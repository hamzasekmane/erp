/**
 * Posts business events to the ledger.
 *
 * Contract: docs/adr/0004-ledger.md
 *
 * Design constraints that shaped this file:
 *
 * 1. POSTING IS PART OF THE CALLER'S TRANSACTION. `postInTx` takes the
 *    transaction handle the business write is already using. There is no
 *    "post afterwards" and no outbox for postings: a window where an invoice
 *    exists but its entry does not is a reconciliation bug waiting to happen.
 *
 * 2. ACCOUNTS ARE RESOLVED BY ROLE, NEVER BY CODE. The posting engine looks up
 *    accounts by `system_role` ('receivable', 'revenue', 'vat_output', ...).
 *    That is what makes the chart replaceable per tenant: an Algerian SCF
 *    template seeds one set of codes, and a tenant that renumbers its chart
 *    does not break posting.
 *
 * 3. A MISSING ACCOUNT IS A HARD FAILURE, NOT A SILENT SKIP. If a tenant has no
 *    'revenue' account, posting throws and the business write rolls back. The
 *    alternative — skipping the posting to let the write succeed — creates
 *    books that quietly diverge from reality.
 */

import { Injectable } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { accounts, accountingPeriods, journalEntries, journalLines } from "../../db/schema";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { audit } from "../../shared/audit";
import {
  LedgerError,
  isLedgerClientError,
  normalBalanceFor,
  validatePosting,
  type AccountType,
  type PostingLine,
} from "./ledger.domain";

/**
 * The roles posting needs. A template must provide all of them; a tenant chart
 * that predates a role gets a clear error rather than a missing entry.
 */
export const SYSTEM_ROLES = [
  "receivable",
  "payable",
  "revenue",
  "vat_output",
  "vat_input",
  "cash",
  "bank",
  "discount_allowed",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

/**
 * The transaction handle a caller passes in.
 *
 * Deliberately broad: the posting code only needs `select` and `insert`, and
 * it must accept both the scoped request transaction and a nested one. Typing
 * this to the full Drizzle transaction type would force every caller to import
 * driver internals.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = any;

export type PostInput = {
  tenantId: string;
  entryDate: string;
  sourceType: string;
  sourceId?: string | null;
  memo?: string | null;
  lines: PostingLine[];
  createdBy?: string | null;
};

export type PostingTemplate = {
  code: string;
  name: string;
  type: AccountType;
  /** Parent code in the same template; null for a root. */
  parentCode: string | null;
  systemRole: SystemRole | null;
  isPostable: boolean;
  description?: string;
};

/** Raised when the ledger refuses a posting; surfaced as 422, never 500. */
function ledgerFailure(error: unknown): never {
  if (isLedgerClientError(error)) {
    const code =
      error instanceof LedgerError ? error.code : (error as { code?: string }).code ?? "LEDGER_ERROR";
    throw AppError.unprocessable(code, error.message);
  }
  throw error;
}

