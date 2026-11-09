import { Injectable } from "@nestjs/common";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { supportMessages, supportTickets } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate } from "../../shared/http";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

@Injectable()
export class SupportService {
  async list(ctx: Ctx, query: { page: number; limit: number; offset: number; status?: string; priority?: string; search?: string }) {
    const db = getDb();
    const filters: SQL[] = [eq(supportTickets.tenantId, ctx.tenantId)];
    if (query.status) filters.push(eq(supportTickets.status, query.status));
    if (query.priority) filters.push(eq(supportTickets.priority, query.priority));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(sql`lower(${supportTickets.subject}) like ${term}`, sql`lower(${supportTickets.description}) like ${term}`);
      if (search) filters.push(search);
    }
    const where = and(...filters);
    const [rows, [countRow]] = await Promise.all([
      db.select().from(supportTickets).where(where).orderBy(desc(supportTickets.createdAt)).limit(query.limit).offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(supportTickets).where(where),
    ]);
    return {
      items: rows.map((row) => this.serialize(row)),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async get(ctx: Ctx, id: string) {
    const db = getDb();
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.tenantId, ctx.tenantId)))
      .limit(1);
    if (!ticket) throw AppError.notFound("Ticket introuvable");
    const messages = await db.select().from(supportMessages).where(eq(supportMessages.ticketId, id)).orderBy(asc(supportMessages.createdAt));
    return {
      ...this.serialize(ticket),
      messages: messages.map((message) => ({ _id: message.id, id: message.id, authorId: message.authorId, body: message.body, createdAt: message.createdAt.toISOString() })),
    };
  }

  async create(ctx: Ctx, input: { subject: string; description: string; category?: string; priority?: string }) {
    const db = getDb();
    const id = newId();
    await db.insert(supportTickets).values({
      id,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      subject: input.subject,
      description: input.description,
      category: input.category ?? "other",
      priority: input.priority ?? "medium",
      status: "open",
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "support.ticket_created", entity: "support_ticket", entityId: id, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.get(ctx, id);
  }

  async update(ctx: Ctx, id: string, input: { status?: string; priority?: string; assignedTo?: string | null; category?: string }) {
    const db = getDb();
    const patch: Partial<typeof supportTickets.$inferInsert> = { updatedAt: new Date() };
    if (input.status !== undefined) patch.status = input.status;
    if (input.priority !== undefined) patch.priority = input.priority;
    if (input.category !== undefined) patch.category = input.category;
    if (input.assignedTo !== undefined) patch.assignedTo = input.assignedTo;
    await db.update(supportTickets).set(patch).where(and(eq(supportTickets.id, id), eq(supportTickets.tenantId, ctx.tenantId)));
    return this.get(ctx, id);
  }

  async reply(ctx: Ctx, id: string, body: string) {
    const db = getDb();
    await this.get(ctx, id);
    await db.insert(supportMessages).values({ id: newId(), ticketId: id, authorId: ctx.userId, body });
    await db.update(supportTickets).set({ status: "in_progress", updatedAt: new Date() }).where(eq(supportTickets.id, id));
    return this.get(ctx, id);
  }

  async stats(ctx: Ctx) {
    const db = getDb();
    const rows = await db
      .select({ status: supportTickets.status, count: sql<number>`count(*)::int` })
      .from(supportTickets)
      .where(eq(supportTickets.tenantId, ctx.tenantId))
      .groupBy(supportTickets.status);
    const map: Record<string, number> = {};
    for (const row of rows) map[row.status] = Number(row.count);
    return {
      open: map.open ?? 0,
      inProgress: map.in_progress ?? 0,
      waiting: map.waiting ?? 0,
      resolved: map.resolved ?? 0,
      closed: map.closed ?? 0,
      total: Object.values(map).reduce((sum, value) => sum + value, 0),
    };
  }

  private serialize(row: typeof supportTickets.$inferSelect) {
    return {
      _id: row.id,
      id: row.id,
      subject: row.subject,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assignedTo: row.assignedTo,
      userId: row.userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
