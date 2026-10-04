import { and, eq, gt, inArray, isNull, ne } from "drizzle-orm";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { db } from "../db/client.js";
import { authSessions, conversations, messages, passwordResetTokens, producers, products, users } from "../db/schema.js";
import { ApiError } from "../middlewares/errorHandler.js";
import type { ProducerProfileInput } from "../schemas/auth.js";
import { loginSchema, producerProfileSchema, profileUpdateSchema, registerSchema } from "../schemas/auth.js";
import { clearSessionCookies, REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_MS, setSessionCookies } from "../utils/authCookie.js";
import { logSecurityEvent } from "../utils/securityLog.js";
import { deleteStoragePrefix } from "../utils/deleteStoragePrefix.js";

const SALT_ROUNDS = 10;
const TOKEN_TTL_SECONDS = 15 * 60;
const RESET_TOKEN_TTL_MS = 20 * 60 * 1000;
const DUMMY_PASSWORD_HASH = "$2b$10$ItyASCX8lc5v920EAAukF.8y7/mtZf8MFqy1xzwIh8eF3IdhozieW";

type UserRow = typeof users.$inferSelect;

const toPublicUser = (user: UserRow) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl,
});

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const requireJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new ApiError(503, "JWT_SECRET precisa ter pelo menos 32 caracteres.");
  return secret;
};

const signToken = (user: UserRow, sessionId: string) =>
  jwt.sign({ sub: user.id, role: user.role, sid: sessionId }, requireJwtSecret(), {
    expiresIn: TOKEN_TTL_SECONDS,
    algorithm: "HS256",
  });

const startSession = async (user: UserRow, res: Response) => {
  const sessionId = randomUUID();
  const refreshToken = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();
  await db.insert(authSessions).values({ id: sessionId, userId: user.id, refreshTokenHash: sha256(refreshToken), expiresAt });
  setSessionCookies(res, signToken(user, sessionId), refreshToken);
};

export const register = async (req: Request, res: Response) => {
  requireJwtSecret();
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const { name, email, password, role } = parsed.data;

  // Eu explico: Produtor precisa de um perfil (producers) desde o cadastro: POST /api/produtos
  // Eu explico: exige um producerId, e não existe hoje uma rota separada para criar esse perfil
  // Eu explico: depois. Ver TODO.md Fase 2.
  let producerProfile: ProducerProfileInput | undefined;
  if (role === "producer") {
    const parsedProfile = producerProfileSchema.safeParse(req.body);
    if (!parsedProfile.success) {
      throw new ApiError(400, parsedProfile.error.issues[0]?.message ?? "Dados inválidos.");
    }
    producerProfile = parsedProfile.data;
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) throw new ApiError(409, "Já existe uma conta com este email.");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning();

  if (role === "producer" && producerProfile) {
    await db.insert(producers).values({
      userId: user.id,
      property: producerProfile.property,
      location: producerProfile.location,
      specialty: producerProfile.specialty,
      history: producerProfile.history,
      image: producerProfile.image,
    });
  }

  await startSession(user, res);
  logSecurityEvent(req, "cadastro_concluido", user.id);
  res.status(201).json({ user: toPublicUser(user) });
};

export const login = async (req: Request, res: Response) => {
  requireJwtSecret();
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
  if (!user || !valid) {
    logSecurityEvent(req, "login_falhou");
    throw new ApiError(401, "Email ou senha inválidos.");
  }

  await startSession(user, res);
  logSecurityEvent(req, "login_concluido", user.id);
  res.json({ user: toPublicUser(user) });
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof refreshToken === "string") {
    await db.update(authSessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(authSessions.refreshTokenHash, sha256(refreshToken)), isNull(authSessions.revokedAt)));
  }
  clearSessionCookies(res);
  logSecurityEvent(req, "logout_concluido");
  res.json({ ok: true });
};

export const refreshSession = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof refreshToken !== "string") {
    clearSessionCookies(res);
    throw new ApiError(401, "Sessão expirada. Entre novamente.");
  }
  const oldHash = sha256(refreshToken);
  const now = new Date().toISOString();
  const session = await db.query.authSessions.findFirst({
    where: and(eq(authSessions.refreshTokenHash, oldHash), isNull(authSessions.revokedAt), gt(authSessions.expiresAt, now)),
  });
  if (!session) {
    clearSessionCookies(res);
    throw new ApiError(401, "Sessão expirada. Entre novamente.");
  }
  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user) {
    clearSessionCookies(res);
    throw new ApiError(401, "Sessão expirada. Entre novamente.");
  }

  // Eu explico: O UPDATE condicional permite que apenas uma renovação concorrente consuma o token antigo.
  const nextRefreshToken = randomBytes(48).toString("base64url");
  const [rotated] = await db.update(authSessions)
    .set({ refreshTokenHash: sha256(nextRefreshToken), lastUsedAt: now })
    .where(and(eq(authSessions.id, session.id), eq(authSessions.refreshTokenHash, oldHash), isNull(authSessions.revokedAt), gt(authSessions.expiresAt, now)))
    .returning({ id: authSessions.id });
  if (!rotated) {
    clearSessionCookies(res);
    throw new ApiError(401, "Sessão já renovada. Atualize a página e entre novamente.");
  }
  setSessionCookies(res, signToken(user, session.id), nextRefreshToken);
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true });
};

