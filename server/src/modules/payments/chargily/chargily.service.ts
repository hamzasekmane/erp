import { Injectable, Logger } from "@nestjs/common";
import { and, desc, eq, isNull } from "drizzle-orm";
import { env } from "../../../config/env";
import { getDb } from "../../../db/client";
import { clients, gatewayCheckouts, invoices, paymentGatewaySecrets, paymentGateways } from "../../../db/schema";
import { audit } from "../../../shared/audit";
import { AppError } from "../../../shared/errors";
import { newId } from "../../../shared/ids";
import { fromMinor } from "../../../shared/money";
import { decryptSecret, secretsConfigured } from "../../../shared/security/secrets";
import { PaymentsService } from "../payments.service";
import {
  ChargilyError,
  createCheckout,
  getCheckout,
  verifySignature,
  type ChargilyCheckout,
  type ChargilyMode,
} from "./chargily.client";
import type { CreateCheckoutRequest, ChargilyWebhookEvent } from "./chargily.schema";

type Ctx = { tenantId: string; userId?: string | null; ip?: string | null; userAgent?: string | null };

type Credentials = { secretKey: string; mode: ChargilyMode; source: "tenant" | "platform" };

/**
 * Chargily only accepts whole dinars (no centimes). We round the invoice balance
 * **up** so a full-balance checkout can always clear the invoice; the tiny
 * rounding difference is capped when the payment is recorded at settlement.
 */
export function toProviderAmount(amountMinor: number): number {
  return Math.ceil(amountMinor / 100);
}

export function fromProviderAmount(amount: number | undefined): number {
  return Math.round(Number(amount ?? 0) * 100);
}

const STATUS_MAP: Record<string, string> = {
  "checkout.paid": "paid",
  "checkout.failed": "failed",
  "checkout.canceled": "canceled",
  "checkout.expired": "expired",
};

@Injectable()
export class ChargilyService {
  private readonly logger = new Logger("Chargily");

  constructor(private readonly payments: PaymentsService) {}

  /* ------------------------------ credentials ----------------------------- */

  async credentials(tenantId: string): Promise<Credentials> {
    const db = getDb();
    const [gateway] = await db
      .select()
      .from(paymentGateways)
      .where(and(eq(paymentGateways.tenantId, tenantId), eq(paymentGateways.code, "chargily")))
      .limit(1);

    if (gateway) {
      const [secret] = await db
        .select()
        .from(paymentGatewaySecrets)
        .where(and(eq(paymentGatewaySecrets.gatewayId, gateway.id), eq(paymentGatewaySecrets.key, "secret_key")))
        .limit(1);
      if (secret && secretsConfigured()) {
        const mode = (gateway.config?.mode === "live" ? "live" : "test") as ChargilyMode;
        return { secretKey: decryptSecret(secret.ciphertext), mode, source: "tenant" };
      }
      if (secret && !secretsConfigured()) {
        this.logger.warn("Gateway secret exists but SECRETS_ENCRYPTION_KEY is missing; falling back to platform key.");
      }
    }

    if (env.CHARGILY_SECRET_KEY) {
      return { secretKey: env.CHARGILY_SECRET_KEY, mode: env.CHARGILY_MODE, source: "platform" };
    }

    throw new AppError(
      "CHARGILY_NOT_CONFIGURED",
      "Aucune clé Chargily n'est configurée. Enregistrez la passerelle dans Paramètres > Paiements.",
      400,
    );
  }

  /* -------------------------------- checkout ------------------------------ */

