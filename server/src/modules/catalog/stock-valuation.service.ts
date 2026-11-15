import { Injectable } from "@nestjs/common";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { products, stockMovements } from "../../db/schema";
import {
  expiringSoon,
  inventoryValue,
  issue,
  orderLayers,
  ValuationError,
  type CostLayer,
  type CostingMethod,
} from "../../../lib/algorithms/valuation";
import { fromMinor } from "../../shared/money";

type Ctx = { tenantId: string };

export type ProductValuation = {
  productId: string;
  method: CostingMethod;
  quantity: number;
  valueMinor: number;
  unitCostMinor: number;
  layers: CostLayer[];
};

/**
 * Inventory valuation from the movement history.
 *
 * Why this exists
 * ---------------
 * Stock was valued as `quantity * products.cost_minor`: a single mutable cost
 * per product. Change the cost and every unit already in the warehouse is
 * retroactively revalued, so the stock report stops agreeing with what was
 * actually paid, and the cost of goods sold for a closed month changes after
 * the fact. `stock_movements.unit_cost_minor` has been recorded all along; this
 * turns that history into layers and values them properly.
 *
 * The arithmetic lives in `lib/algorithms/valuation.ts`, which is
 * framework-agnostic and property-tested (value conservation across every
 * method). This service only does I/O and reconstruction.
 */
@Injectable()
export class StockValuationService {
  /**
   * Builds cost layers for one product from its movements, then issues the
   * outbound movements against them under the tenant's method.
   *
   * O(m log m) in the product's movement count: one pass to collect receipts,
   * one sort per issue. A product with 10 000 movements is 10 000 rows, which
   * is cheap compared with the full stock report; a per-product ledger table
   * would be the next step if that stops being true.
   */
  async valueProduct(ctx: Ctx, productId: string, method: CostingMethod = "fifo"): Promise<ProductValuation> {
    const db = getDb();
    const movements = await db
      .select({
        id: stockMovements.id,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        unitCostMinor: stockMovements.unitCostMinor,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.tenantId, ctx.tenantId),
          eq(stockMovements.productId, productId),
        ),
      )
      // Sequence comes from insertion order: `created_at` can tie when several
      // movements land in the same millisecond, and `id` breaks the tie
      // deterministically so two runs never disagree.
      .orderBy(asc(stockMovements.createdAt), asc(stockMovements.id));

    let layers: CostLayer[] = [];
    let valueMinor = 0;
    let sequence = 0;

    for (const movement of movements) {
      // Numeric columns come back as strings; quantities may be fractional
      // (3 decimals) but cost layers are counted in whole units. A fractional
      // quantity cannot be represented in a layer, so it is rejected loudly
      // rather than silently truncated — truncating would invent or destroy
      // units and every later valuation would be wrong.
      const quantity = Number(movement.quantity);
      const unitCostMinor = Number(movement.unitCostMinor);

      if (movement.type === "in") {
        if (!Number.isInteger(quantity)) {
          throw new ValuationError(
            "FRACTIONAL_QUANTITY",
            `movement ${movement.id} has a fractional quantity (${quantity}); cost layers require whole units`,
          );
        }
        if (quantity <= 0) continue;
        sequence += 1;
        layers = [
          ...layers,
          { layerId: movement.id, quantity, unitCostMinor, sequence, expiresOn: null },
        ];
        valueMinor += quantity * unitCostMinor;
        continue;
      }

      if (movement.type === "out") {
        // Movement quantities are stored signed for `out`, so take the absolute
        // value: a negative quantity here means "remove", not "add".
        const outgoing = Math.abs(quantity);
        if (outgoing === 0) continue;
        if (!Number.isInteger(outgoing)) {
          throw new ValuationError(
            "FRACTIONAL_QUANTITY",
            `movement ${movement.id} has a fractional quantity (${outgoing}); cost layers require whole units`,
          );
        }
        // Under WAC the value must be carried forward, so pass it in.
        const result = issue(layers, outgoing, method, { valueMinor });
        layers = result.remaining;
        valueMinor = result.remainingValueMinor ?? inventoryValue(layers).valueMinor;
        continue;
      }

      // `adjustment` sets an absolute level and `transfer` moves between
      // locations; neither has a recoverable cost basis here. They are skipped
      // rather than guessed at — see the residual risks in docs/adr/0005.
    }

