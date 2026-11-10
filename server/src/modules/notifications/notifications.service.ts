import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { notifications, users } from "../../db/schema";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate } from "../../shared/http";

type Ctx = { tenantId: string; userId: string };

@Injectable()
export class NotificationsService {
  async list(ctx: Ctx, query: { page: number; limit: number; offset: number; isRead?: string; type?: string }) {
    const db = getDb();
    const filters: SQL[] = [eq(notifications.tenantId, ctx.tenantId), or(eq(notifications.userId, ctx.userId), isNull(notifications.userId)) as SQL];
    if (query.isRead === "true" || query.isRead === "false") filters.push(eq(notifications.isRead, query.isRead === "true"));
    if (query.type) filters.push(eq(notifications.type, query.type));
    const where = and(...filters);

    const [rows, [countRow], [unreadRow]] = await Promise.all([
      db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(query.limit).offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(where),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.tenantId, ctx.tenantId), eq(notifications.isRead, false), or(eq(notifications.userId, ctx.userId), isNull(notifications.userId)) as SQL)),
    ]);

    return {
      notifications: rows.map((row) => this.serialize(row)),
      unreadCount: Number(unreadRow?.count ?? 0),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async unreadCount(ctx: Ctx) {
    const db = getDb();
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.tenantId, ctx.tenantId), eq(notifications.isRead, false), or(eq(notifications.userId, ctx.userId), isNull(notifications.userId)) as SQL));
    return { count: Number(row?.count ?? 0) };
  }

  async markRead(ctx: Ctx, id: string) {
    const db = getDb();
    const [row] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.tenantId, ctx.tenantId)))
      .limit(1);
    if (!row) throw AppError.notFound("Notification introuvable");
    await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id));
    return { success: true };
  }

  async markAllRead(ctx: Ctx) {
    const db = getDb();
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.tenantId, ctx.tenantId), eq(notifications.isRead, false), or(eq(notifications.userId, ctx.userId), isNull(notifications.userId)) as SQL));
    return { success: true };
  }

  async remove(ctx: Ctx, id: string) {
    const db = getDb();
    await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.tenantId, ctx.tenantId)));
    return { success: true };
  }

  async removeAll(ctx: Ctx) {
    const db = getDb();
    await db.delete(notifications).where(and(eq(notifications.tenantId, ctx.tenantId), or(eq(notifications.userId, ctx.userId), isNull(notifications.userId)) as SQL));
    return { success: true };
  }

  async broadcast(ctx: Ctx, input: { title: string; message: string; type: string }) {
    const db = getDb();
    const recipients = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.tenantId, ctx.tenantId), isNull(users.deletedAt), eq(users.status, "active")));
    const type = ["info", "success", "warning", "error"].includes(input.type) ? input.type : "info";
    if (recipients.length) {
      await db.insert(notifications).values(
        recipients.map((recipient) => ({
          id: newId(),
          tenantId: ctx.tenantId,
          userId: recipient.id,
          type,
          title: input.title,
          message: input.message,
          priority: "medium" as const,
        })),
      );
    }
    return { success: true, sent: recipients.length };
  }

  async cleanup(ctx: Ctx) {
    const db = getDb();
    await db
      .delete(notifications)
      .where(and(eq(notifications.tenantId, ctx.tenantId), sql`${notifications.expiresAt} is not null and ${notifications.expiresAt} < now()`));
    return { success: true };
  }

  private serialize(row: typeof notifications.$inferSelect) {
    return {
      _id: row.id,
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      priority: row.priority,
      isRead: row.isRead,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
    };
  }
}
