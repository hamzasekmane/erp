import { Controller, Get } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { Public } from "../../shared/security/decorators";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  async check() {
    let database = "ok";
    try {
      await getDb().execute(sql`select 1`);
    } catch {
      database = "down";
    }
    return { success: true, data: { status: database === "ok" ? "ok" : "degraded", database, uptime: Math.round(process.uptime()) } };
  }
}
