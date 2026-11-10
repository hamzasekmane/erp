import { Controller, Get } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { Public } from "../../shared/security/decorators";

@Controller("health")
export class HealthController {
  /** Liveness: the process is up. Never touches the database. */
  @Public()
  @Get("live")
  live() {
    return { success: true, data: { status: "ok", uptime: Math.round(process.uptime()) } };
  }

  /** Readiness: dependencies usable and no operational backlog. */
  @Public()
  @Get("ready")
  async ready() {
    const checks: Record<string, string> = {};
    try {
      await getDb().execute(sql`select 1`);
      checks.database = "ok";
    } catch {
      checks.database = "down";
    }

    let pendingOutbox = 0;
    try {
      const rows = (await getDb().execute(
        sql`select count(*)::int as count from outbox_events where status = 'pending' and available_at < now() - interval '15 minutes'`,
      )) as unknown as { rows?: Array<{ count: number }> };
      pendingOutbox = Number(rows.rows?.[0]?.count ?? 0);
      checks.outbox = pendingOutbox > 100 ? "lagging" : "ok";
    } catch {
      checks.outbox = "unknown";
    }

    const ready = checks.database === "ok" && checks.outbox !== "lagging";
    return {
      success: ready,
      data: { status: ready ? "ready" : "not_ready", checks, pendingOutbox, uptime: Math.round(process.uptime()) },
    };
  }

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
