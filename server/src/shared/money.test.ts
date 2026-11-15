import { describe, expect, it } from "vitest";
import {
  BP_SCALE,
  MoneyError,
  bpToPercent,
  fromMinor,
  invoiceTotals,
  lineAmounts,
  percentToBp,
  roundHalfUp,
  toMinor,
  toMinorStrict,
  toQuantityMilli,
} from "./money";

/**
 * These tests pin the money contract in docs/adr/0002-money-and-discount-contract.md.
 * Several of them FAIL against the pre-Phase-2 implementation, in particular
 * the global-discount-reduces-taxable-base cases (formerly the invoice service
 * charged VAT on the pre-discount subtotal).
 */
describe("roundHalfUp", () => {
  it("rounds half away from zero", () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(-0.5)).toBe(-1);
    expect(roundHalfUp(2.4)).toBe(2);
    expect(roundHalfUp(2.5)).toBe(3);
  });
});

describe("percentToBp (percentage in, basis points stored)", () => {
  it("converts whole and half percentages exactly", () => {
    expect(percentToBp(0)).toBe(0);
    expect(percentToBp(100)).toBe(10_000);
    expect(percentToBp(12.5)).toBe(1250);
    expect(percentToBp(19)).toBe(1900);
    expect(percentToBp(0.01)).toBe(1);
  });

  it("round-trips through bpToPercent", () => {
    for (const percent of [0, 0.25, 5, 12.5, 19, 33.33, 100]) {
      expect(bpToPercent(percentToBp(percent))).toBeCloseTo(percent, 10);
    }
  });

  it("rejects more than 2 decimals instead of silently rounding", () => {
    expect(() => percentToBp(12.345)).toThrow(MoneyError);
    expect(() => percentToBp(12.345)).toThrow(/at most 2 decimals/);
    // The rejected value must not be quietly coerced to 1235.
    try {
      percentToBp(12.345);
    } catch (error) {
      expect((error as MoneyError).code).toBe("RATE_PRECISION");
    }
  });

  it("rejects out-of-range percentages", () => {
    expect(() => percentToBp(-1)).toThrow(/between 0 and 100/);
    expect(() => percentToBp(100.01)).toThrow(/between 0 and 100/);
    expect(() => percentToBp(Number.NaN)).toThrow(MoneyError);
    expect(() => percentToBp(Number.POSITIVE_INFINITY)).toThrow(MoneyError);
  });
});

describe("toMinorStrict", () => {
  it("converts 2-decimal amounts exactly", () => {
    expect(toMinorStrict(0)).toBe(0);
    expect(toMinorStrict(12.34)).toBe(1234);
    expect(toMinorStrict(1250.5)).toBe(125050);
  });

  it("rejects sub-cent precision", () => {
    expect(() => toMinorStrict(12.345)).toThrow(/at most 2 decimals/);
  });

  it("is the strict counterpart of the lenient toMinor", () => {
    expect(toMinor(12.345)).toBe(1235);
    expect(toMinorStrict(12.34)).toBe(toMinor(12.34));
  });
});

describe("toQuantityMilli", () => {
  it("accepts up to 3 decimals", () => {
    expect(toQuantityMilli(1)).toBe(1000);
    expect(toQuantityMilli(0.5)).toBe(500);
    expect(toQuantityMilli(2.125)).toBe(2125);
  });

  it("rejects finer precision", () => {
    expect(() => toQuantityMilli(0.0001)).toThrow(/at most 3 decimals/);
  });
});

