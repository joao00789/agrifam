import { Router } from "express";
import {
  getOrder,
  listMyOrders,
  listProducerOrders,
} from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

export const orderRouter = Router();

// Eu explico: Os pagamentos passam por `/api/pagamentos/checkout`; esta rota exibe apenas o histórico.
orderRouter.get("/pedidos", requireAuth, listMyOrders);
orderRouter.get("/pedidos/:id", requireAuth, getOrder);

orderRouter.get("/produtor/pedidos", requireAuth, requireRole("producer"), listProducerOrders);
