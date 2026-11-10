import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { apiKeys } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { hashToken } from "../../shared/security/tokens";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

function generateKey() {
  const secret = randomBytes(24).toString("base64url");
  const prefix = `erp_${randomBytes(4).toString("hex")}`;
  return { secret: `${prefix}.${secret}`, prefix, hash: hashToken(`${prefix}.${secret}`) };
}

@Injectable()
export class ApiKeysService {
  async list(ctx: Ctx) {
    const db = getDb();
    const rows = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.tenantId, ctx.tenantId), isNull(apiKeys.revokedAt)))
      .orderBy(apiKeys.createdAt);
    return rows.map((row) => ({
      _id: row.id,
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      maskedKey: `${row.prefix}.${"•".repeat(24)}`,
      scopes: row.scopes,
      permissions: row.permissions,
      rateLimit: row.rateLimit,
      isActive: row.isActive,
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async create(ctx: Ctx, input: { name: string; scopes?: string[]; permissions?: string[]; rateLimit?: number; expiresAt?: string }) {
    const db = getDb();
    const id = newId();
    const key = generateKey();
    await db.insert(apiKeys).values({
      id,
      tenantId: ctx.tenantId,
      name: input.name,
      prefix: key.prefix,
      hash: key.hash,
      scopes: input.scopes ?? [],
      permissions: input.permissions ?? [],
      rateLimit: input.rateLimit ?? 1000,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdBy: ctx.userId,
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "api_key.created", entity: "api_key", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    return { _id: id, id, name: input.name, key: key.secret, prefix: key.prefix };
  }

  async regenerate(ctx: Ctx, id: string) {
    const db = getDb();
    const [row] = await db.select().from(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, ctx.tenantId))).limit(1);
    if (!row) throw AppError.notFound("Clé API introuvable");
    const key = generateKey();
    await db.update(apiKeys).set({ prefix: key.prefix, hash: key.hash }).where(eq(apiKeys.id, id));
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "api_key.regenerated", entity: "api_key", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    return { _id: id, id, key: key.secret, prefix: key.prefix };
  }

  async revoke(ctx: Ctx, id: string) {
    const db = getDb();
    await db
      .update(apiKeys)
      .set({ revokedAt: new Date(), isActive: false })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, ctx.tenantId)));
    return { success: true };
  }

  async stats(ctx: Ctx) {
    const db = getDb();
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`coalesce(sum(case when ${apiKeys.isActive} and ${apiKeys.revokedAt} is null then 1 else 0 end), 0)::int`,
      })
      .from(apiKeys)
      .where(eq(apiKeys.tenantId, ctx.tenantId));
    return { total: Number(row?.total ?? 0), active: Number(row?.active ?? 0) };
  }
}
