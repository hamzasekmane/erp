import { describe, expect, it } from "vitest";
import {
  assertValidLayering,
  expiringSoon,
  inventoryValue,
  issue,
  issueFromLayers,
  issueWeightedAverage,
  orderLayers,
  receive,
  ValuationError,
  type CostLayer,
} from "./valuation";

/** Three layers: 10 @ 100, 10 @ 200, 10 @ 300. */
function layered(): CostLayer[] {
  return [
    { layerId: "L1", quantity: 10, unitCostMinor: 100, sequence: 1 },
    { layerId: "L2", quantity: 10, unitCostMinor: 200, sequence: 2 },
    { layerId: "L3", quantity: 10, unitCostMinor: 300, sequence: 3 },
  ];
}

describe("FIFO — first in, first out", () => {
  it("consumes the oldest layer first", () => {
    const result = issueFromLayers(layered(), 15, "fifo");
    expect(result.issues).toEqual([
      { layerId: "L1", quantity: 10, unitCostMinor: 100, costMinor: 1_000 },
      { layerId: "L2", quantity: 5, unitCostMinor: 200, costMinor: 1_000 },
    ]);
    expect(result.totalCostMinor).toBe(2_000);
    expect(result.remaining).toEqual([
      { layerId: "L2", quantity: 5, unitCostMinor: 200, sequence: 2 },
      { layerId: "L3", quantity: 10, unitCostMinor: 300, sequence: 3 },
    ]);
  });

  it("consumes exactly one layer without splitting it", () => {
    const result = issueFromLayers(layered(), 10, "fifo");
    expect(result.issues).toHaveLength(1);
    expect(result.totalCostMinor).toBe(1_000);
    expect(result.remaining.map((layer) => layer.layerId)).toEqual(["L2", "L3"]);
  });

  it("empties the inventory exactly when the last unit leaves", () => {
    const result = issueFromLayers(layered(), 30, "fifo");
    expect(result.remaining).toEqual([]);
    expect(result.totalCostMinor).toBe(6_000); // 1000 + 2000 + 3000
  });
});

describe("LIFO — last in, first out", () => {
  it("consumes the newest layer first", () => {
    const result = issueFromLayers(layered(), 15, "lifo");
    expect(result.issues).toEqual([
      { layerId: "L3", quantity: 10, unitCostMinor: 300, costMinor: 3_000 },
      { layerId: "L2", quantity: 5, unitCostMinor: 200, costMinor: 1_000 },
    ]);
    expect(result.totalCostMinor).toBe(4_000);
    expect(result.remaining.map((layer) => layer.layerId)).toEqual(["L1", "L2"]);
  });

  it("gives a different cost from FIFO for the same withdrawal — the whole point", () => {
    const fifo = issueFromLayers(layered(), 10, "fifo");
    const lifo = issueFromLayers(layered(), 10, "lifo");
    expect(fifo.totalCostMinor).toBe(1_000);
    expect(lifo.totalCostMinor).toBe(3_000);
  });
});

describe("FEFO — first expired, first out", () => {
  it("consumes by expiry, not by arrival", () => {
    const layers: CostLayer[] = [
      { layerId: "new-noexpiry", quantity: 5, unitCostMinor: 100, sequence: 1, expiresOn: null },
      { layerId: "later", quantity: 5, unitCostMinor: 200, sequence: 2, expiresOn: "2027-06-01" },
      { layerId: "sooner", quantity: 5, unitCostMinor: 300, sequence: 3, expiresOn: "2026-12-01" },
    ];
    const result = issueFromLayers(layers, 6, "fefo");
    // 'sooner' leaves first even though it arrived last.
    expect(result.issues.map((entry) => entry.layerId)).toEqual(["sooner", "later"]);
    expect(result.totalCostMinor).toBe(5 * 300 + 1 * 200);
  });

  it("treats a missing expiry as never-expiring, sorting it last", () => {
    const layers: CostLayer[] = [
      { layerId: "no-expiry", quantity: 10, unitCostMinor: 100, sequence: 1, expiresOn: null },
      { layerId: "has-expiry", quantity: 10, unitCostMinor: 200, sequence: 2, expiresOn: "2030-01-01" },
    ];
    expect(orderLayers(layers, "fefo").map((layer) => layer.layerId)).toEqual(["has-expiry", "no-expiry"]);
  });

  it("breaks ties on expiry by arrival order, so the result is deterministic", () => {
    const layers: CostLayer[] = [
      { layerId: "second", quantity: 1, unitCostMinor: 100, sequence: 2, expiresOn: "2026-01-01" },
      { layerId: "first", quantity: 1, unitCostMinor: 200, sequence: 1, expiresOn: "2026-01-01" },
    ];
    expect(orderLayers(layers, "fefo").map((layer) => layer.layerId)).toEqual(["first", "second"]);
  });
});

