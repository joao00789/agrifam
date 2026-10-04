import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { authSessions, users } from "../db/schema.js";
import { AUTH_COOKIE_NAME } from "../utils/authCookie.js";
import { ApiError } from "./errorHandler.js";

export interface AuthPayload {
  sub: number;
  role: "buyer" | "producer";
  sid: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) throw new ApiError(401, "Não autenticado.");

  let verified: string | jwt.JwtPayload;
  try {
    // Eu explico: A API assina as sessões com HS256. Fixar o algoritmo impede aceitar por
    // Eu explico: engano um token assinado por outro método.
    verified = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] });
  } catch {
    throw new ApiError(401, "Sessão inválida ou expirada.");
  }

  const sub = typeof verified === "object" && verified !== null ? Number(verified.sub) : NaN;
  const sid = typeof verified === "object" && verified !== null ? verified.sid : undefined;
  if (!Number.isSafeInteger(sub) || sub <= 0 || typeof sid !== "string") {
    throw new ApiError(401, "Sessão inválida ou expirada.");
  }

  // Eu explico: Confere sessão ativa e papel atual no banco em cada requisição privada. Assim,
  // Eu explico: trocar senha ou papel revoga imediatamente tokens antigos.
  const session = await db.query.authSessions.findFirst({
    where: and(
      eq(authSessions.id, sid),
      eq(authSessions.userId, sub),
      isNull(authSessions.revokedAt),
      gt(authSessions.expiresAt, new Date().toISOString()),
    ),
  });
  if (!session) throw new ApiError(401, "Sessão inválida ou expirada.");

  const user = await db.query.users.findFirst({ where: eq(users.id, sub), columns: { id: true, role: true } });
  if (!user || (user.role !== "buyer" && user.role !== "producer")) {
    throw new ApiError(401, "Sessão inválida ou expirada.");
  }

  req.user = { sub: user.id, role: user.role, sid };
  next();
};

export const requireRole =
  (role: AuthPayload["role"]) => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "Não autenticado.");
    if (req.user.role !== role) {
      throw new ApiError(403, "Acesso não permitido para este perfil.");
    }
    next();
  };
