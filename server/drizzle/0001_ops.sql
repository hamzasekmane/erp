CREATE TABLE "archive_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"description" text,
	"file_url" text,
	"mime" text,
	"size" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"date" date NOT NULL,
	"check_in" text,
	"check_out" text,
	"status" text DEFAULT 'present' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_status_chk" CHECK ("attendance_records"."status" in ('present','late','absent','leave','holiday','remote'))
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"manager_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "employee_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"type" text DEFAULT 'cdi' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"salary_minor" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_contracts_type_chk" CHECK ("employee_contracts"."type" in ('cdi','cdd','intern','freelance')),
	CONSTRAINT "employee_contracts_status_chk" CHECK ("employee_contracts"."status" in ('active','expired','terminated'))
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"department_id" text,
	"position" text DEFAULT '' NOT NULL,
	"contract_type" text DEFAULT 'cdi' NOT NULL,
	"hire_date" date NOT NULL,
	"salary_minor" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "employees_status_chk" CHECK ("employees"."status" in ('active','inactive','terminated')),
	CONSTRAINT "employees_contract_chk" CHECK ("employees"."contract_type" in ('cdi','cdd','intern','freelance'))
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"type" text DEFAULT 'annual' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days" numeric(6, 1) DEFAULT '1' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leave_requests_type_chk" CHECK ("leave_requests"."type" in ('annual','sick','unpaid','maternity','other')),
	CONSTRAINT "leave_requests_status_chk" CHECK ("leave_requests"."status" in ('pending','approved','rejected','cancelled'))
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"subject" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_status_chk" CHECK ("support_tickets"."status" in ('open','in_progress','waiting','resolved','closed')),
	CONSTRAINT "support_tickets_priority_chk" CHECK ("support_tickets"."priority" in ('low','medium','high','urgent'))
);
--> statement-breakpoint
ALTER TABLE "archive_documents" ADD CONSTRAINT "archive_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "archive_documents_tenant_idx" ON "archive_documents" USING btree ("tenant_id","category","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_employee_day_uq" ON "attendance_records" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "attendance_tenant_date_idx" ON "attendance_records" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_name_uq" ON "departments" USING btree ("tenant_id",lower("name")) WHERE "departments"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "employee_contracts_employee_idx" ON "employee_contracts" USING btree ("tenant_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_code_uq" ON "employees" USING btree ("tenant_id",lower("code")) WHERE "employees"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "employees_tenant_department_idx" ON "employees" USING btree ("tenant_id","department_id","status");--> statement-breakpoint
CREATE INDEX "leave_requests_tenant_idx" ON "leave_requests" USING btree ("tenant_id","status","start_date");--> statement-breakpoint
CREATE INDEX "support_messages_ticket_idx" ON "support_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "support_tickets_tenant_idx" ON "support_tickets" USING btree ("tenant_id","status","created_at");