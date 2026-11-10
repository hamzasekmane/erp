import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from "@nestjs/common";
import { env } from "../../config/env";
import { MaintenanceService } from "./maintenance.service";

/** Runs the housekeeping batch a few times a day. Disabled in tests via MAINTENANCE_DISABLED. */
@Injectable()
export class MaintenanceWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MaintenanceWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly maintenance: MaintenanceService) {}

  onApplicationBootstrap() {
    if (env.MAINTENANCE_DISABLED || env.MAINTENANCE_INTERVAL_MS === 0) {
      this.logger.log("Maintenance worker disabled");
      return;
    }
    this.timer = setInterval(() => void this.tick(), env.MAINTENANCE_INTERVAL_MS);
    this.timer.unref();
    this.logger.log(`Maintenance worker started (every ${env.MAINTENANCE_INTERVAL_MS} ms)`);
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    try {
      await this.maintenance.runAll();
    } catch (error) {
      this.logger.error(`Maintenance run failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
