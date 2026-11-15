CREATE TABLE "bom_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"parent_id" text NOT NULL,
	"child_id" text NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"scrap_bp" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bom_lines_quantity_chk" CHECK ("bom_lines"."quantity" > 0),
	CONSTRAINT "bom_lines_scrap_chk" CHECK ("bom_lines"."scrap_bp" >= 0 and "bom_lines"."scrap_bp" <= 10000),
	CONSTRAINT "bom_lines_no_self_ref_chk" CHECK ("bom_lines"."parent_id" <> "bom_lines"."child_id")
);
--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_child_id_products_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bom_lines_edge_uq" ON "bom_lines" USING btree ("tenant_id","parent_id","child_id");--> statement-breakpoint
CREATE INDEX "bom_lines_child_idx" ON "bom_lines" USING btree ("tenant_id","child_id");