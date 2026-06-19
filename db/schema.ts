import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const marketplaceProvider = [
  "trendyol",
  "amazon",
  "hepsiburada",
] as const;
export type MarketplaceProvider = (typeof marketplaceProvider)[number];

// Tenant (satıcı). id Clerk organization id ile eşleşir.
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  plan: text("plan", { enum: ["temel", "plus", "pro"] }).default("temel").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketplaceConnections = pgTable(
  "marketplace_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: marketplaceProvider }).notNull(),
    status: text("status", {
      enum: ["bagli", "baglanti_yok", "hata"],
    }).default("baglanti_yok").notNull(),
    credentials: jsonb("credentials").$type<Record<string, unknown>>().default({}),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    orgProviderIdx: index("marketplace_connections_org_provider_idx").on(t.orgId, t.provider),
  })
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    externalId: text("external_id"),
    fullName: text("full_name"),
    email: text("email"),
    phone: text("phone"),
    totalOrders: integer("total_orders").default(0),
    totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).default("0"),
    tags: jsonb("tags").$type<string[]>().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    orgPhoneIdx: index("customers_org_phone_idx").on(t.orgId, t.phone),
    orgExternalIdx: index("customers_org_external_idx").on(t.orgId, t.externalId),
  })
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: marketplaceProvider }).notNull(),
    externalId: text("external_id").notNull(),
    orderNumber: text("order_number").notNull(),
    customerId: uuid("customer_id").references(() => customers.id),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),

    totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
    currency: text("currency").default("TRY"),
    itemsJson: jsonb("items_json")
      .$type<
        Array<{
          productId: string;
          name: string;
          quantity: number;
          price: number;
          variant?: string;
        }>
      >()
      .default([]),

    fulfillmentStatus: text("fulfillment_status", {
      enum: ["beklemede", "hazirlaniyor", "kargoda", "teslim_edildi", "iptal_edildi"],
    }).default("beklemede").notNull(),
    financialStatus: text("financial_status", {
      enum: ["odeme_bekliyor", "odendi", "iade_edildi"],
    }).default("odeme_bekliyor").notNull(),

    trackingNumber: text("tracking_number"),
    trackingCompany: text("tracking_company"),
    trackingUrl: text("tracking_url"),

    shippingAddress: jsonb("shipping_address").$type<Record<string, unknown>>(),

    placedAt: timestamp("placed_at").defaultNow().notNull(),
    shippedAt: timestamp("shipped_at"),
    deliveredAt: timestamp("delivered_at"),
    reviewRequestedAt: timestamp("review_requested_at"),

    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (t) => ({
    orgExternalIdx: index("orders_org_external_idx").on(t.orgId, t.provider, t.externalId),
    orgNumberIdx: index("orders_org_number_idx").on(t.orgId, t.orderNumber),
    orgPhoneIdx: index("orders_org_phone_idx").on(t.orgId, t.customerPhone),
  })
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: marketplaceProvider }).notNull(),
    externalId: text("external_id").notNull(),
    orderId: uuid("order_id").references(() => orders.id),
    productName: text("product_name").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    customerName: text("customer_name"),

    status: text("status", { enum: ["yeni", "yanitlandi"] }).default("yeni").notNull(),
    aiSuggestedReply: text("ai_suggested_reply"),
    repliedText: text("replied_text"),
    repliedAt: timestamp("replied_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    orgStatusIdx: index("reviews_org_status_idx").on(t.orgId, t.status),
    orgExternalIdx: index("reviews_org_external_idx").on(t.orgId, t.provider, t.externalId),
  })
);

export const returnRequests = pgTable(
  "return_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: marketplaceProvider }).notNull(),
    externalId: text("external_id").notNull(),
    orderId: uuid("order_id").references(() => orders.id),
    reason: text("reason").notNull(),

    status: text("status", {
      enum: ["talep_edildi", "onay_bekliyor", "onaylandi", "reddedildi"],
    }).default("talep_edildi").notNull(),

    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    decidedAt: timestamp("decided_at"),
    decidedByUserId: text("decided_by_user_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    orgStatusIdx: index("return_requests_org_status_idx").on(t.orgId, t.status),
    orgExternalIdx: index("return_requests_org_external_idx").on(t.orgId, t.provider, t.externalId),
  })
);

// AI / otomasyon tarafından yapılan veya önerilen her aksiyonun denetim kaydı.
export const automationActions = pgTable(
  "automation_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),

    actionType: text("action_type", {
      enum: [
        "order_status_lookup",
        "reply_review",
        "approve_return",
        "reject_return",
        "escalate_to_human",
        "review_request",
      ],
    }).notNull(),
    source: text("source", { enum: ["ai", "automation", "human"] }).notNull(),
    status: text("status", {
      enum: ["completed", "pending_approval", "approved", "rejected"],
    }).default("completed").notNull(),

    targetType: text("target_type", { enum: ["order", "review", "return_request", "conversation"] }).notNull(),
    targetId: uuid("target_id").notNull(),

    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    reasoning: text("reasoning"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    decidedAt: timestamp("decided_at"),
    decidedByUserId: text("decided_by_user_id"),
  },
  (t) => ({
    orgStatusIdx: index("automation_actions_org_status_idx").on(t.orgId, t.status),
    orgCreatedIdx: index("automation_actions_org_created_idx").on(t.orgId, t.createdAt),
  })
);

// Müşteri destek konuşmaları (WhatsApp / Instagram / Web chat)
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    channel: text("channel", {
      enum: ["whatsapp", "instagram", "web_chat", "email"],
    }).notNull(),
    externalId: text("external_id"),
    customerId: uuid("customer_id").references(() => customers.id),
    customerPhone: text("customer_phone"),
    customerName: text("customer_name"),

    status: text("status", {
      enum: ["aktif", "ai_handling", "insan_bekliyor", "cozuldu", "kapandi"],
    }).default("ai_handling").notNull(),

    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    lastMessagePreview: text("last_message_preview"),
    messageCount: integer("message_count").default(0),

    topic: text("topic"),
    sentiment: text("sentiment", { enum: ["olumlu", "notr", "olumsuz"] }),

    handledByUserId: text("handled_by_user_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    orgChannelExtIdx: index("conversations_org_channel_ext_idx").on(t.orgId, t.channel, t.externalId),
    orgStatusIdx: index("conversations_org_status_idx").on(t.orgId, t.status),
  })
);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  direction: text("direction", { enum: ["gelen", "giden"] }).notNull(),
  sender: text("sender", { enum: ["musteri", "ai", "insan"] }).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type", {
    enum: ["metin", "resim", "video", "dosya"],
  }).default("metin"),
  mediaUrl: text("media_url"),
  externalMessageId: text("external_message_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true).notNull(),
  useCount: integer("use_count").default(0),
});
