import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { clientNotes } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate } from "../../shared/http";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

const CATEGORIES = ["general", "follow-up", "important", "reminder"] as const;

@Injectable()
export class ClientNotesService {
  async list(ctx: Ctx, query: { page: number; limit: number; offset: number; clientId?: string; type?: string; search?: string }) {
    const db = getDb();
    const filters: SQL[] = [eq(clientNotes.tenantId, ctx.tenantId), isNull(clientNotes.deletedAt)];
    if (query.clientId) filters.push(eq(clientNotes.clientId, query.clientId));
    if (query.type && (CATEGORIES as readonly string[]).includes(query.type)) filters.push(eq(clientNotes.category, query.type));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(sql`lower(${clientNotes.title}) like ${term}`, sql`lower(${clientNotes.content}) like ${term}`);
      if (search) filters.push(search);
    }
    const where = and(...filters);
    const [rows, [countRow]] = await Promise.all([
      db.select().from(clientNotes).where(where).orderBy(desc(clientNotes.isPinned), desc(clientNotes.createdAt)).limit(query.limit).offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(clientNotes).where(where),
    ]);
    return { items: rows.map((row) => this.serialize(row)), pagination: paginate(countRow?.count ?? 0, query.page, query.limit) };
  }

  async byClient(ctx: Ctx, clientId: string) {
    const db = getDb();
    const rows = await db
      .select()
      .from(clientNotes)
      .where(and(eq(clientNotes.tenantId, ctx.tenantId), eq(clientNotes.clientId, clientId), isNull(clientNotes.deletedAt)))
      .orderBy(desc(clientNotes.isPinned), desc(clientNotes.createdAt));
    return rows.map((row) => this.serialize(row));
  }

  async create(ctx: Ctx, input: { clientId: string; content: string; type?: string; title?: string; isPinned?: boolean }) {
    const db = getDb();
    const id = newId();
    const type = (CATEGORIES as readonly string[]).includes(input.type ?? "") ? input.type! : "general";
    await db.insert(clientNotes).values({
      id,
      tenantId: ctx.tenantId,
      clientId: input.clientId,
      title: input.title?.trim() || input.content.slice(0, 80),
      content: input.content,
      category: type,
      isPinned: input.isPinned ?? false,
      createdBy: ctx.userId,
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "client_note.created", entity: "client_note", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.get(ctx, id);
  }

  async update(ctx: Ctx, id: string, input: { content?: string; type?: string; title?: string; isPinned?: boolean }) {
    const db = getDb();
    const existing = await this.require(ctx, id);
    const patch: Partial<typeof clientNotes.$inferInsert> = { updatedAt: new Date() };
    if (input.content !== undefined) patch.content = input.content;
    if (input.title !== undefined) patch.title = input.title.trim() || existing.title;
    if (input.type !== undefined && (CATEGORIES as readonly string[]).includes(input.type)) patch.category = input.type;
    if (input.isPinned !== undefined) patch.isPinned = input.isPinned;
    await db.update(clientNotes).set(patch).where(and(eq(clientNotes.id, id), eq(clientNotes.tenantId, ctx.tenantId)));
    return this.get(ctx, id);
  }

  async remove(ctx: Ctx, id: string) {
    const db = getDb();
    await this.require(ctx, id);
    await db.update(clientNotes).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(clientNotes.id, id), eq(clientNotes.tenantId, ctx.tenantId)));
    return { success: true };
  }

  private async get(ctx: Ctx, id: string) {
    const row = await this.require(ctx, id);
    return this.serialize(row);
  }

  private async require(ctx: Ctx, id: string): Promise<typeof clientNotes.$inferSelect> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(clientNotes)
      .where(and(eq(clientNotes.id, id), eq(clientNotes.tenantId, ctx.tenantId), isNull(clientNotes.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Note introuvable");
    return row;
  }

  private serialize(row: typeof clientNotes.$inferSelect) {
    return {
      _id: row.id,
      id: row.id,
      clientId: row.clientId,
      title: row.title,
      content: row.content,
      type: row.category,
      category: row.category,
      isPinned: row.isPinned,
      createdBy: row.createdBy ?? "",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
