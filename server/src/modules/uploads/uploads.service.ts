import { Injectable, NotFoundException } from "@nestjs/common";
import { createReadStream, existsSync, mkdirSync, promises as fs } from "node:fs";
import { extname, resolve } from "node:path";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { plans, subscriptions, tenants, uploads } from "../../db/schema";
import { env } from "../../config/env";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { okList, paginate } from "../../shared/http";
import { newId } from "../../shared/ids";
import { antivirusConfigured, evaluateQuota, scanUpload } from "../../shared/security/antivirus";

export type UploadKind = "logo" | "document" | "attachment" | "import";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

const ALLOWED_MIME: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
};

@Injectable()
export class UploadsService {
  storageRoot() {
    return resolve(env.UPLOAD_DIR);
  }

  async save(ctx: Ctx, file: Express.Multer.File | undefined, kind: UploadKind) {
    if (!file) throw AppError.badRequest("Aucun fichier reçu");
    const extensions = ALLOWED_MIME[file.mimetype];
    if (!extensions) throw AppError.badRequest(`Type de fichier non autorisé : ${file.mimetype}`);
    const extension = (extname(file.originalname) || extensions[0] || "").toLowerCase();
    if (!extensions.includes(extension)) throw AppError.badRequest(`Extension ${extension} incompatible avec ${file.mimetype}`);

    // 1. Antivirus — a rejected file is never written to disk nor recorded.
    let scan: Awaited<ReturnType<typeof scanUpload>>;
    try {
      scan = await scanUpload(file.buffer, file.mimetype);
    } catch (error) {
      await audit({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: "upload.scan_unavailable",
        entity: "upload",
        after: { filename: file.originalname, reason: error instanceof Error ? error.message : "unknown" },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new AppError("SCAN_UNAVAILABLE", "Analyse antivirus indisponible, réessayez plus tard.", 503);
    }
    if (!scan.clean) {
      await audit({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: "upload.blocked",
        entity: "upload",
        after: { filename: file.originalname, signature: scan.signature, engine: scan.engine },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw AppError.unprocessable(
        "UPLOAD_INFECTED",
        `Fichier rejeté : signature malveillante détectée (${scan.signature ?? "inconnue"}).`,
        { signature: scan.signature, engine: scan.engine },
      );
    }

    // 2. Stockage : quota de la formule d'abonnement.
    const usage = await this.usage(ctx);
    const quota = evaluateQuota(usage.usedBytes, file.size, usage.limitBytes);
    if (!quota.allowed) {
      throw AppError.unprocessable(
        "STORAGE_QUOTA_EXCEEDED",
        `Quota de stockage atteint (${Math.round(usage.usedBytes / 1024 / 1024)} Mo utilisés sur ${Math.round(usage.limitBytes / 1024 / 1024)} Mo).`,
        {
          usedMb: Math.round((usage.usedBytes / 1024 / 1024) * 10) / 10,
          limitMb: Math.round(usage.limitBytes / 1024 / 1024),
          fileMb: Math.round((file.size / 1024 / 1024) * 100) / 100,
        },
      );
    }

    const id = newId();
    const directory = resolve(this.storageRoot(), ctx.tenantId);
    mkdirSync(directory, { recursive: true });
    const storagePath = resolve(directory, `${id}${extension}`);
    await fs.writeFile(storagePath, file.buffer);

    const db = getDb();
    await db.insert(uploads).values({
      id,
      tenantId: ctx.tenantId,
      kind,
      filename: file.originalname.slice(0, 200),
      mime: file.mimetype,
      size: file.size,
      storagePath,
      uploadedBy: ctx.userId,
      scanStatus: "clean",
      scanEngine: scan.engine,
      scanSignature: scan.signature ?? null,
      scannedAt: new Date(),
    });
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: `upload.${kind}`,
      entity: "upload",
      entityId: id,
      after: { filename: file.originalname, size: file.size, engine: scan.engine },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      _id: id,
      id,
      kind,
      filename: file.originalname,
      mime: file.mimetype,
      size: file.size,
      scanStatus: "clean",
      scanEngine: scan.engine,
      url: `/api/uploads/${id}`,
      createdAt: new Date().toISOString(),
    };
  }

  /** Live storage usage and the quota of the tenant's current plan. */
  async usage(ctx: { tenantId: string }) {
    const [totals, limitMb] = await Promise.all([this.totals(ctx.tenantId), this.quotaMb(ctx.tenantId)]);
    const usedBytes = Number(totals?.bytes ?? 0);
    const limitBytes = limitMb * 1024 * 1024;
    return {
      usedBytes,
      limitBytes,
      count: Number(totals?.count ?? 0),
      percent: limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0,
      remainingBytes: Math.max(0, limitBytes - usedBytes),
      limitMb,
      usedMb: Math.round((usedBytes / 1024 / 1024) * 10) / 10,
      antivirus: { configured: antivirusConfigured(), engine: antivirusConfigured() ? "clamd" : "builtin" },
    };
  }

  private async totals(tenantId: string) {
    const db = getDb();
    const [row] = await db
      .select({ bytes: sql<number>`coalesce(sum(${uploads.size}), 0)::bigint`, count: sql<number>`count(*)::int` })
      .from(uploads)
      .where(and(eq(uploads.tenantId, tenantId), isNull(uploads.deletedAt)));
    return row;
  }

  private async quotaMb(tenantId: string): Promise<number> {
    const db = getDb();
    const [subscription] = await db
      .select({ limits: plans.limits })
      .from(subscriptions)
      .innerJoin(plans, eq(plans.id, subscriptions.planId))
      .where(eq(subscriptions.tenantId, tenantId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    const limit = Number((subscription?.limits as Record<string, number> | undefined)?.storageMb ?? 0);
    return limit > 0 ? limit : Number(env.DEFAULT_STORAGE_QUOTA_MB);
  }

  async list(ctx: Ctx, page = 1, limit = 20) {
    const db = getDb();
    const where = and(eq(uploads.tenantId, ctx.tenantId), isNull(uploads.deletedAt));
    const rows = await db
      .select()
      .from(uploads)
      .where(where)
      .orderBy(desc(uploads.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(uploads).where(where);
    return okList(rows.map(serializeUpload), paginate(Number(count), page, limit));
  }

  async find(ctx: Ctx, id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(uploads)
      .where(and(eq(uploads.id, id), eq(uploads.tenantId, ctx.tenantId), isNull(uploads.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Fichier introuvable");
    return row;
  }

  async stream(ctx: Ctx, id: string) {
    const row = await this.find(ctx, id);
    if (!existsSync(row.storagePath)) throw new NotFoundException("Fichier introuvable sur le disque");
    return { row, stream: createReadStream(row.storagePath) };
  }

  async remove(ctx: Ctx, id: string) {
    const row = await this.find(ctx, id);
    const db = getDb();
    await db.update(uploads).set({ deletedAt: new Date() }).where(eq(uploads.id, row.id));
    await fs.rm(row.storagePath, { force: true });
    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "upload.deleted",
      entity: "upload",
      entityId: id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { success: true };
  }

  async setLogo(ctx: Ctx, file: Express.Multer.File | undefined) {
    const saved = await this.save(ctx, file, "logo");
    const db = getDb();
    await db.update(tenants).set({ logoUrl: saved.url, updatedAt: new Date() }).where(eq(tenants.id, ctx.tenantId));
    return { ...saved, logoUrl: saved.url };
  }
}

export function serializeUpload(row: typeof uploads.$inferSelect) {
  return {
    _id: row.id,
    id: row.id,
    kind: row.kind,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    scanStatus: row.scanStatus,
    scanEngine: row.scanEngine,
    url: `/api/uploads/${row.id}`,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.createdAt.toISOString(),
  };
}
