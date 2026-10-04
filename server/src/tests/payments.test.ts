import { createHmac, randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../app.js";
import { db } from "../db/client.js";
import { categories, orderItems, orders, producers, products, users, paymentEvents } from "../db/schema.js";
import { encryptMercadoPagoToken } from "../utils/mercadoPagoTokens.js";

const app = createApp();
const appFetch = globalThis.fetch;
process.env.MP_TOKEN_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");
process.env.MP_MARKETPLACE_FEE_PERCENT = "3";
process.env.MP_WEBHOOK_SECRET = "webhook-secret-de-teste";

const createSellerAndProduct = async () => {
  const [sellerUser] = await db.insert(users).values({
    name: "Produtora de teste",
    email: `seller-${randomUUID()}@teste.com`,
    passwordHash: "hash-de-teste",
    role: "producer",
  }).returning();
  const [seller] = await db.insert(producers).values({
    userId: sellerUser.id,
    property: "Sítio Teste",
    location: "Teresina - PI",
    specialty: "Frutas",
    mercadoPagoUserId: `mp-${sellerUser.id}`,
    mercadoPagoAccessToken: encryptMercadoPagoToken("seller-access-token"),
    mercadoPagoRefreshToken: encryptMercadoPagoToken("seller-refresh-token"),
    mercadoPagoTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }).returning();
  const [category] = await db.insert(categories).values({ name: `Categoria ${randomUUID()}`, icon: "leaf" }).returning();
  const [product] = await db.insert(products).values({
    producerId: seller.id,
    categoryId: category.id,
    name: "Tomate de teste",
    price: 10,
    unit: "kg",
    location: "Teresina - PI",
  }).returning();
  return { seller, product };
};

const registerBuyer = async () => {
  const response = await request(app).post("/api/auth/register").send({
    name: "Comprador de teste",
    email: `buyer-${randomUUID()}@teste.com`,
    password: "senha1234",
    role: "buyer",
  });
  const setCookie = response.headers["set-cookie"];
  if (!setCookie) throw new Error("A rota de cadastro não retornou cookie de sessão.");
  return { id: response.body.user.id as number, cookie: Array.isArray(setCookie) ? setCookie : [setCookie] };
};

afterEach(() => {
  vi.stubGlobal("fetch", appFetch);
});

describe("POST /api/pagamentos/checkout", () => {
  it("reaproveita a mesma ordem para uma repetição idempotente do carrinho", async () => {
    const { seller, product } = await createSellerAndProduct();
    const buyer = await registerBuyer();
    const idempotencyKey = randomUUID();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      id: `pref-${randomUUID()}`,
      init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test",
    }), { status: 201, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const sendCheckout = () => request(app)
      .post("/api/pagamentos/checkout")
      .set("Cookie", buyer.cookie)
      .set("Idempotency-Key", idempotencyKey)
      .send({ items: [{ productId: product.id, quantity: 2 }] });
    const first = await sendCheckout();
    const replay = await sendCheckout();

    expect(first.status).toBe(201);
    expect(replay.status).toBe(200);
    expect(replay.body.orderId).toBe(first.body.orderId);
    expect(replay.body.reused).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const matchingOrders = await db.query.orders.findMany({
      where: eq(orders.buyerId, buyer.id),
    });
    expect(matchingOrders.filter((order) => order.checkoutRequestId === idempotencyKey)).toHaveLength(1);
    expect(seller.id).toBeGreaterThan(0);
  });

  it("não reaproveita uma chave de checkout para um carrinho diferente", async () => {
    const { product } = await createSellerAndProduct();
    const buyer = await registerBuyer();
    const idempotencyKey = randomUUID();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      id: `pref-${randomUUID()}`,
      init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test",
    }), { status: 201, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const send = (quantity: number) => request(app)
      .post("/api/pagamentos/checkout")
      .set("Cookie", buyer.cookie)
      .set("Idempotency-Key", idempotencyKey)
      .send({ items: [{ productId: product.id, quantity }] });

    expect((await send(1)).status).toBe(201);
    expect((await send(2)).status).toBe(409);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/pagamentos/mercadopago/conectar", () => {
  it("normaliza a URL de retorno do Mercado Pago sem barra final", async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "12345678901234567890123456789012";
    process.env.PUBLIC_APP_URL = "https://agri-fam2.vercel.app";
    process.env.MP_REDIRECT_URI = "https://agri-fam2.vercel.app/api/pagamentos/mercadopago/callback/";
    process.env.MP_CLIENT_ID = "client-id-teste";

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Produtor de teste",
        email: `producer-${randomUUID()}@teste.com`,
        password: "senha1234",
        role: "producer",
      });

    const cookie = response.headers["set-cookie"];
    expect(cookie).toBeTruthy();

    const connect = await request(app)
      .get("/api/pagamentos/mercadopago/conectar")
      .set("Cookie", Array.isArray(cookie) ? cookie : [cookie]);

    expect(connect.status).toBe(302);
    expect(connect.headers.location).toContain("redirect_uri=https%3A%2F%2Fagri-fam2.vercel.app%2Fapi%2Fpagamentos%2Fmercadopago%2Fcallback");
    expect(connect.headers.location).not.toContain("callback%2F");
  });
});

