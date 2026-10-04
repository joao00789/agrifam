import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  bigserial,
  check,
  doublePrecision,
  integer,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Eu explico: Fases 1, 2, 3 e 4 (Autenticação, Catálogo, Pedidos e Conversas) — todas as fases do
 * Eu explico: backend previstas no TODO.md. A Fase 5 é integrar o frontend a essas rotas.
 */
export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url").notNull().default(""),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["buyer", "producer"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [check("users_role_check", sql`${table.role} in ('buyer', 'producer')`)]);

/**
 * Eu explico: Perfil de produtor, um por usuário com role "producer". Criado junto do cadastro
 * Eu explico: (ver authController.register) porque `POST /api/produtos` depende de já existir um
 * Eu explico: `producerId` para associar o produto.
 */
export const producers = pgTable("producers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .unique()
    .references(() => users.id),
  // Eu explico: Nome da propriedade/negócio (ex.: "Sítio Boa Esperança") — é o valor que aparece
  // Eu explico: no campo `producer` dos produtos, conforme o contrato de types.ts.
  property: text("property").notNull(),
  location: text("location").notNull(),
  specialty: text("specialty").notNull(),
  rating: doublePrecision("rating").notNull().default(5),
  history: text("history").notNull().default(""),
  image: text("image").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  mercadoPagoUserId: text("mercado_pago_user_id"),
  mercadoPagoAccessToken: text("mercado_pago_access_token"),
  mercadoPagoRefreshToken: text("mercado_pago_refresh_token"),
  mercadoPagoTokenExpiresAt: timestamp("mercado_pago_token_expires_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

// Eu explico: Sessões revogáveis com refresh token opaco; no banco fica apenas o hash do token.
export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshTokenHash: text("refresh_token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("auth_sessions_user_id_idx").on(table.userId)]);

// Eu explico: Tokens de recuperação ficam armazenados como hash, expiram em poucos minutos e só
// Eu explico: podem ser consumidos uma vez.
export const passwordResetTokens = pgTable("password_reset_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("password_reset_tokens_user_id_idx").on(table.userId)]);

export const categories = pgTable("categories", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull().unique(),
  // Eu explico: Chave do ícone SVG incorporado em `categoryIcons` no script.js da interface web.
  icon: text("icon").notNull(),
});

export const products = pgTable("products", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  producerId: bigint("producer_id", { mode: "number" })
    .notNull()
    .references(() => producers.id),
  categoryId: bigint("category_id", { mode: "number" })
    .notNull()
    .references(() => categories.id),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  unit: text("unit").notNull(),
  location: text("location").notNull(),
  rating: doublePrecision("rating").notNull().default(5),
  image: text("image").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

/**
 * Eu explico: Um pedido por checkout de um comprador autenticado. O pedido só vira "paid"
 * Eu explico: quando o webhook assinado do Mercado Pago confirma o pagamento.
 */
export const orders = pgTable("orders", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  buyerId: bigint("buyer_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  status: text("status", { enum: ["pending", "paid", "rejected", "cancelled"] })
    .notNull()
    .default("pending"),
  total: doublePrecision("total").notNull(),
  producerId: bigint("producer_id", { mode: "number" }).references(() => producers.id),
  marketplaceFee: doublePrecision("marketplace_fee").notNull(),
  mercadoPagoPreferenceId: text("mercado_pago_preference_id"),
  mercadoPagoPaymentId: text("mercado_pago_payment_id"),
  checkoutRequestId: text("checkout_request_id"),
  checkoutFingerprint: text("checkout_fingerprint"),
  checkoutUrl: text("checkout_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  check("orders_status_check", sql`${table.status} in ('pending', 'paid', 'rejected', 'cancelled')`),
  uniqueIndex("orders_buyer_checkout_request_unique").on(table.buyerId, table.checkoutRequestId),
]);

// Eu explico: Registro mínimo para auditoria de eventos confirmados pelo provedor de pagamento.
// Eu explico: Nunca guardar dados de cartão ou o corpo completo enviado pelo gateway.
export const paymentEvents = pgTable("payment_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull().references(() => orders.id),
  paymentId: text("payment_id").notNull(),
  paymentStatus: text("payment_status").notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull(),
  sellerAccountId: text("seller_account_id").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [uniqueIndex("payment_events_payment_status_unique").on(table.paymentId, table.paymentStatus)]);

/**
 * Eu explico: `productName`/`unitPrice` são uma cópia (snapshot) do produto no momento da compra:
 * Eu explico: o histórico do pedido não deve mudar se o produtor editar o preço depois.
 * Eu explico: `producerId` é redundante com `productId -> products.producerId`, mas evita um join
 * Eu explico: extra para `GET /api/produtor/pedidos`.
 */
export const orderItems = pgTable("order_items", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" })
    .notNull()
    .references(() => orders.id),
  productId: bigint("product_id", { mode: "number" })
    .notNull()
    .references(() => products.id),
  producerId: bigint("producer_id", { mode: "number" })
    .notNull()
    .references(() => producers.id),
  productName: text("product_name").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
});

/**
 * Eu explico: Uma conversa por par comprador-produtor (índice único evita duplicar a thread se o
 * Eu explico: mesmo comprador iniciar contato de novo com o mesmo produtor).
 */
export const conversations = pgTable(
  "conversations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    buyerId: bigint("buyer_id", { mode: "number" })
      .notNull()
      .references(() => users.id),
    producerId: bigint("producer_id", { mode: "number" })
      .notNull()
      .references(() => producers.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("conversations_buyer_producer_unique").on(table.buyerId, table.producerId)],
);

export const messages = pgTable("messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  conversationId: bigint("conversation_id", { mode: "number" })
    .notNull()
    .references(() => conversations.id),
  senderId: bigint("sender_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  producer: one(producers, {
    fields: [users.id],
    references: [producers.userId],
  }),
  orders: many(orders),
  conversationsAsBuyer: many(conversations),
  messages: many(messages),
}));

export const producersRelations = relations(producers, ({ one, many }) => ({
  user: one(users, {
    fields: [producers.userId],
    references: [users.id],
  }),
  products: many(products),
  conversations: many(conversations),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  producer: one(producers, {
    fields: [products.producerId],
    references: [producers.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  producer: one(producers, {
    fields: [orderItems.producerId],
    references: [producers.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  buyer: one(users, {
    fields: [conversations.buyerId],
    references: [users.id],
  }),
  producer: one(producers, {
    fields: [conversations.producerId],
    references: [producers.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));
