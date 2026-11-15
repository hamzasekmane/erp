import { describe, expect, it } from "vitest";
import {
  assertAcyclic,
  bomDepth,
  BomError,
  childrenIndex,
  explode,
  findCycle,
  fromMilli,
  netRequirements,
  nodesOf,
  rolledUpCost,
  toMilli,
  topologicalOrder,
  validateGraph,
  whereUsed,
  type BomEdge,
  type BomGraph,
} from "./bom";

/** Reads as `edge("A", "B", 2)` = "one A needs two B". */
function edge(parentId: string, childId: string, units: number, scrapBp = 0): BomEdge {
  return { parentId, childId, quantity: toMilli(units), scrapBp };
}

function graph(...edges: BomEdge[]): BomGraph {
  return { edges };
}

/* ------------------------------------------------------------------ */
/* A realistic three-level BOM with a shared component (a diamond)      */
/* ------------------------------------------------------------------ */
/*
 *  BIKE ──1── WHEEL ──1── TYRE
 *    │         └────1── RIM
 *    ├──1── FRAME
 *    └──2── BOLT            (shared with WHEEL? no — see below)
 *
 *  SCOOTER ──2── WHEEL     (WHEEL is shared between two products: where-used)
 */
function bikeBom(): BomGraph {
  return graph(
    edge("BIKE", "WHEEL", 2),
    edge("BIKE", "FRAME", 1),
    edge("WHEEL", "TYRE", 1),
    edge("WHEEL", "RIM", 1),
    edge("FRAME", "BOLT", 4),
    edge("WHEEL", "BOLT", 1),
  );
}

describe("validateGraph", () => {
  it("accepts a well-formed graph", () => {
    expect(() => validateGraph(bikeBom())).not.toThrow();
  });

  it("rejects a self-reference", () => {
    expect(() => validateGraph(graph(edge("A", "A", 1)))).toThrow(/cannot contain itself/);
  });

  it("rejects a duplicate line rather than summing it", () => {
    // Two rows for the same pair is a data-entry mistake; summing it silently
    // turns a typo into a doubled requirement.
    expect(() => validateGraph(graph(edge("A", "B", 1), edge("A", "B", 2)))).toThrow(/duplicate BOM line/);
  });

  it("rejects non-positive and fractional quantities", () => {
    expect(() => validateGraph(graph(edge("A", "B", 0)))).toThrow(/positive integer/);
    expect(() => validateGraph(graph({ parentId: "A", childId: "B", quantity: 1.5 }))).toThrow(/positive integer/);
  });

  it("rejects an out-of-range scrap allowance", () => {
    expect(() => validateGraph(graph(edge("A", "B", 1, 10_001)))).toThrow(/scrapBp/);
    expect(() => validateGraph(graph(edge("A", "B", 1, -1)))).toThrow(/scrapBp/);
  });
});

describe("cycle detection", () => {
  it("returns null for a DAG", () => {
    expect(findCycle(bikeBom())).toBeNull();
  });

  it("detects a two-node cycle and names it", () => {
    const cycle = findCycle(graph(edge("A", "B", 1), edge("B", "A", 1)));
    expect(cycle).not.toBeNull();
    expect(cycle!.join("->")).toBe("A->B->A");
  });

  it("detects a longer cycle and reports the whole path", () => {
    const cycle = findCycle(graph(edge("A", "B", 1), edge("B", "C", 1), edge("C", "A", 1)));
    expect(cycle!.join("->")).toBe("A->B->C->A");
  });

  it("does not mistake a diamond for a cycle", () => {
    // The shared BOLT appears on two paths but no path returns to a node.
    expect(findCycle(graph(edge("A", "B", 1), edge("A", "C", 1), edge("B", "D", 1), edge("C", "D", 1)))).toBeNull();
  });

  it("throws with the path, not just 'invalid BOM'", () => {
    try {
      assertAcyclic(graph(edge("X", "Y", 1), edge("Y", "X", 1)));
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(BomError);
      expect((error as BomError).code).toBe("CYCLE");
      expect((error as Error).message).toMatch(/X -> Y -> X/);
    }
  });
});