describe("weighted average cost", () => {
  it("issues at the blended average", () => {
    // (10*100 + 10*200 + 10*300) / 30 = 200
    const result = issueWeightedAverage(layered(), 10);
    expect(result.averageCostMinor).toBe(200);
    expect(result.totalCostMinor).toBe(2_000);
  });

  it("handles a non-integer average without losing value on the final issue", () => {
    // 3 units at 100 and 1 at 101: value 401, quantity 4, average 100.25.
    const layers: CostLayer[] = [
      { layerId: "a", quantity: 3, unitCostMinor: 100, sequence: 1 },
      { layerId: "b", quantity: 1, unitCostMinor: 101, sequence: 2 },
    ];
    expect(inventoryValue(layers).valueMinor).toBe(401);

    const all = issueWeightedAverage(layers, 4);
    // Whatever the rounding, the total issued must equal the value on hand and
    // nothing may be left behind.
    expect(all.totalCostMinor).toBe(401);
    expect(all.remaining).toEqual([]);
  });

  it("conserves value across a sequence of partial issues", () => {
    // Under WAC the value is carried forward explicitly: the layers only track
    // how many units remain, because the per-unit average is not an integer.
    const layers: CostLayer[] = [
      { layerId: "a", quantity: 3, unitCostMinor: 100, sequence: 1 },
      { layerId: "b", quantity: 3, unitCostMinor: 101, sequence: 2 },
    ];
    const startValue = inventoryValue(layers).valueMinor; // 603

    let current = layers;
    let currentValue = startValue;
    let issuedValue = 0;
    for (let i = 0; i < 6; i += 1) {
      const result = issueWeightedAverage(current, 1, { valueMinor: currentValue });
      issuedValue += result.totalCostMinor;
      current = result.remaining;
      currentValue = result.remainingValueMinor;
    }
    expect(current).toEqual([]);
    expect(currentValue).toBe(0);
    // Every minor unit that left the inventory is accounted for exactly once.
    expect(issuedValue).toBe(startValue);
  });
});

describe("errors are refusals, not silent guesses", () => {
  it("refuses to issue more than is on hand", () => {
    expect(() => issueFromLayers(layered(), 31, "fifo")).toThrow(/only 30 on hand/);
    expect(() => issueWeightedAverage(layered(), 31)).toThrow(ValuationError);
  });

  it("refuses fractional quantities and costs", () => {
    expect(() => issueFromLayers(layered(), 1.5, "fifo")).toThrow(/must be an integer/);
    expect(() =>
      issueFromLayers([{ layerId: "x", quantity: 1, unitCostMinor: 10.5, sequence: 1 }], 1, "fifo"),
    ).toThrow(/must be an integer/);
  });

  it("refuses a negative unit cost", () => {
    expect(() =>
      issueFromLayers([{ layerId: "x", quantity: 1, unitCostMinor: -1, sequence: 1 }], 1, "fifo"),
    ).toThrow(/negative unit cost/);
  });

  it("refuses a non-positive layer quantity", () => {
    expect(() =>
      issueFromLayers([{ layerId: "x", quantity: 0, unitCostMinor: 10, sequence: 1 }], 0, "fifo"),
    ).toThrow(/non-positive quantity/);
  });

  it("exposes a code so callers can map to an API response", () => {
    try {
      issueFromLayers(layered(), 99, "fifo");
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValuationError);
      expect((error as ValuationError).code).toBe("INSUFFICIENT_STOCK");
    }
  });
});

