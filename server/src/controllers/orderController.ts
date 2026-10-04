import { desc, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db/client.js";
import { orderItems, orders, producers, users } from "../db/schema.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { parseIdParam } from "../utils/parseIdParam.js";

type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;

const toOrderResponse = (order: OrderRow, items: OrderItemRow[]) => ({
  id: order.id,
  status: order.status,
  total: order.total,
  createdAt: order.createdAt,
  items: items.map((item) => ({
    productId: item.productId,
    name: item.productName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  })),
});


// Eu explico: Pedidos do comprador


export const listMyOrders = async (req: Request, res: Response) => {
  const rows = await db.query.orders.findMany({
    where: eq(orders.buyerId, req.user!.sub),
    with: { items: true },
    // Eu explico: `created_at` só tem precisão de segundo no SQLite — desempata por `id`.
    orderBy: [desc(orders.createdAt), desc(orders.id)],
  });
  res.json(rows.map((order) => toOrderResponse(order, order.items)));
};

export const getOrder = async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });
  if (!order) throw new ApiError(404, "Pedido não encontrado.");
  if (order.buyerId !== req.user!.sub) {
    throw new ApiError(403, "Você só pode ver os seus próprios pedidos.");
  }
  res.json(toOrderResponse(order, order.items));
};


// Eu explico: Pedidos do produtor (itens que incluem produtos dele, de qualquer comprador)


export const listProducerOrders = async (req: Request, res: Response) => {
  const producerProfile = await db.query.producers.findFirst({
    where: eq(producers.userId, req.user!.sub),
  });
  if (!producerProfile) throw new ApiError(404, "Perfil de produtor não encontrado.");

  const rows = await db
    .select({
      orderId: orders.id,
      orderStatus: orders.status,
      orderCreatedAt: orders.createdAt,
      buyerName: users.name,
      productId: orderItems.productId,
      productName: orderItems.productName,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
      subtotal: orderItems.subtotal,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(users, eq(orders.buyerId, users.id))
    .where(eq(orderItems.producerId, producerProfile.id))
    .orderBy(desc(orders.createdAt), desc(orders.id));

  res.json(rows);
};