    const quantity = layers.reduce((sum, layer) => sum + layer.quantity, 0);
    return {
      productId,
      method,
      quantity,
      valueMinor,
      unitCostMinor: quantity === 0 ? 0 : Math.round(valueMinor / quantity),
      layers,
    };
  }

  /**
   * Values the whole catalogue.
   *
   * Batches the movement query by product so a catalogue of 2 000 products does
   * not issue 2 000 round trips.
   */
  async valueAll(ctx: Ctx, method: CostingMethod = "fifo"): Promise<{
    method: CostingMethod;
    totalValueMinor: number;
    totalQuantity: number;
    products: ProductValuation[];
    /** Products whose movement history is inconsistent. Excluded from the totals. */
    problems: Array<{ productId: string; code: string; message: string }>;
  }> {
    const db = getDb();
    const active = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)));

    // One query for every movement, grouped in memory. The alternative — a
    // query per product — is the N+1 that this method exists to avoid.
    const allMovements =
      active.length === 0
        ? []
        : await db
            .select({
              productId: stockMovements.productId,
              id: stockMovements.id,
              type: stockMovements.type,
              quantity: stockMovements.quantity,
              unitCostMinor: stockMovements.unitCostMinor,
            })
            .from(stockMovements)
            .where(
              and(
                eq(stockMovements.tenantId, ctx.tenantId),
                inArray(
                  stockMovements.productId,
                  active.map((product) => product.id),
                ),
              ),
            )
            .orderBy(asc(stockMovements.createdAt), asc(stockMovements.id));

    const byProduct = new Map<string, typeof allMovements>();
    for (const movement of allMovements) {
      const list = byProduct.get(movement.productId) ?? [];
      list.push(movement);
      byProduct.set(movement.productId, list);
    }

    const valuations: ProductValuation[] = [];
    const problems: Array<{ productId: string; code: string; message: string }> = [];
    let totalValueMinor = 0;
    let totalQuantity = 0;

    for (const product of active) {
      const movements = byProduct.get(product.id);
      if (!movements || movements.length === 0) continue;

      // One inconsistent product must not take down the whole report. A single
      // oversold history would otherwise make the stock dashboard unrenderable
      // for every other product — the failure mode you least want in an
      // exception-only view. The bad product is reported, not hidden.
      try {
        let layers: CostLayer[] = [];
        let valueMinor = 0;
        let sequence = 0;
        for (const movement of movements) {
          const quantity = Number(movement.quantity);
          const unitCostMinor = Number(movement.unitCostMinor);
          if (movement.type === "in") {
            if (!Number.isInteger(quantity) || quantity <= 0) continue;
            sequence += 1;
            layers = [...layers, { layerId: movement.id, quantity, unitCostMinor, sequence, expiresOn: null }];
            valueMinor += quantity * unitCostMinor;
          } else if (movement.type === "out") {
            const outgoing = Math.abs(quantity);
            if (!Number.isInteger(outgoing) || outgoing === 0) continue;
            const result = issue(layers, outgoing, method, { valueMinor });
            layers = result.remaining;
            valueMinor = result.remainingValueMinor ?? inventoryValue(layers).valueMinor;
          }
        }
        const quantity = layers.reduce((sum, layer) => sum + layer.quantity, 0);
        if (quantity === 0 && valueMinor === 0) continue;
        valuations.push({
          productId: product.id,
          method,
          quantity,
          valueMinor,
          unitCostMinor: quantity === 0 ? 0 : Math.round(valueMinor / quantity),
          layers,
        });
        totalValueMinor += valueMinor;
        totalQuantity += quantity;
      } catch (error) {
        problems.push({
          productId: product.id,
          code: error instanceof ValuationError ? error.code : "VALUATION_FAILED",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { method, totalValueMinor, totalQuantity, products: valuations, problems };
  }

  /**
   * Stock value for the dashboard statistic.
   *
   * Replaces `sum(quantity * products.cost_minor)`. Returns both figures so the
   * discrepancy stays visible instead of being silently swapped: a large gap
   * means the product cost column is stale, which is information the operator
   * needs rather than something to hide.
   */
  async summary(ctx: Ctx, method: CostingMethod = "fifo") {
    const db = getDb();
    const [legacy] = await db
      .select({
        legacyValueMinor: sql<string>`coalesce(sum(coalesce(${sql.identifier("sl")}.quantity, 0) * ${products.costMinor}), 0)`,
      })
      .from(products)
      .leftJoin(sql`stock_levels sl`, sql`sl.product_id = ${products.id} and sl.tenant_id = ${products.tenantId}`)
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)));

    const valued = await this.valueAll(ctx, method);
    const legacyValueMinor = Math.round(Number(legacy?.legacyValueMinor ?? 0));

    return {
      method,
      valuedQuantity: valued.totalQuantity,
      valuedAmount: fromMinor(valued.totalValueMinor),
      valuedAmountMinor: valued.totalValueMinor,
      // The figure the dashboard used to show, kept for comparison and for one
      // release of backwards compatibility on the API.
      staticCostAmount: fromMinor(legacyValueMinor),
      staticCostAmountMinor: legacyValueMinor,
      /** value(METHOD) - quantity * product.cost. Non-zero means costs drift. */
      differenceMinor: valued.totalValueMinor - legacyValueMinor,
      productCount: valued.products.length,
      /** Excluded from the totals; surfaced so bad history is not silent. */
      problems: valued.problems,
    };
  }

  /** Layers of one product, ordered for reporting. */
  async layers(ctx: Ctx, productId: string, method: CostingMethod = "fifo"): Promise<CostLayer[]> {
    const valuation = await this.valueProduct(ctx, productId, method);
    return orderLayers(valuation.layers, method);
  }

  /**
   * Batches expiring within `withinDays`, across the catalogue.
   *
   * Layers carry no expiry today because `stock_movements` has no expiry column;
   * this returns an empty list until that column exists, and says so rather than
   * inventing dates. The function is here so the report has a stable contract.
   */
  async expiring(ctx: Ctx, withinDays: number, asOf: string) {
    void ctx;
    void withinDays;
    void asOf;
    return expiringSoon([], asOf, withinDays);
  }
}
