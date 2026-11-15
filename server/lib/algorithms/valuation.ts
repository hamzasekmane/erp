/**
 * Inventory cost-flow valuation: FIFO, LIFO, weighted average, FEFO.
 *
 * Framework-agnostic and dependency-free — no Nest, no Drizzle, no I/O — so it
 * can be property-tested exhaustively and reused by any caller.
 *
 * Why this exists
 * ---------------
 * Inventory was valued as `quantity * product.cost`, a single mutable number.
 * The moment a purchase changes the cost, every unit already in stock is
 * retroactively revalued: the stock report silently disagrees with what was
 * actually paid, and the cost of goods sold for a past month changes after the
 * fact. Cost-flow methods fix that by tracking the units actually held, each
 * with the cost it was bought at.
 *
 * Money model (docs/adr/0002): every amount is an integer in minor units. No
 * floating point anywhere, and every function rejects non-integers rather than
 * rounding. Where a division is unavoidable (weighted average), the remainder
 * is handled explicitly so the total value is preserved exactly.
 */

export type CostingMethod = "fifo" | "lifo" | "wac" | "fefo";

export class ValuationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ValuationError";
    this.code = code;
  }
}

/** A batch of units acquired at one cost, optionally expiring. */
export type CostLayer = {
  /** Correlates the layer with a purchase/receipt document. */
  layerId: string;
  /** Units remaining in this layer. Always > 0 while the layer is open. */
  quantity: number;
  /** Cost per unit, in minor units. */
  unitCostMinor: number;
  /** Acquisition order. Used by FIFO/LIFO; must be strictly increasing. */
  sequence: number;
  /** For FEFO: the date this batch expires, ISO `YYYY-MM-DD`. */
  expiresOn?: string | null;
};

export type Issue = {
  layerId: string;
  quantity: number;
  unitCostMinor: number;
  /** quantity * unitCostMinor. */
  costMinor: number;
};

export type IssueResult = {
  /** What was consumed, in the order it was consumed. */
  issues: Issue[];
  /** Total cost of the units consumed. */
  totalCostMinor: number;
  /** Layers that remain, with reduced quantities. */
  remaining: CostLayer[];
};

/**
 * Weighted-average issues additionally report the value still on hand.
 *
 * WAC is a moving valuation, not a set of priced batches: the layers only say
 * HOW MANY units remain, never what they are worth. Deriving the value back
 * from `unitCostMinor` therefore does not work under WAC — the per-unit average
 * is generally not an integer, so `quantity * unitCostMinor` drifts. The value
 * is carried explicitly here, and `remainingValueMinor` is the number to report.
 */
export type WeightedAverageResult = IssueResult & {
  averageCostMinor: number;
  remainingValueMinor: number;
};

