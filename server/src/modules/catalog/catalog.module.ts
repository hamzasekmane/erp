import { Module } from "@nestjs/common";
import { CategoriesController, ProductsController, TaxesController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { StockValuationService } from "./stock-valuation.service";
import { BomService } from "./bom.service";

@Module({
  controllers: [ProductsController, CategoriesController, TaxesController],
  providers: [CatalogService, StockValuationService, BomService],
  exports: [CatalogService, StockValuationService, BomService],
})
export class CatalogModule {}
