import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { db } from "../db/client.js";
import { orderItems, orders, paymentEvents, producers, products, users } from "../db/schema.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { decryptMercadoPagoToken, encryptMercadoPagoToken } from "../utils/mercadoPagoTokens.js";

const MP_API = "https://api.mercadopago.com";
const stateCookie = "agrifam_mp_oauth";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/pagamentos/mercadopago/callback",
  maxAge: 10 * 60 * 1000,
};

const requiredSetting = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError(503, `O Mercado Pago ainda não está configurado (${name}).`);
  return value;
};

const appBaseUrl = (req: Request) => {
  const configuredUrl = process.env.PUBLIC_APP_URL?.trim();
  if (process.env.NODE_ENV === "production" && !configuredUrl) {
    throw new ApiError(503, "A URL pública do AgriFam não está configurada no servidor.");
  }
  let parsed: URL;
  try {
    parsed = new URL(configuredUrl || `${req.protocol}://${req.get("host")}`);
  } catch {
    throw new ApiError(503, "A URL pública do AgriFam está configurada incorretamente.");
  }
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new ApiError(503, "A URL pública do AgriFam precisa usar HTTPS.");
  }
  return parsed.origin;
};
const callbackUrl = (req: Request) => {
  const configured = process.env.MP_REDIRECT_URI?.trim();
  if (!configured) return `${appBaseUrl(req)}/api/pagamentos/mercadopago/callback`;
  let parsed: URL;
  try { parsed = new URL(configured); } catch { throw new ApiError(503, "O retorno do Mercado Pago está configurado incorretamente."); }
  if (process.env.NODE_ENV === "production" && (parsed.protocol !== "https:" || parsed.origin !== appBaseUrl(req))) {
    throw new ApiError(503, "O retorno do Mercado Pago precisa usar o domínio HTTPS do AgriFam.");
  }
  return parsed.toString();
};

