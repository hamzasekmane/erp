ALTER TABLE "uploads" ADD COLUMN "scan_status" text DEFAULT 'clean' NOT NULL;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "scan_engine" text;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "scan_signature" text;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "scanned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_scan_status_chk" CHECK ("uploads"."scan_status" in ('clean','infected','skipped','error'));