describe("topologicalOrder", () => {
  it("emits children before parents", () => {
    const order = topologicalOrder(bikeBom());
    const position = new Map(order.map((node, index) => [node, index]));
    for (const e of bikeBom().edges) {
      expect(position.get(e.childId)!).toBeLessThan(position.get(e.parentId)!);
    }
  });

  it("includes every node exactly once", () => {
    const order = topologicalOrder(bikeBom());
    expect(new Set(order).size).toBe(order.length);
    expect(order.sort()).toEqual(nodesOf(bikeBom()).sort());
  });

  it("is deterministic across runs", () => {
    expect(topologicalOrder(bikeBom())).toEqual(topologicalOrder(bikeBom()));
  });

  it("throws on a cycle instead of returning a partial order", () => {
    expect(() => topologicalOrder(graph(edge("A", "B", 1), edge("B", "A", 1)))).toThrow(/cycle/);
  });
});

describe("bomDepth", () => {
  it("counts levels below the root", () => {
    expect(bomDepth(bikeBom(), "BIKE")).toBe(2); // BIKE -> WHEEL -> TYRE
    expect(bomDepth(bikeBom(), "WHEEL")).toBe(1);
    expect(bomDepth(bikeBom(), "TYRE")).toBe(0);
  });

  it("is 0 for a node not in the graph", () => {
    expect(bomDepth(bikeBom(), "NOTHING")).toBe(0);
  });
});

describe("explode — the diamond is the test that matters", () => {
  it("accumulates a shared component across every path", () => {
    // BIKE needs 2 WHEEL; each WHEEL needs 1 BOLT, and FRAME needs 4 BOLT.
    // A depth-first walk that stops at the first sighting of BOLT reports 4 or
    // 2 depending on traversal order. The correct total is 2*1 + 4 = 6.
    const result = explode(bikeBom(), "BIKE", 1);
    const bolt = result.lines.find((line) => line.componentId === "BOLT");
    expect(bolt).toBeTruthy();
    expect(bolt!.requiredMilli).toBe(toMilli(6));
    expect(bolt!.requiredWhole).toBe(6);
    // And it says where the number came from.
    expect(bolt!.sources.sort()).toEqual(["FRAME", "WHEEL"]);
  });

  it("reports each component at its shallowest level", () => {
    const result = explode(bikeBom(), "BIKE", 1);
    const levels = new Map(result.lines.map((line) => [line.componentId, line.level]));
    expect(levels.get("WHEEL")).toBe(1);
    expect(levels.get("FRAME")).toBe(1);
    expect(levels.get("TYRE")).toBe(2);
    expect(levels.get("RIM")).toBe(2);
    // Both of BOLT's parents (WHEEL and FRAME) sit at level 1, so BOLT first
    // appears at level 2; it is not a level-1 component of the bike.
    expect(levels.get("BOLT")).toBe(2);
  });

  it("multiplies through the whole structure for a batch of 10", () => {
    const result = explode(bikeBom(), "BIKE", 10);
    const byId = new Map(result.lines.map((line) => [line.componentId, line.requiredWhole]));
    expect(byId.get("WHEEL")).toBe(20);
    expect(byId.get("FRAME")).toBe(10);
    expect(byId.get("TYRE")).toBe(20);
    expect(byId.get("RIM")).toBe(20);
    expect(byId.get("BOLT")).toBe(60); // 20 wheels * 1 + 10 frames * 4
  });

  it("lists only true leaves as purchase candidates", () => {
    const result = explode(bikeBom(), "BIKE", 1);
    // WHEEL and FRAME are built, not bought.
    expect(result.leafComponentIds.sort()).toEqual(["BOLT", "RIM", "TYRE"]);
  });

  it("produces a build order with sub-assemblies before the product", () => {
    const result = explode(bikeBom(), "BIKE", 1);
    expect(result.buildOrder).toContain("WHEEL");
    expect(result.buildOrder).not.toContain("BIKE");
    const position = new Map(result.buildOrder.map((node, index) => [node, index]));
    // WHEEL must be built before FRAME only if one depends on the other; here
    // both are level 1, so assert the real constraint: TYRE/RIM before WHEEL.
    expect(position.get("TYRE")!).toBeLessThan(position.get("WHEEL")!);
    expect(position.get("RIM")!).toBeLessThan(position.get("WHEEL")!);
  });

  it("includes the root only when asked", () => {
    expect(explode(bikeBom(), "BIKE", 1).lines.some((line) => line.componentId === "BIKE")).toBe(false);
    const withRoot = explode(bikeBom(), "BIKE", 3, { includeRoot: true });
    const root = withRoot.lines.find((line) => line.componentId === "BIKE")!;
    expect(root.level).toBe(0);
    expect(root.requiredWhole).toBe(3);
  });

  it("rejects a non-positive root quantity", () => {
    expect(() => explode(bikeBom(), "BIKE", 0)).toThrow(/must be positive/);
    expect(() => explode(bikeBom(), "BIKE", -1)).toThrow(/must be positive/);
  });

  it("handles a leaf root (no children) without inventing lines", () => {
    const result = explode(bikeBom(), "TYRE", 5);
    expect(result.lines).toEqual([]);
    expect(result.buildOrder).toEqual([]);
  });
});

