import { Injectable } from "@nestjs/common";
import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { categories, products, stockLevels, stockMovements, taxes } from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { paginate, type Pagination } from "../../shared/http";
import { fromMinor, toMinor } from "../../shared/money";
import type {
  CreateCategoryInput,
  CreateProductInput,
  CreateTaxInput,
  StockMovementInput,
  UpdateCategoryInput,
  UpdateProductInput,
  UpdateTaxInput,
} from "./catalog.dto";

type Ctx = { tenantId: string; userId: string; ip?: string | null; userAgent?: string | null };

type ProductListQuery = {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  category?: string;
  categoryId?: string;
  status?: string;
  lowStock?: string;
  sortBy?: string;
  sortOrder?: string;
};

type Row = {
  product: typeof products.$inferSelect;
  categoryName: string | null;
  quantity: string | null;
};

function serializeProduct(row: Row) {
  const p = row.product;
  return {
    _id: p.id,
    id: p.id,
    tenantId: p.tenantId,
    code: p.code,
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    category: row.categoryName ? { _id: p.categoryId, name: row.categoryName } : null,
    price: fromMinor(Number(p.priceMinor)),
    cost: fromMinor(Number(p.costMinor)),
    stock: Number(row.quantity ?? 0),
    minStock: Number(p.minStock),
    unit: p.unit,
    taxId: p.taxId,
    isActive: p.isActive,
    status: p.isActive ? "active" : "inactive",
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

@Injectable()
export class CatalogService {
  /* ----------------------------- products ----------------------------- */

  async listProducts(ctx: Ctx, query: ProductListQuery): Promise<{ items: ReturnType<typeof serializeProduct>[]; pagination: Pagination }> {
    const db = getDb();
    const filters: SQL[] = [eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)];
    if (query.categoryId) filters.push(eq(products.categoryId, query.categoryId));
    if (query.category && !query.categoryId) {
      filters.push(sql`${products.categoryId} in (select id from categories where tenant_id = ${ctx.tenantId} and lower(name) = ${query.category.toLowerCase()})`);
    }
    if (query.status === "active" || query.status === "inactive") filters.push(eq(products.isActive, query.status === "active"));
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      const search = or(sql`lower(${products.name}) like ${term}`, sql`lower(${products.code}) like ${term}`);
      if (search) filters.push(search);
    }
    if (query.lowStock === "true") {
      filters.push(sql`coalesce(${stockLevels.quantity}, 0) <= ${products.minStock}`);
    }
    const where = and(...filters);

    const sortColumn = query.sortBy === "name" ? products.name : query.sortBy === "price" ? products.priceMinor : products.createdAt;
    const orderBy = query.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    const base = db
      .select({ product: products, categoryName: categories.name, quantity: stockLevels.quantity })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id));

    const [rows, [countRow]] = await Promise.all([
      base.where(where).orderBy(orderBy).limit(query.limit).offset(query.offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
        .where(where),
    ]);

    return {
      items: (rows as Row[]).map(serializeProduct),
      pagination: paginate(countRow?.count ?? 0, query.page, query.limit),
    };
  }

  async getProduct(ctx: Ctx, id: string) {
    const db = getDb();
    const [row] = await db
      .select({ product: products, categoryName: categories.name, quantity: stockLevels.quantity })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Produit introuvable");
    return serializeProduct(row as Row);
  }

  async createProduct(ctx: Ctx, input: CreateProductInput) {
    const db = getDb();
    await this.assertCodeFree(ctx.tenantId, input.code);
    if (input.categoryId) await this.assertCategory(ctx.tenantId, input.categoryId);
    if (input.taxId) await this.assertTax(ctx.tenantId, input.taxId);

    const id = newId();
    const initialStock = input.stock ?? 0;
    await db.transaction(async (tx) => {
      await tx.insert(products).values({
        id,
        tenantId: ctx.tenantId,
        code: input.code.trim(),
        name: input.name.trim(),
        description: input.description ?? null,
        categoryId: input.categoryId ?? null,
        priceMinor: toMinor(input.price),
        costMinor: toMinor(input.cost ?? 0),
        minStock: String(input.minStock ?? 0),
        unit: input.unit,
        taxId: input.taxId ?? null,
        isActive: input.isActive,
        createdBy: ctx.userId,
      });
      await tx.insert(stockLevels).values({ productId: id, tenantId: ctx.tenantId, quantity: String(initialStock) });
      if (initialStock > 0) {
        await tx.insert(stockMovements).values({
          id: newId(),
          tenantId: ctx.tenantId,
          productId: id,
          type: "in",
          quantity: String(initialStock),
          unitCostMinor: toMinor(input.cost ?? 0),
          reason: "Stock initial",
          createdBy: ctx.userId,
        });
      }
    });

    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "product.created", entity: "product", entityId: id, after: { code: input.code, name: input.name }, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.getProduct(ctx, id);
  }

  async updateProduct(ctx: Ctx, id: string, input: UpdateProductInput) {
    const db = getDb();
    const existing = await this.requireProduct(ctx, id);
    if (input.code && input.code.trim().toLowerCase() !== existing.code.toLowerCase()) {
      await this.assertCodeFree(ctx.tenantId, input.code.trim(), id);
    }
    if (input.categoryId) await this.assertCategory(ctx.tenantId, input.categoryId);
    if (input.taxId) await this.assertTax(ctx.tenantId, input.taxId);

    const patch: Partial<typeof products.$inferInsert> = { updatedAt: new Date() };
    if (input.code !== undefined) patch.code = input.code.trim();
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.categoryId !== undefined) patch.categoryId = input.categoryId ?? null;
    if (input.price !== undefined) patch.priceMinor = toMinor(input.price);
    if (input.cost !== undefined) patch.costMinor = toMinor(input.cost);
    if (input.minStock !== undefined) patch.minStock = String(input.minStock);
    if (input.unit !== undefined) patch.unit = input.unit;
    if (input.taxId !== undefined) patch.taxId = input.taxId ?? null;
    if (input.isActive !== undefined) patch.isActive = input.isActive;

    await db.update(products).set(patch).where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)));
    if (input.stock !== undefined) {
      await this.applyStock(ctx, id, { type: "adjustment", quantity: input.stock, reason: "Mise à jour manuelle" });
    }
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "product.updated", entity: "product", entityId: id, after: input, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.getProduct(ctx, id);
  }

  async setProductStatus(ctx: Ctx, id: string, isActive: boolean) {
    const db = getDb();
    await this.requireProduct(ctx, id);
    await db.update(products).set({ isActive, updatedAt: new Date() }).where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)));
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "product.status_changed", entity: "product", entityId: id, after: { isActive }, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.getProduct(ctx, id);
  }

  async removeProduct(ctx: Ctx, id: string) {
    const db = getDb();
    const existing = await this.requireProduct(ctx, id);
    await db
      .update(products)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)));
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "product.deleted", entity: "product", entityId: id, before: { code: existing.code, name: existing.name }, ip: ctx.ip, userAgent: ctx.userAgent });
    return { success: true };
  }

  async moveStock(ctx: Ctx, id: string, input: StockMovementInput) {
    await this.requireProduct(ctx, id);
    await this.applyStock(ctx, id, input);
    return this.getProduct(ctx, id);
  }

  async stockHistory(ctx: Ctx, id: string) {
    await this.requireProduct(ctx, id);
    const db = getDb();
    const rows = await db
      .select()
      .from(stockMovements)
      .where(and(eq(stockMovements.tenantId, ctx.tenantId), eq(stockMovements.productId, id)))
      .orderBy(desc(stockMovements.createdAt))
      .limit(200);
    return rows.map((row) => ({
      _id: row.id,
      id: row.id,
      type: row.type,
      quantity: Number(row.quantity),
      unitCost: fromMinor(Number(row.unitCostMinor)),
      reason: row.reason,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async productStats(ctx: Ctx) {
    const db = getDb();
    const [row] = await db
      .select({
        totalProducts: sql<number>`count(*)::int`,
        totalStockValue: sql<number>`coalesce(sum(coalesce(${stockLevels.quantity}, 0) * ${products.priceMinor}), 0)::bigint`,
        lowStockCount: sql<number>`coalesce(sum(case when coalesce(${stockLevels.quantity}, 0) <= ${products.minStock} then 1 else 0 end), 0)::int`,
        outOfStockCount: sql<number>`coalesce(sum(case when coalesce(${stockLevels.quantity}, 0) <= 0 then 1 else 0 end), 0)::int`,
      })
      .from(products)
      .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)));

    return {
      summary: {
        totalProducts: Number(row?.totalProducts ?? 0),
        totalStockValue: fromMinor(Number(row?.totalStockValue ?? 0)),
        lowStockCount: Number(row?.lowStockCount ?? 0),
        outOfStockCount: Number(row?.outOfStockCount ?? 0),
      },
    };
  }

  /* ---------------------------- categories ---------------------------- */

  async listCategories(ctx: Ctx, type?: string) {
    const db = getDb();
    const filters: SQL[] = [eq(categories.tenantId, ctx.tenantId), isNull(categories.deletedAt)];
    if (type) filters.push(eq(categories.type, type));
    const rows = await db.select().from(categories).where(and(...filters)).orderBy(asc(categories.name));
    return rows.map((row) => this.serializeCategory(row));
  }

  async getCategory(ctx: Ctx, id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.tenantId, ctx.tenantId), isNull(categories.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Catégorie introuvable");
    return this.serializeCategory(row);
  }

  async createCategory(ctx: Ctx, input: CreateCategoryInput) {
    const db = getDb();
    await this.assertCategoryName(ctx.tenantId, input.name, input.type);
    const id = newId();
    await db.insert(categories).values({
      id,
      tenantId: ctx.tenantId,
      name: input.name.trim(),
      description: input.description ?? null,
      type: input.type,
      color: input.color ?? "#0891b2",
      icon: input.icon ?? "tag",
      parentId: input.parentId ?? null,
      isActive: input.isActive,
    });
    await audit({ tenantId: ctx.tenantId, actorId: ctx.userId, action: "category.created", entity: "category", entityId: id, after: input, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.getCategory(ctx, id);
  }

  async updateCategory(ctx: Ctx, id: string, input: UpdateCategoryInput) {
    const db = getDb();
    const existing = await this.getCategory(ctx, id);
    if (input.name && input.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      await this.assertCategoryName(ctx.tenantId, input.name, input.type ?? existing.type);
    }
    const patch: Partial<typeof categories.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.type !== undefined) patch.type = input.type;
    if (input.color !== undefined) patch.color = input.color;
    if (input.icon !== undefined) patch.icon = input.icon;
    if (input.parentId !== undefined) patch.parentId = input.parentId ?? null;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    await db.update(categories).set(patch).where(and(eq(categories.id, id), eq(categories.tenantId, ctx.tenantId)));
    return this.getCategory(ctx, id);
  }

  async removeCategory(ctx: Ctx, id: string) {
    const db = getDb();
    await this.getCategory(ctx, id);
    const [used] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.tenantId, ctx.tenantId), eq(products.categoryId, id), isNull(products.deletedAt)))
      .limit(1);
    if (used) throw AppError.unprocessable("CATEGORY_IN_USE", "Cette catégorie contient encore des produits.");
    await db.update(categories).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(categories.id, id), eq(categories.tenantId, ctx.tenantId)));
    return { success: true };
  }

  /* ------------------------------- taxes ------------------------------ */

  async listTaxes(ctx: Ctx) {
    const db = getDb();
    const rows = await db.select().from(taxes).where(eq(taxes.tenantId, ctx.tenantId)).orderBy(asc(taxes.name));
    return rows.map((row) => ({
      _id: row.id,
      id: row.id,
      name: row.name,
      rate: Number(row.rateBp) / 100,
      rateBp: Number(row.rateBp),
      isActive: row.isActive,
    }));
  }

  async createTax(ctx: Ctx, input: CreateTaxInput) {
    const db = getDb();
    const rateBp = input.rateBp ?? Math.round((input.rate ?? 0) * 100);
    const id = newId();
    await db.insert(taxes).values({ id, tenantId: ctx.tenantId, name: input.name.trim(), rateBp, isActive: input.isActive });
    return { _id: id, id, name: input.name.trim(), rate: rateBp / 100, rateBp, isActive: input.isActive };
  }

  async updateTax(ctx: Ctx, id: string, input: UpdateTaxInput) {
    const db = getDb();
    const [existing] = await db.select().from(taxes).where(and(eq(taxes.id, id), eq(taxes.tenantId, ctx.tenantId))).limit(1);
    if (!existing) throw AppError.notFound("Taxe introuvable");
    const patch: Partial<typeof taxes.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.rateBp !== undefined) patch.rateBp = input.rateBp;
    else if (input.rate !== undefined) patch.rateBp = Math.round(input.rate * 100);
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    await db.update(taxes).set(patch).where(and(eq(taxes.id, id), eq(taxes.tenantId, ctx.tenantId)));
    return { success: true };
  }

  async removeTax(ctx: Ctx, id: string) {
    const db = getDb();
    await db.delete(taxes).where(and(eq(taxes.id, id), eq(taxes.tenantId, ctx.tenantId)));
    return { success: true };
  }

  /* ------------------------------ helpers ----------------------------- */

  private serializeCategory(row: typeof categories.$inferSelect) {
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      parentId: row.parentId,
      color: row.color,
      icon: row.icon,
      isActive: row.isActive,
    };
  }

  private async applyStock(ctx: Ctx, productId: string, input: StockMovementInput) {
    const db = getDb();
    await db.transaction(async (tx) => {
      const [level] = await tx.select().from(stockLevels).where(eq(stockLevels.productId, productId)).limit(1);
      const current = Number(level?.quantity ?? 0);
      const next = input.type === "adjustment" ? input.quantity : input.type === "in" ? current + input.quantity : current - input.quantity;
      if (next < 0) throw AppError.unprocessable("INSUFFICIENT_STOCK", "Stock insuffisant pour cette opération.", { current });
      if (level) {
        await tx.update(stockLevels).set({ quantity: String(next), updatedAt: new Date() }).where(eq(stockLevels.productId, productId));
      } else {
        await tx.insert(stockLevels).values({ productId, tenantId: ctx.tenantId, quantity: String(next) });
      }
      await tx.insert(stockMovements).values({
        id: newId(),
        tenantId: ctx.tenantId,
        productId,
        type: input.type,
        quantity: String(input.quantity),
        unitCostMinor: toMinor(input.unitCost ?? 0),
        reason: input.reason ?? null,
        createdBy: ctx.userId,
      });
    });
  }

  private async requireProduct(ctx: Ctx, id: string): Promise<typeof products.$inferSelect> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)))
      .limit(1);
    if (!row) throw AppError.notFound("Produit introuvable");
    return row;
  }

  private async assertCodeFree(tenantId: string, code: string, exceptId?: string) {
    const db = getDb();
    const filters: SQL[] = [eq(products.tenantId, tenantId), sql`lower(${products.code}) = ${code.toLowerCase()}`, isNull(products.deletedAt)];
    if (exceptId) filters.push(sql`${products.id} <> ${exceptId}`);
    const [row] = await db.select({ id: products.id }).from(products).where(and(...filters)).limit(1);
    if (row) throw AppError.conflict("PRODUCT_CODE_EXISTS", "Ce code produit est déjà utilisé");
  }

  private async assertCategory(tenantId: string, categoryId: string) {
    const db = getDb();
    const [row] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.tenantId, tenantId), isNull(categories.deletedAt)))
      .limit(1);
    if (!row) throw AppError.badRequest("Catégorie invalide");
  }

  private async assertTax(tenantId: string, taxId: string) {
    const db = getDb();
    const [row] = await db.select({ id: taxes.id }).from(taxes).where(and(eq(taxes.id, taxId), eq(taxes.tenantId, tenantId))).limit(1);
    if (!row) throw AppError.badRequest("Taxe invalide");
  }

  private async assertCategoryName(tenantId: string, name: string, type: string) {
    const db = getDb();
    const [row] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.tenantId, tenantId), eq(categories.type, type), sql`lower(${categories.name}) = ${name.trim().toLowerCase()}`, isNull(categories.deletedAt)))
      .limit(1);
    if (row) throw AppError.conflict("CATEGORY_EXISTS", "Une catégorie porte déjà ce nom");
  }
}
