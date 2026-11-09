import { Injectable } from "@nestjs/common";
import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { plans, sessions, subscriptions, users } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate, type Pagination } from "../../shared/http";
import { hashPassword, passwordIssues, verifyPassword } from "../../shared/security/password";
import { ROLE_PERMISSIONS, permissionsFor } from "../../shared/security/permissions";
import { serializeUser } from "../../shared/serializers";
import type {
  AdminResetPasswordInput,
  ChangePasswordInput,
  CreateUserInput,
  UpdateProfileInput,
  UpdateUserInput,
} from "./users.dto";

type Ctx = { tenantId: string; userId: string; role: string; ip?: string | null; userAgent?: string | null };
type ListQuery = { page: number; limit: number; offset: number; search?: string; role?: string; status?: string };

@Injectable()
export class UsersService {
  async list(ctx: Ctx, query: ListQuery): Promise<{ items: ReturnType<typeof serializeUser>[]; pagination: Pagination }> {
    const db = getDb();
    const filters: SQL[] = [eq(users.tenantId, ctx.tenantId), isNull(users.deletedAt)];
    if (query.role) filters.push(eq(users.role, query.role));
    if (query.status) filters.push(eq(users.status, query.status));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(sql`lower(${users.name}) like ${term}`, sql`lower(${users.email}) like ${term}`);
      if (search) filters.push(search);
    }
    const where = and(...filters);

    const [rows, [countRow]] = await Promise.all([
      db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(query.limit).offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(where),
    ]);

