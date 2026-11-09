import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { ClientNotesService } from "./client-notes.service";

const createNoteSchema = z.object({
  clientId: z.string().min(1),
  content: z.string().min(1).max(5000),
  type: z.enum(["general", "follow-up", "important", "reminder"]).optional(),
  title: z.string().max(200).optional(),
  isPinned: z.boolean().optional(),
});

const updateNoteSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  type: z.enum(["general", "follow-up", "important", "reminder"]).optional(),
  title: z.string().max(200).optional(),
  isPinned: z.boolean().optional(),
});

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("client-notes")
export class ClientNotesController {
  constructor(private readonly notes: ClientNotesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.clientsRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.notes.list(ctx(auth, req), {
      ...parsePagination(query),
      clientId: typeof query.clientId === "string" ? query.clientId : undefined,
      type: typeof query.type === "string" ? query.type : undefined,
      search: typeof query.search === "string" ? query.search : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Get("client/:clientId")
  @RequirePermissions(PERMISSIONS.clientsRead)
  async byClient(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("clientId") clientId: string) {
    return ok(await this.notes.byClient(ctx(auth, req), clientId));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.clientsWrite)
  async create(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(createNoteSchema)) body: z.infer<typeof createNoteSchema>) {
    return ok(await this.notes.create(ctx(auth, req), body), "Note créée");
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.clientsWrite)
  async update(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateNoteSchema)) body: z.infer<typeof updateNoteSchema>,
  ) {
    return ok(await this.notes.update(ctx(auth, req), id, body), "Note mise à jour");
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.clientsWrite)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.notes.remove(ctx(auth, req), id), "Note supprimée");
  }
}
