import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { createClientSchema, updateClientSchema, type CreateClientInput, type UpdateClientInput } from "./clients.dto";
import { ClientsService } from "./clients.service";

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("clients")
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.clientsRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.clients.list(ctx(auth, req), {
      ...parsePagination(query),
      search: typeof query.search === "string" ? query.search : undefined,
      type: typeof query.type === "string" ? query.type : undefined,
      category: typeof query.category === "string" ? query.category : undefined,
      isActive: typeof query.isActive === "string" ? query.isActive : undefined,
      sortBy: typeof query.sortBy === "string" ? query.sortBy : undefined,
      sortOrder: typeof query.sortOrder === "string" ? query.sortOrder : undefined,
    });
    return okList(result.items, result.pagination);
  }

  /** These two answer `{ available }` at the top level: `clientService` reads them directly. */
  @Get("check-code")
  @RequirePermissions(PERMISSIONS.clientsRead)
  async checkCode(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("code") code = "", @Query("clientId") clientId?: string) {
    if (!code) return { available: false, error: "Code requis" };
    return this.clients.checkCode(ctx(auth, req), code, clientId);
  }

  @Get("check-email")
  @RequirePermissions(PERMISSIONS.clientsRead)
  async checkEmail(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("email") email = "", @Query("clientId") clientId?: string) {
    if (!email) return { available: false, error: "Email requis" };
    return this.clients.checkEmail(ctx(auth, req), email, clientId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.clientsWrite)
  async create(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(createClientSchema)) body: CreateClientInput,
  ) {
    return ok(await this.clients.create(ctx(auth, req), body), "Client créé");
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.clientsRead)
  async get(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.clients.get(ctx(auth, req), id));
  }

  @Get(":id/stats")
  @RequirePermissions(PERMISSIONS.clientsRead)
  async stats(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.clients.stats(ctx(auth, req), id));
  }

  @Get(":id/invoices")
  @RequirePermissions(PERMISSIONS.invoicesRead)
  async invoices(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.clients.invoices(ctx(auth, req), id));
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.clientsWrite)
  async update(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateClientSchema)) body: UpdateClientInput,
  ) {
    return ok(await this.clients.update(ctx(auth, req), id, body), "Client mis à jour");
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.clientsDelete)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.clients.remove(ctx(auth, req), id), "Client supprimé");
  }
}
