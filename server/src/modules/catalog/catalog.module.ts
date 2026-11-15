import { Module } from "@nestjs/common";
import { CategoriesController, ProductsController, TaxesController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { StockValuationService } from "./stock-valuation.service";

@Module({
  controllers: [ProductsController, CategoriesController, TaxesController],
  providers: [CatalogService, StockValuationService],
  exports: [CatalogService, StockValuationService],
})
export class CatalogModule {}
