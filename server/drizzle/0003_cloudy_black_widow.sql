CREATE TABLE "gateway_checkouts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"provider" text DEFAULT 'chargily' NOT NULL,
	"external_id" text NOT NULL,
	"invoice_id" text,
	"client_id" text,
	"amount_minor" bigint NOT NULL,
	"currency" text DEFAULT 'DZD' NOT NULL,
	"payment_method" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"checkout_url" text,
	"mode" text DEFAULT 'test' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gateway_checkouts" ADD CONSTRAINT "gateway_checkouts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_checkouts" ADD CONSTRAINT "gateway_checkouts_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_checkouts" ADD CONSTRAINT "gateway_checkouts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gateway_checkouts_external_uq" ON "gateway_checkouts" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "gateway_checkouts_tenant_status_idx" ON "gateway_checkouts" USING btree ("tenant_id","status","created_at");