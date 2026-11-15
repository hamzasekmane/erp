CREATE TABLE "account_closure" (
	"tenant_id" text NOT NULL,
	"ancestor_id" text NOT NULL,
	"descendant_id" text NOT NULL,
	"depth" integer NOT NULL,
	CONSTRAINT "account_closure_tenant_id_ancestor_id_descendant_id_pk" PRIMARY KEY("tenant_id","ancestor_id","descendant_id"),
	CONSTRAINT "account_closure_depth_chk" CHECK ("account_closure"."depth" >= 0),
	CONSTRAINT "account_closure_self_chk" CHECK (("account_closure"."depth" = 0) = ("account_closure"."ancestor_id" = "account_closure"."descendant_id"))
);
--> statement-breakpoint
CREATE TABLE "accounting_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"period" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounting_periods_status_chk" CHECK ("accounting_periods"."status" in ('open','locked')),
	CONSTRAINT "accounting_periods_range_chk" CHECK ("accounting_periods"."end_date" >= "accounting_periods"."start_date")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"normal_balance" text NOT NULL,
	"parent_id" text,
	"is_postable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"system_role" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "accounts_type_chk" CHECK ("accounts"."type" in ('asset','liability','equity','revenue','expense')),
	CONSTRAINT "accounts_normal_balance_chk" CHECK ("accounts"."normal_balance" in ('debit','credit'))
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"number" text NOT NULL,
	"entry_date" date NOT NULL,
	"status" text DEFAULT 'posted' NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"memo" text,
	"is_reversal" boolean DEFAULT false NOT NULL,
	"reverses_entry_id" text,
	"reversed_by_entry_id" text,
	"posted_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_status_chk" CHECK ("journal_entries"."status" in ('draft','posted','reversed')),
	CONSTRAINT "journal_entries_reversal_chk" CHECK (("journal_entries"."is_reversal" = false and "journal_entries"."reverses_entry_id" is null) or ("journal_entries"."is_reversal" = true and "journal_entries"."reverses_entry_id" is not null)),
	CONSTRAINT "journal_entries_no_self_reversal_chk" CHECK ("journal_entries"."reverses_entry_id" is distinct from "journal_entries"."id")
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"entry_id" text NOT NULL,
	"line_number" integer NOT NULL,
	"account_id" text NOT NULL,
	"debit_minor" bigint DEFAULT 0 NOT NULL,
	"credit_minor" bigint DEFAULT 0 NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_lines_debit_credit_chk" CHECK ("journal_lines"."debit_minor" >= 0 and "journal_lines"."credit_minor" >= 0),
	CONSTRAINT "journal_lines_one_sided_chk" CHECK (("journal_lines"."debit_minor" > 0 and "journal_lines"."credit_minor" = 0) or ("journal_lines"."credit_minor" > 0 and "journal_lines"."debit_minor" = 0))
);
--> statement-breakpoint
ALTER TABLE "account_closure" ADD CONSTRAINT "account_closure_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_periods" ADD CONSTRAINT "accounting_periods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_closure_descendant_idx" ON "account_closure" USING btree ("tenant_id","descendant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_periods_tenant_period_uq" ON "accounting_periods" USING btree ("tenant_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_tenant_code_uq" ON "accounts" USING btree ("tenant_id","code") WHERE "accounts"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_tenant_system_role_uq" ON "accounts" USING btree ("tenant_id","system_role") WHERE "accounts"."system_role" is not null and "accounts"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "accounts_tenant_type_idx" ON "accounts" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_entries_tenant_number_uq" ON "journal_entries" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX "journal_entries_tenant_date_idx" ON "journal_entries" USING btree ("tenant_id","entry_date");--> statement-breakpoint
CREATE INDEX "journal_entries_source_idx" ON "journal_entries" USING btree ("tenant_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "journal_entries_reverses_idx" ON "journal_entries" USING btree ("tenant_id","reverses_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_lines_entry_line_uq" ON "journal_lines" USING btree ("entry_id","line_number");--> statement-breakpoint
CREATE INDEX "journal_lines_account_idx" ON "journal_lines" USING btree ("tenant_id","account_id");--> statement-breakpoint
-- stock_levels_quantity_chk is created by hand in 0006_stock_guards.sql and is
-- already present in the schema snapshot drift; drizzle does not track it.