function assertInteger(value: number, field: string): void {
  if (!Number.isInteger(value)) {
    throw new ValuationError("INVALID_NUMBER", `${field} must be an integer, got ${value}`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new ValuationError("AMOUNT_OVERFLOW", `${field} exceeds safe integer range`);
  }
}

function assertLayer(layer: CostLayer): void {
  assertInteger(layer.quantity, `layer ${layer.layerId} quantity`);
  assertInteger(layer.unitCostMinor, `layer ${layer.layerId} unitCostMinor`);
  if (layer.quantity <= 0) {
    throw new ValuationError("INVALID_QUANTITY", `layer ${layer.layerId} has non-positive quantity`);
  }
  if (layer.unitCostMinor < 0) {
    throw new ValuationError("INVALID_COST", `layer ${layer.layerId} has a negative unit cost`);
  }
}

/**
 * Orders layers by the rule of the chosen method.
 *
 * O(n log n) — a sort, once per issue. For FEFO the key is expiry then
 * sequence, so batches closest to expiry leave first; layers without an expiry
 * sort last, because an unknown expiry must never be assumed to be soon.
 */
export function orderLayers(layers: readonly CostLayer[], method: CostingMethod): CostLayer[] {
  const copy = [...layers];
  switch (method) {
    case "lifo":
      return copy.sort((a, b) => b.sequence - a.sequence);
    case "fefo":
      return copy.sort((a, b) => {
        const aExpiry = a.expiresOn ?? "9999-12-31";
        const bExpiry = b.expiresOn ?? "9999-12-31";
        if (aExpiry !== bExpiry) return aExpiry < bExpiry ? -1 : 1;
        return a.sequence - b.sequence;
      });
    case "fifo":
    case "wac":
    default:
      return copy.sort((a, b) => a.sequence - b.sequence);
  }
}

/**
 * Consumes `quantity` units from the layers under the given method.
 *
 * FIFO/LIFO/FEFO consume whole or partial layers and return the exact cost of
 * each. WAC is handled by {@link issueWeightedAverage} because it cannot be
 * expressed as a per-layer selection: the cost is a single blended average.
 *
 * O(n log n) for the sort plus O(n) to walk the layers.
 *
 * Refuses to consume more than is on hand — an oversell is a data error, not
 * something to paper over with a zero-cost remainder.
 */
export function issueFromLayers(
  layers: readonly CostLayer[],
  quantity: number,
  method: Exclude<CostingMethod, "wac">,
): IssueResult {
  assertInteger(quantity, "quantity");
  if (quantity < 0) throw new ValuationError("INVALID_QUANTITY", "quantity to issue must be >= 0");
  layers.forEach(assertLayer);
  if (quantity === 0) {
    return { issues: [], totalCostMinor: 0, remaining: layers.map((layer) => ({ ...layer })) };
  }

  const available = layers.reduce((sum, layer) => sum + layer.quantity, 0);
  if (quantity > available) {
    throw new ValuationError(
      "INSUFFICIENT_STOCK",
      `cannot issue ${quantity} units, only ${available} on hand`,
    );
  }

  const ordered = orderLayers(layers, method);
  const issues: Issue[] = [];
  const consumed = new Map<string, number>();
  let needed = quantity;
  let totalCostMinor = 0;

  for (const layer of ordered) {
    if (needed === 0) break;
    const take = Math.min(layer.quantity, needed);
    const costMinor = take * layer.unitCostMinor;
    if (!Number.isSafeInteger(costMinor)) {
      throw new ValuationError("AMOUNT_OVERFLOW", "layer cost exceeds safe integer range");
    }
    issues.push({ layerId: layer.layerId, quantity: take, unitCostMinor: layer.unitCostMinor, costMinor });
    consumed.set(layer.layerId, take);
    totalCostMinor += costMinor;
    needed -= take;
  }

  const remaining = layers
    .map((layer) => ({
      ...layer,
      quantity: layer.quantity - (consumed.get(layer.layerId) ?? 0),
    }))
    .filter((layer) => layer.quantity > 0);

  return { issues, totalCostMinor, remaining };
}

/**
 * Total value of the layers, and their unit count.
 *
 * O(n). This is the per-batch value used by FIFO/LIFO/FEFO. It is NOT the
 * right number under WAC — see {@link WeightedAverageResult}.
 */
export function inventoryValue(layers: readonly CostLayer[]): { quantity: number; valueMinor: number } {
  let quantity = 0;
  let valueMinor = 0;
  for (const layer of layers) {
    assertLayer(layer);
    quantity += layer.quantity;
    const lineValue = layer.quantity * layer.unitCostMinor;
    if (!Number.isSafeInteger(lineValue)) {
      throw new ValuationError("AMOUNT_OVERFLOW", `layer ${layer.layerId} value exceeds safe integer range`);
    }
    valueMinor += lineValue;
  }
  if (!Number.isSafeInteger(valueMinor)) {
    throw new ValuationError("AMOUNT_OVERFLOW", "inventory value exceeds safe integer range");
  }
  return { quantity, valueMinor };
}

/**
 * Issues under weighted average cost.
 *
 * The cost of an issue is allocated **pro rata to the value on hand**:
 * `cost = round(value * qty / onHand)`. Multiplying a rounded average instead
 * loses up to half a minor unit per issue, and those losses compound silently —
 * a warehouse can end up worth less than it cost after a few hundred movements.
 *
 * When the whole quantity leaves, the cost is the entire remaining value, so the
 * inventory ends at exactly zero with no residue to explain.
 *
 * O(n).
 */
export function issueWeightedAverage(
  layers: readonly CostLayer[],
  quantity: number,
  options: { valueMinor?: number } = {},
): WeightedAverageResult {
  assertInteger(quantity, "quantity");
  if (quantity < 0) throw new ValuationError("INVALID_QUANTITY", "quantity to issue must be >= 0");

  const onHand = layers.reduce((sum, layer) => sum + layer.quantity, 0);
  // Under WAC the value cannot be re-derived from the layer unit costs, so a
  // caller continuing a WAC sequence passes the value forward explicitly.
  const valueMinor = options.valueMinor ?? inventoryValue(layers).valueMinor;

  if (quantity > onHand) {
    throw new ValuationError("INSUFFICIENT_STOCK", `cannot issue ${quantity} units, only ${onHand} on hand`);
  }
  if (quantity === 0) {
    return {
      issues: [],
      totalCostMinor: 0,
      remaining: layers.map((layer) => ({ ...layer })),
      averageCostMinor: onHand === 0 ? 0 : Math.round(valueMinor / onHand),
      remainingValueMinor: valueMinor,
    };
  }

  const averageCostMinor = Math.round(valueMinor / onHand);
  const totalCostMinor = quantity === onHand ? valueMinor : Math.round((valueMinor * quantity) / onHand);
  if (!Number.isSafeInteger(totalCostMinor)) {
    throw new ValuationError("AMOUNT_OVERFLOW", "issue cost exceeds safe integer range");
  }

  // Walk the layers in consumption order only to know which batches shrink.
  // Their unit costs are left untouched: rewriting them would turn a FIFO layer
  // into a WAC layer and make a later change of method report a value that
  // never existed.
  const ordered = orderLayers(layers, "fifo");
  const issues: Issue[] = [];
  const consumed = new Map<string, number>();
  let needed = quantity;
  for (const layer of ordered) {
    if (needed === 0) break;
    const take = Math.min(layer.quantity, needed);
    issues.push({ layerId: layer.layerId, quantity: take, unitCostMinor: averageCostMinor, costMinor: 0 });
    consumed.set(layer.layerId, take);
    needed -= take;
  }

  // Spread the exact total over the lines so they sum to it; rounding each line
  // independently would drift exactly as a rounded average does.
  let allocated = 0;
  issues.forEach((line, index) => {
    const isLast = index === issues.length - 1;
    const share = isLast ? totalCostMinor - allocated : Math.round((totalCostMinor * line.quantity) / quantity);
    line.costMinor = share;
    allocated += share;
  });

  const remaining = layers
    .map((layer) => ({ ...layer, quantity: layer.quantity - (consumed.get(layer.layerId) ?? 0) }))
    .filter((layer) => layer.quantity > 0);

  return {
    issues,
    totalCostMinor,
    remaining,
    averageCostMinor,
    // Exact by construction: the issue took this much, so this is what is left.
    remainingValueMinor: valueMinor - totalCostMinor,
  };
}


/** Dispatches to the right strategy. */
export function issue(
  layers: readonly CostLayer[],
  quantity: number,
  method: CostingMethod,
  options: { valueMinor?: number } = {},
): IssueResult & { averageCostMinor?: number; remainingValueMinor?: number } {
  if (method === "wac") return issueWeightedAverage(layers, quantity, options);
  return issueFromLayers(layers, quantity, method);
}

/**
 * Adds a received batch, merging it into an existing layer when the cost and
 * expiry match.
 *
 * Merging keeps the layer list from growing without bound when the same
 * supplier ships the same cost every week. Merging is only safe when the cost
 * AND expiry agree, because otherwise consumption order would change.
 *
 * O(n).
 */
export function receive(
  layers: readonly CostLayer[],
  receipt: { layerId: string; quantity: number; unitCostMinor: number; sequence: number; expiresOn?: string | null },
  options: { merge?: boolean } = {},
): CostLayer[] {
  assertLayer({ ...receipt, expiresOn: receipt.expiresOn ?? null });
  const merge = options.merge ?? true;
  if (merge) {
    const index = layers.findIndex(
      (layer) => layer.unitCostMinor === receipt.unitCostMinor && (layer.expiresOn ?? null) === (receipt.expiresOn ?? null),
    );
    if (index >= 0) {
      const next = [...layers];
      next[index] = { ...next[index]!, quantity: next[index]!.quantity + receipt.quantity };
      return next;
    }
  }
  return [...layers, { ...receipt, expiresOn: receipt.expiresOn ?? null }];
}

/**
 * Layers expiring within `withinDays` of `asOf`, ordered by expiry.
 *
 * Used for the expiry report and to decide what to discount. O(n log n).
 */
export function expiringSoon(
  layers: readonly CostLayer[],
  asOf: string,
  withinDays: number,
): Array<CostLayer & { daysToExpiry: number }> {
  const asOfMs = Date.parse(`${asOf}T00:00:00Z`);
  if (Number.isNaN(asOfMs)) throw new ValuationError("INVALID_DATE", `asOf must be YYYY-MM-DD, got ${asOf}`);
  const out: Array<CostLayer & { daysToExpiry: number }> = [];
  for (const layer of layers) {
    if (!layer.expiresOn) continue;
    const expiryMs = Date.parse(`${layer.expiresOn}T00:00:00Z`);
    if (Number.isNaN(expiryMs)) {
      throw new ValuationError("INVALID_DATE", `layer ${layer.layerId} has an invalid expiry ${layer.expiresOn}`);
    }
    const daysToExpiry = Math.floor((expiryMs - asOfMs) / 86_400_000);
    if (daysToExpiry <= withinDays) out.push({ ...layer, daysToExpiry });
  }
  return out.sort((a, b) => a.daysToExpiry - b.daysToExpiry || a.sequence - b.sequence);
}

/** Structural validity of a layer set: unique ids, ordered sequences, positive quantities. */
export function assertValidLayering(layers: readonly CostLayer[]): void {
  const ids = new Set<string>();
  let lastSequence = -Infinity;
  for (const layer of layers) {
    assertLayer(layer);
    if (ids.has(layer.layerId)) {
      throw new ValuationError("DUPLICATE_LAYER", `duplicate layer id: ${layer.layerId}`);
    }
    ids.add(layer.layerId);
    if (layer.sequence <= lastSequence) {
      throw new ValuationError(
        "SEQUENCE_OUT_OF_ORDER",
        `layers must be in ascending sequence order; ${layer.layerId} breaks it`,
      );
    }
    lastSequence = layer.sequence;
  }
}