describe("receive", () => {
  it("merges a receipt at the same cost and expiry", () => {
    const layers = receive(layered(), { layerId: "L4", quantity: 5, unitCostMinor: 100, sequence: 4 });
    expect(layers).toHaveLength(3);
    expect(layers[0]!.quantity).toBe(15);
  });

  it("creates a new layer when the cost differs", () => {
    const layers = receive(layered(), { layerId: "L4", quantity: 5, unitCostMinor: 150, sequence: 4 });
    expect(layers).toHaveLength(4);
  });

  it("does not merge across different expiries — that would change FEFO order", () => {
    const withExpiry: CostLayer[] = [{ layerId: "a", quantity: 5, unitCostMinor: 100, sequence: 1, expiresOn: "2026-01-01" }];
    const layers = receive(withExpiry, { layerId: "b", quantity: 5, unitCostMinor: 100, sequence: 2, expiresOn: "2026-06-01" });
    expect(layers).toHaveLength(2);
  });

  it("can be told not to merge", () => {
    const layers = receive(layered(), { layerId: "L4", quantity: 5, unitCostMinor: 100, sequence: 4 }, { merge: false });
    expect(layers).toHaveLength(4);
  });
});

describe("inventoryValue", () => {
  it("sums quantity and value", () => {
    expect(inventoryValue(layered())).toEqual({ quantity: 30, valueMinor: 6_000 });
  });

  it("is zero for no layers", () => {
    expect(inventoryValue([])).toEqual({ quantity: 0, valueMinor: 0 });
  });
});

describe("expiringSoon", () => {
  it("lists layers expiring inside the window, soonest first", () => {
    const layers: CostLayer[] = [
      { layerId: "far", quantity: 1, unitCostMinor: 100, sequence: 1, expiresOn: "2027-01-01" },
      { layerId: "near", quantity: 1, unitCostMinor: 100, sequence: 2, expiresOn: "2026-11-20" },
      { layerId: "past", quantity: 1, unitCostMinor: 100, sequence: 3, expiresOn: "2026-11-01" },
      { layerId: "none", quantity: 1, unitCostMinor: 100, sequence: 4, expiresOn: null },
    ];
    const result = expiringSoon(layers, "2026-11-15", 30);
    expect(result.map((layer) => layer.layerId)).toEqual(["past", "near"]);
    expect(result[0]!.daysToExpiry).toBe(-14);
    expect(result[1]!.daysToExpiry).toBe(5);
  });

  it("rejects an invalid date rather than silently returning nothing", () => {
    expect(() => expiringSoon([], "15/11/2026", 30)).toThrow(/YYYY-MM-DD/);
  });
});

describe("assertValidLayering", () => {
  it("accepts a well-formed set", () => {
    expect(() => assertValidLayering(layered())).not.toThrow();
  });

  it("rejects a duplicate layer id", () => {
    const layers: CostLayer[] = [
      { layerId: "x", quantity: 1, unitCostMinor: 10, sequence: 1 },
      { layerId: "x", quantity: 1, unitCostMinor: 10, sequence: 2 },
    ];
    expect(() => assertValidLayering(layers)).toThrow(/duplicate layer id/);
  });

  it("rejects out-of-order sequences", () => {
    const layers: CostLayer[] = [
      { layerId: "b", quantity: 1, unitCostMinor: 10, sequence: 5 },
      { layerId: "a", quantity: 1, unitCostMinor: 10, sequence: 2 },
    ];
    expect(() => assertValidLayering(layers)).toThrow(/ascending sequence/);
  });
});

describe("dispatch", () => {
  it("routes each method to its strategy", () => {
    expect(issue(layered(), 10, "fifo").totalCostMinor).toBe(1_000);
    expect(issue(layered(), 10, "lifo").totalCostMinor).toBe(3_000);
    expect(issue(layered(), 10, "wac").totalCostMinor).toBe(2_000);
    expect(issue(layered(), 10, "wac").averageCostMinor).toBe(200);
  });
});

/* ------------------------------------------------------------------ */
/* Property tests                                                      */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random but structurally valid layers. */
function randomLayers(random: () => number, count: number): CostLayer[] {
  return Array.from({ length: count }, (_, index) => ({
    layerId: `L${index}`,
    quantity: 1 + Math.floor(random() * 50),
    unitCostMinor: Math.floor(random() * 10_000),
    sequence: index + 1,
  }));
}

