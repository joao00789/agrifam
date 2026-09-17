import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/client.js";
import { producers, users } from "../db/schema.js";
import { ApiError } from "../middlewares/errorHandler.js";
import type { ProducerProfileInput } from "../schemas/auth.js";
import { loginSchema, producerProfileSchema, registerSchema } from "../schemas/auth.js";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookie.js";

const SALT_ROUNDS = 10;
const TOKEN_TTL = "7d";

type UserRow = typeof users.$inferSelect;

const toPublicUser = (user: UserRow) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const signToken = (user: UserRow) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, {
    expiresIn: TOKEN_TTL,
  });

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const { name, email, password, role } = parsed.data;

  // Produtor precisa de um perfil (producers) desde o cadastro: POST /api/produtos
  // exige um producerId, e não existe hoje uma rota separada para criar esse perfil
  // depois. Ver TODO.md Fase 2.
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

  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(201).json({ user: toPublicUser(user) });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new ApiError(401, "Email ou senha inválidos.");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Email ou senha inválidos.");

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: toPublicUser(user) });
};

export const logout = (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ ok: true });
};

export const me = async (req: Request, res: Response) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.sub) });
  if (!user) throw new ApiError(401, "Sessão inválida.");
  res.json({ user: toPublicUser(user) });
};
