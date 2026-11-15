# ADR 0002 — Money and discount contract

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Product owner, Principal Architect
- **Supersedes:** nothing. **Corrects:** audit finding C1/DB-1 (retracted, see `docs/audit/AUDIT.md` Erratum E-1).
- **Related:** `server/src/shared/money.ts`, `server/src/shared/money.test.ts`, `server/src/db/scripts/inspect-discounts.ts`

---

## Context

Invoice totals in this system are fiscal figures: they appear on documents sent
to customers and are declared to the tax authority. Two things must therefore
hold:

1. **No floating-point money is ever persisted or summed.** Binary floats
   cannot represent most decimal amounts exactly, so the same invoice can
   total differently depending on the order in which lines are added.
2. **VAT must be charged on the taxable base actually invoiced** — that is,
   after every discount. Charging VAT on a pre-discount amount over-declares
   tax and over-bills the customer.

The pre-existing implementation violated (2) and had two competing
implementations of (1), described below.

### What existed before this decision

Three separate notions of "the discount" coexisted:

| Location | Unit | Meaning |
| --- | --- | --- |
| `invoices.dto.ts` `invoiceItemSchema.discount` | percentage 0–100 | per-line discount from the UI |
| `invoices.dto.ts` `createInvoiceSchema.discount` | major currency units | invoice-level discount |
| `invoices` table `discount_minor` | minor units | stored invoice-level discount |
| `invoice_items` table `discount_bp` | basis points 0–10000 | stored line discount |

The arithmetic was implemented twice: once in `server/src/shared/money.ts`
(`lineTotalMinor`, `invoiceTotals`) and, differently, in
`invoices.service.ts` (`computeLines`). Only the second was ever called — the
first had **zero consumers**, so the "documented" contract in `money.ts` was
not the contract in force.

### The defects this ADR resolves

1. **VAT on the wrong base.** `computeLines` computed each line's VAT from the
   line's own post-line-discount base, and the invoice-level discount was then
   subtracted from the total only. One line of 1000.00 at 19 % VAT with a
   100.00 invoice discount produced:

   ```text
   before: total = (1000.00 - 100.00) + 190.00 = 1090.00   tax = 190.00
   after:  total = (1000.00 - 100.00) + 171.00 = 1071.00   tax = 171.00
   ```

   The discount must reduce the taxable base, so VAT is 171.00, not 190.00.

2. **Silent precision loss.** `toMinor()` was `Math.round(major * 100)`, so an
   ambiguous amount such as `12.345` became `1235` without warning.

3. **Unenforced rate range.** A discount above 100 % or a negative rate passed
   Zod (`min(0)`/no max on some fields) and produced negative money.

---

## Decision

### D1. Integer representation

- **Money** is stored and computed as integer **minor units** (`bigint` in the
  DB; `number` in JS, safe for DZD amounts — see the residual risk below).
- **Rates** (discount, VAT) are stored and computed as integer **basis
  points**, `0…10000`, where `10000 bp = 100 %`.
- **Quantities** are scaled to integer thousandths (`numeric(18,3)`).

### D2. Conversion happens exactly once, at the API boundary

- The API and UI exchange **percentages** `0…100` with **at most 2 decimals**.
- `percentToBp(percent)` converts to basis points exactly once, in the service
  layer, and **throws** `MoneyError("RATE_PRECISION")` for e.g. `12.345`
  rather than rounding it. A silent 0.05 % error compounds across lines.
- Prices use `toMinorStrict()`, which rejects sub-cent precision. The lenient
  `toMinor()` remains for internal, already-validated callers.
- Responses convert back with `bpToPercent()` / `fromMinor()`.

### D3. Rounding is half-away-from-zero, per line, in a fixed order

```text
gross    = round(qty_milli * unitPriceMinor / 1000)
discount = round(gross * discountBp / 10000)
base     = gross - discount
tax      = round(base * taxRateBp / 10000)
total    = base + tax
```

