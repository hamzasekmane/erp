/**
 * Initialises a tenant's chart of accounts from a template.
 *
 * Contract: docs/adr/0004-ledger.md
 *
 * "Replaceable" is enforced by what this does NOT do: it never looks up a code
 * elsewhere, never seeds lazily on first invoice, and never partially applies.
 * A tenant either has a complete chart or a clear error. Run it explicitly:
 *
 *   await ledgerSetup.initialiseChart(tenantId);
 *
 * Re-running is safe: existing codes are left untouched, so a tenant that has
 * renamed or renumbered accounts does not lose those edits.
 */

import { Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../db/client";
import { accountClosure, accounts, accountingPeriods } from "../../db/schema";
import { newId } from "../../shared/ids";
import { ALGERIAN_SCF, ALGERIAN_SCF_TEMPLATE_VERSION, assertTemplateUsable } from "./chart-of-accounts.template";
import { SYSTEM_ROLES, type PostingTemplate } from "./ledger.service";
import { buildClosure, normalBalanceFor } from "./ledger.domain";

export type InitialiseResult = {
  created: number;
  skipped: number;
  templateVersion: string;
};

@Injectable()
export class LedgerSetupService {
  /**
   * Seeds the chart into the tenant's own tables.
   *
   * `tx` is the caller's transaction when the tenant is being created (so a
   * tenant can never exist without a chart), or omitted to open one. It must
   * never open a SECOND transaction while the caller is inside one: the chart
   * could then commit while the tenant rolls back.
   */
  async initialiseChart(
    tenantId: string,
    options: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx?: any;
      template?: PostingTemplate[];
      version?: string;
    } = {},
  ): Promise<InitialiseResult> {
    const template = options.template ?? ALGERIAN_SCF;
    const version = options.version ?? ALGERIAN_SCF_TEMPLATE_VERSION;
    assertTemplateUsable(template, SYSTEM_ROLES);

    // The same narrow shape the ledger posting code uses: only `select` and
    // `insert` are needed, and the real Drizzle transaction type would force
    // every caller to import driver internals.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = async (tx: any): Promise<InitialiseResult> => {
      const existing = await tx
        .select({ code: accounts.code })
        .from(accounts)
        .where(and(eq(accounts.tenantId, tenantId), isNull(accounts.deletedAt)));
      const existingCodes = new Set(existing.map((row: { code: string }) => row.code));

      // Map template code -> database id, so parents can be linked as we go.
      // Currently existing codes may have different ids than the template
      // would assign, which is why they are looked up rather than assumed.
      const idByCode = new Map<string, string>();
      if (existingCodes.size > 0) {
        const rows = await tx
          .select({ id: accounts.id, code: accounts.code })
          .from(accounts)
          .where(and(eq(accounts.tenantId, tenantId), isNull(accounts.deletedAt)));
        for (const row of rows as Array<{ id: string; code: string }>) idByCode.set(row.code, row.id);
      }

      let skipped = 0;
      const toInsert = template.filter((account) => {
        if (existingCodes.has(account.code)) {
          skipped += 1;
          return false;
        }
        return true;
      });

      for (const account of toInsert) idByCode.set(account.code, newId());

      if (toInsert.length > 0) {
        await tx.insert(accounts).values(
          toInsert.map((account) => ({
            id: idByCode.get(account.code)!,
            tenantId,
            code: account.code,
            name: account.name,
            type: account.type,
            normalBalance: normalBalanceFor(account.type),
            parentId: account.parentCode ? (idByCode.get(account.parentCode) ?? null) : null,
            isPostable: account.isPostable,
            systemRole: account.systemRole,
            description: account.description ?? null,
          })),
        );
      }

      // Rebuild the closure for the whole chart from parent pointers. Doing it
      // wholesale (rather than incrementally) keeps the invariant obvious and
      // handles a pre-existing chart that was imported without one.
      const all = await tx
        .select({ id: accounts.id, parentId: accounts.parentId })
        .from(accounts)
        .where(and(eq(accounts.tenantId, tenantId), isNull(accounts.deletedAt)));

      const closure = buildClosure(
        (all as Array<{ id: string; parentId: string | null }>).map((row) => ({ id: row.id, parentId: row.parentId })),
      );

      // Only the rows that do not exist yet: preserves anything already built.
      const existingClosure = await tx
        .select({
          ancestorId: accountClosure.ancestorId,
          descendantId: accountClosure.descendantId,
        })
        .from(accountClosure)
        .where(eq(accountClosure.tenantId, tenantId));
      const closureKeys = new Set(
        (existingClosure as Array<{ ancestorId: string; descendantId: string }>).map(
          (row) => `${row.ancestorId}:${row.descendantId}`,
        ),
      );

      const newClosure = closure
        .filter((row) => !closureKeys.has(`${row.ancestorId}:${row.descendantId}`))
        .map((row) => ({
          tenantId,
          ancestorId: row.ancestorId,
          descendantId: row.descendantId,
          depth: row.depth,
        }));

      if (newClosure.length > 0) {
        await tx.insert(accountClosure).values(newClosure);
      }

      return { created: toInsert.length, skipped, templateVersion: version };
    };

    return options.tx ? run(options.tx) : getDb().transaction(run);
  }

  /**
   * Opens an accounting period. Periods are opt-in locks: the ledger works
   * without any, and locking one freezes it.
   */
  async openPeriod(tenantId: string, period: string, startDate: string, endDate: string): Promise<void> {
    await getDb().insert(accountingPeriods).values({
      id: newId(),
      tenantId,
      period,
      startDate,
      endDate,
      status: "open",
    });
  }

  /** Locks a period. Idempotent. */
  async lockPeriod(tenantId: string, period: string, lockedBy?: string | null): Promise<void> {
    await getDb()
      .update(accountingPeriods)
      .set({ status: "locked", lockedAt: new Date(), lockedBy: lockedBy ?? null, updatedAt: new Date() })
      .where(and(eq(accountingPeriods.tenantId, tenantId), eq(accountingPeriods.period, period)));
  }
}
