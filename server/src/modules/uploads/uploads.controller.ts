import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { env } from "../../config/env";
import { ok } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { UploadsService, type UploadKind } from "./uploads.service";

const KIND_BY_SCOPE: Record<string, UploadKind> = {
  logo: "logo",
  document: "document",
  attachment: "attachment",
  import: "import",
};

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  private ctx(auth: AuthContext, req: Request) {
    return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
  }

  @Post("logo")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 } }))
  @RequirePermissions(PERMISSIONS.settingsWrite)
  async logo(@CurrentAuth() auth: AuthContext, @Req() req: Request, @UploadedFile() file?: Express.Multer.File) {
    return ok(await this.uploads.setLogo(this.ctx(auth, req), file));
  }

  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 } }))
  @RequirePermissions(PERMISSIONS.archivesWrite)
  async upload(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body("kind") kind: string | undefined,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const resolved = KIND_BY_SCOPE[kind ?? "document"] ?? "document";
    return ok(await this.uploads.save(this.ctx(auth, req), file, resolved));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.archivesRead)
  async list(@CurrentAuth() auth: AuthContext, @Query("page") page = "1", @Query("limit") limit = "20") {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.uploads.list({ tenantId: auth.tenantId, userId: auth.userId }, pageNumber, limitNumber);
  }

  @Get("usage")
  @RequirePermissions(PERMISSIONS.archivesRead)
  async usage(@CurrentAuth() auth: AuthContext) {
    return ok(await this.uploads.usage({ tenantId: auth.tenantId }));
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.archivesRead)
  async download(@CurrentAuth() auth: AuthContext, @Param("id") id: string, @Res() res: Response) {
    const { row, stream } = await this.uploads.stream({ tenantId: auth.tenantId, userId: auth.userId }, id);
    res.setHeader("Content-Type", row.mime);
    res.setHeader("Content-Length", row.size);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(row.filename)}"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    stream.pipe(res);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.archivesWrite)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.uploads.remove(this.ctx(auth, req), id));
  }
}
