import { Injectable, Logger } from "@nestjs/common";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { outboxEvents } from "../../db/schema";
import { env } from "../../config/env";
import { MailService } from "../../shared/mail/mail.service";

interface OutboxRow {
  id: string;
  tenantId: string | null;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
}

export interface OutboxRunResult {
  claimed: number;
  processed: number;
  failed: number;
  errors: Array<{ id: string; type: string; message: string }>;
}

const BACKOFF_MS = [30_000, 2 * 60_000, 10 * 60_000, 60 * 60_000];

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly mail: MailService) {}

  /** Claims and handles a batch of due events. Safe to call concurrently. */
  async processPending(limit = 20): Promise<OutboxRunResult> {
    const db = getDb();
    const result: OutboxRunResult = { claimed: 0, processed: 0, failed: 0, errors: [] };

    // Recover events stuck in "processing" (crashed worker) after 10 minutes.
    await db
      .update(outboxEvents)
      .set({ status: "pending" })
      .where(and(eq(outboxEvents.status, "processing"), lte(outboxEvents.availableAt, new Date(Date.now() - 10 * 60_000))));

    const due = await db
      .select({ id: outboxEvents.id })
      .from(outboxEvents)
      .where(and(eq(outboxEvents.status, "pending"), lte(outboxEvents.availableAt, new Date())))
      .orderBy(asc(outboxEvents.availableAt))
      .limit(limit);

    for (const { id } of due) {
      const claimed = await db
        .update(outboxEvents)
        .set({ status: "processing", availableAt: new Date(Date.now() + 10 * 60_000) })
        .where(and(eq(outboxEvents.id, id), eq(outboxEvents.status, "pending")))
        .returning({ id: outboxEvents.id, tenantId: outboxEvents.tenantId, type: outboxEvents.type, payload: outboxEvents.payload, attempts: outboxEvents.attempts });
      const row = claimed[0] as OutboxRow | undefined;
      if (!row) continue;
      result.claimed += 1;

      try {
        await this.handle(row);
        await db.update(outboxEvents).set({ status: "processed", processedAt: new Date(), lastError: null }).where(eq(outboxEvents.id, row.id));
        result.processed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const attempts = row.attempts + 1;
        const exhausted = attempts >= env.OUTBOX_MAX_ATTEMPTS;
        await db
          .update(outboxEvents)
          .set({
            status: exhausted ? "failed" : "pending",
            attempts,
            lastError: message.slice(0, 500),
            availableAt: new Date(Date.now() + (BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)] ?? 60_000)),
            processedAt: exhausted ? new Date() : null,
          })
          .where(eq(outboxEvents.id, row.id));
        result.failed += 1;
        result.errors.push({ id: row.id, type: row.type, message });
        this.logger.warn(`Outbox ${row.type} (${row.id}) failed: ${message}`);
      }
    }

    return result;
  }

  async stats() {
    const db = getDb();
    const rows = await db
      .select({ status: outboxEvents.status, count: sql<number>`count(*)::int` })
      .from(outboxEvents)
      .groupBy(outboxEvents.status);
    const byStatus: Record<string, number> = { pending: 0, processing: 0, processed: 0, failed: 0 };
    for (const row of rows) byStatus[row.status] = Number(row.count);
    const [oldest] = await db
      .select({ createdAt: outboxEvents.createdAt })
      .from(outboxEvents)
      .where(eq(outboxEvents.status, "pending"))
      .orderBy(asc(outboxEvents.createdAt))
      .limit(1);
    return { byStatus, pendingSince: oldest?.createdAt ?? null };
  }

  private async handle(event: OutboxRow) {
    const payload = event.payload ?? {};
    switch (event.type) {
      case "invoice.send":
        return this.sendInvoice(payload);
      case "password.reset":
        return this.sendPasswordReset(payload);
      case "user.invite":
        return this.sendInvite(payload);
      case "email.generic":
        return this.sendGeneric(payload);
      default:
        throw new Error(`Unsupported outbox event type: ${event.type}`);
    }
  }

  private async sendInvoice(payload: Record<string, unknown>) {
    if (payload.sendEmail === false) return;
    const to = typeof payload.to === "string" ? payload.to : "";
    if (!to) throw new Error("missing_recipient");
    const number = typeof payload.invoiceNumber === "string" ? payload.invoiceNumber : "facture";
    const invoiceId = String(payload.invoiceId ?? "");
    const link = `${env.APP_URL}/dashboard/invoices/${invoiceId}`;
    const message = typeof payload.message === "string" && payload.message ? `${payload.message}\n\n` : "";
    await this.mail.send({
      to,
      subject: `Facture ${number}`,
      text: `${message}Veuillez trouver votre facture ${number} : ${link}\n\nMerci de votre confiance.`,
      html: `<p>${escapeHtml(message).replace(/\n/g, "<br />")}Votre facture <strong>${escapeHtml(number)}</strong> est disponible : <a href="${link}">${link}</a></p>`,
    });
  }

  private async sendPasswordReset(payload: Record<string, unknown>) {
    const to = typeof payload.to === "string" ? payload.to : "";
    const token = typeof payload.token === "string" ? payload.token : "";
    if (!to) throw new Error("missing_recipient");
    if (!token) throw new Error("missing_token");
    const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mail.send({
      to,
      subject: "Réinitialisation de votre mot de passe",
      text: `Pour choisir un nouveau mot de passe, ouvrez ce lien (valide 30 minutes) : ${link}`,
      html: `<p>Pour choisir un nouveau mot de passe, ouvrez ce lien (valide 30 minutes) :</p><p><a href="${link}">${link}</a></p>`,
    });
  }

  private async sendInvite(payload: Record<string, unknown>) {
    const to = typeof payload.to === "string" ? payload.to : "";
    if (!to) throw new Error("missing_recipient");
    const tenant = typeof payload.tenantName === "string" ? payload.tenantName : "votre espace";
    const link = `${env.APP_URL}/login`;
    await this.mail.send({
      to,
      subject: `Invitation à rejoindre ${tenant}`,
      text: `Un compte vient d'être créé pour vous sur ${tenant}. Connectez-vous : ${link}`,
      html: `<p>Un compte vient d'être créé pour vous sur <strong>${escapeHtml(tenant)}</strong>.</p><p><a href="${link}">Se connecter</a></p>`,
    });
  }

  private async sendGeneric(payload: Record<string, unknown>) {
    const to = typeof payload.to === "string" ? payload.to : "";
    if (!to) throw new Error("missing_recipient");
    await this.mail.send({
      to,
      subject: String(payload.subject ?? "Notification"),
      text: String(payload.text ?? ""),
      html: typeof payload.html === "string" ? payload.html : undefined,
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
