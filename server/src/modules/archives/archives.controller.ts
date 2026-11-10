import { Body, Controller, Delete, Get, Param, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { ArchivesService } from "./archives.service";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(["invoice", "client", "product", "hr", "contract", "other"]).optional(),
  description: z.string().max(2000).nullish(),
  fileUrl: z.string().max(2000).nullish(),
  mime: z.string().max(120).nullish(),
  size: z.number().int().nonnegative().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
});

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("archives")
export class ArchivesController {
  constructor(private readonly archives: ArchivesService) {}

  @Get("documents")
  @RequirePermissions(PERMISSIONS.archivesRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.archives.list(ctx(auth, req), {
      ...parsePagination(query),
      category: typeof query.category === "string" ? query.category : undefined,
      search: typeof query.search === "string" ? query.search : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Get("stats")
  @RequirePermissions(PERMISSIONS.archivesRead)
  async stats(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.archives.stats(ctx(auth, req)));
  }

  @Post("documents")
  @RequirePermissions(PERMISSIONS.archivesWrite)
  async create(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    return ok(await this.archives.create(ctx(auth, req), body), "Document archivé");
  }

  @Delete("documents/:id")
  @RequirePermissions(PERMISSIONS.archivesWrite)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.archives.remove(ctx(auth, req), id));
  }
}
