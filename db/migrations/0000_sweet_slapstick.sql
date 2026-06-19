CREATE TABLE "automation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"action_type" text NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"reasoning" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp,
	"decided_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"channel" text NOT NULL,
	"external_id" text,
	"customer_id" uuid,
	"customer_phone" text,
	"customer_name" text,
	"status" text DEFAULT 'ai_handling' NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"last_message_preview" text,
	"message_count" integer DEFAULT 0,
	"topic" text,
	"sentiment" text,
	"handled_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"external_id" text,
	"full_name" text,
	"email" text,
	"phone" text,
	"total_orders" integer DEFAULT 0,
	"total_spent" numeric(12, 2) DEFAULT '0',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"use_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "marketplace_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'baglanti_yok' NOT NULL,
	"credentials" jsonb DEFAULT '{}'::jsonb,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'metin',
	"media_url" text,
	"external_message_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" uuid,
	"customer_email" text,
	"customer_phone" text,
	"total_price" numeric(12, 2),
	"currency" text DEFAULT 'TRY',
	"items_json" jsonb DEFAULT '[]'::jsonb,
	"fulfillment_status" text DEFAULT 'beklemede' NOT NULL,
	"financial_status" text DEFAULT 'odeme_bekliyor' NOT NULL,
	"tracking_number" text,
	"tracking_company" text,
	"tracking_url" text,
	"shipping_address" jsonb,
	"placed_at" timestamp DEFAULT now() NOT NULL,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"review_requested_at" timestamp,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"plan" text DEFAULT 'temel' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"order_id" uuid,
	"reason" text NOT NULL,
	"status" text DEFAULT 'talep_edildi' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp,
	"decided_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"order_id" uuid,
	"product_name" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"customer_name" text,
	"status" text DEFAULT 'yeni' NOT NULL,
	"ai_suggested_reply" text,
	"replied_text" text,
	"replied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_actions" ADD CONSTRAINT "automation_actions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_connections" ADD CONSTRAINT "marketplace_connections_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_actions_org_status_idx" ON "automation_actions" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "automation_actions_org_created_idx" ON "automation_actions" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "conversations_org_channel_ext_idx" ON "conversations" USING btree ("org_id","channel","external_id");--> statement-breakpoint
CREATE INDEX "conversations_org_status_idx" ON "conversations" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "customers_org_phone_idx" ON "customers" USING btree ("org_id","phone");--> statement-breakpoint
CREATE INDEX "customers_org_external_idx" ON "customers" USING btree ("org_id","external_id");--> statement-breakpoint
CREATE INDEX "marketplace_connections_org_provider_idx" ON "marketplace_connections" USING btree ("org_id","provider");--> statement-breakpoint
CREATE INDEX "orders_org_external_idx" ON "orders" USING btree ("org_id","provider","external_id");--> statement-breakpoint
CREATE INDEX "orders_org_number_idx" ON "orders" USING btree ("org_id","order_number");--> statement-breakpoint
CREATE INDEX "orders_org_phone_idx" ON "orders" USING btree ("org_id","customer_phone");--> statement-breakpoint
CREATE INDEX "return_requests_org_status_idx" ON "return_requests" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "return_requests_org_external_idx" ON "return_requests" USING btree ("org_id","provider","external_id");--> statement-breakpoint
CREATE INDEX "reviews_org_status_idx" ON "reviews" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "reviews_org_external_idx" ON "reviews" USING btree ("org_id","provider","external_id");