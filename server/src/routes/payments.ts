import { Router } from "express";
import {
  connectMercadoPago,
  createMarketplaceCheckout,
  mercadoPagoCallback,
  mercadoPagoStatus,
  mercadoPagoWebhook,
} from "../controllers/paymentController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { createRateLimit } from "../middlewares/rateLimit.js";

export const paymentRouter = Router();
const connectRateLimit = createRateLimit(5, 15 * 60 * 1000, "mercadopago-conectar");
const checkoutRateLimit = createRateLimit(10, 10 * 60 * 1000, "pagamentos-checkout");

paymentRouter.get(
  "/mercadopago/conectar",
  requireAuth,
  requireRole("producer"),
  connectRateLimit,
  connectMercadoPago,
);
paymentRouter.get("/mercadopago/callback", mercadoPagoCallback);
paymentRouter.get(
  "/mercadopago/status",
  requireAuth,
  requireRole("producer"),
  mercadoPagoStatus,
);
paymentRouter.post(
  "/checkout",
  requireAuth,
  checkoutRateLimit,
  createMarketplaceCheckout,
);
paymentRouter.post("/mercadopago/webhook", mercadoPagoWebhook);
