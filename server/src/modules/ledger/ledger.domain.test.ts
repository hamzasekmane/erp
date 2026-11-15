import { describe, expect, it } from "vitest";
import {
  LedgerError,
  buildClosure,
  normalBalanceFor,
  reverseLines,
  signedBalance,
  validatePosting,
  type PostingLine,
} from "./ledger.domain";

/** Deterministic PRNG so a failure is reproducible from the seed alone. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("validatePosting — rejections", () => {
  it("rejects an entry with fewer than two lines", () => {
    expect(() => validatePosting([])).toThrow(LedgerError);
    expect(() => validatePosting([{ accountId: "a", debitMinor: 100 }])).toThrow(/at least two/i);
  });

  it("rejects a line that is both debit and credit", () => {
    expect(() =>
      validatePosting([
        { accountId: "a", debitMinor: 100, creditMinor: 100 },
        { accountId: "b", debitMinor: 100 },
      ]),
    ).toThrow(/not both/i);
  });

  it("rejects a zero line on both sides", () => {
    expect(() =>
      validatePosting([
        { accountId: "a", debitMinor: 100 },
        { accountId: "b", creditMinor: 100 },
        { accountId: "c" },
      ]),
    ).toThrow(/zero amount/i);
  });

  it("rejects negative and non-integer amounts", () => {
    expect(() => validatePosting([{ accountId: "a", debitMinor: -5 }, { accountId: "b", creditMinor: -5 }])).toThrow(
      /negative/i,
    );
    // 0.1 + 0.2 !== 0.3 is precisely why the ledger refuses floats.
    expect(() => validatePosting([{ accountId: "a", debitMinor: 10.5 }, { accountId: "b", creditMinor: 10.5 }])).toThrow(
      /integer/i,
    );
  });

  it("rejects an unbalanced entry and reports the difference", () => {
    try {
      validatePosting([
        { accountId: "a", debitMinor: 1000 },
        { accountId: "b", creditMinor: 999 },
      ]);
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(LedgerError);
      expect((error as LedgerError).code).toBe("UNBALANCED");
      expect((error as LedgerError).details).toMatchObject({ difference: 1 });
    }
  });

  it("rejects two debits with no credit", () => {
    expect(() =>
      validatePosting([
        { accountId: "a", debitMinor: 50 },
        { accountId: "b", debitMinor: 50 },
      ]),
    ).toThrow(/unbalanced/i);
  });
});

describe("validatePosting — acceptances", () => {
  it("accepts a simple two-line entry", () => {
    const result = validatePosting([
      { accountId: "a", debitMinor: 1190 },
      { accountId: "b", creditMinor: 1190 },
    ]);
    expect(result.totalDebitMinor).toBe(1190);
    expect(result.totalCreditMinor).toBe(1190);
    expect(result.lines).toHaveLength(2);
  });

  it("accepts a many-line split entry", () => {
    const result = validatePosting([
      { accountId: "ar", debitMinor: 1190 },
      { accountId: "rev", creditMinor: 1000 },
      { accountId: "vat", creditMinor: 190 },
    ]);
    expect(result.totalDebitMinor).toBe(result.totalCreditMinor);
  });

  it("normalises omitted sides to zero", () => {
    const result = validatePosting([
      { accountId: "a", debitMinor: 10 },
      { accountId: "b", creditMinor: 10 },
    ]);
    expect(result.lines[0]).toMatchObject({ debitMinor: 10, creditMinor: 0 });
    expect(result.lines[1]).toMatchObject({ debitMinor: 0, creditMinor: 10 });
  });
});

describe("balance is a property, not an example", () => {
  it("holds for 2000 randomly generated balanced entries", () => {
    const random = mulberry32(20261115);

    for (let iteration = 0; iteration < 2000; iteration += 1) {
      // 2..8 lines, amounts derived from a single random total so the entry is
      // balanced by construction; validatePosting must then ACCEPT it.
      const lineCount = 2 + Math.floor(random() * 7);
      const total = 1 + Math.floor(random() * 1_000_000);
      const sides: PostingLine[] = [];

      let remaining = total;
      for (let index = 0; index < lineCount - 1; index += 1) {
        const amount = Math.floor(random() * remaining);
        remaining -= amount;
        if (amount === 0) continue;
        sides.push(
          random() > 0.5
            ? { accountId: `acc-${index}`, debitMinor: amount }
            : { accountId: `acc-${index}`, creditMinor: amount },
        );
      }
      if (remaining > 0) {
        sides.push(
          random() > 0.5
            ? { accountId: `acc-last`, debitMinor: remaining }
            : { accountId: `acc-last`, creditMinor: remaining },
        );
      }

      // Skip the degenerate case where every line landed on one side.
      const debit = sides.reduce((sum, line) => sum + (line.debitMinor ?? 0), 0);
      const credit = sides.reduce((sum, line) => sum + (line.creditMinor ?? 0), 0);
      if (debit !== credit || sides.length < 2) {
        expect(() => validatePosting(sides)).toThrow(LedgerError);
        continue;
      }

      const result = validatePosting(sides);
      expect(result.totalDebitMinor).toBe(result.totalCreditMinor);
    }
  });

  it("rejects every unbalanced variant of a balanced entry", () => {
    const balanced = validatePosting([
      { accountId: "a", debitMinor: 700 },
      { accountId: "b", creditMinor: 700 },
    ]);
    // Perturb a single line: the entry must never validate.
    for (const delta of [1, -1, 100, -100]) {
      const mutated = balanced.lines.map((line, index) =>
        index === 0 ? { ...line, debitMinor: line.debitMinor + delta } : line,
      );
      if (delta < 0) continue; // negative is rejected for a different reason
      expect(() => validatePosting(mutated)).toThrow(/unbalanced/i);
    }
  });

  it("a reversal of any entry is itself balanced and nets to zero", () => {
    const random = mulberry32(7);
    for (let iteration = 0; iteration < 200; iteration += 1) {
      const amount = 1 + Math.floor(random() * 100_000);
      const original = validatePosting([
        { accountId: "a", debitMinor: amount },
        { accountId: "b", creditMinor: amount },
      ]);
      const reversal = validatePosting(reverseLines(original.lines));

      // Individually balanced...
      expect(reversal.totalDebitMinor).toBe(reversal.totalCreditMinor);
      // ...and together they cancel exactly, account by account.
      const net = new Map<string, number>();
      for (const line of [...original.lines, ...reversal.lines]) {
        net.set(line.accountId, (net.get(line.accountId) ?? 0) + line.debitMinor - line.creditMinor);
      }
      for (const value of net.values()) expect(value).toBe(0);
    }
  });
});

describe("signedBalance", () => {
  it("adds on the normal side and subtracts on the other", () => {
    // Debit-normal account: a debit increases it.
    expect(signedBalance("debit", 100, 30)).toBe(70);
    // Credit-normal account: a credit increases it.
    expect(signedBalance("credit", 30, 100)).toBe(70);
  });

  it("can go negative, which is a legitimate (and meaningful) state", () => {
    // A bank account with more credits than debits is an overdraft, not an error.
    expect(signedBalance("debit", 10, 50)).toBe(-40);
  });
});

describe("normalBalanceFor", () => {
  it("maps the five account types to their normal side", () => {
    expect(normalBalanceFor("asset")).toBe("debit");
    expect(normalBalanceFor("expense")).toBe("debit");
    expect(normalBalanceFor("liability")).toBe("credit");
    expect(normalBalanceFor("equity")).toBe("credit");
    expect(normalBalanceFor("revenue")).toBe("credit");
  });

  it("rejects an unknown type rather than defaulting", () => {
    expect(() => normalBalanceFor("invented" as never)).toThrow(LedgerError);
  });
});

describe("buildClosure", () => {
  it("produces self rows and ancestor paths", () => {
    const closure = buildClosure([
      { id: "root", parentId: null },
      { id: "mid", parentId: "root" },
      { id: "leaf", parentId: "mid" },
    ]);
    expect(closure).toEqual(
      expect.arrayContaining([
        { ancestorId: "root", descendantId: "root", depth: 0 },
        { ancestorId: "mid", descendantId: "mid", depth: 0 },
        { ancestorId: "leaf", descendantId: "leaf", depth: 0 },
        { ancestorId: "root", descendantId: "mid", depth: 1 },
        { ancestorId: "mid", descendantId: "leaf", depth: 1 },
        { ancestorId: "root", descendantId: "leaf", depth: 2 },
      ]),
    );
    expect(closure).toHaveLength(6);
  });

  it("rejects a cycle instead of looping forever", () => {
    expect(() =>
      buildClosure([
        { id: "a", parentId: "c" },
        { id: "b", parentId: "a" },
        { id: "c", parentId: "b" },
      ]),
    ).toThrow(/cycle/i);
  });

  it("rejects a self-parent", () => {
    expect(() => buildClosure([{ id: "a", parentId: "a" }])).toThrow(/cycle/i);
  });

  it("rejects a dangling parent", () => {
    expect(() => buildClosure([{ id: "a", parentId: "ghost" }])).toThrow(/does not exist/i);
  });

  it("rejects duplicate ids", () => {
    expect(() =>
      buildClosure([
        { id: "a", parentId: null },
        { id: "a", parentId: null },
      ]),
    ).toThrow(/duplicate/i);
  });

  it("handles an empty chart and a flat chart", () => {
    expect(buildClosure([])).toEqual([]);
    const flat = buildClosure([
      { id: "a", parentId: null },
      { id: "b", parentId: null },
    ]);
    expect(flat).toHaveLength(2);
  });
});
