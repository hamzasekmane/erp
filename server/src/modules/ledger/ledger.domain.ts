/**
 * The ledger domain: double-entry bookkeeping primitives.
 *
 * Contract: docs/adr/0004-ledger.md
 *
 * This module holds the rules that must hold regardless of which caller posts:
 *
 *  1. A journal entry is BALANCED: sum(debits) == sum(credits), exactly.
 *  2. Every entry has at least two lines, and every line is exactly one of a
 *     debit or a credit (never both, never neither, never zero).
 *  3. Amounts are integer minor units. A ledger that accepts 0.1 + 0.2 and
 *     expects 0.3 is not a ledger.
 *  4. Entries are IMMUTABLE. There is no update and no delete. A correction is
 *     a reversal that references the original.
 *
 * The rules are checked here (before anything is written, so a bad posting
 * never touches the database) and again in the database (a deferred constraint
 * trigger at COMMIT, plus triggers that reject UPDATE and DELETE). Duplication
 * is deliberate: the domain gives a useful error, the database gives the
 * guarantee.
 */

import { MoneyError } from "../../shared/money";

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";

/** Thrown when a posting violates the accounting contract. */
export class LedgerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "LedgerError";
  }
}

export type PostingLine = {
  accountId: string;
  /** Exactly one of debitMinor / creditMinor must be > 0. Integers only. */
  debitMinor?: number;
  creditMinor?: number;
  memo?: string | null;
};

export type ValidatedLine = {
  accountId: string;
  debitMinor: number;
  creditMinor: number;
  memo?: string | null;
};

function assertMinorAmount(value: number, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new LedgerError(`Amount must be a finite number (${field})`, "INVALID_AMOUNT", { field });
  }
  if (!Number.isInteger(value)) {
    throw new LedgerError(
      `Amount must be an integer number of minor units, got ${value} (${field})`,
      "NON_INTEGER_AMOUNT",
      { field, value },
    );
  }
  if (value < 0) {
    throw new LedgerError(`Amount must not be negative, got ${value} (${field})`, "NEGATIVE_AMOUNT", {
      field,
      value,
    });
  }
  return value;
}

/**
 * Validates a set of lines and returns them normalised.
 *
 * Rejects: fewer than two lines, an empty or duplicated account per line, a line
 * that is both debit and credit, a line that is neither, and an unbalanced set.
 */
export function validatePosting(lines: PostingLine[]): {
  lines: ValidatedLine[];
  totalDebitMinor: number;
  totalCreditMinor: number;
} {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new LedgerError("A journal entry needs at least two lines", "EMPTY_ENTRY");
  }
  if (lines.length < 2) {
    throw new LedgerError(
      `A journal entry needs at least two lines, got ${lines.length}`,
      "TOO_FEW_LINES",
      { count: lines.length },
    );
  }

  const normalised: ValidatedLine[] = lines.map((line, index) => {
    if (!line.accountId) {
      throw new LedgerError(`Line ${index} has no account`, "MISSING_ACCOUNT", { index });
    }
    const debit = assertMinorAmount(line.debitMinor ?? 0, `lines[${index}].debitMinor`);
    const credit = assertMinorAmount(line.creditMinor ?? 0, `lines[${index}].creditMinor`);

    const hasDebit = debit > 0;
    const hasCredit = credit > 0;
    if (hasDebit && hasCredit) {
      throw new LedgerError(
        `Line ${index} must be a debit OR a credit, not both`,
        "BOTH_SIDES",
        { index, debit, credit },
      );
    }
    if (!hasDebit && !hasCredit) {
      throw new LedgerError(`Line ${index} has a zero amount on both sides`, "ZERO_LINE", { index });
    }
    return {
      accountId: line.accountId,
      debitMinor: debit,
      creditMinor: credit,
      memo: line.memo ?? null,
    };
  });

  const totalDebitMinor = normalised.reduce((sum, line) => sum + line.debitMinor, 0);
  const totalCreditMinor = normalised.reduce((sum, line) => sum + line.creditMinor, 0);

  if (totalDebitMinor !== totalCreditMinor) {
    throw new LedgerError(
      `Unbalanced entry: debits ${totalDebitMinor} != credits ${totalCreditMinor}`,
      "UNBALANCED",
      { totalDebitMinor, totalCreditMinor, difference: totalDebitMinor - totalCreditMinor },
    );
  }

  return { lines: normalised, totalDebitMinor, totalCreditMinor };
}

