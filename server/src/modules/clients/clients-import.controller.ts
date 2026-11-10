import { Body, Controller, Get, Param, Post, Query, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { clients } from "../../db/schema";
import { audit } from "../../shared/audit";
import { newId } from "../../shared/ids";
import { ok, paginate } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

const TEMPLATE = [
  "code,name,type,email,phone,mobile,category,taxNumber,contactPerson,street,city,postalCode,country,isActive",
  "CLI-100,Client Exemple,company,client@example.dz,0212233445,0555123456,regular,123456789,Responsable,1 rue Didouche,Alger,16000,Algérie,true",
].join("\n");

/** Minimal RFC-4180-ish CSV parser (handles quotes and escaped quotes). */
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

@Controller("clients/import")
export class ClientsImportController {
  @Get("template")
  @RequirePermissions(PERMISSIONS.clientsRead)
  template(@Res() res: Response) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="modele-clients.csv"');
    res.send(TEMPLATE);
  }

  @Post("validate")
  @UseInterceptors(FileInterceptor("file"))
  @RequirePermissions(PERMISSIONS.clientsRead)
  async validate(@CurrentAuth() auth: AuthContext, @UploadedFile() file?: Express.Multer.File) {
    if (!file) return { success: false, message: "Fichier requis" };
    const rows = parseCsv(file.buffer.toString("utf8"));
    const [header, ...data] = rows;
    if (!header) return { success: false, message: "Fichier vide" };
    const columns = header.map((cell) => cell.trim().toLowerCase());
    const missing = ["code", "name"].filter((column) => !columns.includes(column));
    return {
      success: missing.length === 0,
      message: missing.length ? `Colonnes manquantes: ${missing.join(", ")}` : `${data.length} lignes détectées`,
      stats: { total: data.length, created: 0, updated: 0, skipped: 0, errors: 0 },
      columns,
    };
  }

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  @RequirePermissions(PERMISSIONS.clientsWrite)
  async import(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body() body: Record<string, string>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) return { success: false, message: "Fichier requis", stats: { total: 0, created: 0, updated: 0, skipped: 0, errors: 1 } };
    const rows = parseCsv(file.buffer.toString("utf8"));
    const [header, ...data] = rows;
    if (!header) return { success: false, message: "Fichier vide", stats: { total: 0, created: 0, updated: 0, skipped: 0, errors: 1 } };
    const columns = header.map((cell) => cell.trim().toLowerCase());
    const updateExisting = body.updateExisting === "true";
    const skipDuplicates = body.skipDuplicates === "true";
    const db = getDb();
    const ctx: Ctx = { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ row: number; field: string; value: string; message: string }> = [];

    for (const [index, cells] of data.entries()) {
      const record: Record<string, string> = {};
      columns.forEach((column, position) => {
        record[column] = (cells[position] ?? "").trim();
      });
      const rowNumber = index + 2;
      if (!record.code || !record.name) {
        errors.push({ row: rowNumber, field: !record.code ? "code" : "name", value: "", message: "Champ obligatoire manquant" });
        continue;
      }
      const [existing] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.tenantId, ctx.tenantId), sql`lower(${clients.code}) = ${record.code.toLowerCase()}`, isNull(clients.deletedAt)))
        .limit(1);

      if (existing) {
        if (updateExisting) {
          await db
            .update(clients)
            .set({
              name: record.name,
              email: record.email || null,
              phone: record.phone || null,
              mobile: record.mobile || null,
              taxNumber: record.taxNumber || null,
              contactPerson: record.contactPerson || null,
              address: Object.fromEntries(
                Object.entries({ street: record.street, city: record.city, postalCode: record.postalCode, country: record.country }).filter(([, value]) => Boolean(value)),
              ) as Record<string, string>,
              updatedAt: new Date(),
            })
            .where(eq(clients.id, existing.id));
          updated += 1;
        } else {
          skipped += 1;
          if (!skipDuplicates) errors.push({ row: rowNumber, field: "code", value: record.code, message: "Client déjà existant" });
        }
        continue;
      }

      await db.insert(clients).values({
        id: newId(),
        tenantId: ctx.tenantId,
        code: record.code,
        name: record.name,
        type: record.type === "company" ? "company" : "individual",
        category: ["vip", "regular", "wholesale", "retail"].includes(record.category ?? "") ? record.category! : "regular",
        email: record.email || null,
        phone: record.phone || null,
        mobile: record.mobile || null,
        taxNumber: record.taxNumber || null,
        contactPerson: record.contactPerson || null,
        address: Object.fromEntries(
          Object.entries({ street: record.street, city: record.city, postalCode: record.postalCode, country: record.country }).filter(([, value]) => Boolean(value)),
        ) as Record<string, string>,
        isActive: record.isActive ? record.isActive.toLowerCase() !== "false" : true,
        createdBy: ctx.userId,
      });
      created += 1;
    }

    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "client.imported",
      entity: "client",
      after: { total: data.length, created, updated, skipped, errors: errors.length },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      success: errors.length === 0,
      message: `${created} créé(s), ${updated} mis à jour, ${skipped} ignoré(s), ${errors.length} erreur(s)`,
      stats: { total: data.length, created, updated, skipped, errors: errors.length },
      errors: errors.slice(0, 50),
    };
  }

  @Get("history")
  @RequirePermissions(PERMISSIONS.clientsRead)
  async history(@Query("page") page = "1", @Query("limit") limit = "10") {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10));
    return { success: true, data: [], pagination: paginate(0, pageNumber, limitNumber) };
  }

  @Post(":importId/cancel")
  @RequirePermissions(PERMISSIONS.clientsWrite)
  async cancel(@Param("importId") _importId: string) {
    return ok({ success: true, message: "Aucun import en cours" });
  }
}
