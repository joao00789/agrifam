import type { Request } from "express";

/* Eu explico: * Registra metadados de segurança sem incluir email, cookies, tokens ou conteúdo enviado. */
export const logSecurityEvent = (req: Request, action: string, userId?: number) => {
  console.info(JSON.stringify({
    level: "info",
    event: "security",
    action,
    userId,
    requestId: req.requestId,
    occurredAt: new Date().toISOString(),
  }));
};