describe("scrap allowance", () => {
  it("inflates the requirement by the allowance", () => {
    // 10% scrap on 1 unit needed -> 1.1 units -> 2 whole units when rounded up.
    const result = explode(graph(edge("A", "B", 1, 1_000)), "A", 1);
    const b = result.lines.find((line) => line.componentId === "B")!;
    expect(b.requiredMilli).toBe(toMilli(1.1));
    expect(b.requiredWhole).toBe(2);
  });

  it("rounds up ONCE at the end, not at every level", () => {
    // Three levels each needing 1 unit with 1 milli of extra: per-level
    // ceiling would give 2 at each step and compound to 8; the correct answer
    // is a single ceiling of the exact total.
    const g = graph(edge("A", "B", 1.001), edge("B", "C", 1.001), edge("C", "D", 1.001));
    const result = explode(g, "A", 1);
    const d = result.lines.find((line) => line.componentId === "D")!;
    expect(d.requiredWhole).toBe(2); // ceil(1.001^3) = 2, not 8
    // The exact figure stays available for costing.
    expect(d.requiredMilli).toBe(Math.round(1.001 * 1.001 * 1.001 * 1000));
  });

  it("keeps fractional requirements exact in milli-units", () => {
    const result = explode(graph(edge("A", "B", 2.5)), "A", 3);
    const b = result.lines.find((line) => line.componentId === "B")!;
    expect(fromMilli(b.requiredMilli)).toBe(7.5);
    expect(b.requiredWhole).toBe(8); // you cannot buy half a unit
  });
});

describe("netRequirements", () => {
  it("subtracts stock and reports only what is short", () => {
    const g = bikeBom();
    const explosion = explode(g, "BIKE", 10);
    const onHand = new Map([
      ["TYRE", toMilli(20)], // exactly enough
      ["RIM", toMilli(5)], // 15 short
      ["BOLT", toMilli(100)], // surplus
    ]);
    const { shortages, covered } = netRequirements(explosion, onHand, g);

    const byId = new Map(shortages.map((shortage) => [shortage.componentId, shortage]));
    expect(byId.has("TYRE")).toBe(false);
    expect(byId.has("BOLT")).toBe(false);
    expect(byId.get("RIM")!.toPurchase).toBe(15);
    expect(byId.get("RIM")!.shortMilli).toBe(toMilli(15));
    expect(covered.map((line) => line.componentId)).toContain("TYRE");
  });

  it("does not report a sub-assembly as a purchase", () => {
    // WHEEL is required but it is built, not bought. Listing it would order it
    // twice — once as a purchase and once as a build.
    const g = bikeBom();
    const { shortages } = netRequirements(explode(g, "BIKE", 10), new Map(), g);
    expect(shortages.map((shortage) => shortage.componentId)).not.toContain("WHEEL");
  });

  it("can include assemblies when they are genuinely bought in", () => {
    const g = bikeBom();
    const { shortages } = netRequirements(explode(g, "BIKE", 10), new Map(), g, { includeAssemblies: true });
    expect(shortages.map((shortage) => shortage.componentId)).toContain("WHEEL");
  });

  it("rounds the purchase quantity up to whole units", () => {
    const g = graph(edge("A", "B", 2.5));
    const { shortages } = netRequirements(explode(g, "A", 3), new Map([["B", toMilli(1)]]), g);
    // Need 7.5, have 1 => 6.5 short => 7 units.
    expect(shortages[0]!.toPurchase).toBe(7);
  });

  it("is sorted deterministically", () => {
    const g = bikeBom();
    const { shortages } = netRequirements(explode(g, "BIKE", 100), new Map(), g);
    const ids = shortages.map((shortage) => shortage.componentId);
    expect(ids).toEqual([...ids].sort());
  });
});

