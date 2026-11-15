import { Module } from "@nestjs/common";
import { LedgerModule } from "../ledger/ledger.module";
import { PaymentsModule } from "../payments/payments.module";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";

@Module({
  imports: [PaymentsModule, LedgerModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