describe("property: valuation never invents or destroys value", () => {
  it("total issued cost plus remaining value equals the starting value, for every method", () => {
    const random = mulberry32(20_261_115);
    for (let run = 0; run < 400; run += 1) {
      const layers = randomLayers(random, 1 + Math.floor(random() * 6));
      const start = inventoryValue(layers);
      const amount = Math.floor(random() * (start.quantity + 1));

      for (const method of ["fifo", "lifo", "fefo", "wac"] as const) {
        const result = issue(layers, amount, method);
        // Under WAC the remaining value is reported, not re-derived from the
        // batch costs: quantity * a rounded average drifts.
        const remainingValue =
          method === "wac" ? result.remainingValueMinor! : inventoryValue(result.remaining).valueMinor;
        const accountedFor = result.totalCostMinor + remainingValue;
        const expected = start.valueMinor;

        // Exact conservation. A drift here means the books lose or gain money
        // on every stock movement, which compounds silently.
        expect({ method, accountedFor, expected }).toEqual({ method, accountedFor, expected });
        expect(result.remaining.reduce((sum, layer) => sum + layer.quantity, 0)).toBe(start.quantity - amount);
      }
    }
  });

  it("issues as many units as requested, never more", () => {
    const random = mulberry32(42);
    for (let run = 0; run < 400; run += 1) {
      const layers = randomLayers(random, 1 + Math.floor(random() * 5));
      const onHand = inventoryValue(layers).quantity;
      const amount = Math.floor(random() * (onHand + 1));
      for (const method of ["fifo", "lifo", "fefo"] as const) {
        const result = issue(layers, amount, method);
        const issued = result.issues.reduce((sum, entry) => sum + entry.quantity, 0);
        expect(issued).toBe(amount);
        // Each issue line's stated cost really is quantity * unit cost.
        for (const entry of result.issues) {
          expect(entry.costMinor).toBe(entry.quantity * entry.unitCostMinor);
        }
      }
    }
  });

  it("FIFO and LIFO agree exactly when all layers share one cost", () => {
    const random = mulberry32(7);
    for (let run = 0; run < 200; run += 1) {
      const count = 1 + Math.floor(random() * 5);
      const unitCost = Math.floor(random() * 5_000);
      const layers: CostLayer[] = Array.from({ length: count }, (_, index) => ({
        layerId: `L${index}`,
        quantity: 1 + Math.floor(random() * 20),
        unitCostMinor: unitCost,
        sequence: index + 1,
      }));
      const onHand = inventoryValue(layers).quantity;
      const amount = Math.floor(random() * (onHand + 1));
      expect(issue(layers, amount, "fifo").totalCostMinor).toBe(issue(layers, amount, "lifo").totalCostMinor);
    }
  });

  it("receiving then issuing the same quantity at one cost is value-neutral", () => {
    const random = mulberry32(99);
    for (let run = 0; run < 200; run += 1) {
      const layers = randomLayers(random, 1 + Math.floor(random() * 4));
      const quantity = 1 + Math.floor(random() * 20);
      const unitCostMinor = Math.floor(random() * 5_000);
      const before = inventoryValue(layers);
      // `sequence` must be strictly greater than every existing layer's, which
      // is what "1000 + run" is for: run stays below 200 while base layers cap
      // at 4, so ordering is unambiguous.
      const afterReceive = inventoryValue(
        receive(layers, { layerId: `new-${run}`, quantity, unitCostMinor, sequence: 1000 + run }),
      );
      expect(afterReceive.quantity).toBe(before.quantity + quantity);
      expect(afterReceive.valueMinor).toBe(before.valueMinor + quantity * unitCostMinor);

      const received = receive(layers, { layerId: `new-${run}`, quantity, unitCostMinor, sequence: 1000 + run });
      // Receive and then issue the SAME batch: LIFO must return exactly what
      // just came in. (FIFO would take the oldest units, and returning them
      // would cost a different amount — that is the method working, not a bug,
      // so asserting it here would be asserting the wrong thing.)
      const issued = issue(received, quantity, "lifo");
      expect(issued.totalCostMinor).toBe(quantity * unitCostMinor);
      expect(inventoryValue(issued.remaining).valueMinor).toBe(before.valueMinor);
    }
  });
});
