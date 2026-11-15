/**
 * Money arithmetic — the single source of truth.
 *
 * CONTRACT (see docs/adr/0002-money-and-discount-contract.md)
 * ---------------------------------------------------------------------------
 * 1. Storage and all internal arithmetic use INTEGER MINOR UNITS of the
 *    currency (DZD centimes here) and INTEGER BASIS POINTS for every rate.
 *    No floating-point money ever reaches the database.
 * 2. Rates cross the API boundary as PERCENTAGES (0-100, max 2 decimals) and
 *    are converted to basis points exactly once, here, via `percentToBp`.
 *    Inputs with more than 2 decimals are REJECTED, never silently rounded.
 * 3. Rounding is half-away-from-zero, applied per line in a fixed order
 *    (documented below). Summing rounded lines must never be replaced by
 *    rounding a sum: the order is part of the contract and is tested.
 * 4. The GLOBAL invoice discount reduces the TAXABLE BASE, so VAT is computed
 *    on the net amount. The per-line tax is therefore reduced pro-rata by the
 *    global discount.
 *
 * Debits, credits and every derived amount below are integers (or integer
 * results of half-up rounding). Division only ever happens inside
 * `roundHalfUp`-guarded expressions.
 */

/** 10_000 basis points = 100 %. */
export const BP_SCALE = 10_000;
/** Quantities are stored as numeric(18,3): three decimal places. */
export const QUANTITY_SCALE = 1_000;
/** Major -> minor unit factor (2 decimal currency). */
export const MINOR_SCALE = 100;

export type Minor = number;
export type BasisPoints = number;

/** Thrown when a caller hands over a value that cannot be represented exactly. */
export class MoneyError extends Error {
  constructor(
    message: string,
    public readonly field = "_root",
    public readonly code = "INVALID_AMOUNT",
  ) {
    super(message);
    this.name = "MoneyError";
  }
}

/**
 * Half-up rounding, away from zero (the accounting convention used by the
 * invoice engine). Kept exported because it is the primitive every other
 * helper uses and because tests pin its behaviour.
 */
export function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

function assertFinite(value: number, field: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MoneyError(`Value must be a finite number (${field})`, field);
  }
}

/**
 * Percentage (0-100, max 2 decimals) -> basis points (0-10000).
 *
 * `12.5` -> `1250`. Rejects `12.345` rather than storing `1235` (a silent
 * 0.05 % error that would compound across invoice lines).
 */
export function percentToBp(percent: number, field = "rate"): BasisPoints {
  assertFinite(percent, field);
  if (percent < 0 || percent > 100) {
    throw new MoneyError(`Percentage must be between 0 and 100 (${field})`, field, "RATE_OUT_OF_RANGE");
  }
  const scaled = percent * (BP_SCALE / 100);
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) > 1e-7) {
    throw new MoneyError(`Percentage must have at most 2 decimals (${field})`, field, "RATE_PRECISION");
  }
  return rounded;
}

/** Basis points (0-10000) -> percentage, for API responses. `1250` -> `12.5`. */
export function bpToPercent(bp: BasisPoints): number {
  return bp / (BP_SCALE / 100);
}

/**
 * Major units -> integer minor units, REJECTING sub-cent precision.
 *
 * Used at the API boundary so an ambiguous price such as `12.345` fails loudly
 * instead of becoming `1235` or `1234` depending on the rounding mode.
 */
export function toMinorStrict(major: number, field = "amount"): Minor {
  assertFinite(major, field);
  const scaled = major * MINOR_SCALE;
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) > 1e-7) {
    throw new MoneyError(`Amount must have at most 2 decimals (${field})`, field, "AMOUNT_PRECISION");
  }
  return rounded;
}

/**
 * Major units -> integer minor units (lenient).
 *
 * Kept for internal callers that already hold validated numbers. Prefer
 * `toMinorStrict` on any path that accepts user input.
 */
export function toMinor(major: number): Minor {
  if (!Number.isFinite(major)) return 0;
  return Math.round(major * MINOR_SCALE);
}

/** Integer minor units -> major units, for API responses. */
export function fromMinor(minor: number | null | undefined): number {
  return Number(minor ?? 0) / MINOR_SCALE;
}

/**
 * Quantity (0-3 decimals) -> integer thousandths, rejecting finer precision.
 * Exact integer arithmetic afterwards avoids `0.1 + 0.2` style drift.
 */
export function toQuantityMilli(quantity: number, field = "quantity"): number {
  assertFinite(quantity, field);
  const scaled = quantity * QUANTITY_SCALE;
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) > 1e-7) {
    throw new MoneyError(`Quantity must have at most 3 decimals (${field})`, field, "QUANTITY_PRECISION");
  }
  return rounded;
}

export type LineInput = {
  /** Decimal quantity, at most 3 decimals. */
  quantity: number;
  /** Unit price in integer minor units. */
  unitPriceMinor: Minor;
  /** Line discount in basis points (0-10000). */
  discountBp: BasisPoints;
  /** VAT rate in basis points (0-10000). */
  taxRateBp: BasisPoints;
};