describe("POST /api/pagamentos/mercadopago/webhook", () => {
  it("aceita eventos mp-connect de autorização sem exigir assinatura de pagamento", async () => {
    const response = await request(app)
      .post("/api/pagamentos/mercadopago/webhook")
      .send({
        action: "application.authorized",
        api_version: "v1",
        data: { id: "123456" },
        date_created: "2021-11-01T02:02:02Z",
        id: "123456",
        live_mode: false,
        type: "mp-connect",
        user_id: 3383575615,
      });

    expect(response.status).toBe(200);
  });

  it("valida a origem e a ordem antes de marcar pagamento e registra o evento uma vez", async () => {
    const { seller, product } = await createSellerAndProduct();
    const buyer = await registerBuyer();
    const paymentId = String(Date.now());
    const [order] = await db.insert(orders).values({
      buyerId: buyer.id,
      producerId: seller.id,
      total: 20,
      marketplaceFee: 0.6,
      status: "pending",
    }).returning();
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: product.id,
      producerId: seller.id,
      productName: product.name,
      unitPrice: 10,
      quantity: 2,
      subtotal: 20,
    });
    const payment = {
      id: paymentId,
      status: "approved",
      external_reference: String(order.id),
      transaction_amount: 20,
      marketplace_fee: 0.6,
      collector_id: seller.mercadoPagoUserId,
      currency_id: "BRL",
    };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payment), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const requestId = randomUUID();
    const timestamp = String(Date.now());
    const signature = createHmac("sha256", process.env.MP_WEBHOOK_SECRET!)
      .update(`id:${paymentId};request-id:${requestId};ts:${timestamp};`)
      .digest("hex");
    const deliver = () => request(app)
      .post(`/api/pagamentos/mercadopago/webhook?data.id=${paymentId}&user_id=${seller.mercadoPagoUserId}`)
      .set("x-request-id", requestId)
      .set("x-signature", `ts=${timestamp},v1=${signature}`)
      .send({});

    expect((await deliver()).status).toBe(200);
    expect((await deliver()).status).toBe(200);
    const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, order.id));
    const events = await db.select().from(paymentEvents).where(eq(paymentEvents.paymentId, paymentId));
    expect(updatedOrder.status).toBe("paid");
    expect(events).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ignora uma assinatura inválida sem consultar o pagamento", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await request(app)
      .post("/api/pagamentos/mercadopago/webhook?data.id=123&user_id=123")
      .set("x-request-id", "request-test")
      .set("x-signature", "ts=1,v1=invalid")
      .send({});
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirma notificações mp-connect sem tratá-las como pagamentos", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await request(app)
      .post("/api/pagamentos/mercadopago/webhook")
      .send({ action: "application.authorized", type: "mp-connect", data: { id: "123456" } });

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
