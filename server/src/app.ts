import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { conversationRouter } from "./routes/conversations.js";
import { orderRouter } from "./routes/orders.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", catalogRouter);
  app.use("/api", orderRouter);
  app.use("/api", conversationRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