export const me = async (req: Request, res: Response) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.sub) });
  if (!user) throw new ApiError(401, "Sessão inválida.");
  const producer = user.role === "producer"
    ? await db.query.producers.findFirst({ where: eq(producers.userId, user.id) })
    : undefined;
  res.json({ user: toPublicUser(user), producer: producer ?? null });
};

export const updateMe = async (req: Request, res: Response) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.sub) });
  if (!user) throw new ApiError(401, "Sessão inválida.");
  if (parsed.data.email !== user.email) {
    throw new ApiError(409, "A alteração de email exige confirmação do novo endereço e ainda não está disponível.");
  }

  const duplicate = await db.query.users.findFirst({
    where: and(eq(users.email, parsed.data.email), ne(users.id, user.id)),
  });
  if (duplicate) throw new ApiError(409, "Este email já está sendo usado por outra conta.");

  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
      throw new ApiError(400, "A senha atual não confere.");
    }
  }

  const [updated] = await db.update(users).set({
    name: parsed.data.name,
    email: parsed.data.email,
    ...(parsed.data.avatarUrl !== undefined ? { avatarUrl: parsed.data.avatarUrl } : {}),
    ...(parsed.data.newPassword ? { passwordHash: await bcrypt.hash(parsed.data.newPassword, SALT_ROUNDS) } : {}),
  }).where(eq(users.id, user.id)).returning();

  if (parsed.data.newPassword) {
    const now = new Date().toISOString();
    await db.update(authSessions).set({ revokedAt: now })
      .where(and(eq(authSessions.userId, user.id), isNull(authSessions.revokedAt)));
    await startSession(updated, res);
    logSecurityEvent(req, "senha_alterada", user.id);
  }

  let producer = null;
  if (user.role === "producer") {
    const [updatedProducer] = await db.update(producers).set({
      property: parsed.data.property,
      location: parsed.data.location,
      specialty: parsed.data.specialty,
      history: parsed.data.history,
      image: parsed.data.image,
    }).where(eq(producers.userId, user.id)).returning();
    producer = updatedProducer ?? null;
  }
  res.json({ user: toPublicUser(updated), producer });
};

export const loginWithGoogle = async (req: Request, res: Response) => {
  requireJwtSecret();
  const accessToken = typeof req.body?.accessToken === "string" ? req.body.accessToken : "";
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new ApiError(503, "Login Google ainda não foi configurado no servidor.");
  if (!accessToken) throw new ApiError(400, "Token Google ausente.");

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new ApiError(401, "Não foi possível validar sua conta Google.");
  const identity = await response.json() as {
    email?: string;
    email_confirmed_at?: string;
    confirmed_at?: string;
    user_metadata?: { full_name?: string; name?: string };
  };
  const email = identity.email?.trim().toLowerCase();
  if (!email || !(identity.email_confirmed_at || identity.confirmed_at)) {
    throw new ApiError(401, "A conta Google precisa ter um email confirmado.");
  }

  let user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    const name = identity.user_metadata?.full_name || identity.user_metadata?.name || email.split("@")[0];
    const passwordHash = await bcrypt.hash(randomBytes(48).toString("hex"), SALT_ROUNDS);
    [user] = await db.insert(users).values({ name, email, passwordHash, role: "buyer" }).returning();
  }
  await startSession(user, res);
  res.json({ user: toPublicUser(user) });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new ApiError(400, "Informe um email válido.");
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim();
  let appUrl: URL;
  try {
    appUrl = new URL(process.env.PUBLIC_APP_URL || "");
    if (appUrl.username || appUrl.password || appUrl.search || appUrl.hash) throw new Error("URL pública inválida");
    if (process.env.NODE_ENV === "production" && (appUrl.protocol !== "https:" || appUrl.origin === "null")) {
      throw new Error("HTTPS obrigatório");
    }
  } catch {
    throw new ApiError(503, "A recuperação de senha ainda não foi configurada.");
  }
  if (!apiKey || !from) throw new ApiError(503, "A recuperação de senha ainda não foi configurada.");

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  // Eu explico: A resposta não confirma se o email está cadastrado.
  if (user) {
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
    await db.insert(passwordResetTokens).values({ tokenHash, userId: user.id, expiresAt });
    const link = new URL("/", appUrl);
    link.searchParams.set("reset_token", rawToken);
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: "Redefina sua senha do AgriFam",
        text: `Use este link para definir uma nova senha. Ele expira em 20 minutos e só pode ser usado uma vez: ${link.toString()}`,
        html: `<p>Recebemos um pedido para redefinir a senha da sua conta AgriFam.</p><p><a href="${link.toString()}">Criar nova senha</a></p><p>O link expira em 20 minutos e só pode ser usado uma vez. Se você não pediu essa alteração, ignore este email.</p>`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!emailResponse.ok) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
      console.error("Falha ao enviar email de recuperação:", emailResponse.status);
      throw new ApiError(503, "Não foi possível enviar o email agora. Tente novamente mais tarde.");
    }
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(202).json({ message: "Se o endereço estiver cadastrado, enviaremos um link para redefinir a senha." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token) || password.length < 8 || password.length > 128) {
    throw new ApiError(400, "Link inválido ou expirado. Solicite um novo email de recuperação.");
  }
  const tokenHash = sha256(token);
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const reset = await db.transaction(async (tx) => {
    const [claimed] = await tx.update(passwordResetTokens)
      .set({ consumedAt: now })
      .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.consumedAt), gt(passwordResetTokens.expiresAt, now)))
      .returning({ userId: passwordResetTokens.userId });
    if (!claimed) return false;
    await tx.update(users).set({ passwordHash }).where(eq(users.id, claimed.userId));
    await tx.update(authSessions).set({ revokedAt: now })
      .where(and(eq(authSessions.userId, claimed.userId), isNull(authSessions.revokedAt)));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, claimed.userId));
    return true;
  });
  if (!reset) throw new ApiError(400, "Link inválido ou expirado. Solicite um novo email de recuperação.");
  clearSessionCookies(res);
  logSecurityEvent(req, "senha_recuperada");
  res.setHeader("Cache-Control", "no-store");
  res.json({ message: "Senha alterada. Entre novamente com sua nova senha." });
};