export type LineAmounts = {
  /** quantity * unit price, before discount. */
  grossMinor: Minor;
  /** Discount amount in minor units. */
  discountMinor: Minor;
  /** Net amount before tax (the taxable base of the line). */
  baseMinor: Minor;
  /** VAT on the line, before any global discount. */
  taxMinor: Minor;
  /** baseMinor + taxMinor. */
  totalMinor: Minor;
};

/**
 * Computes one invoice line. Rounding order (part of the contract):
 *
 *   gross    = round(qty_milli * unitPriceMinor / 1000)
 *   discount = round(gross * discountBp / 10000)
 *   base     = gross - discount
 *   tax      = round(base * taxRateBp / 10000)
 *   total    = base + tax
 */
export function lineAmounts(input: LineInput, field = "items"): LineAmounts {
  if (input.unitPriceMinor < 0) throw new MoneyError("Unit price cannot be negative", `${field}.unitPrice`);
  if (input.discountBp < 0 || input.discountBp > BP_SCALE) {
    throw new MoneyError("Line discount must be between 0 and 10000 bp", `${field}.discount`, "RATE_OUT_OF_RANGE");
  }
  if (input.taxRateBp < 0 || input.taxRateBp > BP_SCALE) {
    throw new MoneyError("Tax rate must be between 0 and 10000 bp", `${field}.taxRate`, "RATE_OUT_OF_RANGE");
  }

  const quantityMilli = toQuantityMilli(input.quantity, `${field}.quantity`);
  const grossMinor = roundHalfUp((quantityMilli * input.unitPriceMinor) / QUANTITY_SCALE);
  const discountMinor = roundHalfUp((grossMinor * input.discountBp) / BP_SCALE);
  const baseMinor = grossMinor - discountMinor;
  const taxMinor = roundHalfUp((baseMinor * input.taxRateBp) / BP_SCALE);

  return { grossMinor, discountMinor, baseMinor, taxMinor, totalMinor: baseMinor + taxMinor };
}

export type InvoiceTotalsInput = {
  items: LineInput[];
  /** Invoice-level discount in minor units, applied to the taxable base. */
  globalDiscountMinor?: Minor;
  /** Shipping in minor units; not taxable (documented simplification). */
  shippingMinor?: Minor;
};

export type InvoiceTotals = {
  lines: LineAmounts[];
  /** Sum of the per-line net amounts, before the global discount. */
  subtotalMinor: Minor;
  /** Per-line VAT, before the global discount is taken into account. */
  lineTaxMinor: Minor;
  /** The global discount actually applied (clamped to the subtotal). */
  globalDiscountMinor: Minor;
  /** subtotal - global discount: what VAT is charged on. */
  taxableBaseMinor: Minor;
  /** VAT actually charged, net of the pro-rata global-discount relief. */
  taxMinor: Minor;
  totalMinor: Minor;
};

/**
 * Computes invoice totals for a set of lines.
 *
 * Guarantees (property-tested):
 *  - `totalMinor` is independent of the order of `items`.
 *  - `taxMinor >= 0`, `taxableBaseMinor >= 0`, `totalMinor >= 0` for
 *    non-negative inputs, provided the global discount does not exceed the
 *    subtotal (clamped if it does).
 *  - Applying a global discount never increases the VAT due.
 */
export function invoiceTotals(input: InvoiceTotalsInput): InvoiceTotals {
  const lines = input.items.map((item, index) => lineAmounts(item, `items[${index}]`));

  const subtotalMinor = lines.reduce((sum, line) => sum + line.baseMinor, 0);
  const lineTaxMinor = lines.reduce((sum, line) => sum + line.taxMinor, 0);

  const requestedDiscount = input.globalDiscountMinor ?? 0;
  if (requestedDiscount < 0) throw new MoneyError("Global discount cannot be negative", "discount");
  // A discount larger than the subtotal would make the base negative; clamp it
  // rather than emitting a negative VAT base.
  const globalDiscountMinor = Math.min(requestedDiscount, subtotalMinor);
  const taxableBaseMinor = subtotalMinor - globalDiscountMinor;

  // Pro-rata reduction of the VAT so that the global discount reduces the
  // taxable base: tax_after = lineTax * (taxableBase / subtotal).
  const taxRelief =
    subtotalMinor === 0 ? 0 : roundHalfUp((lineTaxMinor * globalDiscountMinor) / subtotalMinor);
  const taxMinor = Math.max(0, lineTaxMinor - taxRelief);

  const shippingMinor = input.shippingMinor ?? 0;
  if (shippingMinor < 0) throw new MoneyError("Shipping cannot be negative", "shipping");

  return {
    lines,
    subtotalMinor,
    lineTaxMinor,
    globalDiscountMinor,
    taxableBaseMinor,
    taxMinor,
    totalMinor: taxableBaseMinor + shippingMinor + taxMinor,
  };
}