describe("whereUsed", () => {
  it("lists every assembly that transitively contains the component", () => {
    const g = graph(
      edge("BIKE", "WHEEL", 1),
      edge("WHEEL", "BOLT", 1),
      edge("SCOOTER", "WHEEL", 1),
      edge("TRIKE", "BIKE", 1),
    );
    const result = whereUsed(g, "BOLT");
    const byId = new Map(result.map((entry) => [entry.assemblyId, entry.distance]));
    expect(byId.get("WHEEL")).toBe(1);
    expect(byId.get("BIKE")).toBe(2);
    expect(byId.get("SCOOTER")).toBe(2);
    expect(byId.get("TRIKE")).toBe(3);
  });

  it("returns an empty list for a component nothing uses", () => {
    expect(whereUsed(bikeBom(), "UNUSED")).toEqual([]);
  });

  it("does not list the component itself", () => {
    expect(whereUsed(bikeBom(), "BIKE").map((entry) => entry.assemblyId)).not.toContain("BIKE");
  });
});

describe("rolledUpCost", () => {
  it("costs a unit from its leaves", () => {
    const g = bikeBom();
    const costs = new Map([
      ["TYRE", 1_000],
      ["RIM", 500],
      ["BOLT", 10],
      ["FRAME", 2_000],
    ]);
    // WHEEL has no price of its own, so it rolls up from its children:
    // TYRE + RIM + BOLT = 1510. FRAME has its own standard cost, which wins
    // over its 4 BOLT children (you do not buy the bolts of a bought frame):
    // BIKE = 2*WHEEL + FRAME = 3020 + 2000 = 5020.
    const result = rolledUpCost(g, "BIKE", costs);
    expect(result.costMinor).toBe(5_020);
    expect(result.unpriced).toEqual([]);
  });

  it("reports unpriced components instead of quietly costing zero", () => {
    const costs = new Map([["TYRE", 1_000]]);
    const result = rolledUpCost(bikeBom(), "BIKE", costs);
    expect(result.unpriced).toContain("RIM");
    expect(result.unpriced).toContain("BOLT");
    expect(result.unpriced).toContain("FRAME");
    // The number is still returned, but the caller knows it is incomplete.
    expect(result.costMinor).toBe(1_000 * 2);
  });

  it("costs a leaf from its own entry", () => {
    expect(rolledUpCost(bikeBom(), "TYRE", new Map([["TYRE", 250]])).costMinor).toBe(250);
  });
});

describe("toMilli / fromMilli", () => {
  it("round-trips integral and fractional quantities", () => {
    for (const value of [0, 1, 2.5, 0.001, 1_234.567]) {
      expect(fromMilli(toMilli(value))).toBeCloseTo(value, 3);
    }
  });

  it("rejects non-finite input", () => {
    expect(() => toMilli(Number.NaN)).toThrow(BomError);
    expect(() => toMilli(Number.POSITIVE_INFINITY)).toThrow(BomError);
  });
});

