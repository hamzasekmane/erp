import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import type { Response } from "express";
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

  /**
   * Readiness: dependencies usable and no operational backlog.
   *
   * The HTTP STATUS carries the verdict (503 when not ready) because that is
   * what container orchestrators and load balancers read. Returning 200 with
   * `success: false` in the body silently kept a broken instance in rotation.
   */
  @Public()
  @Get("ready")
  async ready(@Res({ passthrough: true }) res: Response) {
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
    res.status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      success: ready,
      data: { status: ready ? "ready" : "not_ready", checks, pendingOutbox, uptime: Math.round(process.uptime()) },
    };
  }

  @Public()
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    let database = "ok";
    try {
      await getDb().execute(sql`select 1`);
    } catch {
      database = "down";
    }
    const healthy = database === "ok";
    res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      success: healthy,
      data: { status: healthy ? "ok" : "degraded", database, uptime: Math.round(process.uptime()) },
    };
  }
}
