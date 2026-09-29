import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { conversationRouter } from "./routes/conversations.js";
import { orderRouter } from "./routes/orders.js";
import { uploadRouter } from "./routes/uploads.js";

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
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
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=(self)");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });
  // The Vercel rewrite sends every /api/* request to one function and forwards
  // the original route in the `path` query parameter.
  app.use((req, _res, next) => {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const forwardedPath = requestUrl.searchParams.get("path");
    if (requestUrl.pathname === "/api" && forwardedPath) {
      requestUrl.pathname = `/api/${forwardedPath.replace(/^\/+|\/+$/g, "")}`;
      requestUrl.searchParams.delete("path");
      req.url = `${requestUrl.pathname}${requestUrl.search}`;
    }
    next();
  });
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", catalogRouter);
  app.use("/api", orderRouter);
  app.use("/api", conversationRouter);
  app.use("/api", uploadRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
