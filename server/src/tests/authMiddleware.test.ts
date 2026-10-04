import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { db } from "../db/client.js";
import { authSessions, users } from "../db/schema.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { AUTH_COOKIE_NAME } from "../utils/authCookie.js";

const makeRes = () => ({}) as Response;

describe("requireAuth", () => {
  it("lança 401 quando não há cookie de sessão", async () => {
    const req = { cookies: {} } as unknown as Request;
    await expect(requireAuth(req, makeRes(), vi.fn())).rejects.toThrow(/Não autenticado/);
  });

  it("lança 401 quando o token é inválido", async () => {
    const req = {
      cookies: { [AUTH_COOKIE_NAME]: "token-invalido" },
    } as unknown as Request;
    await expect(requireAuth(req, makeRes(), vi.fn())).rejects.toThrow(/inválida ou expirada/);
  });

  it("usa o papel atual do banco e exige uma sessão ativa", async () => {
    const [user] = await db.insert(users).values({
      name: "Usuário Middleware",
      email: `middleware-${randomUUID()}@teste.com`,
      passwordHash: "hash-de-teste",
      role: "producer",
    }).returning();
    const sid = randomUUID();
    await db.insert(authSessions).values({
      id: sid,
      userId: user.id,
      refreshTokenHash: randomUUID(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    // Eu explico: O papel adulterado na reivindicação não pode conceder privilégios.
    const token = jwt.sign({ sub: user.id, role: "buyer", sid }, process.env.JWT_SECRET!);
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } } as unknown as Request;
    const next = vi.fn();

    await requireAuth(req, makeRes(), next);

    expect(req.user).toMatchObject({ sub: user.id, role: "producer", sid });
    expect(next).toHaveBeenCalledOnce();
  });

  it("nega uma sessão revogada mesmo se o JWT ainda não expirou", async () => {
    const sid = randomUUID();
    const token = jwt.sign({ sub: 999999, role: "producer", sid }, process.env.JWT_SECRET!);
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } } as unknown as Request;
    await expect(requireAuth(req, makeRes(), vi.fn())).rejects.toThrow(/inválida ou expirada/);
  });
});

describe("requireRole", () => {
  it("lança 401 quando não há usuário autenticado", () => {
    const req = {} as unknown as Request;
    expect(() => requireRole("producer")(req, makeRes(), vi.fn())).toThrow(/Não autenticado/);
  });

  it("lança 403 quando o papel do usuário não confere", () => {
    const req = { user: { sub: 1, role: "buyer" } } as unknown as Request;
    expect(() => requireRole("producer")(req, makeRes(), vi.fn())).toThrow(/não permitido/);
  });

  it("chama next quando o papel confere", () => {
    const req = { user: { sub: 1, role: "producer" } } as unknown as Request;
    const next = vi.fn();

    requireRole("producer")(req, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });
});
