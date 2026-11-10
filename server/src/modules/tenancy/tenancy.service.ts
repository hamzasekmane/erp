import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { invoices, plans, subscriptionInvoices, subscriptions, tenantSettings, tenants, users } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { serializeTenant } from "../../shared/serializers";
import type {
  CancelSubscriptionInput,
  ChangeSubscriptionInput,
  UpdateSecurityInput,
  UpdateSettingsInput,
  UpdateTenantInput,
} from "./tenancy.dto";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

@Injectable()
export class TenancyService {
  async get(ctx: Ctx) {
    const db = getDb();
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, ctx.tenantId), isNull(tenants.deletedAt)))
      .limit(1);
    if (!tenant) throw AppError.notFound("Espace de travail introuvable");
    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenant.id)).limit(1);
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenant.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    const [plan] = subscription
      ? await db.select().from(plans).where(eq(plans.id, subscription.planId)).limit(1)
      : [];

    return {
      ...serializeTenant(tenant, settings ?? null),
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            planCode: plan?.code ?? tenant.planCode,
            billingCycle: subscription.billingCycle,
            startDate: subscription.startDate.toISOString(),
            endDate: subscription.endDate.toISOString(),
            trialEnd: subscription.trialEnd?.toISOString(),
            autoRenew: subscription.autoRenew,
            priceMinor: Number(subscription.priceMinor),
            currency: subscription.currency,
          }
        : null,
    };
  }

  async update(ctx: Ctx, input: UpdateTenantInput) {
    const db = getDb();
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, ctx.tenantId)).limit(1);
    if (!tenant) throw AppError.notFound("Espace de travail introuvable");

    const patch: Partial<typeof tenants.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.email !== undefined) patch.email = input.email;
    if (input.phone !== undefined) patch.phone = input.phone ?? null;
    if (input.address !== undefined) patch.address = input.address ?? null;
    if (input.city !== undefined) patch.city = input.city ?? null;
    if (input.country !== undefined) patch.country = input.country;
    if (input.taxNumber !== undefined) patch.taxNumber = input.taxNumber ?? null;
    if (input.currency !== undefined) patch.currency = input.currency.toUpperCase();
    if (input.language !== undefined) patch.language = input.language;
    if (input.timezone !== undefined) patch.timezone = input.timezone;
    if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl ?? null;

    await db.update(tenants).set(patch).where(eq(tenants.id, tenant.id));
    await audit({
      tenantId: tenant.id,
      actorId: ctx.userId,
      action: "tenant.updated",
      entity: "tenant",
      entityId: tenant.id,
      before: { name: tenant.name, currency: tenant.currency, language: tenant.language },
      after: patch,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.get(ctx);
  }

  async updateSettings(ctx: Ctx, input: UpdateSettingsInput) {
    const db = getDb();
    const [current] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, ctx.tenantId)).limit(1);
    if (!current) throw AppError.notFound("Paramètres introuvables");

    const patch: Partial<typeof tenantSettings.$inferInsert> = { updatedAt: new Date() };
    if (input.theme !== undefined) patch.theme = input.theme;
    if (input.dateFormat !== undefined) patch.dateFormat = input.dateFormat;
    if (input.numberFormat !== undefined) patch.numberFormat = input.numberFormat;
    if (input.primaryColor !== undefined) patch.primaryColor = input.primaryColor;
    if (input.invoicePrefix !== undefined) patch.invoicePrefix = input.invoicePrefix;
    if (input.defaultVatBp !== undefined) patch.defaultVatBp = input.defaultVatBp;
    if (input.allowOverpayment !== undefined) patch.allowOverpayment = input.allowOverpayment;
    if (input.notifications) patch.notifications = { ...current.notifications, ...input.notifications };
    if (input.integrations) patch.integrations = { ...current.integrations, ...input.integrations };

    await db.update(tenantSettings).set(patch).where(eq(tenantSettings.tenantId, ctx.tenantId));
    return this.get(ctx);
  }

  async updateSecurity(ctx: Ctx, input: UpdateSecurityInput) {
    const db = getDb();
    const [current] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, ctx.tenantId)).limit(1);
    if (!current) throw AppError.notFound("Paramètres introuvables");
    await db
      .update(tenantSettings)
      .set({ security: { ...current.security, ...input }, updatedAt: new Date() })
      .where(eq(tenantSettings.tenantId, ctx.tenantId));
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "tenant.security_updated",
      entity: "tenant_settings",
      entityId: ctx.tenantId,
      after: input,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.get(ctx);
  }

  /* ---------------------------- subscription --------------------------- */

  async subscription(ctx: Ctx) {
    const db = getDb();
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, ctx.tenantId)).limit(1);
    if (!tenant) throw AppError.notFound("Espace de travail introuvable");

    const [row] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, ctx.tenantId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    const allPlans = await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
    const [plan] = row ? await db.select().from(plans).where(eq(plans.id, row.planId)).limit(1) : [];

    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.tenantId, ctx.tenantId), isNull(users.deletedAt)));
    const [invoiceCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt)));

    return {
      subscription: row
        ? {
            id: row.id,
            status: row.status,
            billingCycle: row.billingCycle,
            startDate: row.startDate.toISOString(),
            endDate: row.endDate.toISOString(),
            trialEnd: row.trialEnd?.toISOString(),
            autoRenew: row.autoRenew,
            cancelAtPeriodEnd: row.cancelAtPeriodEnd,
            priceMinor: Number(row.priceMinor),
            currency: row.currency,
          }
        : null,
      plan: plan ? this.serializePlan(plan) : null,
      plans: allPlans.map((p) => this.serializePlan(p)),
      usage: {
        users: userCount?.count ?? 0,
        invoices: invoiceCount?.count ?? 0,
        maxUsers: Number((plan?.limits as Record<string, number> | undefined)?.maxUsers ?? 5),
      },
    };
  }

  async changePlan(ctx: Ctx, input: ChangeSubscriptionInput) {
    const db = getDb();
    const [plan] = await db.select().from(plans).where(eq(plans.code, input.planCode)).limit(1);
    if (!plan) throw AppError.notFound("Formule introuvable");

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, ctx.tenantId)).limit(1);
    if (!tenant) throw AppError.notFound("Espace de travail introuvable");

    const [current] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, ctx.tenantId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const now = new Date();
    const endDate = new Date(now.getTime() + (input.billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000);
    const priceMinor = input.billingCycle === "yearly" ? plan.priceYearlyMinor : plan.priceMonthlyMinor;

    // Payment capture is not wired yet: the subscription is recorded as pending
    // payment and activated by the billing webhook / admin endpoint.
    const status = priceMinor === 0 ? "active" : "pending_payment";

    if (current) {
      await db
        .update(subscriptions)
        .set({
          planId: plan.id,
          status,
          billingCycle: input.billingCycle,
          startDate: now,
          endDate,
          trialEnd: null,
          priceMinor,
          currency: tenant.currency,
          cancelAtPeriodEnd: false,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, current.id));
    } else {
      await db.insert(subscriptions).values({
        id: newId(),
        tenantId: ctx.tenantId,
        planId: plan.id,
        status,
        billingCycle: input.billingCycle,
        startDate: now,
        endDate,
        priceMinor,
        currency: tenant.currency,
      });
    }

    await db.update(tenants).set({ planCode: plan.code, status: status === "active" ? "active" : tenant.status, updatedAt: now }).where(eq(tenants.id, tenant.id));
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "subscription.changed",
      entity: "subscription",
      entityId: current?.id ?? null,
      after: { planCode: plan.code, billingCycle: input.billingCycle, status },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.subscription(ctx);
  }

  async cancelPlan(ctx: Ctx, input: CancelSubscriptionInput) {
    const db = getDb();
    const [current] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, ctx.tenantId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    if (!current) throw AppError.notFound("Aucun abonnement actif");

    const now = new Date();
    await db
      .update(subscriptions)
      .set(
        input.immediately
          ? { status: "cancelled", endDate: now, autoRenew: false, cancelAtPeriodEnd: false, updatedAt: now }
          : { autoRenew: false, cancelAtPeriodEnd: true, updatedAt: now },
      )
      .where(eq(subscriptions.id, current.id));
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "subscription.cancelled",
      entity: "subscription",
      entityId: current.id,
      after: input,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.subscription(ctx);
  }

  async listPlans() {
    const db = getDb();
    const rows = await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
    return rows.map((p) => this.serializePlan(p));
  }

  private serializePlan(plan: typeof plans.$inferSelect) {
    return {
      id: plan.id,
      _id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      priceMonthlyMinor: Number(plan.priceMonthlyMinor),
      priceYearlyMinor: Number(plan.priceYearlyMinor),
      currency: plan.currency,
      features: plan.features,
      limits: plan.limits,
      trialDays: plan.trialDays,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Frontend-compatible `/subscriptions/*` surface                      */
/* ------------------------------------------------------------------ */

@Injectable()
export class SubscriptionsService {
  constructor(private readonly tenancy: TenancyService) {}

  private mapPlan(plan: typeof plans.$inferSelect) {
    const limits = (plan.limits ?? {}) as Record<string, number>;
    const features = (plan.features ?? {}) as Record<string, boolean>;
    return {
      _id: plan.id,
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      price: { monthly: Number(plan.priceMonthlyMinor) / 100, yearly: Number(plan.priceYearlyMinor) / 100 },
      currency: plan.currency,
      features: {
        users: Number(limits.maxUsers ?? 5),
        storage: Number(limits.storageMb ?? 1000),
        invoices: { monthly: Number(limits.invoicesPerMonth ?? 100) },
        clients: Number(limits.clients ?? 100),
        products: Number(limits.products ?? 100),
        hasReports: Boolean(features.reports ?? true),
        hasApiAccess: Boolean(features.api ?? false),
        hasCustomBranding: Boolean(features.branding ?? false),
      },
      trialDays: plan.trialDays,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
    };
  }

  async current(ctx: Ctx) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, ctx.tenantId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    if (!row) throw AppError.notFound("Aucun abonnement");
    const [plan] = await db.select().from(plans).where(eq(plans.id, row.planId)).limit(1);
    const mapped = plan ? this.mapPlan(plan) : null;
    const daysRemaining = Math.max(0, Math.ceil((row.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

    return {
      _id: row.id,
      id: row.id,
      tenantId: row.tenantId,
      planId: row.planId,
      planName: plan?.name ?? "—",
      status: row.status,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      billingCycle: row.billingCycle,
      autoRenew: row.autoRenew,
      paymentMethod: "manual",
      price: Number(row.priceMinor) / 100,
      limits: mapped?.features
        ? {
            users: mapped.features.users,
            invoices: mapped.features.invoices.monthly,
            storage: mapped.features.storage,
            clients: mapped.features.clients,
            products: mapped.features.products,
          }
        : { users: 5, invoices: 100, storage: 1000, clients: 100, products: 100 },
      features: {
        hasReports: mapped?.features.hasReports ?? true,
        hasApiAccess: mapped?.features.hasApiAccess ?? false,
        hasCustomBranding: mapped?.features.hasCustomBranding ?? false,
      },
      isTrial: row.status === "trial",
      trialEndDate: row.trialEnd?.toISOString(),
      nextPaymentDate: row.endDate.toISOString(),
      daysRemaining,
      isExpired: row.status === "expired" || row.endDate.getTime() < Date.now(),
    };
  }

  async listPlans() {
    const db = getDb();
    const rows = await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
    return rows.map((plan) => this.mapPlan(plan));
  }

  async invoices(ctx: Ctx, limit = 10) {
    const db = getDb();
    const rows = await db
      .select()
      .from(subscriptionInvoices)
      .where(eq(subscriptionInvoices.tenantId, ctx.tenantId))
      .orderBy(desc(subscriptionInvoices.createdAt))
      .limit(Math.min(100, Math.max(1, limit)));
    return rows.map((row) => ({
      _id: row.id,
      id: row.id,
      invoiceNumber: row.number,
      createdAt: row.createdAt.toISOString(),
      date: row.createdAt.toISOString(),
      amount: Number(row.amountMinor) / 100,
      currency: row.currency,
      status: row.status,
      planName: "Abonnement",
      invoiceUrl: null,
    }));
  }

  async changePlanById(ctx: Ctx, newPlanId: string, billingCycle?: "monthly" | "yearly") {
    const db = getDb();
    const [plan] = await db.select().from(plans).where(eq(plans.id, newPlanId)).limit(1);
    if (!plan) throw AppError.notFound("Formule introuvable");
    const [current] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, ctx.tenantId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    const cycle = billingCycle ?? (current?.billingCycle === "yearly" ? "yearly" : "monthly");
    await this.tenancy.changePlan(ctx, { planCode: plan.code, billingCycle: cycle });
    return this.current(ctx);
  }

  async cancel(ctx: Ctx, cancelAtPeriodEnd: boolean, reason?: string) {
    await this.tenancy.cancelPlan(ctx, { immediately: !cancelAtPeriodEnd, reason });
    return this.current(ctx);
  }

  async limits(ctx: Ctx) {
    const db = getDb();
    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.tenantId, ctx.tenantId), isNull(users.deletedAt)));
    const [invoiceCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, ctx.tenantId),
          isNull(invoices.deletedAt),
          sql`date_trunc('month', ${invoices.issueDate}) = date_trunc('month', current_date)`,
        ),
      );
    return { currentUsers: Number(userCount?.count ?? 0), usedStorageGB: 0, currentMonthInvoices: Number(invoiceCount?.count ?? 0) };
  }
}
