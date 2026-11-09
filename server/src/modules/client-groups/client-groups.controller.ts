import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { ClientGroupsService } from "./client-groups.service";

const groupSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullish(),
  color: z.string().max(20).optional(),
  discount: z.number().finite().min(0).max(100).optional(),
  groupedBilling: z.boolean().optional(),
});

const updateGroupSchema = groupSchema.partial();

const addClientSchema = z.object({ clientId: z.string().min(1) });

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

/**
 * NOTE: responses are bare JSON (no `success`/`data` envelope) because
 * `clientGroupService` consumes arrays directly (`result.map(...)`).
 */
function GroupsController(path: string) {
  @Controller(path)
  class Groups {
    constructor(readonly groups: ClientGroupsService) {}

    @Get()
    @RequirePermissions(PERMISSIONS.clientsRead)
    async list(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
      return this.groups.list(ctx(auth, req));
    }

    @Get("stats")
    @RequirePermissions(PERMISSIONS.clientsRead)
    async stats(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
      return this.groups.stats(ctx(auth, req));
    }

    @Get("check-name")
    @RequirePermissions(PERMISSIONS.clientsRead)
    async checkName(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("name") name = "", @Query("groupId") groupId?: string) {
      return this.groups.checkName(ctx(auth, req), name, groupId);
    }

    @Post()
    @RequirePermissions(PERMISSIONS.clientsWrite)
    async create(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(groupSchema)) body: z.infer<typeof groupSchema>) {
      return this.groups.create(ctx(auth, req), body);
    }

    @Get(":id")
    @RequirePermissions(PERMISSIONS.clientsRead)
    async get(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
      return this.groups.get(ctx(auth, req), id);
    }

    @Put(":id")
    @RequirePermissions(PERMISSIONS.clientsWrite)
    async update(
      @CurrentAuth() auth: AuthContext,
      @Req() req: Request,
      @Param("id") id: string,
      @Body(new ZodValidationPipe(updateGroupSchema)) body: Partial<z.infer<typeof groupSchema>>,
    ) {
      return this.groups.update(ctx(auth, req), id, body);
    }

    @Delete(":id")
    @RequirePermissions(PERMISSIONS.clientsWrite)
    async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
      return this.groups.remove(ctx(auth, req), id);
    }

    @Get(":id/clients")
    @RequirePermissions(PERMISSIONS.clientsRead)
    async groupClients(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
      return this.groups.groupClients(ctx(auth, req), id);
    }

    @Post(":id/clients")
    @RequirePermissions(PERMISSIONS.clientsWrite)
    async addClient(
      @CurrentAuth() auth: AuthContext,
      @Req() req: Request,
      @Param("id") id: string,
      @Body(new ZodValidationPipe(addClientSchema)) body: { clientId: string },
    ) {
      return this.groups.addClient(ctx(auth, req), id, body.clientId);
    }

    @Delete(":id/clients/:clientId")
    @RequirePermissions(PERMISSIONS.clientsWrite)
    async removeClient(
      @CurrentAuth() auth: AuthContext,
      @Req() req: Request,
      @Param("id") id: string,
      @Param("clientId") clientId: string,
    ) {
      return this.groups.removeClient(ctx(auth, req), id, clientId);
    }
  }
  return Groups;
}

export const ClientGroupsController = GroupsController("client-groups");
/** Alias for the corrupted frontend literal `/n` (see audit §10). */
export const ClientGroupsAliasController = GroupsController("n");
