import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ok } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("sales")
  @RequirePermissions(PERMISSIONS.reportsRead)
  async sales(
    @CurrentAuth() auth: AuthContext,
    @Query() query: { period?: string; startDate?: string; endDate?: string; groupBy?: string },
  ) {
    return ok(await this.reports.sales({ tenantId: auth.tenantId }, query));
  }

  @Get("payments")
  @RequirePermissions(PERMISSIONS.reportsRead)
  async payments(@CurrentAuth() auth: AuthContext, @Query() query: { startDate?: string; endDate?: string }) {
    return ok(await this.reports.paymentsReport({ tenantId: auth.tenantId }, query));
  }

  @Get("clients")
  @RequirePermissions(PERMISSIONS.reportsRead)
  async clients(@CurrentAuth() auth: AuthContext) {
    return ok(await this.reports.clientsReport({ tenantId: auth.tenantId }));
  }

  @Get("products")
  @RequirePermissions(PERMISSIONS.reportsRead)
  async products(@CurrentAuth() auth: AuthContext) {
    return ok(await this.reports.productsReport({ tenantId: auth.tenantId }));
  }

  @Get("aging")
  @RequirePermissions(PERMISSIONS.reportsRead)
  async aging(@CurrentAuth() auth: AuthContext) {
    return ok(await this.reports.agingReport({ tenantId: auth.tenantId }));
  }

  @Get("traffic-sources")
  @RequirePermissions(PERMISSIONS.reportsRead)
  async traffic(@CurrentAuth() auth: AuthContext) {
    return ok(this.reports.trafficSources({ tenantId: auth.tenantId }));
  }

  @Get("export")
  @RequirePermissions(PERMISSIONS.reportsRead)
  async export(
    @CurrentAuth() auth: AuthContext,
    @Req() _req: Request,
    @Res() res: Response,
    @Query("type") type = "sales",
    @Query("format") format = "csv",
  ) {
    if (format !== "csv") {
      res.status(400).json({ success: false, error_code: "UNSUPPORTED_FORMAT", message: "Format non supporté" });
      return;
    }
    const file = await this.reports.exportCsv({ tenantId: auth.tenantId }, type);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.send(file.csv);
  }
}
