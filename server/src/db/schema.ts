import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Conventions (see docs/02-architecture.md §7):
 * - ids: text (UUID) returned as `_id` + `id`
 * - money: bigint minor units
 * - rates: integer basis points
 * - timestamps: timestamptz
 * - soft delete: deleted_at
 */

const id = () => text("id").primaryKey();
const tenantId = () => text("tenant_id").notNull();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const deletedAt = () => timestamp("deleted_at", { withTimezone: true });
const money = (name: string) => bigint(name, { mode: "number" }).notNull().default(0);

/* ------------------------------------------------------------------ */
/* Tenancy                                                             */
/* ------------------------------------------------------------------ */

export const tenants = pgTable(
  "tenants",
  {
    id: id(),
    name: text("name").notNull(),
    subdomain: text("subdomain").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    country: text("country").notNull().default("DZ"),
    taxNumber: text("tax_number"),
    currency: text("currency").notNull().default("DZD"),
    language: text("language").notNull().default("fr"),
    timezone: text("timezone").notNull().default("Africa/Algiers"),
    status: text("status").notNull().default("trial"),
    planCode: text("plan_code").notNull().default("trial"),
    logoUrl: text("logo_url"),
    legacyId: text("legacy_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    uniqueIndex("tenants_subdomain_uq").on(sql`lower(${t.subdomain})`).where(sql`${t.deletedAt} is null`),
    index("tenants_status_idx").on(t.status),
    check("tenants_status_chk", sql`${t.status} in ('active','inactive','suspended','trial')`),
    check("tenants_currency_chk", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  ],
);

export const tenantSettings = pgTable("tenant_settings", {
  tenantId: text("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("dark"),
  dateFormat: text("date_format").notNull().default("dd/MM/yyyy"),
  numberFormat: text("number_format").notNull().default("fr-FR"),
  primaryColor: text("primary_color").notNull().default("#06b6d4"),
  security: jsonb("security")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({ twoFactorAuth: false, sessionTimeout: 480, passwordPolicy: "standard", ipWhitelist: [], allowedDomains: [] }),
  notifications: jsonb("notifications")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({ emailNotifications: true, pushNotifications: false, alertOnLogin: true, weeklyReports: false }),
  integrations: jsonb("integrations")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({ stripe: false, slack: false, googleDrive: false, dropbox: false, zapier: false }),
  invoicePrefix: text("invoice_prefix").notNull().default("FA-"),
  defaultVatBp: integer("default_vat_bp").notNull().default(1900),
  allowOverpayment: boolean("allow_overpayment").notNull().default(false),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("user"),
    status: text("status").notNull().default("active"),
    avatarUrl: text("avatar_url"),
    phone: text("phone"),
    department: text("department"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    tokenVersion: integer("token_version").notNull().default(0),
    legacyId: text("legacy_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    // login is email-only in the existing frontend => globally unique email
    uniqueIndex("users_email_uq").on(sql`lower(${t.email})`).where(sql`${t.deletedAt} is null`),
    index("users_tenant_status_idx").on(t.tenantId, t.status),
    check("users_role_chk", sql`${t.role} in ('superadmin','tenant_admin','manager','user')`),
    check("users_status_chk", sql`${t.status} in ('active','inactive','suspended')`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    familyId: text("family_id").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("sessions_refresh_uq").on(t.refreshTokenHash),
    index("sessions_user_idx").on(t.userId, t.expiresAt),
    index("sessions_family_idx").on(t.familyId),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("password_reset_token_uq").on(t.tokenHash)],
);

/* ------------------------------------------------------------------ */
/* Billing                                                             */
/* ------------------------------------------------------------------ */

export const plans = pgTable(
  "plans",
  {
    id: id(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    priceMonthlyMinor: money("price_monthly_minor"),
    priceYearlyMinor: money("price_yearly_minor"),
    currency: text("currency").notNull().default("DZD"),
    features: jsonb("features").$type<Record<string, boolean>>().notNull().default({}),
    limits: jsonb("limits").$type<Record<string, number>>().notNull().default({}),
    trialDays: integer("trial_days").notNull().default(14),
    isActive: boolean("is_active").notNull().default(true),
    isPopular: boolean("is_popular").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("plans_code_uq").on(t.code)],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    status: text("status").notNull().default("trial"),
    billingCycle: text("billing_cycle").notNull().default("monthly"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull().defaultNow(),
    trialEnd: timestamp("trial_end", { withTimezone: true }),
    autoRenew: boolean("auto_renew").notNull().default(true),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    priceMinor: money("price_minor"),
    currency: text("currency").notNull().default("DZD"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("subscriptions_tenant_idx").on(t.tenantId, t.status),
    check(
      "subscriptions_status_chk",
      sql`${t.status} in ('trial','active','expired','cancelled','past_due','pending_payment')`,
    ),
    check("subscriptions_cycle_chk", sql`${t.billingCycle} in ('monthly','yearly')`),
  ],
);

export const subscriptionInvoices = pgTable(
  "subscription_invoices",
  {
    id: id(),
    tenantId: tenantId(),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    amountMinor: money("amount_minor"),
    currency: text("currency").notNull().default("DZD"),
    status: text("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    pdfUrl: text("pdf_url"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("subscription_invoices_number_uq").on(t.tenantId, t.number)],
);

/* ------------------------------------------------------------------ */
/* CRM                                                                 */
/* ------------------------------------------------------------------ */

export const clients = pgTable(
  "clients",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull().default("individual"),
    category: text("category").notNull().default("regular"),
    email: text("email"),
    phone: text("phone"),
    mobile: text("mobile"),
    taxNumber: text("tax_number"),
    commercialRegistration: text("commercial_registration"),
    contactPerson: text("contact_person"),
    notes: text("notes"),
    address: jsonb("address").$type<Record<string, string | undefined>>().notNull().default({}),
    billingAddress: jsonb("billing_address").$type<Record<string, string | undefined>>().notNull().default({}),
    balanceMinor: money("balance_minor"),
    creditLimitMinor: money("credit_limit_minor"),
    paymentTerms: text("payment_terms").notNull().default("net_30"),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by"),
    legacyId: text("legacy_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    uniqueIndex("clients_code_uq").on(t.tenantId, sql`lower(${t.code})`).where(sql`${t.deletedAt} is null`),
    uniqueIndex("clients_email_uq")
      .on(t.tenantId, sql`lower(${t.email})`)
      .where(sql`${t.email} is not null and ${t.deletedAt} is null`),
    index("clients_tenant_name_idx").on(t.tenantId, t.name),
    index("clients_tenant_created_idx").on(t.tenantId, t.createdAt),
    check("clients_type_chk", sql`${t.type} in ('individual','company')`),
    check("clients_category_chk", sql`${t.category} in ('vip','regular','wholesale','retail')`),
    check("clients_balance_chk", sql`${t.balanceMinor} >= 0`),
  ],
);

export const clientGroups = pgTable(
  "client_groups",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull().default("cyan"),
    discountBp: integer("discount_bp").notNull().default(0),
    groupedBilling: boolean("grouped_billing").notNull().default(false),
    createdBy: text("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    uniqueIndex("client_groups_name_uq").on(t.tenantId, sql`lower(${t.name})`).where(sql`${t.deletedAt} is null`),
    check("client_groups_discount_chk", sql`${t.discountBp} between 0 and 10000`),
  ],
);

export const clientGroupMembers = pgTable(
  "client_group_members",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => clientGroups.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.clientId] }), index("client_group_members_client_idx").on(t.clientId)],
);

export const clientNotes = pgTable(
  "client_notes",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    category: text("category").notNull().default("general"),
    isPinned: boolean("is_pinned").notNull().default(false),
    createdBy: text("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    index("client_notes_tenant_client_idx").on(t.tenantId, t.clientId, t.isPinned, t.createdAt),
    check("client_notes_category_chk", sql`${t.category} in ('general','follow-up','important','reminder')`),
  ],
);

/* ------------------------------------------------------------------ */
/* Catalog & inventory                                                 */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").notNull().default("product"),
    parentId: text("parent_id"),
    color: text("color").notNull().default("#0891b2"),
    icon: text("icon").notNull().default("tag"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    uniqueIndex("categories_name_uq")
      .on(t.tenantId, t.type, sql`lower(${t.name})`)
      .where(sql`${t.deletedAt} is null`),
    check("categories_type_chk", sql`${t.type} in ('product','client','invoice')`),
  ],
);

export const taxes = pgTable(
  "taxes",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rateBp: integer("rate_bp").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("taxes_name_uq").on(t.tenantId, sql`lower(${t.name})`),
    check("taxes_rate_chk", sql`${t.rateBp} between 0 and 10000`),
  ],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: text("category_id").references(() => categories.id),
    priceMinor: money("price_minor"),
    costMinor: money("cost_minor"),
    minStock: numeric("min_stock", { precision: 18, scale: 3 }).notNull().default("0"),
    unit: text("unit").notNull().default("piece"),
    taxId: text("tax_id").references(() => taxes.id),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by"),
    legacyId: text("legacy_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    uniqueIndex("products_code_uq").on(t.tenantId, sql`lower(${t.code})`).where(sql`${t.deletedAt} is null`),
    index("products_tenant_category_idx").on(t.tenantId, t.categoryId, t.isActive),
    check("products_price_chk", sql`${t.priceMinor} >= 0`),
    check("products_unit_chk", sql`${t.unit} in ('piece','kg','meter','liter','box','pack')`),
  ],
);

export const stockLevels = pgTable(
  "stock_levels",
  {
    productId: text("product_id")
      .primaryKey()
      .references(() => products.id, { onDelete: "cascade" }),
    tenantId: tenantId(),
    quantity: numeric("quantity", { precision: 18, scale: 3 }).notNull().default("0"),
    updatedAt: updatedAt(),
  },
  (t) => [index("stock_levels_tenant_idx").on(t.tenantId)],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: id(),
    tenantId: tenantId(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 3 }).notNull(),
    unitCostMinor: money("unit_cost_minor"),
    reason: text("reason"),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    createdBy: text("created_by"),
    createdAt: createdAt(),
  },
  (t) => [
    index("stock_movements_tenant_product_idx").on(t.tenantId, t.productId, t.createdAt),
    check("stock_movements_type_chk", sql`${t.type} in ('in','out','adjustment','transfer')`),
  ],
);

/* ------------------------------------------------------------------ */
/* Invoicing                                                           */
/* ------------------------------------------------------------------ */

export const numberSequences = pgTable(
  "number_sequences",
  {
    tenantId: text("tenant_id").notNull(),
    docType: text("doc_type").notNull(),
    period: text("period").notNull(),
    nextValue: integer("next_value").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.docType, t.period] }), check("number_sequences_value_chk", sql`${t.nextValue} > 0`)],
);

