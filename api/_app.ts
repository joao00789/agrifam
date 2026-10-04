import { createApp } from "../server/src/app.js";

// Eu explico: Interrompe a inicialização com uma mensagem clara para evitar emitir tokens de sessão fracos.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Configure JWT_SECRET com pelo menos 32 caracteres nas variáveis da Vercel.");
}

// Eu explico: A Vercel reutiliza esta aplicação nas requisições atendidas pela função única de API.
export const app = createApp();
