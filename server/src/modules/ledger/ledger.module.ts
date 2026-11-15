import { Module } from "@nestjs/common";
import { LedgerService } from "./ledger.service";
import { LedgerSetupService } from "./ledger-setup.service";

@Module({
  providers: [LedgerService, LedgerSetupService],
  exports: [LedgerService, LedgerSetupService],
})
export class LedgerModule {}