export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id),
    status: text("status").notNull().default("draft"),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    currency: text("currency").notNull().default("DZD"),
    subtotalMinor: money("subtotal_minor"),
    discountMinor: money("discount_minor"),
    shippingMinor: money("shipping_minor"),
    taxMinor: money("tax_minor"),
    totalMinor: money("total_minor"),
    paidMinor: money("paid_minor"),
    dueMinor: money("due_minor"),
    notes: text("notes"),
    terms: text("terms"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdBy: text("created_by"),
    legacyId: text("legacy_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    uniqueIndex("invoices_number_uq").on(t.tenantId, t.number).where(sql`${t.deletedAt} is null`),
    index("invoices_tenant_status_due_idx").on(t.tenantId, t.status, t.dueDate),
    index("invoices_tenant_client_idx").on(t.tenantId, t.clientId, t.issueDate),
    check("invoices_status_chk", sql`${t.status} in ('draft','sent','paid','partially_paid','overdue','cancelled')`),
    check("invoices_amounts_chk", sql`${t.subtotalMinor} >= 0 and ${t.totalMinor} >= 0 and ${t.paidMinor} >= 0 and ${t.dueMinor} >= 0`),
    check("invoices_due_chk", sql`${t.dueMinor} = ${t.totalMinor} - ${t.paidMinor}`),
  ],
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: id(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    productId: text("product_id").references(() => products.id),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 3 }).notNull(),
    unitPriceMinor: money("unit_price_minor"),
    discountBp: integer("discount_bp").notNull().default(0),
    taxRateBp: integer("tax_rate_bp").notNull().default(0),
    taxMinor: money("tax_minor"),
    lineTotalMinor: money("line_total_minor"),
  },
  (t) => [
    uniqueIndex("invoice_items_position_uq").on(t.invoiceId, t.position),
    check("invoice_items_qty_chk", sql`${t.quantity} > 0`),
    check("invoice_items_discount_chk", sql`${t.discountBp} between 0 and 10000`),
  ],
);

