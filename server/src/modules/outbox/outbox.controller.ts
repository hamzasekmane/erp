import { Controller, Get, Post, Query } from "@nestjs/common";
import { ok } from "../../shared/http";
import { RequirePermissions } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { OutboxService } from "./outbox.service";

@Controller("admin/outbox")
@RequirePermissions(PERMISSIONS.tenantsWrite)
export class OutboxController {
  constructor(private readonly outbox: OutboxService) {}

  @Get("stats")
  async stats() {
    return ok(await this.outbox.stats());
  }

  @Post("process")
  async process(@Query("limit") limit?: string) {
    const parsed = Math.min(200, Math.max(1, Number(limit) || 20));
    return ok(await this.outbox.processPending(parsed));
  }
}