  async createCheckout(ctx: Ctx, input: CreateCheckoutRequest) {
    const db = getDb();
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, input.invoiceId), eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt)))
      .limit(1);
    if (!invoice) throw AppError.notFound("Facture introuvable");
    if (invoice.status === "cancelled") throw AppError.unprocessable("INVOICE_CANCELLED", "Cette facture est annulée.");
    if (invoice.status === "draft") throw AppError.unprocessable("INVOICE_DRAFT", "Émettez la facture avant d'encaisser un paiement.");
    if (invoice.status === "paid") throw AppError.unprocessable("INVOICE_ALREADY_PAID", "Cette facture est déjà soldée.");

    const dueMinor = Number(invoice.dueMinor);
    const requestedMinor = input.amount ? Math.round(input.amount * 100) : dueMinor;
    if (requestedMinor <= 0) throw new AppError("INVALID_AMOUNT", "Le montant doit être supérieur à zéro.", 400);
    if (requestedMinor > dueMinor) {
      throw AppError.unprocessable("PAYMENT_EXCEEDS_DUE", "Le montant dépasse le solde restant dû.", {
        due: fromMinor(dueMinor),
        maxPayable: fromMinor(dueMinor),
      });
    }

    // Chargily is charged in whole dinars: store the exact provider amount so the
    // webhook can be matched against it without rounding drift.
    const providerAmount = toProviderAmount(requestedMinor);
    const amountMinor = providerAmount * 100;

    const { secretKey, mode } = await this.credentials(ctx.tenantId);
    const publicUrl = (env.APP_PUBLIC_URL || env.APP_URL).replace(/\/$/, "");
    const successUrl = `${publicUrl}/dashboard/invoices/${invoice.id}?payment=success&checkout={CHECKOUT_ID}`;
    const failureUrl = `${publicUrl}/dashboard/invoices/${invoice.id}?payment=failed`;

    let checkout: ChargilyCheckout;
    try {
      checkout = await createCheckout(secretKey, mode, {
        amount: providerAmount,
        currency: "dzd",
        payment_method: input.method,
        success_url: successUrl.replace("{CHECKOUT_ID}", "success"),
        failure_url: failureUrl,
        description: `Facture ${invoice.number}`,
        locale: input.locale ?? "fr",
        metadata: { invoice_id: invoice.id, tenant_id: ctx.tenantId },
        ...(env.CHARGILY_WEBHOOK_URL ? { webhook_endpoint: env.CHARGILY_WEBHOOK_URL } : {}),
      });
    } catch (error) {
      this.logger.error(`Checkout creation failed: ${error instanceof Error ? error.message : error}`);
      throw new AppError(
        "PAYMENT_PROVIDER_ERROR",
        "La passerelle de paiement a refusé la demande. Réessayez plus tard.",
        400,
      );
    }

    const id = newId();
    await db.insert(gatewayCheckouts).values({
      id,
      tenantId: ctx.tenantId,
      provider: "chargily",
      externalId: checkout.id,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      amountMinor,
      currency: "DZD",
      paymentMethod: checkout.payment_method ?? input.method ?? null,
      status: "pending",
      checkoutUrl: checkout.checkout_url,
      mode,
      metadata: { invoiceNumber: invoice.number, invoiceDueMinor: dueMinor },
    });

    await audit({
      tenantId: ctx.tenantId,
      actorId: ctx.userId ?? null,
      action: "payment.checkout.created",
      entity: "gateway_checkout",
      entityId: id,
      after: { invoiceId: invoice.id, amount: fromMinor(amountMinor), provider: "chargily", mode },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      id,
      checkoutId: checkout.id,
      checkoutUrl: checkout.checkout_url,
      status: checkout.status,
      amount: fromMinor(amountMinor),
      currency: "DZD",
      mode,
    };
  }

  async list(ctx: Ctx, limit = 20) {
    const db = getDb();
    const rows = await db
      .select()
      .from(gatewayCheckouts)
      .where(eq(gatewayCheckouts.tenantId, ctx.tenantId))
      .orderBy(desc(gatewayCheckouts.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));
    return rows.map((row) => ({
      id: row.id,
      checkoutId: row.externalId,
      invoiceId: row.invoiceId,
      amount: fromMinor(row.amountMinor),
      currency: row.currency,
      status: row.status,
      mode: row.mode,
      checkoutUrl: row.checkoutUrl,
      paidAt: row.paidAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /**
   * Active confirmation fallback: the success page can force a status refresh so
   * a payment is recorded even if the webhook never reaches us.
   */
  async refresh(ctx: Ctx, checkoutId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(gatewayCheckouts)
      .where(and(eq(gatewayCheckouts.tenantId, ctx.tenantId), eq(gatewayCheckouts.externalId, checkoutId)))
      .limit(1);
    if (!row) throw AppError.notFound("Paiement en ligne introuvable");
    if (row.status === "paid") return { status: "paid", alreadySettled: true };

    const { secretKey, mode } = await this.credentials(ctx.tenantId);
    let checkout: ChargilyCheckout;
    try {
      checkout = await getCheckout(secretKey, mode, checkoutId);
    } catch (error) {
      if (error instanceof ChargilyError) {
        throw new AppError("PAYMENT_PROVIDER_ERROR", "Impossible de vérifier le paiement auprès de Chargily.", 400);
      }
      throw error;
    }

    await this.applyProviderStatus(row, checkout);
    return { status: checkout.status, alreadySettled: checkout.status === "paid" };
  }

  /**
   * Called when the customer comes back from the Chargily page: refreshes every
   * still-pending checkout of the invoice against the provider instead of
   * trusting the redirect query string.
   */
  async refreshInvoice(ctx: Ctx, invoiceId: string) {
    const db = getDb();
    const rows = await db
      .select()
      .from(gatewayCheckouts)
      .where(and(eq(gatewayCheckouts.tenantId, ctx.tenantId), eq(gatewayCheckouts.invoiceId, invoiceId)))
      .orderBy(desc(gatewayCheckouts.createdAt));

    const pending = rows.filter((row) => row.status === "pending");
    if (pending.length > 0) {
      const { secretKey, mode } = await this.credentials(ctx.tenantId);
      for (const row of pending) {
        try {
          const checkout = await getCheckout(secretKey, mode, row.externalId);
          await this.applyProviderStatus(row, checkout);
        } catch (error) {
          this.logger.warn(
            `Invoice refresh failed for ${row.externalId}: ${error instanceof Error ? error.message : error}`,
          );
        }
      }
    }

    const refreshed = await db
      .select()
      .from(gatewayCheckouts)
      .where(and(eq(gatewayCheckouts.tenantId, ctx.tenantId), eq(gatewayCheckouts.invoiceId, invoiceId)))
      .orderBy(desc(gatewayCheckouts.createdAt));

    return {
      invoiceId,
      paid: refreshed.some((row) => row.status === "paid"),
      checkouts: refreshed.map((row) => ({
        id: row.id,
        checkoutId: row.externalId,
        status: row.status,
        amount: fromMinor(row.amountMinor),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  /* --------------------------------- webhook ------------------------------ */

  /**
   * Chargily webhook entry point. The signature is verified against the raw
   * body with the tenant key that owns the checkout, then the invoice is
   * settled exactly once (idempotent).
   */
  async handleWebhook(rawBody: string, signature: string | undefined) {
    let event: ChargilyWebhookEvent;
    try {
      event = JSON.parse(rawBody) as ChargilyWebhookEvent;
    } catch {
      throw new AppError("INVALID_PAYLOAD", "Corps de webhook illisible.", 400);
    }

    const data = event?.data;
    const checkoutId = data?.id;
    if (!checkoutId || !data) throw new AppError("INVALID_PAYLOAD", "Identifiant de paiement manquant.", 400);

    const db = getDb();
    const [row] = await db
      .select()
      .from(gatewayCheckouts)
      .where(and(eq(gatewayCheckouts.provider, "chargily"), eq(gatewayCheckouts.externalId, checkoutId)))
      .limit(1);
    if (!row) {
      this.logger.warn(`Webhook for unknown checkout ${checkoutId} ignored`);
      return { received: true, ignored: true };
    }

    const { secretKey } = await this.credentials(row.tenantId);
    if (!verifySignature(rawBody, signature, secretKey)) {
      this.logger.warn(`Invalid webhook signature for checkout ${checkoutId}`);
      throw AppError.forbidden("Signature de webhook invalide.", "INVALID_SIGNATURE");
    }

    if (row.status === "paid") return { received: true, alreadySettled: true };

    await this.applyProviderStatus(row, data, event.type);
    const [updated] = await getDb()
      .select({ status: gatewayCheckouts.status })
      .from(gatewayCheckouts)
      .where(eq(gatewayCheckouts.id, row.id))
      .limit(1);
    return { received: true, status: updated?.status ?? "pending" };
  }

  /* ------------------------------- settlement ----------------------------- */

  private async applyProviderStatus(
    row: typeof gatewayCheckouts.$inferSelect,
    checkout: { id: string; amount?: number; currency?: string; status?: string },
    eventType?: string,
  ) {
    const db = getDb();
    const mapped = eventType ? STATUS_MAP[eventType] : undefined;
    const providerStatus = checkout.status ?? "";
    const nextStatus = mapped ?? (providerStatus === "paid" ? "paid" : providerStatus || "pending");

    if (nextStatus !== "paid") {
      await db
        .update(gatewayCheckouts)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(eq(gatewayCheckouts.id, row.id));
      return;
    }

    const providerAmountMinor = fromProviderAmount(checkout.amount);
    if (providerAmountMinor !== row.amountMinor) {
      await db
        .update(gatewayCheckouts)
        .set({ status: "amount_mismatch", updatedAt: new Date() })
        .where(eq(gatewayCheckouts.id, row.id));
      this.logger.error(
        `Amount mismatch on checkout ${row.externalId}: expected ${row.amountMinor}, provider ${providerAmountMinor}`,
      );
      return;
    }

    if (row.invoiceId) {
      const [invoice] = await db
        .select({ dueMinor: invoices.dueMinor })
        .from(invoices)
        .where(eq(invoices.id, row.invoiceId))
        .limit(1);
      // Whole-dinar rounding can leave the charged amount a few centimes above the
      // balance: allocate at most what is still owed.
      const settleMinor = Math.min(row.amountMinor, Number(invoice?.dueMinor ?? row.amountMinor));
      const rounding = row.amountMinor - settleMinor;
      try {
        await this.payments.create(
          { tenantId: row.tenantId, userId: null, ip: null, userAgent: "chargily-webhook" },
          {
            invoiceId: row.invoiceId,
            amount: fromMinor(settleMinor),
            method: (row.paymentMethod ?? "edahabia").toUpperCase(),
            notes:
              `Paiement en ligne Chargily (${row.externalId})` +
              (rounding > 0 ? ` — arrondi dinarique de ${fromMinor(rounding)} DZD` : ""),
            reference: row.externalId,
            paidAt: new Date().toISOString(),
          } as never,
        );
      } catch (error) {
        const code = (error as { error_code?: string }).error_code;
        if (code !== "INVOICE_ALREADY_PAID") {
          await db
            .update(gatewayCheckouts)
            .set({ status: "reconcile_failed", updatedAt: new Date() })
            .where(eq(gatewayCheckouts.id, row.id));
          throw error;
        }
      }
    }

    await db
      .update(gatewayCheckouts)
      .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
      .where(eq(gatewayCheckouts.id, row.id));

    await audit({
      tenantId: row.tenantId,
      actorId: null,
      action: "payment.checkout.paid",
      entity: "gateway_checkout",
      entityId: row.id,
      after: { checkoutId: row.externalId, amount: fromMinor(row.amountMinor) },
    });
  }

  /** Used by the payments settings screen to show whether online payment is ready. */
  async status(tenantId: string) {
    let configured = false;
    let mode: ChargilyMode = env.CHARGILY_MODE;
    let source: "tenant" | "platform" | "none" = "none";
    try {
      const credentials = await this.credentials(tenantId);
      configured = true;
      mode = credentials.mode;
      source = credentials.source;
    } catch {
      configured = false;
    }
    const db = getDb();
    const [clientCount] = await db.select({ id: clients.id }).from(clients).where(eq(clients.tenantId, tenantId)).limit(1);
    return {
      provider: "chargily",
      configured,
      mode,
      source,
      secretsEncryption: secretsConfigured(),
      hasClients: Boolean(clientCount),
      webhookPath: "/api/payments/chargily/webhook",
      currencies: ["DZD"],
      methods: ["edahabia", "cib"],
    };
  }
}
