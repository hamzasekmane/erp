import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { AdminService } from "./admin.service";

const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  subdomain: z.string().max(60).optional(),
  planCode: z.string().max(40).optional(),
  currency: z.string().length(3).optional(),
  country: z.string().max(80).optional(),
  adminName: z.string().max(120).optional(),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(8).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).nullish(),
  address: z.string().max(240).nullish(),
  city: z.string().max(120).nullish(),
  country: z.string().max(80).optional(),
  currency: z.string().length(3).optional(),
  planCode: z.string().max(40).optional(),
  status: z.enum(["active", "inactive", "suspended", "trial"]).optional(),
});

const statusSchema = z.object({
  isActive: z.boolean().optional(),
  status: z.enum(["active", "inactive", "suspended", "trial"]).optional(),
});

const inviteSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(["tenant_admin", "manager", "user"]).optional(),
  password: z.string().min(8).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.enum(["tenant_admin", "manager", "user"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

function ctx(auth: AuthContext, req: Request) {
  return { ...auth, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("tenants")
  @RequirePermissions(PERMISSIONS.tenantsRead)
  async listTenants(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.admin.listTenants(ctx(auth, req), {
      ...parsePagination(query),
      search: typeof query.search === "string" ? query.search : undefined,
      status: typeof query.status === "string" ? query.status : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Post("tenants")
  @RequirePermissions(PERMISSIONS.tenantsWrite)
  async createTenant(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(createTenantSchema)) body: z.infer<typeof createTenantSchema>) {
    return ok(await this.admin.createTenant(ctx(auth, req), body), "Espace de travail créé");
  }

  @Get("tenants/:id")
  @RequirePermissions(PERMISSIONS.tenantsRead)
  async getTenant(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.admin.getTenant(ctx(auth, req), id));
  }

  @Put("tenants/:id")
  @RequirePermissions(PERMISSIONS.tenantsWrite)
  async updateTenant(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTenantSchema)) body: z.infer<typeof updateTenantSchema>,
  ) {
    return ok(await this.admin.updateTenant(ctx(auth, req), id, body));
  }

  @Patch("tenants/:id/status")
  @RequirePermissions(PERMISSIONS.tenantsWrite)
  async setStatus(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(statusSchema)) body: z.infer<typeof statusSchema>,
  ) {
    const status = body.status ?? (body.isActive ? "active" : "inactive");
    return ok(await this.admin.setStatus(ctx(auth, req), id, status));
  }

  @Get("tenants/:id/users")
  @RequirePermissions(PERMISSIONS.tenantsRead)
  async tenantUsers(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.admin.tenantUsers(ctx(auth, req), id));
  }

  @Post("tenants/:id/users/invite")
  @RequirePermissions(PERMISSIONS.tenantsWrite)
  async invite(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(inviteSchema)) body: z.infer<typeof inviteSchema>,
  ) {
    return ok(await this.admin.inviteUser(ctx(auth, req), id, body), "Utilisateur invité");
  }

  @Put("tenants/:id/users/:userId")
  @RequirePermissions(PERMISSIONS.tenantsWrite)
  async updateTenantUser(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: z.infer<typeof updateUserSchema>,
  ) {
    return ok(await this.admin.updateTenantUser(ctx(auth, req), id, userId, body));
  }

  @Delete("tenants/:id/users/:userId")
  @RequirePermissions(PERMISSIONS.tenantsWrite)
  async removeTenantUser(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string, @Param("userId") userId: string) {
    return ok(await this.admin.removeTenantUser(ctx(auth, req), id, userId));
  }

  @Get("tenants/:id/settings")
  @RequirePermissions(PERMISSIONS.tenantsRead)
  async tenantSettings(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.admin.tenantSettings(ctx(auth, req), id));
  }

  @Put("tenants/:id/settings")
  @RequirePermissions(PERMISSIONS.tenantsWrite)
  async updateTenantSettings(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return ok(await this.admin.updateTenantSettings(ctx(auth, req), id, body ?? {}));
  }

  @Get("metrics")
  @RequirePermissions(PERMISSIONS.tenantsRead)
  async metrics(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.admin.metrics(ctx(auth, req)));
  }
}