/**
 * Builds the reversal of an existing entry.
 *
 * Swaps every debit for a credit and vice versa, keeping the same accounts, so
 * the reversal exactly cancels the original. The reversal is a new entry; the
 * original is never modified.
 */
export function reverseLines(lines: Array<{ accountId: string; debitMinor: number; creditMinor: number; memo?: string | null }>): PostingLine[] {
  if (lines.length === 0) {
    throw new LedgerError("Cannot reverse an entry with no lines", "EMPTY_ENTRY");
  }
  return lines.map((line) => ({
    accountId: line.accountId,
    debitMinor: line.creditMinor,
    creditMinor: line.debitMinor,
    memo: line.memo ?? null,
  }));
}

/**
 * Signed balance of an account, in the direction of its normal balance.
 *
 * For a debit-normal account (asset, expense) a debit increases the balance.
 * For a credit-normal account (liability, equity, revenue) a credit does.
 * Returning a single signed number lets the trial balance and reports sum
 * without per-type branching, while `rawDebitCredit` keeps the unmodified
 * figures available for the trial balance itself.
 */
export function signedBalance(
  normalBalance: NormalBalance,
  totalDebitMinor: number,
  totalCreditMinor: number,
): number {
  return normalBalance === "debit"
    ? totalDebitMinor - totalCreditMinor
    : totalCreditMinor - totalDebitMinor;
}

/** Derives the normal balance from the account type — the only valid mapping. */
export function normalBalanceFor(type: AccountType): NormalBalance {
  switch (type) {
    case "asset":
    case "expense":
      return "debit";
    case "liability":
    case "equity":
    case "revenue":
      return "credit";
    default:
      throw new LedgerError(`Unknown account type: ${String(type)}`, "INVALID_ACCOUNT_TYPE");
  }
}

/**
 * Recomputes a whole chart's closure rows from parent pointers.
 *
 * Used for import/replacement of the chart: given `{ id, parentId }` it returns
 * every (ancestor, descendant, depth) triple, including the self-rows.
 *
 * Rejects cycles instead of looping forever, and rejects a parent that is not
 * in the input, because a dangling parent means a corrupt chart. Operational
 * cost is O(n * depth) rows; that is the price of single-join subtree queries.
 */
export function buildClosure(
  nodes: Array<{ id: string; parentId: string | null }>,
): Array<{ ancestorId: string; descendantId: string; depth: number }> {
  const byId = new Map<string, { id: string; parentId: string | null }>();
  for (const node of nodes) {
    if (byId.has(node.id)) {
      throw new LedgerError(`Duplicate account id: ${node.id}`, "DUPLICATE_NODE", { id: node.id });
    }
    byId.set(node.id, node);
  }
  for (const node of nodes) {
    if (node.parentId !== null && !byId.has(node.parentId)) {
      throw new LedgerError(
        `Account ${node.id} references a parent that does not exist: ${node.parentId}`,
        "DANGLING_PARENT",
        { id: node.id, parentId: node.parentId },
      );
    }
  }

  const result: Array<{ ancestorId: string; descendantId: string; depth: number }> = [];
  for (const node of nodes) {
    result.push({ ancestorId: node.id, descendantId: node.id, depth: 0 });

    let current = node.parentId;
    let depth = 1;
    const seen = new Set<string>([node.id]);
    while (current !== null) {
      if (seen.has(current)) {
        throw new LedgerError(
          `Cycle in the chart of accounts at account ${current}`,
          "CYCLE",
          { id: node.id, cycleAt: current },
        );
      }
      seen.add(current);
      result.push({ ancestorId: current, descendantId: node.id, depth });
      current = byId.get(current)!.parentId;
      depth += 1;
    }
  }
  return result;
}

/** Ledger posting failures that callers may want to surface as 422 rather than 500. */
export function isLedgerClientError(error: unknown): error is LedgerError | MoneyError {
  return error instanceof LedgerError || error instanceof MoneyError;
}