@Injectable()
export class LedgerService {
  /**
   * Resolves the tenant's postable account for a system role.
   *
   * Scoped to the tenant and to non-deleted rows; the partial unique index
   * guarantees at most one, so this cannot be ambiguous.
   */
  async accountForRole(tenantId: string, role: SystemRole, tx: Tx = getDb()): Promise<string> {
    const [account] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          eq(accounts.systemRole, role),
          eq(accounts.isActive, true),
          isNull(accounts.deletedAt),
        ),
      )
      .limit(1);

    if (!account) {
      throw AppError.unprocessable(
        "LEDGER_ACCOUNT_MISSING",
        `Le plan comptable ne contient aucun compte pour le rôle « ${role} ». Initialisez le plan comptable du tenant.`,
      );
    }
    return account.id;
  }

  /**
   * Posts a balanced entry inside an existing transaction.
   *
   * Validates in the domain first (so a bad posting never reaches the database)
   * and lets the database re-check at COMMIT.
   */
  async postInTx(tx: Tx, input: PostInput): Promise<string> {
    let validated;
    try {
      validated = validatePosting(input.lines);
    } catch (error) {
      ledgerFailure(error);
    }

    await this.assertPeriodOpen(input.tenantId, input.entryDate, tx);

    const entryId = newId();
    await tx.insert(journalEntries).values({
      id: entryId,
      tenantId: input.tenantId,
      // `number` is assigned by a BEFORE INSERT trigger: gap-free per year
      // without a round-trip, and correct under concurrency.
      number: "",
      entryDate: input.entryDate,
      status: "posted",
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      memo: input.memo ?? null,
      postedAt: new Date(),
      createdBy: input.createdBy ?? null,
    });

    await tx.insert(journalLines).values(
      validated.lines.map((line, index) => ({
        id: newId(),
        tenantId: input.tenantId,
        entryId,
        lineNumber: index + 1,
        accountId: line.accountId,
        debitMinor: line.debitMinor,
        creditMinor: line.creditMinor,
        memo: line.memo ?? null,
      })),
    );

    return entryId;
  }

  /**
   * Posts an invoice.
   *
   *   Receivable               total
   *     Revenue                       subtotal + shipping   (gross)
   *     VAT output                              tax
   *   Discount allowed          discount      (contra-revenue, debit)
   *
   * Revenue is posted GROSS and the discount as a separate contra-revenue
   * debit, so "how much did we give away" is answerable from the ledger alone.
   * Netting the discount into revenue instead would balance with only two
   * lines, but it destroys that information permanently.
   *
   * Getting this right is not cosmetic: an earlier version debited receivable
   * (which already nets the discount) AND debited discount, while crediting
   * net revenue — double-counting the discount and omitting shipping, and
   * failing the balance check by exactly (discount + shipping).
   */
  async postInvoice(
    tx: Tx,
    input: {
      tenantId: string;
      invoiceId: string;
      invoiceNumber: string;
      entryDate: string;
      subtotalMinor: number;
      discountMinor: number;
      shippingMinor: number;
      taxMinor: number;
      totalMinor: number;
      createdBy?: string | null;
    },
  ): Promise<string> {
    const receivable = await this.accountForRole(input.tenantId, "receivable", tx);
    const revenue = await this.accountForRole(input.tenantId, "revenue", tx);

    const lines: PostingLine[] = [
      { accountId: receivable, debitMinor: input.totalMinor, memo: `Facture ${input.invoiceNumber}` },
    ];

    if (input.discountMinor > input.subtotalMinor) {
      throw AppError.unprocessable("LEDGER_NEGATIVE_REVENUE", "La remise dépasse le sous-total.");
    }

    // Gross revenue: the subtotal plus shipping (produits accessoires). The
    // discount is NOT netted here - it is debited separately below.
    const grossRevenue = input.subtotalMinor + input.shippingMinor;
    if (grossRevenue > 0) {
      lines.push({ accountId: revenue, creditMinor: grossRevenue, memo: `Ventes ${input.invoiceNumber}` });
    }

    if (input.discountMinor > 0) {
      const discountAccount = await this.accountForRole(input.tenantId, "discount_allowed", tx);
      lines.push({
        accountId: discountAccount,
        debitMinor: input.discountMinor,
        memo: `Remise ${input.invoiceNumber}`,
      });
    }

    if (input.taxMinor > 0) {
      const vatOutput = await this.accountForRole(input.tenantId, "vat_output", tx);
      lines.push({ accountId: vatOutput, creditMinor: input.taxMinor, memo: `TVA ${input.invoiceNumber}` });
    }

    return this.postInTx(tx, {
      tenantId: input.tenantId,
      entryDate: input.entryDate,
      sourceType: "invoice",
      sourceId: input.invoiceId,
      memo: `Facture ${input.invoiceNumber}`,
      lines,
      createdBy: input.createdBy ?? null,
    });
  }

  /**
   * Posts a customer payment.
   *
   *   Cash / Bank   amount
   *     Receivable          amount
   */
  async postPayment(
    tx: Tx,
    input: {
      tenantId: string;
      paymentId: string;
      paymentNumber: string;
      entryDate: string;
      amountMinor: number;
      /** 'cash' | 'bank' — resolved to a role, not to a hardcoded code. */
      accountKind: "cash" | "bank";
      createdBy?: string | null;
    },
  ): Promise<string> {
    const assetRole: SystemRole = input.accountKind === "bank" ? "bank" : "cash";
    const asset = await this.accountForRole(input.tenantId, assetRole, tx);
    const receivable = await this.accountForRole(input.tenantId, "receivable", tx);

    return this.postInTx(tx, {
      tenantId: input.tenantId,
      entryDate: input.entryDate,
      sourceType: "payment",
      sourceId: input.paymentId,
      memo: `Encaissement ${input.paymentNumber}`,
      lines: [
        { accountId: asset, debitMinor: input.amountMinor, memo: `Encaissement ${input.paymentNumber}` },
        { accountId: receivable, creditMinor: input.amountMinor, memo: `Encaissement ${input.paymentNumber}` },
      ],
      createdBy: input.createdBy ?? null,
    });
  }

  /**
   * Reverses an entry: writes a new entry with every side swapped.
   *
   * The original is never modified (the database rejects UPDATE anyway). The
   * link is recorded both ways so "why was this reversed" and "what did this
   * reversal cancel" are both single lookups.
   */
  async reverseEntry(
    tx: Tx,
    input: { tenantId: string; entryId: string; reason: string; createdBy?: string | null },
  ): Promise<string> {
    const [original] = await tx
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, input.entryId), eq(journalEntries.tenantId, input.tenantId)))
      .limit(1);

    if (!original) throw AppError.notFound("Écriture comptable introuvable");
    if (original.isReversal) {
      throw AppError.unprocessable("LEDGER_CANNOT_REVERSE_REVERSAL", "Une écriture d'extourne ne peut pas être annulée.");
    }


    const lines = await tx
      .select()
      .from(journalLines)
      .where(eq(journalLines.entryId, input.entryId));

    if (lines.length === 0) {
      throw AppError.unprocessable("LEDGER_EMPTY_ENTRY", "Aucune ligne à extourner.");
    }

    const reversalId = newId();
    let validated;
    try {
      validated = validatePosting(
        lines.map((line: { accountId: string; debitMinor: number; creditMinor: number; memo: string | null }) => ({
          accountId: line.accountId,
          // Swap: the reversal exactly cancels the original.
          debitMinor: Number(line.creditMinor),
          creditMinor: Number(line.debitMinor),
          memo: line.memo,
        })),
      );
    } catch (error) {
      ledgerFailure(error);
    }

    await this.assertPeriodOpen(input.tenantId, String(original.entryDate), tx);

    await tx.insert(journalEntries).values({
      id: reversalId,
      tenantId: input.tenantId,
      number: "",
      entryDate: original.entryDate,
      status: "posted",
      sourceType: "reversal",
      sourceId: input.entryId,
      memo: `Extourne: ${input.reason}`,
      isReversal: true,
      reversesEntryId: input.entryId,
      postedAt: new Date(),
      createdBy: input.createdBy ?? null,
    });

    await tx.insert(journalLines).values(
      validated.lines.map((line, index) => ({
        id: newId(),
        tenantId: input.tenantId,
        entryId: reversalId,
        lineNumber: index + 1,
        accountId: line.accountId,
        debitMinor: line.debitMinor,
        creditMinor: line.creditMinor,
        memo: line.memo ?? null,
      })),
    );

    return reversalId;
  }

  /**
   * A locked period refuses postings, so a closed month cannot change.
   * An entry outside any declared period is allowed: periods are opt-in locks,
   * not a precondition for using the ledger.
   */
  private async assertPeriodOpen(tenantId: string, entryDate: string, tx: Tx = getDb()): Promise<void> {
    const [period] = await tx
      .select({ status: accountingPeriods.status, period: accountingPeriods.period })
      .from(accountingPeriods)
      .where(
        and(
          eq(accountingPeriods.tenantId, tenantId),
          sql`${entryDate} between ${accountingPeriods.startDate} and ${accountingPeriods.endDate}`,
        ),
      )
      .limit(1);

    if (period && period.status === "locked") {
      throw AppError.unprocessable(
        "LEDGER_PERIOD_LOCKED",
        `La période comptable ${period.period} est clôturée : aucune écriture ne peut y être ajoutée.`,
      );
    }
  }
}

export { validatePosting, normalBalanceFor };
export type { PostingLine };