describe("childrenIndex", () => {
  it("groups edges by parent", () => {
    const index = childrenIndex(bikeBom());
    expect(index.get("BIKE")!.map((entry) => entry.childId).sort()).toEqual(["FRAME", "WHEEL"]);
    expect(index.get("TYRE")).toBeUndefined();
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

/**
 * Builds a random DAG by only ever connecting a lower-numbered node to a
 * higher-numbered one, which makes cycles impossible by construction.
 */
function randomDag(random: () => number, nodeCount: number, edgeCount: number): BomGraph {
  const ids = Array.from({ length: nodeCount }, (_, index) => `N${index}`);
  const edges: BomEdge[] = [];
  const used = new Set<string>();
  let attempts = 0;
  while (edges.length < edgeCount && attempts < edgeCount * 20) {
    attempts += 1;
    const a = Math.floor(random() * (nodeCount - 1));
    const b = a + 1 + Math.floor(random() * (nodeCount - 1 - a));
    const key = `${a}-${b}`;
    if (used.has(key)) continue;
    used.add(key);
    edges.push({
      parentId: ids[a]!,
      childId: ids[b]!,
      quantity: toMilli(1 + Math.floor(random() * 4)),
      scrapBp: random() < 0.2 ? Math.floor(random() * 500) : 0,
    });
  }
  return { edges };
}

describe("property: the graph invariants hold for any acyclic BOM", () => {
  it("a DAG built from ordered edges is always accepted as acyclic", () => {
    const random = mulberry32(20_261_115);
    for (let run = 0; run < 200; run += 1) {
      const g = randomDag(random, 2 + Math.floor(random() * 8), 1 + Math.floor(random() * 10));
      expect(findCycle(g)).toBeNull();
      expect(() => assertAcyclic(g)).not.toThrow();
    }
  });

  it("topological order always puts every child before its parent", () => {
    const random = mulberry32(7);
    for (let run = 0; run < 200; run += 1) {
      const g = randomDag(random, 2 + Math.floor(random() * 8), 1 + Math.floor(random() * 10));
      const order = topologicalOrder(g);
      const position = new Map(order.map((node, index) => [node, index]));
      for (const e of g.edges) {
        expect(position.get(e.childId)!).toBeLessThan(position.get(e.parentId)!);
      }
      // Every node appears exactly once: no duplicates, nothing dropped.
      expect(new Set(order).size).toBe(order.length);
      expect(order.length).toBe(nodesOf(g).length);
    }
  });

  it("explosion is monotonic in the root quantity", () => {
    const random = mulberry32(99);
    for (let run = 0; run < 120; run += 1) {
      const g = randomDag(random, 2 + Math.floor(random() * 6), 1 + Math.floor(random() * 8));
      const roots = nodesOf(g).filter((node) => !g.edges.some((e) => e.childId === node));
      if (roots.length === 0) continue;
      const root = roots.sort()[0]!;

      const small = explode(g, root, 1);
      const large = explode(g, root, 5);
      const smallById = new Map(small.lines.map((line) => [line.componentId, line.requiredMilli]));
      for (const line of large.lines) {
        // Five times as many units can never need FEWER of a component.
        expect(line.requiredMilli).toBeGreaterThanOrEqual(smallById.get(line.componentId) ?? 0);
      }
    }
  });

  it("whole-unit requirements always cover the exact requirement", () => {
    const random = mulberry32(1234);
    for (let run = 0; run < 200; run += 1) {
      const g = randomDag(random, 2 + Math.floor(random() * 8), 1 + Math.floor(random() * 10));
      const roots = nodesOf(g).filter((node) => !g.edges.some((e) => e.childId === node));
      if (roots.length === 0) continue;
      const root = roots.sort()[0]!;
      const quantity = 1 + Math.floor(random() * 10);
      for (const line of explode(g, root, quantity).lines) {
        // Ceiling, not floor: you must be able to fulfil the exact requirement.
        expect(line.requiredWhole * 1000).toBeGreaterThanOrEqual(line.requiredMilli);
        expect((line.requiredWhole - 1) * 1000).toBeLessThan(line.requiredMilli);
      }
    }
  });

  it("a component is never exploded above its shallowest level", () => {
    const random = mulberry32(555);
    for (let run = 0; run < 200; run += 1) {
      const g = randomDag(random, 3 + Math.floor(random() * 7), 2 + Math.floor(random() * 10));
      const roots = nodesOf(g).filter((node) => !g.edges.some((e) => e.childId === node));
      if (roots.length === 0) continue;
      const root = roots.sort()[0]!;
      const result = explode(g, root, 1);
      for (const line of result.lines) {
        expect(line.level).toBeGreaterThanOrEqual(1);
        expect(line.level).toBeLessThanOrEqual(nodesOf(g).length);
        expect(line.requiredMilli).toBeGreaterThan(0);
      }
    }
  });

  it("adding an edge can never reduce another component's requirement", () => {
    // A BOM change that makes a part disappear from a plan is a red flag, so
    // this guards the accumulation logic against a rewrite that double-counts
    // or drops paths.
    const random = mulberry32(31_337);
    for (let run = 0; run < 120; run += 1) {
      const base = randomDag(random, 4 + Math.floor(random() * 6), 2 + Math.floor(random() * 6));
      const roots = nodesOf(base).filter((node) => !base.edges.some((e) => e.childId === node));
      if (roots.length === 0) continue;
      const root = roots.sort()[0]!;
      const before = explode(base, root, 1);
      const beforeById = new Map(before.lines.map((line) => [line.componentId, line.requiredMilli]));

      // Add one edge from a node to a NEW leaf, which cannot create a cycle.
      const leaf = `NEW${run}`;
      const from = nodesOf(base)[Math.floor(random() * nodesOf(base).length)]!;
      const extended = explode({ edges: [...base.edges, edge(from, leaf, 1)] }, root, 1);
      const extendedById = new Map(extended.lines.map((line) => [line.componentId, line.requiredMilli]));

      for (const [componentId, required] of beforeById) {
        expect(extendedById.get(componentId) ?? 0).toBeGreaterThanOrEqual(required);
      }
      // The new leaf is present iff `from` is in the exploded tree.
      if (beforeById.has(from)) {
        expect(extendedById.has(leaf)).toBe(true);
      }
    }
  });
});
