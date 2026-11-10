import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { archiveDocuments } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate } from "../../shared/http";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

@Injectable()
export class ArchivesService {
  async list(ctx: Ctx, query: { page: number; limit: number; offset: number; category?: string; search?: string }) {
    const db = getDb();
    const filters: SQL[] = [eq(archiveDocuments.tenantId, ctx.tenantId), isNull(archiveDocuments.deletedAt)];
    if (query.category) filters.push(eq(archiveDocuments.category, query.category));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(sql`lower(${archiveDocuments.name}) like ${term}`, sql`lower(coalesce(${archiveDocuments.description}, '')) like ${term}`);
      if (search) filters.push(search);
    }
    const where = and(...filters);
    const [rows, [countRow]] = await Promise.all([
      db.select().from(archiveDocuments).where(where).orderBy(desc(archiveDocuments.createdAt)).limit(query.limit).offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(archiveDocuments).where(where),
    ]);
    return {
      items: rows.map((row) => this.serialize(row)),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async stats(ctx: Ctx) {
    const db = getDb();
    const rows = await db
      .select({ category: archiveDocuments.category, count: sql<number>`count(*)::int`, size: sql<number>`coalesce(sum(${archiveDocuments.size}), 0)::bigint` })
      .from(archiveDocuments)
      .where(and(eq(archiveDocuments.tenantId, ctx.tenantId), isNull(archiveDocuments.deletedAt)))
      .groupBy(archiveDocuments.category);
    return {
      totalDocuments: rows.reduce((sum, row) => sum + Number(row.count), 0),
      totalSize: rows.reduce((sum, row) => sum + Number(row.size), 0),
      byCategory: rows.map((row) => ({ category: row.category, count: Number(row.count), size: Number(row.size) })),
    };
  }

  async create(ctx: Ctx, input: { name: string; category?: string; description?: string | null; fileUrl?: string | null; mime?: string | null; size?: number; tags?: string[] }) {
    const db = getDb();
    const id = newId();
    await db.insert(archiveDocuments).values({
      id,
      tenantId: ctx.tenantId,
      name: input.name,
      category: input.category ?? "other",
      description: input.description ?? null,
      fileUrl: input.fileUrl ?? null,
      mime: input.mime ?? null,
      size: input.size ?? 0,
      tags: input.tags ?? [],
      uploadedBy: ctx.userId,
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "archive.document_created", entity: "archive_document", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    const [row] = await db.select().from(archiveDocuments).where(eq(archiveDocuments.id, id)).limit(1);
    return this.serialize(row!);
  }

  async remove(ctx: Ctx, id: string) {
    const db = getDb();
    const [row] = await db
      .select({ id: archiveDocuments.id })
      .from(archiveDocuments)
      .where(and(eq(archiveDocuments.id, id), eq(archiveDocuments.tenantId, ctx.tenantId)))
      .limit(1);
    if (!row) throw AppError.notFound("Document introuvable");
    await db.update(archiveDocuments).set({ deletedAt: new Date() }).where(eq(archiveDocuments.id, id));
    return { success: true };
  }

  private serialize(row: typeof archiveDocuments.$inferSelect) {
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      fileUrl: row.fileUrl,
      mime: row.mime,
      size: row.size,
      tags: row.tags,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
