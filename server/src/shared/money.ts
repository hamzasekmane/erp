/**
 * Money helpers — all amounts are integer minor units (see docs/02-architecture.md §8).
 * Rounding is half-up, applied per line before summing (documented order).
 */
export function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

export function lineTotalMinor(input: {
  quantity: number;
  unitPriceMinor: number;
  discountBp?: number;
}): number {
  const discountBp = clampBp(input.discountBp ?? 0);
  const gross = input.quantity * input.unitPriceMinor;
  return roundHalfUp((gross * (10_000 - discountBp)) / 10_000);
}

export function taxMinor(lineTotal: number, taxRateBp: number): number {
  return roundHalfUp((lineTotal * clampBp(taxRateBp)) / 10_000);
}

export function invoiceTotals(input: {
  items: Array<{ quantity: number; unitPriceMinor: number; discountBp?: number; taxRateBp?: number }>;
  discountMinor?: number;
  shippingMinor?: number;
}): { subtotalMinor: number; taxMinor: number; totalMinor: number } {
  let subtotal = 0;
  let tax = 0;
  for (const item of input.items) {
    const line = lineTotalMinor(item);
    subtotal += line;
    tax += taxMinor(line, item.taxRateBp ?? 0);
  }
  const total = subtotal - (input.discountMinor ?? 0) + (input.shippingMinor ?? 0) + tax;
  if (total < 0) throw new Error("Invoice total cannot be negative");
  return { subtotalMinor: subtotal, taxMinor: tax, totalMinor: total };
}

export function formatMinor(amountMinor: number, currency = "DZD", locale = "fr-FR"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountMinor / 100);
}

function clampBp(bp: number): number {
  if (!Number.isFinite(bp)) return 0;
  return Math.min(10_000, Math.max(0, Math.round(bp)));
}

/** Major units (what the UI shows, e.g. 1250.5 DA) -> integer minor units. */
export function toMinor(major: number): number {
  if (!Number.isFinite(major)) return 0;
  return Math.round(major * 100);
}

/** Integer minor units -> major units (number, for API responses consumed by the UI). */
export function fromMinor(minor: number | null | undefined): number {
  return Number(minor ?? 0) / 100;
}