export const invoiceStatusHistory = pgTable(
  "invoice_status_history",
  {
    id: id(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    actorId: text("actor_id"),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [index("invoice_status_history_invoice_idx").on(t.invoiceId, t.createdAt)],
);

export const invoicePublicTokens = pgTable(
  "invoice_public_tokens",
  {
    id: id(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("invoice_public_tokens_hash_uq").on(t.tokenHash), index("invoice_public_tokens_invoice_idx").on(t.invoiceId)],
);

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export const payments = pgTable(
  "payments",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    clientId: text("client_id").references(() => clients.id),
    invoiceId: text("invoice_id").references(() => invoices.id),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("DZD"),
    method: text("method").notNull().default("cash"),
    status: text("status").notNull().default("completed"),
    reference: text("reference"),
    notes: text("notes"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by"),
    reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
    reconciledBy: text("reconciled_by"),
    legacyId: text("legacy_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("payments_number_uq").on(t.tenantId, t.number),
    index("payments_tenant_status_idx").on(t.tenantId, t.status, t.paidAt),
    index("payments_tenant_client_idx").on(t.tenantId, t.clientId),
    check("payments_amount_chk", sql`${t.amountMinor} > 0`),
    check("payments_status_chk", sql`${t.status} in ('pending','completed','failed','refunded','cancelled')`),
  ],
);

export const paymentAllocations = pgTable(
  "payment_allocations",
  {
    id: id(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("payment_allocations_uq").on(t.paymentId, t.invoiceId),
    index("payment_allocations_invoice_idx").on(t.invoiceId),
    check("payment_allocations_amount_chk", sql`${t.amountMinor} > 0`),
  ],
);

export const paymentRefunds = pgTable(
  "payment_refunds",
  {
    id: id(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    reason: text("reason"),
    createdBy: text("created_by"),
    createdAt: createdAt(),
  },
  (t) => [index("payment_refunds_payment_idx").on(t.paymentId)],
);

export const paymentGateways = pgTable(
  "payment_gateways",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("payment_gateways_code_uq").on(t.tenantId, t.code)],
);

export const paymentGatewaySecrets = pgTable(
  "payment_gateway_secrets",
  {
    gatewayId: text("gateway_id")
      .notNull()
      .references(() => paymentGateways.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    ciphertext: text("ciphertext").notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.gatewayId, t.key] })],
);

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("payment_methods_code_uq").on(t.tenantId, t.code)],
);

/* ------------------------------------------------------------------ */
/* Notifications, API keys, audit, platform                           */
/* ------------------------------------------------------------------ */

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("info"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>(),
    priority: text("priority").notNull().default("medium"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    index("notifications_user_idx").on(t.tenantId, t.userId, t.isRead, t.createdAt),
    check("notifications_type_chk", sql`${t.type} in ('info','success','warning','error')`),
    check("notifications_priority_chk", sql`${t.priority} in ('low','medium','high')`),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    hash: text("hash").notNull(),
    scopes: text("scopes").array().notNull().default(sql`'{}'::text[]`),
    permissions: text("permissions").array().notNull().default(sql`'{}'::text[]`),
    rateLimit: integer("rate_limit").notNull().default(1000),
    ipWhitelist: text("ip_whitelist").array().notNull().default(sql`'{}'::text[]`),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdBy: text("created_by"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("api_keys_prefix_uq").on(t.prefix), index("api_keys_tenant_idx").on(t.tenantId)],
);

export const files = pgTable("files", {
  id: id(),
  tenantId: tenantId(),
  kind: text("kind").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull(),
  checksum: text("checksum"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    tenantId: text("tenant_id"),
    actorType: text("actor_type").notNull().default("user"),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    requestId: text("request_id"),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_logs_tenant_created_idx").on(t.tenantId, t.createdAt),
    index("audit_logs_entity_idx").on(t.entity, t.entityId),
  ],
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: id(),
    tenantId: text("tenant_id"),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [index("outbox_events_status_idx").on(t.status, t.availableAt)],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    tenantId: text("tenant_id").notNull(),
    key: text("key").notNull(),
    requestHash: text("request_hash").notNull(),
    response: jsonb("response"),
    status: text("status").notNull().default("in_progress"),
    createdAt: createdAt(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.key] })],
);

