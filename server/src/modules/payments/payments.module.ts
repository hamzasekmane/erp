import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { ChargilyController } from "./chargily/chargily.controller";
import { ChargilyService } from "./chargily/chargily.service";

@Module({
  controllers: [PaymentsController, ChargilyController],
  providers: [PaymentsService, ChargilyService],
  exports: [PaymentsService, ChargilyService],
})
export class PaymentsModule {}
