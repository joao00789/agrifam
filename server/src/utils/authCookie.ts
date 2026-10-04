import type { Response } from "express";

export const AUTH_COOKIE_NAME = "agrifam_token";
export const REFRESH_COOKIE_NAME = "agrifam_refresh";
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export const setSessionCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie(AUTH_COOKIE_NAME, accessToken, {
    ...cookieBase,
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
  // Eu explico: O refresh token só é enviado às rotas de autenticação.
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieBase,
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
};

export const clearSessionCookies = (res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...cookieBase, path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieBase, path: "/api/auth" });
};
