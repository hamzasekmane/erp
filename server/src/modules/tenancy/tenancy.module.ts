import { Module } from "@nestjs/common";
import { PlansController, SubscriptionsController, TenancyController } from "./tenancy.controller";
import { SubscriptionsService, TenancyService } from "./tenancy.service";

@Module({
  controllers: [TenancyController, PlansController, SubscriptionsController],
  providers: [TenancyService, SubscriptionsService],
  exports: [TenancyService, SubscriptionsService],
})
export class TenancyModule {}
