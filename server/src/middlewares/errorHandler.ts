import type { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: "Rota não encontrada." });
};

// Eu explico: Middleware de erro precisa dos 4 parâmetros para o Express reconhecê-lo como tal.
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Eu explico: Não registre corpo, cookies, tokens ou a mensagem bruta do banco/provedor.
  console.error(JSON.stringify({
    level: "error",
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    errorName: err instanceof Error ? err.name : "UnknownError",
  }));
  res.status(500).json({ error: "Erro interno do servidor." });
};