describe("lineAmounts", () => {
  it("computes gross, discount, base, VAT and total in minor units", () => {
    // 3 x 1000.00 = 300000, 12.5 % off = 37500, base 262500, 10 % VAT = 26250
    const line = lineAmounts({ quantity: 3, unitPriceMinor: 100_000, discountBp: 1250, taxRateBp: 1000 });
    expect(line).toEqual({
      grossMinor: 300_000,
      discountMinor: 37_500,
      baseMinor: 262_500,
      taxMinor: 26_250,
      totalMinor: 288_750,
    });
  });

  it("handles a fractional quantity without float drift", () => {
    // 0.1 + 0.2 territory: 3 x 0.1 kg at 3333 minor
    const line = lineAmounts({ quantity: 0.3, unitPriceMinor: 3333, discountBp: 0, taxRateBp: 0 });
    expect(line.grossMinor).toBe(1000); // 0.3 * 3333 = 999.9 -> 1000
    expect(Number.isInteger(line.totalMinor)).toBe(true);
  });

  it("applies 0 % and 100 % discounts", () => {
    const none = lineAmounts({ quantity: 1, unitPriceMinor: 10_000, discountBp: 0, taxRateBp: 1900 });
    expect(none.discountMinor).toBe(0);
    expect(none.taxMinor).toBe(1900);

    const all = lineAmounts({ quantity: 1, unitPriceMinor: 10_000, discountBp: BP_SCALE, taxRateBp: 1900 });
    expect(all.discountMinor).toBe(10_000);
    expect(all.baseMinor).toBe(0);
    expect(all.taxMinor).toBe(0);
    expect(all.totalMinor).toBe(0);
  });

  it("rejects negative prices and out-of-range rates", () => {
    expect(() => lineAmounts({ quantity: 1, unitPriceMinor: -1, discountBp: 0, taxRateBp: 0 })).toThrow(MoneyError);
    expect(() => lineAmounts({ quantity: 1, unitPriceMinor: 100, discountBp: 10_001, taxRateBp: 0 })).toThrow(/0 and 10000/);
    expect(() => lineAmounts({ quantity: 1, unitPriceMinor: 100, discountBp: 0, taxRateBp: -1 })).toThrow(/0 and 10000/);
  });
});

