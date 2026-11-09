import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import {
  createCategorySchema,
  createProductSchema,
  createTaxSchema,
  stockMovementSchema,
  updateCategorySchema,
  updateProductSchema,
  updateProductStatusSchema,
  updateTaxSchema,
  type CreateCategoryInput,
  type CreateProductInput,
  type CreateTaxInput,
  type StockMovementInput,
  type UpdateCategoryInput,
  type UpdateProductInput,
  type UpdateTaxInput,
} from "./catalog.dto";
import { CatalogService } from "./catalog.service";

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("products")
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.catalogRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.catalog.listProducts(ctx(auth, req), {
      ...parsePagination(query, 20, 200),
      search: typeof query.search === "string" ? query.search : undefined,
      category: typeof query.category === "string" ? query.category : undefined,
      categoryId: typeof query.categoryId === "string" ? query.categoryId : undefined,
      status: typeof query.status === "string" ? query.status : undefined,
      lowStock: typeof query.lowStock === "string" ? query.lowStock : undefined,
      sortBy: typeof query.sortBy === "string" ? query.sortBy : undefined,
      sortOrder: typeof query.sortOrder === "string" ? query.sortOrder : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Get("stats")
  @RequirePermissions(PERMISSIONS.catalogRead)
  async stats(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.catalog.productStats(ctx(auth, req)));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async create(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductInput) {
    return ok(await this.catalog.createProduct(ctx(auth, req), body), "Produit créé");
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.catalogRead)
  async get(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.catalog.getProduct(ctx(auth, req), id));
  }

  @Get(":id/movements")
  @RequirePermissions(PERMISSIONS.catalogRead)
  async movements(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.catalog.stockHistory(ctx(auth, req), id));
  }

  @Post(":id/stock")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async moveStock(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(stockMovementSchema)) body: StockMovementInput,
  ) {
    return ok(await this.catalog.moveStock(ctx(auth, req), id, body));
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async update(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductInput,
  ) {
    return ok(await this.catalog.updateProduct(ctx(auth, req), id, body), "Produit mis à jour");
  }

  @Patch(":id/status")
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async status(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateProductStatusSchema)) body: { isActive: boolean },
  ) {
    return ok(await this.catalog.setProductStatus(ctx(auth, req), id, body.isActive));
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.catalog.removeProduct(ctx(auth, req), id), "Produit supprimé");
  }
}

@Controller("categories")
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.catalogRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("type") type?: string) {
    return ok(await this.catalog.listCategories(ctx(auth, req), type));
  }

  @Get("type/:type")
  @RequirePermissions(PERMISSIONS.catalogRead)
  async byType(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("type") type: string) {
    return ok(await this.catalog.listCategories(ctx(auth, req), type));
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.catalogRead)
  async get(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.catalog.getCategory(ctx(auth, req), id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async create(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategoryInput) {
    return ok(await this.catalog.createCategory(ctx(auth, req), body), "Catégorie créée");
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async update(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) body: UpdateCategoryInput,
  ) {
    return ok(await this.catalog.updateCategory(ctx(auth, req), id, body), "Catégorie mise à jour");
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.catalog.removeCategory(ctx(auth, req), id), "Catégorie supprimée");
  }
}

@Controller("taxes")
export class TaxesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.catalogRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.catalog.listTaxes(ctx(auth, req)));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async create(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(createTaxSchema)) body: CreateTaxInput) {
    return ok(await this.catalog.createTax(ctx(auth, req), body), "Taxe créée");
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async update(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTaxSchema)) body: UpdateTaxInput,
  ) {
    return ok(await this.catalog.updateTax(ctx(auth, req), id, body), "Taxe mise à jour");
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.catalogWrite)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.catalog.removeTax(ctx(auth, req), id), "Taxe supprimée");
  }
}