    return {
      items: rows.map(serializeUser),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async get(ctx: Ctx, id: string) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, ctx.tenantId), isNull(users.deletedAt)))
      .limit(1);
    if (!user) throw AppError.notFound("Utilisateur introuvable");
    return serializeUser(user);
  }

  async create(ctx: Ctx, input: CreateUserInput) {
    const db = getDb();
    await this.assertUserQuota(ctx.tenantId);

    const email = input.email.trim().toLowerCase();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(sql`lower(${users.email}) = ${email}`, isNull(users.deletedAt)))
      .limit(1);
    if (existing) throw AppError.conflict("EMAIL_IN_USE", "Cet email est déjà utilisé");

    if (input.role === "tenant_admin" && ctx.role !== "tenant_admin") {
      throw AppError.forbidden("Seul un administrateur peut créer un administrateur", "INSUFFICIENT_PERMISSIONS");
    }
    const issues = passwordIssues(input.password);
    if (issues.length) throw AppError.badRequest(issues[0]);

    const id = newId();
    await db.insert(users).values({
      id,
      tenantId: ctx.tenantId,
      email,
      name: input.name,
      passwordHash: hashPassword(input.password),
      role: input.role,
      status: input.status,
      phone: input.phone ?? null,
      department: input.department ?? null,
    });
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "user.created",
      entity: "user",
      entityId: id,
      after: { email, role: input.role },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.get(ctx, id);
  }

  async update(ctx: Ctx, id: string, input: UpdateUserInput) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, ctx.tenantId), isNull(users.deletedAt)))
      .limit(1);
    if (!user) throw AppError.notFound("Utilisateur introuvable");

    if (user.role === "tenant_admin" && ctx.role !== "tenant_admin") {
      throw AppError.forbidden("Modification réservée à un administrateur", "INSUFFICIENT_PERMISSIONS");
    }
    if (id === ctx.userId && input.status && input.status !== "active") {
      throw AppError.badRequest("Vous ne pouvez pas désactiver votre propre compte");
    }

    const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      const [clash] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(sql`lower(${users.email}) = ${email}`, sql`${users.id} <> ${id}`, isNull(users.deletedAt)))
        .limit(1);
      if (clash) throw AppError.conflict("EMAIL_IN_USE", "Cet email est déjà utilisé");
      patch.email = email;
    }
    if (input.role !== undefined) patch.role = input.role;
    if (input.phone !== undefined) patch.phone = input.phone ?? null;
    if (input.department !== undefined) patch.department = input.department ?? null;
    if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl ?? null;
    if (input.status !== undefined) {
      patch.status = input.status;
      if (input.status !== "active") patch.tokenVersion = sql`${users.tokenVersion} + 1` as never;
    }

    await db.update(users).set(patch).where(eq(users.id, id));
    if (patch.status && patch.status !== "active") {
      await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
    }
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "user.updated",
      entity: "user",
      entityId: id,
      before: { role: user.role, status: user.status },
      after: input,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.get(ctx, id);
  }

  /** Soft delete: the row is kept for referential integrity (invoices, audit). */
  async remove(ctx: Ctx, id: string) {
    const db = getDb();
    if (id === ctx.userId) throw AppError.badRequest("Vous ne pouvez pas supprimer votre propre compte");
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, ctx.tenantId), isNull(users.deletedAt)))
      .limit(1);
    if (!user) throw AppError.notFound("Utilisateur introuvable");
    if (user.role === "tenant_admin" && ctx.role !== "tenant_admin") {
      throw AppError.forbidden("Suppression réservée à un administrateur", "INSUFFICIENT_PERMISSIONS");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ deletedAt: new Date(), status: "inactive", tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
        .where(eq(users.id, id));
      await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, id));
    });
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "user.deleted",
      entity: "user",
      entityId: id,
      before: { email: user.email, role: user.role },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { success: true };
  }

  /* ------------------------------ profile ------------------------------ */

  async profile(ctx: Ctx) {
    return this.get(ctx, ctx.userId);
  }

  async updateProfile(ctx: Ctx, input: UpdateProfileInput) {
    return this.update(ctx, ctx.userId, { name: input.name, phone: input.phone, department: input.department, avatarUrl: input.avatarUrl });
  }

  async changeOwnPassword(ctx: Ctx, input: ChangePasswordInput) {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1);
    if (!user) throw AppError.unauthorized("Utilisateur introuvable");
    if (!verifyPassword(input.currentPassword, user.passwordHash)) {
      throw AppError.badRequest("Mot de passe actuel incorrect");
    }
    if (input.currentPassword === input.newPassword) throw AppError.badRequest("Le nouveau mot de passe doit être différent");
    const issues = passwordIssues(input.newPassword);
    if (issues.length) throw AppError.badRequest(issues[0]);

    await db
      .update(users)
      .set({ passwordHash: hashPassword(input.newPassword), tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
      .where(eq(users.id, ctx.userId));
    await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, ctx.userId), isNull(sessions.revokedAt)));
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "user.password_changed", entity: "user", entityId: ctx.userId, ip: ctx.ip, userAgent: ctx.userAgent });
    return { success: true, message: "Mot de passe mis à jour. Veuillez vous reconnecter." };
  }

  async adminResetPassword(ctx: Ctx, id: string, input: AdminResetPasswordInput) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, ctx.tenantId), isNull(users.deletedAt)))
      .limit(1);
    if (!user) throw AppError.notFound("Utilisateur introuvable");
    const issues = passwordIssues(input.newPassword);
    if (issues.length) throw AppError.badRequest(issues[0]);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ passwordHash: hashPassword(input.newPassword), tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
        .where(eq(users.id, id));
      await tx.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "user.password_reset_by_admin", entity: "user", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    return { success: true };
  }

  /** Role catalogue for the permissions matrix UI. */
  roles() {
    return (Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>)
      .filter((role) => role !== "superadmin")
      .map((role) => ({
        id: role,
        name: role === "tenant_admin" ? "Administrateur" : role === "manager" ? "Manager" : "Utilisateur",
        permissions: [...permissionsFor(role)],
      }));
  }

  private async assertUserQuota(tenantId: string) {
    const db = getDb();
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)).orderBy(desc(subscriptions.createdAt)).limit(1);
    const [plan] = sub ? await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1) : [];
    const maxUsers = Number((plan?.limits as Record<string, number> | undefined)?.maxUsers ?? 5);
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), isNull(users.deletedAt)));
    if ((row?.count ?? 0) >= maxUsers) {
      throw AppError.unprocessable("USER_QUOTA_REACHED", `Votre formule est limitée à ${maxUsers} utilisateurs.`, {
        maxUsers,
        current: row?.count ?? 0,
      });
    }
  }
}