const getSellerAccessToken = async (producer: typeof producers.$inferSelect): Promise<string> => {
  if (!producer.mercadoPagoAccessToken || !producer.mercadoPagoRefreshToken) throw new ApiError(409, "A loja precisa reconectar sua conta do Mercado Pago.");
  const expiresSoon = !producer.mercadoPagoTokenExpiresAt || new Date(producer.mercadoPagoTokenExpiresAt).getTime() < Date.now() + 5 * 60 * 1000;
  if (!expiresSoon) return decryptMercadoPagoToken(producer.mercadoPagoAccessToken);
  const body = new URLSearchParams({ grant_type: "refresh_token", client_id: requiredSetting("MP_CLIENT_ID"), client_secret: requiredSetting("MP_CLIENT_SECRET"), refresh_token: decryptMercadoPagoToken(producer.mercadoPagoRefreshToken) });
  const response = await fetch(`${MP_API}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const updated = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!response.ok || !updated.access_token || !updated.refresh_token) throw new ApiError(409, "A conexão do Mercado Pago expirou. Peça ao vendedor para reconectar a conta.");
  await db.update(producers).set({
    mercadoPagoAccessToken: encryptMercadoPagoToken(updated.access_token),
    mercadoPagoRefreshToken: encryptMercadoPagoToken(updated.refresh_token),
    mercadoPagoTokenExpiresAt: new Date(Date.now() + (Number(updated.expires_in) || 15552000) * 1000).toISOString(),
  }).where(eq(producers.id, producer.id));
  return updated.access_token;
};

export const connectMercadoPago = async (req: Request, res: Response) => {
  const clientId = requiredSetting("MP_CLIENT_ID");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new ApiError(503, "JWT_SECRET precisa ser um segredo forte para autorizar conexões de pagamento.");
  const producer = await db.query.producers.findFirst({ where: eq(producers.userId, req.user!.sub) });
  if (!producer) throw new ApiError(404, "Perfil de produtor não encontrado.");
  const nonce = randomBytes(32).toString("base64url");
  const state = jwt.sign({ sub: req.user!.sub, nonce, purpose: "mp-oauth" }, process.env.JWT_SECRET, { expiresIn: "10m", algorithm: "HS256" });
  res.cookie(stateCookie, state, cookieOptions);
  const url = new URL("https://auth.mercadopago.com.br/authorization");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("state", nonce);
  url.searchParams.set("redirect_uri", callbackUrl(req));
  res.redirect(302, url.toString());
};

export const mercadoPagoCallback = async (req: Request, res: Response) => {
  const html = (message: string, ok: boolean) => {
    let returnUrl = "/";
    try { returnUrl = appBaseUrl(req); }
    catch { /* Mantém o retorno local quando a URL pública estiver ausente ou inválida. */ }
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><title>AgriFam · Mercado Pago</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:580px;margin:10vh auto;padding:24px;color:#183d26;background:#f5f8f4}.card{padding:clamp(24px,6vw,40px);border:1px solid #e2e9df;border-radius:22px;background:#fff;box-shadow:0 16px 50px #15331a12}.mark{display:grid;place-items:center;width:48px;height:48px;margin-bottom:20px;border-radius:15px;background:${ok ? "#e8f5e9" : "#fff2e9"};color:${ok ? "#147137" : "#a14a17"}}svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}h1{margin:0 0 12px;font-size:clamp(26px,6vw,34px);line-height:1.2;letter-spacing:-.04em}p{color:#59695e}.hint{font-size:14px}a{display:inline-flex;margin-top:12px;padding:12px 18px;border-radius:10px;background:#11662e;color:#fff;font-weight:700;text-decoration:none}a:focus-visible{outline:3px solid #174c91;outline-offset:3px}</style></head><body><main class="card"><div class="mark" aria-hidden="true"><svg viewBox="0 0 24 24">${ok ? '<path d="m5 12 4 4L19 6"/>' : '<path d="M12 8v5m0 4h.01"/><circle cx="12" cy="12" r="9"/>'}</svg></div><h1>${ok ? "Conta conectada" : "Não foi possível conectar"}</h1><p>${message}</p><p class="hint">Você pode fechar esta janela e voltar ao AgriFam.</p><a href="${returnUrl}">Voltar ao AgriFam</a></main></body></html>`;
  };
  const sendResult = (message: string, ok: boolean, status: number) => {
    res.status(status).type("html").set("Cache-Control", "no-store").set("Referrer-Policy", "no-referrer").send(html(message, ok));
  };
  const clearState = () => res.clearCookie(stateCookie, cookieOptions);
  const code = String(req.query.code || "");
  const returnedState = String(req.query.state || "");
  const cookieState = String(req.cookies?.[stateCookie] || "");
  if (!code || !returnedState || !cookieState || !process.env.JWT_SECRET) {
    clearState(); sendResult("A autorização expirou ou não foi iniciada pelo AgriFam. Reinicie a conexão pelo perfil de produtor.", false, 400); return;
  }
  let identity: { sub: number; nonce: string; purpose: string };
  try {
    identity = jwt.verify(cookieState, process.env.JWT_SECRET, { algorithms: ["HS256"] }) as unknown as typeof identity;
    const received = Buffer.from(returnedState);
    const expected = Buffer.from(identity.nonce);
    if (identity.purpose !== "mp-oauth" || !Number.isSafeInteger(identity.sub) || received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error("state mismatch");
  } catch {
    clearState(); sendResult("A validação de segurança falhou. Reinicie a conexão pelo perfil.", false, 400); return;
  }
  clearState();

  try {
    const clientId = requiredSetting("MP_CLIENT_ID");
    const clientSecret = requiredSetting("MP_CLIENT_SECRET");
    const body = new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code, redirect_uri: callbackUrl(req) });
    const tokenResponse = await fetch(`${MP_API}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const token = await tokenResponse.json() as { access_token?: string; refresh_token?: string; user_id?: number | string; expires_in?: number; error?: string };
    if (!tokenResponse.ok || !token.access_token || !token.refresh_token || !token.user_id) {
      const providerError = String(token.error || "").replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 80);
      console.error("Mercado Pago OAuth token exchange failed", { status: tokenResponse.status, providerError });
      const message = providerError === "invalid_client"
        ? "O Mercado Pago recusou as credenciais da aplicação. Confira o Client ID e o Client Secret cadastrados na Vercel e no painel do Mercado Pago."
        : providerError === "invalid_grant"
          ? "O código de autorização expirou ou o endereço de retorno não corresponde ao cadastrado no Mercado Pago. Inicie a conexão novamente e confira a URL de retorno."
          : "O Mercado Pago recusou a autorização. Confira as credenciais e a URL de retorno cadastradas para a aplicação e tente conectar novamente.";
      sendResult(message, false, 502);
      return;
    }
    const encryptedAccess = encryptMercadoPagoToken(token.access_token);
    const encryptedRefresh = encryptMercadoPagoToken(token.refresh_token);
    const linkedProducer = await db.update(producers).set({
      mercadoPagoUserId: String(token.user_id),
      mercadoPagoAccessToken: encryptedAccess,
      mercadoPagoRefreshToken: encryptedRefresh,
      mercadoPagoTokenExpiresAt: new Date(Date.now() + (Number(token.expires_in) || 15552000) * 1000).toISOString(),
    }).where(eq(producers.userId, identity.sub)).returning({ id: producers.id });
    if (!linkedProducer.length) throw new ApiError(404, "Perfil de produtor não encontrado. Entre novamente na conta da loja e tente conectar.");
    sendResult("Sua conta do Mercado Pago está vinculada com segurança ao seu perfil de vendedor.", true, 200);
  } catch (error) {
    console.error("Mercado Pago OAuth callback failed:", error instanceof Error ? error.name : "unknown error");
    if (error instanceof ApiError) {
      sendResult(error.message, false, error.status);
      return;
    }
    sendResult("Não foi possível concluir a vinculação agora. Confira sua conexão e tente novamente pelo perfil da loja.", false, 502);
  }
};

export const mercadoPagoStatus = async (req: Request, res: Response) => {
  const producer = await db.query.producers.findFirst({
    where: eq(producers.userId, req.user!.sub),
    columns: { mercadoPagoUserId: true, mercadoPagoTokenExpiresAt: true },
  });
  if (!producer) throw new ApiError(404, "Perfil de produtor não encontrado.");
  res.setHeader("Cache-Control", "no-store");
  res.json({ connected: Boolean(producer.mercadoPagoUserId), expiresAt: producer.mercadoPagoTokenExpiresAt });
};

type PreferenceResponse = { id: string; init_point?: string; sandbox_init_point?: string };

export const createMarketplaceCheckout = async (req: Request, res: Response) => {
  const requestId = req.header("Idempotency-Key") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new ApiError(400, "Chave de idempotência inválida. Atualize a página e tente novamente.");
  }
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length || items.length > 50) throw new ApiError(400, "O carrinho precisa ter de 1 a 50 itens.");
  const itemQuantities = new Map<number, number>();
  for (const item of items) {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);
    if (!Number.isSafeInteger(productId) || productId <= 0 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new ApiError(400, "Produto ou quantidade inválida.");
    }
    itemQuantities.set(productId, (itemQuantities.get(productId) || 0) + quantity);
  }
  if ([...itemQuantities.values()].some((quantity) => quantity > 100)) throw new ApiError(400, "O limite é de 100 unidades por produto.");
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([...itemQuantities.entries()].sort(([a], [b]) => a - b)))
    .digest("hex");

  const existingOrder = await db.query.orders.findFirst({
    where: and(eq(orders.buyerId, req.user!.sub), eq(orders.checkoutRequestId, requestId)),
  });
  if (existingOrder) {
    if (existingOrder.checkoutFingerprint !== fingerprint) throw new ApiError(409, "Esta chave já foi usada para outro carrinho.");
    if (existingOrder.status !== "pending") throw new ApiError(409, "Este checkout já foi processado. Inicie um novo pedido se necessário.");
    if (!existingOrder.checkoutUrl) throw new ApiError(409, "O checkout está sendo preparado. Aguarde alguns segundos e tente novamente.");
    res.status(200).setHeader("Cache-Control", "no-store").json({
      orderId: existingOrder.id,
      total: existingOrder.total,
      marketplaceFee: existingOrder.marketplaceFee,
      checkoutUrl: existingOrder.checkoutUrl,
      reused: true,
    });
    return;
  }

  const productRows = await db.query.products.findMany({ where: and(inArray(products.id, [...itemQuantities.keys()]), eq(products.isActive, true)) });
  if (productRows.length !== itemQuantities.size) throw new ApiError(400, "Um ou mais produtos não estão disponíveis.");
  const producerIds = new Set(productRows.map((product) => product.producerId));
  if (producerIds.size !== 1) throw new ApiError(400, "O Mercado Pago Split 1:1 exige um checkout por loja. Remova do carrinho produtos de outras lojas e finalize-os em pedidos separados.");
  const producerId = [...producerIds][0];
  const producer = await db.query.producers.findFirst({ where: and(eq(producers.id, producerId), eq(producers.isActive, true)) });
  if (!producer) throw new ApiError(400, "Esta loja não está disponível.");
  if (!producer.mercadoPagoAccessToken || !producer.mercadoPagoUserId) throw new ApiError(409, "Esta loja ainda não habilitou pagamentos pelo Mercado Pago. Tente novamente mais tarde.");
  const orderLines = productRows.map((product) => ({ product, quantity: itemQuantities.get(product.id)!, unitPrice: Math.round(product.price * 100) / 100 }));
  const totalCents = orderLines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100) * line.quantity, 0);
  const amount = totalCents / 100;
  const feePercent = Number(process.env.MP_MARKETPLACE_FEE_PERCENT || "3");
  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 30) throw new ApiError(503, "A taxa da plataforma está configurada incorretamente.");
  const marketplaceFee = Math.round(amount * feePercent) / 100;
  const buyer = await db.query.users.findFirst({ where: eq(users.id, req.user!.sub), columns: { email: true } });
  if (!buyer) throw new ApiError(401, "Sessão inválida.");

  let created: { order: typeof orders.$inferSelect; insertedItems: (typeof orderItems.$inferSelect)[] };
  try {
    created = await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        buyerId: req.user!.sub,
        producerId,
        total: amount,
        marketplaceFee,
        status: "pending",
        checkoutRequestId: requestId,
        checkoutFingerprint: fingerprint,
      }).returning();
      const insertedItems = await tx.insert(orderItems).values(orderLines.map(({ product, quantity, unitPrice }) => ({ orderId: order.id, productId: product.id, producerId, productName: product.name, unitPrice, quantity, subtotal: Math.round(unitPrice * quantity * 100) / 100 }))).returning();
      return { order, insertedItems };
    });
  } catch (error) {
    // Eu explico: Se duas tentativas chegarem juntas, o índice único decide qual cria o pedido.
    const duplicate = await db.query.orders.findFirst({
      where: and(eq(orders.buyerId, req.user!.sub), eq(orders.checkoutRequestId, requestId)),
    });
    if (duplicate?.checkoutFingerprint === fingerprint && duplicate.status === "pending" && duplicate.checkoutUrl) {
      res.status(200).setHeader("Cache-Control", "no-store").json({ orderId: duplicate.id, total: duplicate.total, marketplaceFee: duplicate.marketplaceFee, checkoutUrl: duplicate.checkoutUrl, reused: true });
      return;
    }
    if (duplicate) throw new ApiError(409, "O pedido já está sendo preparado. Aguarde alguns segundos e tente novamente.");
    throw error;
  }
  const { order, insertedItems } = created;

  try {
    const accessToken = await getSellerAccessToken(producer);
    const base = appBaseUrl(req);
    const preferenceResponse = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Idempotency-Key": `agrifam-order-${order.id}` },
      body: JSON.stringify({
        items: insertedItems.map((item) => ({ id: String(item.productId), title: item.productName, quantity: item.quantity, currency_id: "BRL", unit_price: item.unitPrice })),
        payer: { email: buyer.email },
        external_reference: String(order.id),
        marketplace_fee: marketplaceFee,
        notification_url: `${base}/api/pagamentos/mercadopago/webhook`,
        back_urls: { success: `${base}/?payment=success`, pending: `${base}/?payment=pending`, failure: `${base}/?payment=failure` },
        auto_return: "approved",
        statement_descriptor: "AGRIFAM",
      }),
    });
    const preference = await preferenceResponse.json() as PreferenceResponse;
    const checkoutUrl = process.env.NODE_ENV === "production" ? preference.init_point : (preference.sandbox_init_point || preference.init_point);
    if (!preferenceResponse.ok || !preference.id || !checkoutUrl) {
      console.error("Mercado Pago preference creation failed", preferenceResponse.status);
      throw new Error("Falha ao criar o checkout do Mercado Pago.");
    }
    await db.update(orders).set({ mercadoPagoPreferenceId: preference.id, checkoutUrl }).where(eq(orders.id, order.id));
    res.status(201).setHeader("Cache-Control", "no-store").json({ orderId: order.id, total: order.total, marketplaceFee, feePercent, checkoutUrl });
  } catch (error) {
    await db.update(orders).set({ status: "cancelled" }).where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
    console.error("Mercado Pago checkout setup failed:", error instanceof Error ? error.message : "unknown error");
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "Não foi possível iniciar o pagamento. Tente novamente.");
  }
};

export const mercadoPagoWebhook = async (req: Request, res: Response) => {
  if (req.body?.type === "mp-connect" && req.body?.action === "application.authorized") {
    res.sendStatus(200);
    return;
  }
  const secret = process.env.MP_WEBHOOK_SECRET;
  const signature = req.header("x-signature") || "";
  const requestId = req.header("x-request-id") || "";
  const paymentId = String(req.query["data.id"] || (req.body?.data?.id ?? ""));
  if (!secret || !signature || !requestId || !/^\d+$/.test(paymentId)) { res.sendStatus(400); return; }
  const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2) as [string, string]));
  if (!parts.ts || !parts.v1 || !/^\d+$/.test(parts.ts)) { res.sendStatus(400); return; }
  const manifest = `id:${paymentId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest();
  let received: Buffer;
  try { received = Buffer.from(parts.v1, "hex"); } catch { res.sendStatus(400); return; }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) { res.sendStatus(401); return; }

  const sellerUserId = String(req.query.user_id || req.body?.user_id || "");
  if (!sellerUserId) { res.sendStatus(400); return; }
  const seller = await db.query.producers.findFirst({ where: eq(producers.mercadoPagoUserId, sellerUserId) });
  if (!seller?.mercadoPagoAccessToken) { res.sendStatus(200); return; }
  const lookup = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Bearer ${await getSellerAccessToken(seller)}` } });
  if (!lookup.ok) { res.sendStatus(502); return; }
  const payment = await lookup.json() as { id?: number | string; status?: string; external_reference?: string; transaction_amount?: number; marketplace_fee?: number; collector_id?: number | string; currency_id?: string };
  const orderId = Number(payment.external_reference);
  if (!Number.isSafeInteger(orderId) || orderId <= 0 || String(payment.id) !== paymentId) { res.sendStatus(200); return; }
  const transactionAmount = Number(payment.transaction_amount);
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || !order.producerId || order.producerId !== seller.id || payment.currency_id !== "BRL" || !Number.isFinite(transactionAmount) || Number(order.total).toFixed(2) !== transactionAmount.toFixed(2)) { res.sendStatus(200); return; }
  if (payment.marketplace_fee !== undefined && Number(order.marketplaceFee).toFixed(2) !== Number(payment.marketplace_fee).toFixed(2)) { res.sendStatus(200); return; }
  if (String(seller.mercadoPagoUserId) !== String(payment.collector_id)) { res.sendStatus(200); return; }
  const status = payment.status === "approved" ? "paid" : payment.status === "rejected" ? "rejected" : payment.status === "cancelled" ? "cancelled" : "pending";
  await db.transaction(async (tx) => {
    const [updated] = await tx.update(orders).set({ status, mercadoPagoPaymentId: paymentId })
      .where(and(eq(orders.id, order.id), eq(orders.status, "pending"))).returning({ id: orders.id });
    if (updated) {
      await tx.insert(paymentEvents).values({
        orderId: order.id,
        paymentId,
        paymentStatus: status,
        amount: transactionAmount,
        currency: payment.currency_id!,
        sellerAccountId: String(seller.mercadoPagoUserId),
      }).onConflictDoNothing();
    }
  });
  res.sendStatus(200);
};
