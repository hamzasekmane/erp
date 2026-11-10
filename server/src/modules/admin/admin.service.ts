import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { invoices, outboxEvents, plans, subscriptions, tenantSettings, tenants, users } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate } from "../../shared/http";
import { fromMinor } from "../../shared/money";
import { hashPassword, passwordIssues } from "../../shared/security/password";
import { randomBytes } from "node:crypto";

type Ctx = { tenantId: string; userId: string; role: string; ip?: string | null; userAgent?: string | null };

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "entreprise";
}

@Injectable()
export class AdminService {
  private assertSuperadmin(ctx: Ctx) {
    if (ctx.role !== "superadmin") throw AppError.forbidden("Réservé à l'administration de la plateforme", "INSUFFICIENT_PERMISSIONS");
  }

  async listTenants(ctx: Ctx, query: { page: number; limit: number; offset: number; search?: string; status?: string }) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    const filters: SQL[] = [isNull(tenants.deletedAt)];
    if (query.status) filters.push(eq(tenants.status, query.status));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(sql`lower(${tenants.name}) like ${term}`, sql`lower(${tenants.email}) like ${term}`, sql`lower(${tenants.subdomain}) like ${term}`);
      if (search) filters.push(search);
    }
    const where = and(...filters);
    const [rows, [countRow]] = await Promise.all([
      db.select().from(tenants).where(where).orderBy(desc(tenants.createdAt)).limit(query.limit).offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tenants).where(where),
    ]);
    const planRows = await db.select().from(plans);
    const planMap = new Map(planRows.map((plan) => [plan.code, plan]));

    return {
      items: rows.map((tenant) => {
        const plan = planMap.get(tenant.planCode);
        return {
          ...tenant,
          _id: tenant.id,
          isActive: tenant.status === "active" || tenant.status === "trial",
          plan: plan ? { _id: plan.id, id: plan.id, code: plan.code, name: plan.name } : { code: tenant.planCode, name: tenant.planCode },
        };
      }),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async getTenant(ctx: Ctx, id: string) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    const [tenant] = await db.select().from(tenants).where(and(eq(tenants.id, id), isNull(tenants.deletedAt))).limit(1);
    if (!tenant) throw AppError.notFound("Espace de travail introuvable");
    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, id)).limit(1);
    return { ...tenant, _id: tenant.id, isActive: tenant.status === "active" || tenant.status === "trial", settings };
  }

  async createTenant(
    ctx: Ctx,
    input: {
      name: string;
      email: string;
      subdomain?: string;
      planCode?: string;
      currency?: string;
      country?: string;
      adminName?: string;
      adminEmail?: string;
      adminPassword?: string;
    },
  ) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    const planCode = input.planCode ?? "trial";
    const [plan] = await db.select().from(plans).where(eq(plans.code, planCode)).limit(1);
    if (!plan) throw AppError.badRequest("Formule inconnue");

    const email = input.email.toLowerCase();
    const [existing] = await db.select({ id: tenants.id }).from(tenants).where(sql`lower(${tenants.email}) = ${email}`).limit(1);
    if (existing) throw AppError.conflict("TENANT_EXISTS", "Un espace existe déjà avec cet email");

    const base = slugify(input.subdomain ?? input.name);
    let subdomain = base;
    for (let i = 2; i < 50; i += 1) {
      const [taken] = await db.select({ id: tenants.id }).from(tenants).where(sql`lower(${tenants.subdomain}) = ${subdomain}`).limit(1);
      if (!taken) break;
      subdomain = `${base}-${i}`;
    }

    const tenantId = newId();
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
    const adminPassword = input.adminPassword ?? randomBytes(9).toString("base64url");

    await db.transaction(async (tx) => {
      await tx.insert(tenants).values({
        id: tenantId,
        name: input.name,
        subdomain,
        email,
        country: input.country ?? "DZ",
        currency: (input.currency ?? "DZD").toUpperCase(),
        status: "trial",
        planCode: plan.code,
      });
      await tx.insert(tenantSettings).values({ tenantId });
      await tx.insert(subscriptions).values({
        id: newId(),
        tenantId,
        planId: plan.id,
        status: "trial",
        billingCycle: "monthly",
        startDate: now,
        endDate,
        trialEnd: endDate,
        priceMinor: 0,
        currency: (input.currency ?? "DZD").toUpperCase(),
      });
      if (input.adminEmail) {
        await tx.insert(users).values({
          id: newId(),
          tenantId,
          email: input.adminEmail.toLowerCase(),
          name: input.adminName ?? "Administrateur",
          passwordHash: hashPassword(adminPassword),
          role: "tenant_admin",
          status: "active",
        });
      }
    });

    await audit({ tenantId, actorId: ctx.userId, action: "admin.tenant_created", entity: "tenant", entityId: tenantId, after: { planCode }, ip: ctx.ip, userAgent: ctx.userAgent });
    return { ...(await this.getTenant(ctx, tenantId)), tempPassword: input.adminPassword ? undefined : adminPassword };
  }

  async updateTenant(
    ctx: Ctx,
    id: string,
    input: { name?: string; email?: string; phone?: string | null; address?: string | null; city?: string | null; country?: string; currency?: string; planCode?: string; status?: string },
  ) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    await this.getTenant(ctx, id);
    const patch: Partial<typeof tenants.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.email !== undefined) patch.email = input.email.toLowerCase();
    if (input.phone !== undefined) patch.phone = input.phone ?? null;
    if (input.address !== undefined) patch.address = input.address ?? null;
    if (input.city !== undefined) patch.city = input.city ?? null;
    if (input.country !== undefined) patch.country = input.country;
    if (input.currency !== undefined) patch.currency = input.currency.toUpperCase();
    if (input.planCode !== undefined) patch.planCode = input.planCode;
    if (input.status !== undefined) patch.status = input.status;
    await db.update(tenants).set(patch).where(eq(tenants.id, id));
    await audit({ tenantId: id, actorId: ctx.userId, action: "admin.tenant_updated", entity: "tenant", entityId: id, after: input, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.getTenant(ctx, id);
  }

  async setStatus(ctx: Ctx, id: string, status: string) {
    this.assertSuperadmin(ctx);
    if (!["active", "inactive", "suspended", "trial"].includes(status)) throw AppError.badRequest("Statut invalide");
    const db = getDb();
    await db.update(tenants).set({ status, updatedAt: new Date() }).where(eq(tenants.id, id));
    await audit({ tenantId: id, actorId: ctx.userId, action: "admin.tenant_status_changed", entity: "tenant", entityId: id, after: { status }, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.getTenant(ctx, id);
  }

  async tenantUsers(ctx: Ctx, tenantId: string) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    const rows = await db.select().from(users).where(and(eq(users.tenantId, tenantId), isNull(users.deletedAt))).orderBy(desc(users.createdAt));
    return rows.map((user) => ({ _id: user.id, id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt.toISOString() }));
  }

  async inviteUser(ctx: Ctx, tenantId: string, input: { name: string; email: string; role?: string; password?: string; tenantName?: string }) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    const email = input.email.toLowerCase();
    const [existing] = await db.select({ id: users.id }).from(users).where(and(sql`lower(${users.email}) = ${email}`, isNull(users.deletedAt))).limit(1);
    if (existing) throw AppError.conflict("EMAIL_IN_USE", "Cet email est déjà utilisé");
    const password = input.password ?? randomBytes(9).toString("base64url");
    if (input.password) {
      const issues = passwordIssues(input.password);
      if (issues.length) throw AppError.badRequest(issues[0]);
    }
    const id = newId();
    await db.insert(users).values({
      id,
      tenantId,
      email,
      name: input.name,
      passwordHash: hashPassword(password),
      role: input.role ?? "user",
      status: "active",
    });
    await db.insert(outboxEvents).values({
      id: newId(),
      tenantId,
      type: "user.invite",
      payload: { to: email, tenantName: input.tenantName ?? null, invitedBy: ctx.userId },
      status: "pending",
    });
    await audit({ tenantId, actorId: ctx.userId, action: "admin.user_invited", entity: "user", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    return { _id: id, id, email, tempPassword: input.password ? undefined : password };
  }

  async updateTenantUser(ctx: Ctx, tenantId: string, userId: string, input: { name?: string; role?: string; status?: string }) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    const [user] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.tenantId, tenantId))).limit(1);
    if (!user) throw AppError.notFound("Utilisateur introuvable");
    const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.role !== undefined) patch.role = input.role;
    if (input.status !== undefined) patch.status = input.status;
    await db.update(users).set(patch).where(eq(users.id, userId));
    return this.tenantUsers(ctx, tenantId);
  }

  async removeTenantUser(ctx: Ctx, tenantId: string, userId: string) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    await db
      .update(users)
      .set({ deletedAt: new Date(), status: "inactive", updatedAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));
    return this.tenantUsers(ctx, tenantId);
  }

  async tenantSettings(ctx: Ctx, tenantId: string) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1);
    return settings ?? {};
  }

  async updateTenantSettings(ctx: Ctx, tenantId: string, input: Record<string, unknown>) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1);
    if (!settings) throw AppError.notFound("Paramètres introuvables");
    const patch: Partial<typeof tenantSettings.$inferInsert> = { updatedAt: new Date() };
    if (typeof input.theme === "string") patch.theme = input.theme;
    if (typeof input.dateFormat === "string") patch.dateFormat = input.dateFormat;
    if (typeof input.numberFormat === "string") patch.numberFormat = input.numberFormat;
    if (typeof input.primaryColor === "string") patch.primaryColor = input.primaryColor;
    if (input.notifications && typeof input.notifications === "object") patch.notifications = { ...settings.notifications, ...(input.notifications as Record<string, unknown>) };
    if (input.integrations && typeof input.integrations === "object") patch.integrations = { ...settings.integrations, ...(input.integrations as Record<string, unknown>) };
    if (input.security && typeof input.security === "object") patch.security = { ...settings.security, ...(input.security as Record<string, unknown>) };
    await db.update(tenantSettings).set(patch).where(eq(tenantSettings.tenantId, tenantId));
    return this.tenantSettings(ctx, tenantId);
  }

  async metrics(ctx: Ctx) {
    this.assertSuperadmin(ctx);
    const db = getDb();
    const [tenantAgg] = await db.select({ total: sql<number>`count(*)::int` }).from(tenants).where(isNull(tenants.deletedAt));
    const [activeAgg] = await db.select({ total: sql<number>`count(*)::int` }).from(tenants).where(and(isNull(tenants.deletedAt), sql`${tenants.status} in ('active','trial')`));
    const [userAgg] = await db.select({ total: sql<number>`count(*)::int` }).from(users).where(isNull(users.deletedAt));
    const [invoiceAgg] = await db
      .select({ total: sql<number>`coalesce(sum(${invoices.totalMinor}), 0)::bigint`, count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(isNull(invoices.deletedAt));
    const revenue = fromMinor(Number(invoiceAgg?.total ?? 0));
    return {
      tenants: { total: Number(tenantAgg?.total ?? 0), active: Number(activeAgg?.total ?? 0) },
      users: { total: Number(userAgg?.total ?? 0) },
      invoices: { total: Number(invoiceAgg?.count ?? 0), revenue },
    };
  }
}