Lines are rounded individually and then summed. **Rounding the sum instead is a
different answer and is forbidden** — a test pins the difference
(three lines of 333 at 19 % give 189, not 190).

### D4. The invoice-level discount reduces the taxable base

Shipping is added after tax and is not taxed (documented simplification; see
Consequences). The invoice-level discount is clamped to the subtotal so the
taxable base can never go negative, and the per-line VAT is relieved pro-rata:

```text
taxableBase = subtotal - min(globalDiscount, subtotal)
taxRelief   = round(lineTax * globalDiscount / subtotal)
tax         = max(0, lineTax - taxRelief)
total       = taxableBase + shipping + tax
```

### D5. One implementation

`server/src/shared/money.ts` is the only place money arithmetic may live.
Services must call `invoiceTotals()` / `lineAmounts()`; they may not re-derive
totals. The duplicated `computeLines` in `invoices.service.ts` was reduced to a
thin DTO adapter over this module.

---

## Consequences

### Positive

- Every monetary output is an integer; totals are independent of line order
  (property-tested).
- VAT is correct for discounted invoices; the over-declaration is gone.
- Invalid precision and out-of-range rates fail loudly with a field-level 400
  instead of silently producing wrong money.
- One contract to learn, one place to change, 24 tests pinning it.

### Negative / accepted costs

- **Behavioural change.** Invoices carrying an invoice-level discount now have
  a different (lower, correct) total and tax. Historical rows were **not**
  rewritten: issued documents keep their stored figures. Re-issuing or
  correcting an issued invoice must go through a credit note, not an update.
  This is a fiscal decision for the product owner, not an engineering one.
- **Shipping is untaxed.** Real Algerian practice may tax delivery. Changing
  this is a one-line change in `invoiceTotals`, but it changes totals, so it
  needs its own ADR.
- **`bigint` is exposed as JS `number`.** Amounts above `2^53` minor units
  (≈ 90 trillion DZD) would lose precision. Accepted for DZD; revisit before
  multi-currency support.

### Residual risks

- The invoice-level discount is still expressed in major units at the DTO
  boundary (`discount: number`), unlike rates which are percentages. It is
  converted with `toMinorStrict`, so precision is safe, but a future
  refactor should make the unit explicit in the field name (`discountMinor`).
- `invoiceTotals` taxes each line at its own rate before applying the global
  discount pro-rata across all lines. For invoices that mix VAT rates *and*
  carry an invoice-level discount, the pro-rata relief is proportional to
  total line tax rather than per rate band. This is correct in total but can
  differ by a few minor units from a per-rate-band allocation. Acceptable for
  single-rate Algerian invoices (19 % or 9 %); needs revisiting if mixed-rate
  invoices with global discounts become common.

---

## Data migration

**None.** No schema change and no backfill were performed, because:

1. The stored representation was already correct (percent → bp was fine).
2. Rewriting issued invoices would falsify historical fiscal documents.

Operators who want to know whether their data is internally consistent can run:

```bash
cd server && npm run db:inspect-discounts
```

It recomputes every invoice line from its stored basis points and exits
non-zero if any row disagrees, listing samples. It is read-only and safe
against production.

---

## Verification

- `server/src/shared/money.test.ts` — 24 tests: `0 %`, `100 %`, `12.5 %`,
  rejected `>2` decimals, rejected out-of-range rates, global discount + VAT,
  shipping, clamping, order independence, integer-only outputs, per-line vs
  summed rounding.
- `server/src/test/api.e2e.test.ts` — the end-to-end invoice now asserts
  `subtotal 180.00`, `tax 33.25`, `total 228.25` for a line-discounted,
  invoice-discounted, shipped invoice (previously `34.20` / `229.20`).
- `server/src/db/scripts/inspect-discounts.ts` — verified to flag a
  deliberately wrong-scale row and pass a correct one.