/* ------------------------------------------------------------------ */
/* Relations (for typed joins where used)                             */
/* ------------------------------------------------------------------ */

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
  payments: many(payments),
  notes: many(clientNotes),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  items: many(invoiceItems),
  allocations: many(paymentAllocations),
}));

/* ------------------------------------------------------------------ */
/* HR                                                                  */
/* ------------------------------------------------------------------ */

export const departments = pgTable(
  "departments",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    managerId: text("manager_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [uniqueIndex("departments_name_uq").on(t.tenantId, sql`lower(${t.name})`).where(sql`${t.deletedAt} is null`)],
);

export const employees = pgTable(
  "employees",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    departmentId: text("department_id").references(() => departments.id),
    position: text("position").notNull().default(""),
    contractType: text("contract_type").notNull().default("cdi"),
    hireDate: date("hire_date").notNull(),
    salaryMinor: money("salary_minor"),
    status: text("status").notNull().default("active"),
    address: text("address"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    uniqueIndex("employees_code_uq").on(t.tenantId, sql`lower(${t.code})`).where(sql`${t.deletedAt} is null`),
    index("employees_tenant_department_idx").on(t.tenantId, t.departmentId, t.status),
    check("employees_status_chk", sql`${t.status} in ('active','inactive','terminated')`),
    check("employees_contract_chk", sql`${t.contractType} in ('cdi','cdd','intern','freelance')`),
  ],
);

export const employeeContracts = pgTable(
  "employee_contracts",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("cdi"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    salaryMinor: money("salary_minor"),
    status: text("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [
    index("employee_contracts_employee_idx").on(t.tenantId, t.employeeId),
    check("employee_contracts_type_chk", sql`${t.type} in ('cdi','cdd','intern','freelance')`),
    check("employee_contracts_status_chk", sql`${t.status} in ('active','expired','terminated')`),
  ],
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("annual"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    days: numeric("days", { precision: 6, scale: 1 }).notNull().default("1"),
    status: text("status").notNull().default("pending"),
    reason: text("reason"),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("leave_requests_tenant_idx").on(t.tenantId, t.status, t.startDate),
    check("leave_requests_type_chk", sql`${t.type} in ('annual','sick','unpaid','maternity','other')`),
    check("leave_requests_status_chk", sql`${t.status} in ('pending','approved','rejected','cancelled')`),
  ],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    checkIn: text("check_in"),
    checkOut: text("check_out"),
    status: text("status").notNull().default("present"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("attendance_employee_day_uq").on(t.employeeId, t.date),
    index("attendance_tenant_date_idx").on(t.tenantId, t.date),
    check("attendance_status_chk", sql`${t.status} in ('present','late','absent','leave','holiday','remote')`),
  ],
);

/* ------------------------------------------------------------------ */
/* Support                                                             */
/* ------------------------------------------------------------------ */

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id"),
    subject: text("subject").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("other"),
    priority: text("priority").notNull().default("medium"),
    status: text("status").notNull().default("open"),
    assignedTo: text("assigned_to"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("support_tickets_tenant_idx").on(t.tenantId, t.status, t.createdAt),
    check("support_tickets_status_chk", sql`${t.status} in ('open','in_progress','waiting','resolved','closed')`),
    check("support_tickets_priority_chk", sql`${t.priority} in ('low','medium','high','urgent')`),
  ],
);

export const supportMessages = pgTable(
  "support_messages",
  {
    id: id(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    authorId: text("author_id"),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("support_messages_ticket_idx").on(t.ticketId, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Archives                                                            */
/* ------------------------------------------------------------------ */

export const archiveDocuments = pgTable(
  "archive_documents",
  {
    id: id(),
    tenantId: tenantId().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("other"),
    description: text("description"),
    fileUrl: text("file_url"),
    mime: text("mime"),
    size: integer("size").notNull().default(0),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    uploadedBy: text("uploaded_by"),
    createdAt: createdAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index("archive_documents_tenant_idx").on(t.tenantId, t.category, t.createdAt)],
);
