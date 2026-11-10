import { Module } from "@nestjs/common";
import { MaintenanceController } from "./maintenance.controller";
import { MaintenanceService } from "./maintenance.service";
import { MaintenanceWorker } from "./maintenance.worker";

@Module({
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceWorker],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
