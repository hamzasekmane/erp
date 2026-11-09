import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { SupportService } from "./support.service";

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(3).max(5000),
  category: z.enum(["billing", "technical", "account", "feature", "other"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

const updateSchema = z.object({
  status: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  category: z.string().max(40).optional(),
  assignedTo: z.string().nullish(),
});

const replySchema = z.object({ body: z.string().min(1).max(5000) });

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("support")
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get("tickets")
  @RequirePermissions(PERMISSIONS.supportRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.support.list(ctx(auth, req), {
      ...parsePagination(query),
      status: typeof query.status === "string" ? query.status : undefined,
      priority: typeof query.priority === "string" ? query.priority : undefined,
      search: typeof query.search === "string" ? query.search : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Get("tickets/stats")
  @RequirePermissions(PERMISSIONS.supportRead)
  async stats(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.support.stats(ctx(auth, req)));
  }

  @Post("tickets")
  @RequirePermissions(PERMISSIONS.supportWrite)
  async create(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    return ok(await this.support.create(ctx(auth, req), body), "Ticket créé");
  }

  @Get("tickets/:id")
  @RequirePermissions(PERMISSIONS.supportRead)
  async get(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.support.get(ctx(auth, req), id));
  }

  @Patch("tickets/:id")
  @RequirePermissions(PERMISSIONS.supportWrite)
  async update(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string, @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return ok(await this.support.update(ctx(auth, req), id, body), "Ticket mis à jour");
  }

  @Post("tickets/:id/messages")
  @RequirePermissions(PERMISSIONS.supportWrite)
  async reply(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string, @Body(new ZodValidationPipe(replySchema)) body: { body: string }) {
    return ok(await this.support.reply(ctx(auth, req), id, body.body));
  }
}
