/**
 * Discount-scale inspection (READ-ONLY).
 *
 * Run this BEFORE changing any discount code, to find rows persisted at the
 * wrong scale. The agreed contract is:
 *
 *   API/UI input : percentage, 0-100, max 2 decimals
 *   Storage/DB   : integer basis points (bp), 0-10000, column `discount_bp`
 *   Conversion   : bp = round(percent * 100)   <- exactly once, at the boundary
 *
 * A plain histogram is not enough: a 10% discount stored as 1000 bp (correct)
 * and one stored as 10 bp (wrong scale) both look plausible alone. So every
 * line is RECOMPUTED from its stored basis points and compared against the
 * stored money columns:
 *
 *   gross        = round(quantity * unitPriceMinor)
 *   lineDiscount = round(gross * discountBp / 10000)
 *   lineBase     = gross - lineDiscount
 *   lineTax      = round(lineBase * taxRateBp / 10000)
 *   lineTotal    = lineBase + lineTax
 *
 * A large share of disagreements means the data was written with another scale.
 *
 * Usage (never writes):
 *   cd server && npm run db:inspect-discounts
 *
 * Exit codes: 0 = clean, 1 = suspect rows found, 2 = could not run.
 */
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { closeDb, getDb, initDb } from "../client";
import { migrate } from "../migrate";
import { invoiceItems, invoices } from "../schema";

process.env.NODE_ENV ??= "development";
process.env.JWT_SECRET ??= "inspection-only-secret-at-least-24-chars";
process.env.PGLITE_DATA_DIR ??= `.data/inspect-${randomUUID()}`;
mkdirSync(process.env.PGLITE_DATA_DIR, { recursive: true });

const MAX_BP = 10_000;

/** Mirrors the half-up rounding contract used by the invoice service. */
function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

type Row = {
  invoiceNumber: string;
  status: string;
  quantity: string;
  unitPriceMinor: number;
  discountBp: number;
  taxRateBp: number;
  storedTaxMinor: number;
  storedLineTotalMinor: number;
};

function pct(count: number, total: number): string {
  return total === 0 ? "n/a" : `${((count / total) * 100).toFixed(2)}%`;
}

function histogram(values: number[]): string {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 15)
    .map(([value, n]) => `    ${String(value).padStart(6)} bp  (${(value / 100).toFixed(2).padStart(6)} %)  x${n}`)
    .join("\n");
}

async function main(): Promise<number> {
  await initDb();
  // Ensure the schema exists (no-op when migrations are already applied).
  await migrate();

  const rows: Row[] = await getDb()
    .select({
      invoiceNumber: invoices.number,
      status: invoices.status,
      quantity: invoiceItems.quantity,
      unitPriceMinor: invoiceItems.unitPriceMinor,
      discountBp: invoiceItems.discountBp,
      taxRateBp: invoiceItems.taxRateBp,
      storedTaxMinor: invoiceItems.taxMinor,
      storedLineTotalMinor: invoiceItems.lineTotalMinor,
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id));

  console.log("=".repeat(72));
  console.log("DISCOUNT SCALE INSPECTION (read-only)");
  console.log("=".repeat(72));
  console.log(`invoice lines scanned : ${rows.length}`);

  if (rows.length === 0) {
    console.log("\nNo invoice lines present. Nothing to verify.");
    return 0;
  }

  const discounted = rows.filter((row) => row.discountBp > 0);
  console.log(`lines with a discount : ${discounted.length} (${pct(discounted.length, rows.length)})`);

  const discountOutOfRange = rows.filter((row) => row.discountBp < 0 || row.discountBp > MAX_BP);
  const taxOutOfRange = rows.filter((row) => row.taxRateBp < 0 || row.taxRateBp > MAX_BP);

  console.log("\n-- distinct discount_bp (top 15) --");
  console.log(histogram(rows.map((row) => row.discountBp)));
  console.log("\n-- distinct tax_rate_bp (top 15) --");
  console.log(histogram(rows.map((row) => row.taxRateBp)));

  console.log("\n-- range violations --");
  console.log(`  discount_bp outside 0..${MAX_BP} : ${discountOutOfRange.length}`);
  console.log(`  tax_rate_bp outside 0..${MAX_BP} : ${taxOutOfRange.length}`);

  let taxMismatch = 0;
  let totalMismatch = 0;
  const samples: string[] = [];

  for (const row of rows) {
    const gross = roundHalfUp(Number(row.quantity) * Number(row.unitPriceMinor));
    const lineBase = gross - roundHalfUp((gross * row.discountBp) / MAX_BP);
    const expectedTax = roundHalfUp((lineBase * row.taxRateBp) / MAX_BP);
    const expectedTotal = lineBase + expectedTax;

    const taxDiffers = expectedTax !== Number(row.storedTaxMinor);
    const totalDiffers = expectedTotal !== Number(row.storedLineTotalMinor);
    if (taxDiffers) taxMismatch += 1;
    if (totalDiffers) totalMismatch += 1;

    if ((taxDiffers || totalDiffers) && samples.length < 10) {
      samples.push(
        `    ${row.invoiceNumber} [${row.status}] qty=${Number(row.quantity)} unit=${row.unitPriceMinor} ` +
          `disc=${row.discountBp}bp tax=${row.taxRateBp}bp | expected tax=${expectedTax} total=${expectedTotal} ` +
          `vs stored tax=${row.storedTaxMinor} total=${row.storedLineTotalMinor}`,
      );
    }
  }

  console.log("\n-- recomputation from stored basis points --");
  console.log(`  tax_minor mismatch        : ${taxMismatch} (${pct(taxMismatch, rows.length)})`);
  console.log(`  line_total_minor mismatch : ${totalMismatch} (${pct(totalMismatch, rows.length)})`);
  if (samples.length > 0) {
    console.log("  samples:");
    for (const sample of samples) console.log(sample);
  }

  const suspect = discountOutOfRange.length + taxOutOfRange.length + taxMismatch + totalMismatch;

  console.log("\n-- verdict --");
  if (suspect === 0) {
    console.log("  CLEAN: all rows are consistent with percent-in / basis-points-stored.");
    return 0;
  }
  console.log(`  SUSPECT: ${suspect} finding(s). Investigate before changing discount code.`);
  console.log("  Do NOT rewrite issued invoices — raise a credit note instead (see docs/adr/).");
  return 1;
}

main()
  .then(async (code) => {
    await closeDb();
    process.exit(code);
  })
  .catch(async (error) => {
    console.error("Inspection failed:", error instanceof Error ? error.message : error);
    await closeDb().catch(() => undefined);
    process.exit(2);
  });
