CREATE TABLE "uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"kind" text DEFAULT 'document' NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"storage_path" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "uploads_kind_chk" CHECK ("uploads"."kind" in ('logo','document','attachment','import'))
);
--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "uploads_tenant_created_idx" ON "uploads" USING btree ("tenant_id","created_at");