export const deleteMyAccount = async (req: Request, res: Response) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!password || password.length > 72 || Buffer.byteLength(password, "utf8") > 72) {
    throw new ApiError(400, "Confirme sua senha atual para excluir a conta.");
  }
  const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.sub) });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(403, "A senha não confere. A conta não foi alterada.");
  }
  const producer = await db.query.producers.findFirst({ where: eq(producers.userId, user.id) });

  // Eu explico: Primeiro apague os arquivos no serviço de Storage. Se isso falhar, não confirme
  // Eu explico: uma exclusão parcial que deixe fotos públicas órfãs.
  await deleteStoragePrefix(`${user.id}/profile`);
  if (producer) {
    await deleteStoragePrefix(`${producer.id}/store`);
    await deleteStoragePrefix(`${producer.id}/products`);
  }

  const now = new Date().toISOString();
  const anonymizedPassword = await bcrypt.hash(randomBytes(48).toString("hex"), SALT_ROUNDS);
  await db.transaction(async (tx) => {
    const threads = await tx.query.conversations.findMany({
      where: producer
        ? (table, { eq, or }) => or(eq(table.buyerId, user.id), eq(table.producerId, producer.id))
        : eq(conversations.buyerId, user.id),
      columns: { id: true },
    });
    const threadIds = threads.map((thread) => thread.id);
    if (threadIds.length) {
      await tx.delete(messages).where(inArray(messages.conversationId, threadIds));
      await tx.delete(conversations).where(inArray(conversations.id, threadIds));
    }

    if (producer) {
      await tx.update(products).set({ isActive: false, image: "" }).where(eq(products.producerId, producer.id));
      await tx.update(producers).set({
        isActive: false,
        property: "Loja encerrada",
        location: "",
        specialty: "",
        history: "",
        image: "",
        mercadoPagoUserId: null,
        mercadoPagoAccessToken: null,
        mercadoPagoRefreshToken: null,
        mercadoPagoTokenExpiresAt: null,
      }).where(eq(producers.id, producer.id));
    }

    await tx.delete(authSessions).where(eq(authSessions.userId, user.id));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
    await tx.update(users).set({
      name: "Conta removida",
      email: `deleted-${user.id}-${randomUUID()}@deleted.invalid`,
      passwordHash: anonymizedPassword,
      avatarUrl: "",
    }).where(eq(users.id, user.id));
  });

  logSecurityEvent(req, "conta_anonymizada", user.id);
  clearSessionCookies(res);
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, message: "Conta desativada. O histórico de pedidos foi preservado sem seus dados de contato." });
};

export const startGoogleLogin = (_req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new ApiError(503, "Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY em server/.env.");
  const configuredOrigin = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "production" ? "" : process.env.CORS_ORIGIN) ||
    "http://localhost:5173";
  let frontendUrl: string;
  try {
    const parsedOrigin = new URL(configuredOrigin);
    if (process.env.NODE_ENV === "production" && parsedOrigin.protocol !== "https:") throw new Error("HTTPS obrigatório");
    frontendUrl = parsedOrigin.origin;
  } catch {
    throw new ApiError(503, "Configure a URL HTTPS pública do AgriFam no servidor.");
  }
  const authorizeUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", frontendUrl);
  authorizeUrl.searchParams.set("flow_type", "implicit");
  authorizeUrl.searchParams.set("scopes", "openid email profile");
  res.redirect(authorizeUrl.toString());
};
