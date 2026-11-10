CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"prefix" text NOT NULL,
	"hash" text NOT NULL,
	"scopes" text[] DEFAULT '{}'::text[] NOT NULL,
	"permissions" text[] DEFAULT '{}'::text[] NOT NULL,
	"rate_limit" integer DEFAULT 1000 NOT NULL,
	"ip_whitelist" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_by" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"actor_type" text DEFAULT 'user' NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity" text,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip" text,
	"user_agent" text,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'product' NOT NULL,
	"parent_id" text,
	"color" text DEFAULT '#0891b2' NOT NULL,
	"icon" text DEFAULT 'tag' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "categories_type_chk" CHECK ("categories"."type" in ('product','client','invoice'))
);
--> statement-breakpoint
CREATE TABLE "client_group_members" (
	"group_id" text NOT NULL,
	"client_id" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_group_members_group_id_client_id_pk" PRIMARY KEY("group_id","client_id")
);
--> statement-breakpoint
CREATE TABLE "client_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT 'cyan' NOT NULL,
	"discount_bp" integer DEFAULT 0 NOT NULL,
	"grouped_billing" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "client_groups_discount_chk" CHECK ("client_groups"."discount_bp" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "client_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"client_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "client_notes_category_chk" CHECK ("client_notes"."category" in ('general','follow-up','important','reminder'))
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'individual' NOT NULL,
	"category" text DEFAULT 'regular' NOT NULL,
	"email" text,
	"phone" text,
	"mobile" text,
	"tax_number" text,
	"commercial_registration" text,
	"contact_person" text,
	"notes" text,
	"address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"billing_address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"balance_minor" bigint DEFAULT 0 NOT NULL,
	"credit_limit_minor" bigint DEFAULT 0 NOT NULL,
	"payment_terms" text DEFAULT 'net_30' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "clients_type_chk" CHECK ("clients"."type" in ('individual','company')),
	CONSTRAINT "clients_category_chk" CHECK ("clients"."category" in ('vip','regular','wholesale','retail')),
	CONSTRAINT "clients_balance_chk" CHECK ("clients"."balance_minor" >= 0)
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"kind" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"checksum" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"tenant_id" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"response" jsonb,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "idempotency_keys_tenant_id_key_pk" PRIMARY KEY("tenant_id","key")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"position" integer NOT NULL,
	"product_id" text,
	"description" text NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"unit_price_minor" bigint DEFAULT 0 NOT NULL,
	"discount_bp" integer DEFAULT 0 NOT NULL,
	"tax_rate_bp" integer DEFAULT 0 NOT NULL,
	"tax_minor" bigint DEFAULT 0 NOT NULL,
	"line_total_minor" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "invoice_items_qty_chk" CHECK ("invoice_items"."quantity" > 0),
	CONSTRAINT "invoice_items_discount_chk" CHECK ("invoice_items"."discount_bp" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "invoice_public_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_id" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"number" text NOT NULL,
	"client_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"currency" text DEFAULT 'DZD' NOT NULL,
	"subtotal_minor" bigint DEFAULT 0 NOT NULL,
	"discount_minor" bigint DEFAULT 0 NOT NULL,
	"shipping_minor" bigint DEFAULT 0 NOT NULL,
	"tax_minor" bigint DEFAULT 0 NOT NULL,
	"total_minor" bigint DEFAULT 0 NOT NULL,
	"paid_minor" bigint DEFAULT 0 NOT NULL,
	"due_minor" bigint DEFAULT 0 NOT NULL,
	"notes" text,
	"terms" text,
	"issued_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_by" text,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "invoices_status_chk" CHECK ("invoices"."status" in ('draft','sent','paid','partially_paid','overdue','cancelled')),
	CONSTRAINT "invoices_amounts_chk" CHECK ("invoices"."subtotal_minor" >= 0 and "invoices"."total_minor" >= 0 and "invoices"."paid_minor" >= 0 and "invoices"."due_minor" >= 0),
	CONSTRAINT "invoices_due_chk" CHECK ("invoices"."due_minor" = "invoices"."total_minor" - "invoices"."paid_minor")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"type" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"priority" text DEFAULT 'medium' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "notifications_type_chk" CHECK ("notifications"."type" in ('info','success','warning','error')),
	CONSTRAINT "notifications_priority_chk" CHECK ("notifications"."priority" in ('low','medium','high'))
);
--> statement-breakpoint
CREATE TABLE "number_sequences" (
	"tenant_id" text NOT NULL,
	"doc_type" text NOT NULL,
	"period" text NOT NULL,
	"next_value" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "number_sequences_tenant_id_doc_type_period_pk" PRIMARY KEY("tenant_id","doc_type","period"),
	CONSTRAINT "number_sequences_value_chk" CHECK ("number_sequences"."next_value" > 0)
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_allocations_amount_chk" CHECK ("payment_allocations"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_gateway_secrets" (
	"gateway_id" text NOT NULL,
	"key" text NOT NULL,
	"ciphertext" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_gateway_secrets_gateway_id_key_pk" PRIMARY KEY("gateway_id","key")
);
--> statement-breakpoint
CREATE TABLE "payment_gateways" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"reason" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"number" text NOT NULL,
	"client_id" text,
	"invoice_id" text,
	"amount_minor" bigint NOT NULL,
	"currency" text DEFAULT 'DZD' NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"reference" text,
	"notes" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"reconciled_at" timestamp with time zone,
	"reconciled_by" text,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_chk" CHECK ("payments"."amount_minor" > 0),
	CONSTRAINT "payments_status_chk" CHECK ("payments"."status" in ('pending','completed','failed','refunded','cancelled'))
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_monthly_minor" bigint DEFAULT 0 NOT NULL,
	"price_yearly_minor" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'DZD' NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trial_days" integer DEFAULT 14 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" text,
	"price_minor" bigint DEFAULT 0 NOT NULL,
	"cost_minor" bigint DEFAULT 0 NOT NULL,
	"min_stock" numeric(18, 3) DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'piece' NOT NULL,
	"tax_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_price_chk" CHECK ("products"."price_minor" >= 0),
	CONSTRAINT "products_unit_chk" CHECK ("products"."unit" in ('piece','kg','meter','liter','box','pack'))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"family_id" text NOT NULL,
	"user_agent" text,
	"ip" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_levels" (
	"product_id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"quantity" numeric(18, 3) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"product_id" text NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"unit_cost_minor" bigint DEFAULT 0 NOT NULL,
	"reason" text,
	"reference_type" text,
	"reference_id" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movements_type_chk" CHECK ("stock_movements"."type" in ('in','out','adjustment','transfer'))
);
--> statement-breakpoint
CREATE TABLE "subscription_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"number" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"amount_minor" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'DZD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"status" text DEFAULT 'trial' NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone DEFAULT now() NOT NULL,
	"trial_end" timestamp with time zone,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"price_minor" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'DZD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_status_chk" CHECK ("subscriptions"."status" in ('trial','active','expired','cancelled','past_due','pending_payment')),
	CONSTRAINT "subscriptions_cycle_chk" CHECK ("subscriptions"."billing_cycle" in ('monthly','yearly'))
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"rate_bp" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taxes_rate_chk" CHECK ("taxes"."rate_bp" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"date_format" text DEFAULT 'dd/MM/yyyy' NOT NULL,
	"number_format" text DEFAULT 'fr-FR' NOT NULL,
	"primary_color" text DEFAULT '#06b6d4' NOT NULL,
	"security" jsonb DEFAULT '{"twoFactorAuth":false,"sessionTimeout":480,"passwordPolicy":"standard","ipWhitelist":[],"allowedDomains":[]}'::jsonb NOT NULL,
	"notifications" jsonb DEFAULT '{"emailNotifications":true,"pushNotifications":false,"alertOnLogin":true,"weeklyReports":false}'::jsonb NOT NULL,
	"integrations" jsonb DEFAULT '{"stripe":false,"slack":false,"googleDrive":false,"dropbox":false,"zapier":false}'::jsonb NOT NULL,
	"invoice_prefix" text DEFAULT 'FA-' NOT NULL,
	"default_vat_bp" integer DEFAULT 1900 NOT NULL,
	"allow_overpayment" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subdomain" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"city" text,
	"country" text DEFAULT 'DZ' NOT NULL,
	"tax_number" text,
	"currency" text DEFAULT 'DZD' NOT NULL,
	"language" text DEFAULT 'fr' NOT NULL,
	"timezone" text DEFAULT 'Africa/Algiers' NOT NULL,
	"status" text DEFAULT 'trial' NOT NULL,
	"plan_code" text DEFAULT 'trial' NOT NULL,
	"logo_url" text,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tenants_status_chk" CHECK ("tenants"."status" in ('active','inactive','suspended','trial')),
	CONSTRAINT "tenants_currency_chk" CHECK ("tenants"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"avatar_url" text,
	"phone" text,
	"department" text,
	"last_login_at" timestamp with time zone,
	"token_version" integer DEFAULT 0 NOT NULL,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_role_chk" CHECK ("users"."role" in ('superadmin','tenant_admin','manager','user')),
	CONSTRAINT "users_status_chk" CHECK ("users"."status" in ('active','inactive','suspended'))
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_group_members" ADD CONSTRAINT "client_group_members_group_id_client_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."client_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_group_members" ADD CONSTRAINT "client_group_members_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_groups" ADD CONSTRAINT "client_groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_public_tokens" ADD CONSTRAINT "invoice_public_tokens_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_status_history" ADD CONSTRAINT "invoice_status_history_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_gateway_secrets" ADD CONSTRAINT "payment_gateway_secrets_gateway_id_payment_gateways_id_fk" FOREIGN KEY ("gateway_id") REFERENCES "public"."payment_gateways"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_gateways" ADD CONSTRAINT "payment_gateways_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tax_id_taxes_id_fk" FOREIGN KEY ("tax_id") REFERENCES "public"."taxes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_prefix_uq" ON "api_keys" USING btree ("prefix");--> statement-breakpoint
CREATE INDEX "api_keys_tenant_idx" ON "api_keys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_created_idx" ON "audit_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_uq" ON "categories" USING btree ("tenant_id","type",lower("name")) WHERE "categories"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "client_group_members_client_idx" ON "client_group_members" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_groups_name_uq" ON "client_groups" USING btree ("tenant_id",lower("name")) WHERE "client_groups"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "client_notes_tenant_client_idx" ON "client_notes" USING btree ("tenant_id","client_id","is_pinned","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_code_uq" ON "clients" USING btree ("tenant_id",lower("code")) WHERE "clients"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_email_uq" ON "clients" USING btree ("tenant_id",lower("email")) WHERE "clients"."email" is not null and "clients"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "clients_tenant_name_idx" ON "clients" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "clients_tenant_created_idx" ON "clients" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_items_position_uq" ON "invoice_items" USING btree ("invoice_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_public_tokens_hash_uq" ON "invoice_public_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "invoice_public_tokens_invoice_idx" ON "invoice_public_tokens" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_status_history_invoice_idx" ON "invoice_status_history" USING btree ("invoice_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_uq" ON "invoices" USING btree ("tenant_id","number") WHERE "invoices"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "invoices_tenant_status_due_idx" ON "invoices" USING btree ("tenant_id","status","due_date");--> statement-breakpoint
CREATE INDEX "invoices_tenant_client_idx" ON "invoices" USING btree ("tenant_id","client_id","issue_date");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("tenant_id","user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "outbox_events_status_idx" ON "outbox_events" USING btree ("status","available_at");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_token_uq" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_allocations_uq" ON "payment_allocations" USING btree ("payment_id","invoice_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_invoice_idx" ON "payment_allocations" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_gateways_code_uq" ON "payment_gateways" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_methods_code_uq" ON "payment_methods" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "payment_refunds_payment_idx" ON "payment_refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_number_uq" ON "payments" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX "payments_tenant_status_idx" ON "payments" USING btree ("tenant_id","status","paid_at");--> statement-breakpoint
CREATE INDEX "payments_tenant_client_idx" ON "payments" USING btree ("tenant_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_code_uq" ON "plans" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "products_code_uq" ON "products" USING btree ("tenant_id",lower("code")) WHERE "products"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "products_tenant_category_idx" ON "products" USING btree ("tenant_id","category_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_refresh_uq" ON "sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "sessions_family_idx" ON "sessions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "stock_levels_tenant_idx" ON "stock_levels" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "stock_movements_tenant_product_idx" ON "stock_movements" USING btree ("tenant_id","product_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_invoices_number_uq" ON "subscription_invoices" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX "subscriptions_tenant_idx" ON "subscriptions" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "taxes_name_uq" ON "taxes" USING btree ("tenant_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_subdomain_uq" ON "tenants" USING btree (lower("subdomain")) WHERE "tenants"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree (lower("email")) WHERE "users"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "users_tenant_status_idx" ON "users" USING btree ("tenant_id","status");