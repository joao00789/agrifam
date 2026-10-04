import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { conversationRouter } from "./routes/conversations.js";
import { orderRouter } from "./routes/orders.js";
import { uploadRouter } from "./routes/uploads.js";
import { paymentRouter } from "./routes/payments.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    next();
  });
  // Eu explico: A Vercel adiciona uma camada de proxy confiável. Mantenha este valor alinhado
  // Eu explico: à hospedagem para que req.ip e a segurança dos cookies usem os dados corretos.
  app.set("trust proxy", 1);
  const allowedOrigins = new Set([
    process.env.CORS_ORIGIN || "http://localhost:5173",
  ]);
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5173");
    allowedOrigins.add("http://127.0.0.1:5173");
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, !origin || allowedOrigins.has(origin));
      },
      credentials: true,
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=(self)");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });
  // Eu explico: A reescrita da Vercel envia todas as requisições /api/* para uma única função
  // Eu explico: e encaminha a rota original no parâmetro de consulta `path`.
  app.use((req, _res, next) => {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const forwardedPath = requestUrl.searchParams.get("path");
    // Eu explico: Dependendo do adaptador de funções da Vercel, a função reescrita pode receber
    // Eu explico: o próprio caminho raiz (/, /api ou /api/index). Aceite todos e restaure a rota
    // Eu explico: original para resolver caminhos aninhados, como /api/pagamentos/checkout.
    const isApiFunctionEntry = ["/", "/api", "/api/", "/api/index", "/api/index/"].includes(requestUrl.pathname);
    if (isApiFunctionEntry && forwardedPath) {
      requestUrl.pathname = `/api/${forwardedPath.replace(/^\/+|\/+$/g, "")}`;
      requestUrl.searchParams.delete("path");
      req.url = `${requestUrl.pathname}${requestUrl.search}`;
    }
    next();
  });
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());

  // Eu explico: Sessões e conversas mudam com frequência e nunca devem usar uma resposta em cache.
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", catalogRouter);
  app.use("/api", orderRouter);
  app.use("/api", conversationRouter);
  app.use("/api", uploadRouter);
  app.use("/api/pagamentos", paymentRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
