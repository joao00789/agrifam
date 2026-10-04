import { Router } from "express";
import {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
} from "../controllers/conversationController.js";
import { requireAuth } from "../middlewares/auth.js";
import { createRateLimit } from "../middlewares/rateLimit.js";

export const conversationRouter = Router();
const messageRateLimit = createRateLimit(30, 60 * 1000, "mensagens-chat");

conversationRouter.get("/conversas", requireAuth, listConversations);
conversationRouter.post("/conversas", requireAuth, createConversation);
conversationRouter.get("/conversas/:id/mensagens", requireAuth, listMessages);
conversationRouter.post("/conversas/:id/mensagens", requireAuth, messageRateLimit, sendMessage);
