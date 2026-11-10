import { Injectable, Logger } from "@nestjs/common";
import { and, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { invoiceStatusHistory, invoices, passwordResetTokens, sessions, subscriptions } from "../../db/schema";
import { audit } from "../../shared/audit";
import { newId } from "../../shared/ids";

export interface MaintenanceReport {
  startedAt: string;
  durationMs: number;
  invoicesMarkedOverdue: number;
  subscriptionsExpired: number;
  sessionsPurged: number;
  resetTokensPurged: number;
}

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);
  private lastReport: MaintenanceReport | null = null;

  lastRun() {
    return this.lastReport;
  }

  async runAll(): Promise<MaintenanceReport> {
    const startedAt = new Date();
    const [invoicesMarkedOverdue, subscriptionsExpired, sessionsPurged, resetTokensPurged] = [
      await this.markOverdueInvoices(),
      await this.expireSubscriptions(),
      await this.purgeStaleSessions(),
      await this.purgeResetTokens(),
    ];
    const report: MaintenanceReport = {
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      invoicesMarkedOverdue,
      subscriptionsExpired,
      sessionsPurged,
      resetTokensPurged,
    };
    this.lastReport = report;
    if (invoicesMarkedOverdue + subscriptionsExpired + sessionsPurged + resetTokensPurged > 0) {
      this.logger.log(
        `Maintenance: ${invoicesMarkedOverdue} overdue, ${subscriptionsExpired} subscriptions expired, ${sessionsPurged} sessions purged, ${resetTokensPurged} reset tokens purged`,
      );
    }
    return report;
  }

  /** sent/partially_paid invoices whose due date has passed become `overdue`. */
  async markOverdueInvoices(): Promise<number> {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db
      .select({ id: invoices.id, tenantId: invoices.tenantId, status: invoices.status })
      .from(invoices)
      .where(
        and(
          inArray(invoices.status, ["sent", "partially_paid"]),
          lt(invoices.dueDate, today),
          isNull(invoices.deletedAt),
        ),
      )
      .limit(1000);
    if (rows.length === 0) return 0;

    await db
      .update(invoices)
      .set({ status: "overdue", updatedAt: new Date() })
      .where(
        and(
          inArray(
            invoices.id,
            rows.map((row) => row.id),
          ),
          inArray(invoices.status, ["sent", "partially_paid"]),
        ),
      );

    await db.insert(invoiceStatusHistory).values(
      rows.map((row) => ({
        id: newId(),
        invoiceId: row.id,
        fromStatus: row.status,
        toStatus: "overdue",
        actorId: null,
        reason: "Échéance dépassée (tâche planifiée)",
      })),
    );

    await audit({
      tenantId: null,
      actorId: null,
      action: "invoice.overdue_marked",
      entity: "invoice",
      after: { count: rows.length },
    });
    return rows.length;
  }

  async expireSubscriptions(): Promise<number> {
    const db = getDb();
    const now = new Date();
    const expired = await db
      .update(subscriptions)
      .set({ status: "expired", updatedAt: now })
      .where(
        or(
          and(eq(subscriptions.status, "trial"), lt(subscriptions.trialEnd, now)),
          and(eq(subscriptions.status, "active"), eq(subscriptions.autoRenew, false), lt(subscriptions.endDate, now)),
        ),
      )
      .returning({ id: subscriptions.id, tenantId: subscriptions.tenantId });
    return expired.length;
  }

  async purgeStaleSessions(): Promise<number> {
    const db = getDb();
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deleted = await db.delete(sessions).where(lt(sessions.expiresAt, cutoff)).returning({ id: sessions.id });
    return deleted.length;
  }

  async purgeResetTokens(): Promise<number> {
    const db = getDb();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deleted = await db
      .delete(passwordResetTokens)
      .where(or(lt(passwordResetTokens.expiresAt, cutoff), sql`${passwordResetTokens.usedAt} is not null`))
      .returning({ id: passwordResetTokens.id });
    return deleted.length;
  }
}