describe("invoiceTotals — VAT is charged on the net (post-discount) base", () => {
  it("reduces VAT when a global discount is applied", () => {
    // One line: 1000.00, no line discount, 19 % VAT.
    const withoutDiscount = invoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 100_000, discountBp: 0, taxRateBp: 1900 }],
    });
    expect(withoutDiscount.taxMinor).toBe(19_000);
    expect(withoutDiscount.totalMinor).toBe(119_000);

    // 10 % off the invoice: base 90000, VAT must be 17100, not 19000.
    const withDiscount = invoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 100_000, discountBp: 0, taxRateBp: 1900 }],
      globalDiscountMinor: 10_000,
    });
    expect(withDiscount.subtotalMinor).toBe(100_000);
    expect(withDiscount.globalDiscountMinor).toBe(10_000);
    expect(withDiscount.taxableBaseMinor).toBe(90_000);
    expect(withDiscount.taxMinor).toBe(17_100);
    expect(withDiscount.totalMinor).toBe(107_100);
  });

  it("regression: the former implementation charged 119000 instead of 107100", () => {
    // This is the exact shape of the pre-fix defect: VAT computed on the
    // pre-discount subtotal. The value below must NOT come back.
    const totals = invoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 100_000, discountBp: 0, taxRateBp: 1900 }],
      globalDiscountMinor: 10_000,
    });
    expect(totals.totalMinor).not.toBe(109_000 - 19_000 + 19_000);
    expect(totals.totalMinor).toBe(107_100);
  });

  it("includes shipping without taxing it", () => {
    const totals = invoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 100_000, discountBp: 0, taxRateBp: 1900 }],
      globalDiscountMinor: 10_000,
      shippingMinor: 2_000,
    });
    expect(totals.taxMinor).toBe(17_100);
    expect(totals.totalMinor).toBe(90_000 + 2_000 + 17_100);
  });

  it("combines a line discount and a global discount", () => {
    // line: 10 x 100.00, 10 % line discount -> base 90000, 19 % VAT -> 17100
    // global: 5 % of subtotal (90000) = 4500 -> base 85500
    // VAT relief: 17100 * 4500 / 90000 = 855 -> VAT 16245
    const totals = invoiceTotals({
      items: [{ quantity: 10, unitPriceMinor: 10_000, discountBp: 1000, taxRateBp: 1900 }],
      globalDiscountMinor: 4_500,
    });
    expect(totals.subtotalMinor).toBe(90_000);
    expect(totals.taxableBaseMinor).toBe(85_500);
    expect(totals.taxMinor).toBe(16_245);
    expect(totals.totalMinor).toBe(101_745);
  });

  it("never pays back VAT when the discount is applied", () => {
    const items = [{ quantity: 2, unitPriceMinor: 12_345, discountBp: 750, taxRateBp: 1900 }];
    const before = invoiceTotals({ items });
    const after = invoiceTotals({ items, globalDiscountMinor: 1_111 });
    expect(after.taxMinor).toBeLessThanOrEqual(before.taxMinor);
  });

  it("clamps a global discount larger than the subtotal instead of going negative", () => {
    const totals = invoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 1_000, discountBp: 0, taxRateBp: 1900 }],
      globalDiscountMinor: 5_000,
    });
    expect(totals.globalDiscountMinor).toBe(1_000);
    expect(totals.taxableBaseMinor).toBe(0);
    expect(totals.taxMinor).toBe(0);
    expect(totals.totalMinor).toBe(0);
  });

  it("is independent of line order", () => {
    const a = { quantity: 3, unitPriceMinor: 3_333, discountBp: 333, taxRateBp: 1900 };
    const b = { quantity: 7, unitPriceMinor: 1_999, discountBp: 0, taxRateBp: 900 };
    const c = { quantity: 0.125, unitPriceMinor: 999_999, discountBp: 1250, taxRateBp: 1900 };

    const forward = invoiceTotals({ items: [a, b, c], globalDiscountMinor: 12_345 });
    const reverse = invoiceTotals({ items: [c, b, a], globalDiscountMinor: 12_345 });
    expect(reverse.totalMinor).toBe(forward.totalMinor);
    expect(reverse.taxMinor).toBe(forward.taxMinor);
    expect(reverse.subtotalMinor).toBe(forward.subtotalMinor);
  });

  it("produces integers for every monetary output", () => {
    const totals = invoiceTotals({
      items: [
        { quantity: 1.333, unitPriceMinor: 7_777, discountBp: 617, taxRateBp: 1900 },
        { quantity: 0.007, unitPriceMinor: 123_457, discountBp: 1_499, taxRateBp: 900 },
      ],
      globalDiscountMinor: 999,
      shippingMinor: 501,
    });
    for (const value of [totals.subtotalMinor, totals.taxMinor, totals.totalMinor, totals.taxableBaseMinor]) {
      expect(Number.isInteger(value)).toBe(true);
    }
    for (const line of totals.lines) {
      expect(Number.isInteger(line.totalMinor)).toBe(true);
      expect(Number.isInteger(line.taxMinor)).toBe(true);
    }
  });

  it("sums rounded lines rather than rounding the sum", () => {
    // 3 lines of 0.005-ish produce different results under the two orders.
    const items = [
      { quantity: 1, unitPriceMinor: 333, discountBp: 0, taxRateBp: 1900 },
      { quantity: 1, unitPriceMinor: 333, discountBp: 0, taxRateBp: 1900 },
      { quantity: 1, unitPriceMinor: 333, discountBp: 0, taxRateBp: 1900 },
    ];
    const totals = invoiceTotals({ items });
    // Per-line VAT = round(333 * 0.19) = 63 each -> 189.
    // Rounding the sum instead would give round(999 * 0.19) = 190.
    expect(totals.taxMinor).toBe(189);
  });
});

describe("fromMinor / toMinor", () => {
  it("round-trips integer minor units", () => {
    expect(fromMinor(1234)).toBe(12.34);
    expect(toMinor(fromMinor(1234))).toBe(1234);
    expect(fromMinor(null)).toBe(0);
    expect(fromMinor(undefined)).toBe(0);
  });
});
