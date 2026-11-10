import { Controller, Get, Req } from "@nestjs/common";
import type { Request } from "express";
import { ok } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("stats")
  @RequirePermissions(PERMISSIONS.dashboardRead)
  async stats(@CurrentAuth() auth: AuthContext, @Req() _req: Request) {
    return ok(await this.dashboard.stats({ tenantId: auth.tenantId }));
  }

  @Get("quick-stats")
  @RequirePermissions(PERMISSIONS.dashboardRead)
  async quickStats(@CurrentAuth() auth: AuthContext) {
    return ok(await this.dashboard.quickStats({ tenantId: auth.tenantId }));
  }
}
