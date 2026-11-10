import { Body, Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { ok } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { ApiKeysService } from "./api-keys.service";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  scopes: z.array(z.string().max(60)).max(50).optional(),
  permissions: z.array(z.string().max(60)).max(50).optional(),
  rateLimit: z.number().int().min(1).max(100000).optional(),
  expiresAt: z.string().optional(),
});

@Controller("api-keys")
export class ApiKeysController {
  constructor(private readonly keys: ApiKeysService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.apiKeysRead)
  async list(@CurrentAuth() auth: AuthContext) {
    return ok(await this.keys.list({ tenantId: auth.tenantId, userId: auth.userId }));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.apiKeysWrite)
  async create(@CurrentAuth() auth: AuthContext, @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    return ok(await this.keys.create({ tenantId: auth.tenantId, userId: auth.userId }, body), "Clé API créée");
  }

  @Post(":id/regenerate")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.apiKeysWrite)
  async regenerate(@CurrentAuth() auth: AuthContext, @Param("id") id: string) {
    return ok(await this.keys.regenerate({ tenantId: auth.tenantId, userId: auth.userId }, id));
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.apiKeysWrite)
  async revoke(@CurrentAuth() auth: AuthContext, @Param("id") id: string) {
    return ok(await this.keys.revoke({ tenantId: auth.tenantId, userId: auth.userId }, id));
  }

  @Get("stats")
  @RequirePermissions(PERMISSIONS.apiKeysRead)
  async stats(@CurrentAuth() auth: AuthContext) {
    return ok(await this.keys.stats({ tenantId: auth.tenantId, userId: auth.userId }));
  }
}
