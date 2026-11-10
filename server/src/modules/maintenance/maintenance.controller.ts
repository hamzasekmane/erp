import { Controller, Get, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { env } from "../../config/env";
import { ok } from "../../shared/http";
import { Public, RequirePermissions } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { MaintenanceService } from "./maintenance.service";

@Controller()
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post("admin/maintenance/run")
  @RequirePermissions(PERMISSIONS.tenantsWrite)
  async run() {
    return ok(await this.maintenance.runAll());
  }

  @Get("admin/maintenance/status")
  @RequirePermissions(PERMISSIONS.tenantsRead)
  async status() {
    return ok({ lastRun: this.maintenance.lastRun() });
  }

  /** Cron/webhook entry point for deployments without a long-lived worker. */
  @Post("internal/maintenance/run")
  @Public()
  async runFromCron(@Headers("x-maintenance-token") token?: string) {
    if (!env.MAINTENANCE_TOKEN || token !== env.MAINTENANCE_TOKEN) throw new UnauthorizedException("Invalid maintenance token");
    return ok(await this.maintenance.runAll());
  }
}
