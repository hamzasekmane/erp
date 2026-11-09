import { Injectable } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { clientGroupMembers, clientGroups, clients } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { fromMinor } from "../../shared/money";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

@Injectable()
export class ClientGroupsService {
  async list(ctx: Ctx) {
    const db = getDb();
    const rows = await db
      .select({
        group: clientGroups,
        clientCount: sql<number>`(select count(*)::int from client_group_members m where m.group_id = ${clientGroups.id})`,
      })
      .from(clientGroups)
      .where(and(eq(clientGroups.tenantId, ctx.tenantId), isNull(clientGroups.deletedAt)));
    return rows.map((row) => this.serialize(row.group, Number(row.clientCount)));
  }

  async get(ctx: Ctx, id: string) {
    const db = getDb();
    const [row] = await db
      .select({ group: clientGroups })
      .from(clientGroups)
      .where(and(eq(clientGroups.id, id), eq(clientGroups.tenantId, ctx.tenantId), isNull(clientGroups.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Groupe introuvable");
    const [count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clientGroupMembers)
      .where(eq(clientGroupMembers.groupId, id));
    return this.serialize(row.group, Number(count?.count ?? 0));
  }

  async groupClients(ctx: Ctx, id: string) {
    const db = getDb();
    await this.get(ctx, id);
    const rows = await db
      .select({ client: clients })
      .from(clientGroupMembers)
      .innerJoin(clients, eq(clients.id, clientGroupMembers.clientId))
      .where(and(eq(clientGroupMembers.groupId, id), isNull(clients.deletedAt)));
    return rows.map(({ client }) => ({
      _id: client.id,
      id: client.id,
      code: client.code,
      name: client.name,
      email: client.email,
      phone: client.phone,
      balance: fromMinor(Number(client.balanceMinor)),
      type: client.type,
    }));
  }

  async stats(ctx: Ctx) {
    const db = getDb();
    const [groups] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(clientGroups)
      .where(and(eq(clientGroups.tenantId, ctx.tenantId), isNull(clientGroups.deletedAt)));
    const [members] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(clientGroupMembers)
      .innerJoin(clientGroups, eq(clientGroups.id, clientGroupMembers.groupId))
      .where(and(eq(clientGroups.tenantId, ctx.tenantId), isNull(clientGroups.deletedAt)));
    return { totalGroups: Number(groups?.total ?? 0), totalMembers: Number(members?.total ?? 0) };
  }

  async checkName(ctx: Ctx, name: string, groupId?: string) {
    const db = getDb();
    const filters = [
      eq(clientGroups.tenantId, ctx.tenantId),
      sql`lower(${clientGroups.name}) = ${name.trim().toLowerCase()}`,
      isNull(clientGroups.deletedAt),
    ];
    if (groupId) filters.push(sql`${clientGroups.id} <> ${groupId}`);
    const [row] = await db.select({ id: clientGroups.id }).from(clientGroups).where(and(...filters)).limit(1);
    return row ? { available: false, message: "Ce nom de groupe est déjà utilisé" } : { available: true };
  }

  async create(
    ctx: Ctx,
    input: { name: string; description?: string | null; color?: string; discount?: number; groupedBilling?: boolean },
  ) {
    const db = getDb();
    const availability = await this.checkName(ctx, input.name);
    if (!availability.available) throw AppError.conflict("GROUP_NAME_EXISTS", "Ce nom de groupe est déjà utilisé");
    const id = newId();
    await db.insert(clientGroups).values({
      id,
      tenantId: ctx.tenantId,
      name: input.name.trim(),
      description: input.description ?? null,
      color: input.color ?? "cyan",
      discountBp: Math.round((input.discount ?? 0) * 100),
      groupedBilling: input.groupedBilling ?? false,
      createdBy: ctx.userId,
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "client_group.created", entity: "client_group", entityId: id, after: input, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.get(ctx, id);
  }

  async update(
    ctx: Ctx,
    id: string,
    input: { name?: string; description?: string | null; color?: string; discount?: number; groupedBilling?: boolean },
  ) {
    const db = getDb();
    const existing = await this.get(ctx, id);
    if (input.name && input.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const availability = await this.checkName(ctx, input.name, id);
      if (!availability.available) throw AppError.conflict("GROUP_NAME_EXISTS", "Ce nom de groupe est déjà utilisé");
    }
    const patch: Partial<typeof clientGroups.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.color !== undefined) patch.color = input.color;
    if (input.discount !== undefined) patch.discountBp = Math.round(input.discount * 100);
    if (input.groupedBilling !== undefined) patch.groupedBilling = input.groupedBilling;
    await db.update(clientGroups).set(patch).where(and(eq(clientGroups.id, id), eq(clientGroups.tenantId, ctx.tenantId)));
    return this.get(ctx, id);
  }

  async remove(ctx: Ctx, id: string) {
    const db = getDb();
    await this.get(ctx, id);
    await db.update(clientGroups).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(clientGroups.id, id), eq(clientGroups.tenantId, ctx.tenantId)));
    return { success: true, message: "Groupe supprimé" };
  }

  async addClient(ctx: Ctx, id: string, clientId: string) {
    const db = getDb();
    await this.get(ctx, id);
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, ctx.tenantId), isNull(clients.deletedAt)))
      .limit(1);
    if (!client) throw AppError.notFound("Client introuvable");
    await db.insert(clientGroupMembers).values({ groupId: id, clientId }).onConflictDoNothing();
    return this.groupClients(ctx, id);
  }

  async removeClient(ctx: Ctx, id: string, clientId: string) {
    const db = getDb();
    await this.get(ctx, id);
    await db.delete(clientGroupMembers).where(and(eq(clientGroupMembers.groupId, id), eq(clientGroupMembers.clientId, clientId)));
    return { success: true };
  }

  private serialize(row: typeof clientGroups.$inferSelect, clientCount: number) {
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      discount: Number(row.discountBp) / 100,
      groupedBilling: row.groupedBilling,
      clientCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
