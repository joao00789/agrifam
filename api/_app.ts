import { createApp } from "../server/src/app.js";

// Fail at startup with a clear message instead of issuing weak session tokens.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Configure JWT_SECRET com pelo menos 32 caracteres nas variáveis da Vercel.");
}

// Vercel reuses this app for requests handled by the single API function.
export const app = createApp();
