import { Module } from "@nestjs/common";
import { CategoriesController, ProductsController, TaxesController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

@Module({
  controllers: [ProductsController, CategoriesController, TaxesController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
