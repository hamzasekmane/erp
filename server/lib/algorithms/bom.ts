/**
 * Bill of Materials and Material Requirements Planning.
 *
 * Framework-agnostic and dependency-free — no Nest, no Drizzle, no I/O — so the
 * graph logic can be property-tested against adversarial inputs.
 *
 * Why a library and not a recursive SQL query
 * -------------------------------------------
 * A BOM is a directed acyclic graph: a product is assembled from components,
 * which may themselves be assembled. Three things go wrong in naive
 * implementations, and all three are silent:
 *
 *   1. **Cycles.** A → B → A makes a recursive query loop forever or, worse,
 *      returns a partial answer. Cycles must be rejected when the BOM is
 *      created, not discovered when someone tries to plan a build.
 *   2. **Diamond (shared-component) double counting.** If A needs 2×B and C
 *      needs 3×B, and D needs one of each, a naive depth-first walk adds B's
 *      quantity twice when it should add the total — or adds it twice when the
 *      requirement is genuinely duplicated. Level-by-level explosion with
 *      quantity accumulation gets this right.
 *   3. **Lossy rounding.** You cannot buy 2.5 screws. Rounding each level
 *      independently compounds error; rounding only at the end loses the
 *      per-level scrap. This module rounds up at the end and keeps the exact
 *      fractional requirement available for costing.
 *
 * Quantities are integers in thousandths (milli-units), consistent with
 * `stock_levels` being `numeric(18,3)`: a requirement of 2.5 units is 2500.
 * Money remains integer minor units (ADR-0002).
 */

export class BomError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "BomError";
    this.code = code;
  }
}

/** Quantity in thousandths of a unit. 2.5 units = 2500. */
export type Milli = number;

const MILLI = 1000;

export function toMilli(units: number): Milli {
  if (!Number.isFinite(units)) throw new BomError("INVALID_QUANTITY", `quantity must be finite, got ${units}`);
  const milli = Math.round(units * MILLI);
  if (!Number.isSafeInteger(milli)) {
    throw new BomError("AMOUNT_OVERFLOW", `quantity ${units} exceeds the representable range`);
  }
  return milli;
}

export function fromMilli(milli: Milli): number {
  return milli / MILLI;
}

export type BomEdge = {
  /** The assembly (parent). */
  parentId: string;
  /** The component (child). */
  childId: string;
  /** How many `childId` one `parentId` needs. Must be > 0. */
  quantity: Milli;
  /** Scrap allowance in basis points, e.g. 250 = 2.5% extra must be issued. */
  scrapBp?: number;
};

export type BomGraph = {
  edges: readonly BomEdge[];
};

function assertEdge(edge: BomEdge, index: number): void {
  if (!edge.parentId || !edge.childId) {
    throw new BomError("INVALID_EDGE", `edge ${index}: parentId and childId are required`);
  }
  if (!Number.isInteger(edge.quantity) || edge.quantity <= 0) {
    throw new BomError(
      "INVALID_QUANTITY",
      `edge ${edge.parentId}->${edge.childId}: quantity must be a positive integer in milli-units, got ${edge.quantity}`,
    );
  }
  const scrap = edge.scrapBp ?? 0;
  if (!Number.isInteger(scrap) || scrap < 0 || scrap > 10_000) {
    throw new BomError(
      "INVALID_SCRAP",
      `edge ${edge.parentId}->${edge.childId}: scrapBp must be an integer 0..10000, got ${scrap}`,
    );
  }
}

/**
 * Rejects self-references and duplicate edges.
 *
 * Duplicate `parent→child` pairs are refused rather than summed: two rows for
 * the same pair usually means a data-entry mistake, and silently adding them
 * turns a typo into a doubled requirement.
 */
export function validateGraph(graph: BomGraph): void {
  const seen = new Set<string>();
  graph.edges.forEach((edge, index) => {
    assertEdge(edge, index);
    if (edge.parentId === edge.childId) {
      throw new BomError("SELF_REFERENCE", `component ${edge.parentId} cannot contain itself`);
    }
    const key = `${edge.parentId}\u0000${edge.childId}`;
    if (seen.has(key)) {
      throw new BomError(
        "DUPLICATE_EDGE",
        `duplicate BOM line ${edge.parentId}->${edge.childId}; merge the rows instead of adding them`,
      );
    }
    seen.add(key);
  });
}

/** All distinct node ids in the graph. O(E). */
export function nodesOf(graph: BomGraph): string[] {
  const nodes = new Set<string>();
  for (const edge of graph.edges) {
    nodes.add(edge.parentId);
    nodes.add(edge.childId);
  }
  return [...nodes];
}

/** Direct children of a node, O(E) — callers planning many builds should index once. */
export function childrenIndex(graph: BomGraph): Map<string, BomEdge[]> {
  const index = new Map<string, BomEdge[]>();
  for (const edge of graph.edges) {
    const list = index.get(edge.parentId) ?? [];
    list.push(edge);
    index.set(edge.parentId, list);
  }
  return index;
}

/**
 * Depth-first cycle detection.
 *
 * O(V + E). Returns the cycle as a path so the error can name it
 * (`A → B → C → A`) instead of saying "invalid BOM", which would leave the
 * operator to find it by hand.
 *
 * Uses three-colour marking (white/grey/black) rather than a visited set:
 * a `visited` set alone cannot distinguish "done" from "on the current path",
 * and therefore cannot detect a cycle at all — it only terminates.
 */
export function findCycle(graph: BomGraph): string[] | null {
  const index = childrenIndex(graph);
  const GREY = 1;
  const BLACK = 2;
  const colour = new Map<string, typeof GREY | typeof BLACK>();
  const stack: string[] = [];

  const visit = (node: string): string[] | null => {
    colour.set(node, GREY);
    stack.push(node);
    for (const edge of index.get(node) ?? []) {
      const state = colour.get(edge.childId);
      if (state === GREY) {
        // The child is on the current path: slice from its first appearance.
        const start = stack.indexOf(edge.childId);
        return [...stack.slice(start), edge.childId];
      }
      // BLACK means fully explored: skip it. Only an unexplored node is
      // descended into. (Declaring BLACK and never comparing against it is how
      // this read before: the enum existed, so the code looked correct while
      // re-exploring completed subtrees — which then reported a completed node
      // as if it were on the current path.)
      if (state === undefined) {
        const found = visit(edge.childId);
        if (found) return found;
      }
    }
    stack.pop();
    colour.set(node, BLACK);
    return null;
  };

  for (const node of nodesOf(graph)) {
    if (colour.get(node) === undefined) {
      const found = visit(node);
      if (found) return found;
    }
  }
  return null;
}

/** Throws with the cycle path if the graph is cyclic. O(V + E). */
export function assertAcyclic(graph: BomGraph): void {
  validateGraph(graph);
  const cycle = findCycle(graph);
  if (cycle) {
    throw new BomError("CYCLE", `BOM contains a cycle: ${cycle.join(" -> ")}`);
  }
}

/**
 * Topological order, children before parents.
 *
 * Kahn's algorithm. O(V + E). Deterministic: among nodes with no remaining
 * dependency, the lexicographically smallest is emitted first, so two runs on
 * the same graph produce the same order — a plan whose component order changes
 * between runs is impossible to review or diff.
 *
 * Throws on a cycle rather than returning a partial list.
 */
export function topologicalOrder(graph: BomGraph): string[] {
  assertAcyclic(graph);
  const nodes = nodesOf(graph).sort();
  const index = childrenIndex(graph);
  // dependency = the children a node needs before it can be built. A leaf has
  // no dependencies, so leaves are ready first — that is what "children before
  // parents" means for a build order.
  const remaining = new Map<string, Set<string>>();
  for (const node of nodes) remaining.set(node, new Set());
  // parentIndex: child -> parents, so meeting a node can release its parents.
  const parentIndex = new Map<string, string[]>();
  for (const node of nodes) parentIndex.set(node, []);
  for (const edge of graph.edges) {
    remaining.get(edge.parentId)!.add(edge.childId);
    parentIndex.get(edge.childId)!.push(edge.parentId);
  }

  const ready = nodes.filter((node) => remaining.get(node)!.size === 0);
  const order: string[] = [];
  while (ready.length > 0) {
    const node = ready.shift()!;
    order.push(node);
    for (const parent of parentIndex.get(node) ?? []) {
      const deps = remaining.get(parent)!;
      deps.delete(node);
      if (deps.size === 0) {
        ready.push(parent);
        ready.sort();
      }
    }
  }
  if (order.length !== nodes.length) {
    // assertAcyclic already guarantees this, but a partial plan is worse than
    // an error, so it is checked rather than assumed.
    throw new BomError("CYCLE", "topological order is incomplete; the graph is cyclic");
  }
  return order;
}

/** How deep the BOM goes below `rootId`. 0 for a leaf. O(V + E). */
export function bomDepth(graph: BomGraph, rootId: string): number {
  assertAcyclic(graph);
  const index = childrenIndex(graph);
  const memo = new Map<string, number>();
  const depth = (node: string): number => {
    const cached = memo.get(node);
    if (cached !== undefined) return cached;
    const children = index.get(node) ?? [];
    const value = children.length === 0 ? 0 : 1 + Math.max(...children.map((edge) => depth(edge.childId)));
    memo.set(node, value);
    return value;
  };
  return depth(rootId);
}

export type ExplosionLine = {
  componentId: string;
  /** Exact requirement in milli-units, scrap included, no rounding. */
  requiredMilli: Milli;
  /** Rounded up to whole units — what to actually issue or buy. */
  requiredWhole: number;
  /** BOM level at which the component first appears below the root. */
  level: number;
  /** Which parents pulled it in, for explaining the number to a user. */
  sources: string[];
};

export type ExplosionResult = {
  rootId: string;
  /** Requirement for the root itself, in units. */
  rootQuantity: number;
  lines: ExplosionLine[];
  /** Ordered from deepest to shallowest: the order to build. */
  buildOrder: string[];
  /** Components with no sub-assembly, i.e. what must be purchased. */
  leafComponentIds: string[];
};

/**
 * Explodes a BOM into a total requirement.
 *
 * Level-by-level breadth-first accumulation, which is what makes a **diamond**
 * correct: if the same component is reachable through two different parents,
 * its requirement is accumulated across paths exactly once per path, and the
 * `sources` list records which parents contributed. Depth-first accumulation
 * into a single map gets this wrong whenever a sub-assembly is shared.
 *
 * O(V + E) per level of depth — bounded by O(V · E) in the worst case.
 *
 * `requiredMilli` is exact (scrap and fractional quantities included);
 * `requiredWhole` rounds **up once at the end**, never per level. Rounding each
 * level up would inflate the total every time the BOM is deep.
 */
export function explode(
  graph: BomGraph,
  rootId: string,
  rootQuantity: number,
  options: { includeRoot?: boolean } = {},
): ExplosionResult {
  assertAcyclic(graph);
  const rootMilli = toMilli(rootQuantity);
  if (rootMilli <= 0) {
    throw new BomError("INVALID_QUANTITY", `root quantity must be positive, got ${rootQuantity}`);
  }

  const index = childrenIndex(graph);

  // level 0 is the root itself; requirements at each level are accumulated
  // before descending, so shared components are merged rather than duplicated.
  const required = new Map<string, Milli>();
  const levels = new Map<string, number>();
  const sources = new Map<string, Set<string>>();

  let frontier: Array<{ node: string; quantity: Milli; path: string }> = [
    { node: rootId, quantity: rootMilli, path: rootId },
  ];
  let level = 0;

  while (frontier.length > 0) {
    const next: Array<{ node: string; quantity: Milli; path: string }> = [];

    for (const item of frontier) {
      const ancestors = item.path.split("\u0000");

      for (const edge of index.get(item.node) ?? []) {
        // A path guard catches anything findCycle missed: descending into a
        // component that is already an ancestor means the graph is cyclic.
        if (ancestors.includes(edge.childId)) {
          throw new BomError("CYCLE", `BOM contains a cycle through ${edge.childId}`);
        }
        const scrapFactor = 1 + (edge.scrapBp ?? 0) / 10_000;
        // Both operands are in milli-units, so their product is in micro-units:
        // divide by MILLI once to come back to milli. Round the result to the
        // nearest milli-unit; the graph and the input are integers, so this
        // only absorbs the scrap multiplication.
        const needed = Math.round((item.quantity * edge.quantity * scrapFactor) / MILLI);
        if (!Number.isSafeInteger(needed)) {
          throw new BomError("AMOUNT_OVERFLOW", `requirement for ${edge.childId} exceeds the representable range`);
        }

        const accumulated = (required.get(edge.childId) ?? 0) + needed;
        if (!Number.isSafeInteger(accumulated)) {
          throw new BomError("AMOUNT_OVERFLOW", `total requirement for ${edge.childId} is too large`);
        }
        required.set(edge.childId, accumulated);
        // A component reachable at several levels is reported at the SHALLOWEST
        // one: that is where the plan first needs it.
        if (!levels.has(edge.childId) || level + 1 < levels.get(edge.childId)!) {
          levels.set(edge.childId, level + 1);
        }
        const sourceSet = sources.get(edge.childId) ?? new Set<string>();
        sourceSet.add(item.node);
        sources.set(edge.childId, sourceSet);

        next.push({ node: edge.childId, quantity: needed, path: `${item.path}\u0000${edge.childId}` });
      }
    }

    frontier = next;
    level += 1;
    // Bound the work: a valid DAG cannot exceed its node count in depth.
    if (level > nodesOf(graph).length + 1) {
      throw new BomError("DEPTH_EXCEEDED", "BOM explosion exceeded the maximum depth; the graph is malformed");
    }
  }

  const lines: ExplosionLine[] = [...required.entries()]
    .map(([componentId, requiredMilli]) => ({
      componentId,
      requiredMilli,
      requiredWhole: Math.ceil(requiredMilli / MILLI),
      level: levels.get(componentId) ?? 1,
      sources: [...(sources.get(componentId) ?? [])].sort(),
    }))
    // Deepest first, then by id: deterministic, and it reads as a build order.
    .sort((a, b) => b.level - a.level || (a.componentId < b.componentId ? -1 : a.componentId > b.componentId ? 1 : 0));

  if (options.includeRoot) {
    // The root's own requirement, at level 0, for symmetry in reports.
    lines.unshift({
      componentId: rootId,
      requiredMilli: rootMilli,
      requiredWhole: Math.ceil(rootMilli / MILLI),
      level: 0,
      sources: [],
    });
  }

  // Build order: children before parents, restricted to nodes in this BOM.
  const inBom = new Set(lines.map((line) => line.componentId));
  const buildOrder = topologicalOrder(graph).filter((node) => inBom.has(node) && node !== rootId);

  const leafComponentIds = lines
    .filter((line) => !index.has(line.componentId))
    .map((line) => line.componentId);

  return { rootId, rootQuantity, lines, buildOrder, leafComponentIds };
}

export type StockOnHand = ReadonlyMap<string, Milli>;

export type Shortage = {
  componentId: string;
  requiredMilli: Milli;
  onHandMilli: Milli;
  /** Shortfall in milli-units; always > 0 for a reported shortage. */
  shortMilli: Milli;
  /** Rounded up: the number of whole units to buy. */
  toPurchase: number;
};

/**
 * Net requirement against stock on hand.
 *
 * O(L) where L is the number of explosion lines.
 *
 * Only leaves are reported as purchases by default: a sub-assembly is built,
 * not bought, so listing it as a purchase would order it twice. Pass
 * `includeAssemblies` for the cases where an assembly is bought in.
 */
export function netRequirements(
  explosion: ExplosionResult,
  onHand: StockOnHand,
  graph: BomGraph,
  options: { includeAssemblies?: boolean } = {},
): { shortages: Shortage[]; covered: ExplosionLine[] } {
  const assemblies = new Set(graph.edges.map((edge) => edge.parentId));
  const shortages: Shortage[] = [];
  const covered: ExplosionLine[] = [];

  for (const line of explosion.lines) {
    if (!options.includeAssemblies && assemblies.has(line.componentId)) continue;
    const available = onHand.get(line.componentId) ?? 0;
    const short = line.requiredMilli - available;
    if (short > 0) {
      shortages.push({
        componentId: line.componentId,
        requiredMilli: line.requiredMilli,
        onHandMilli: available,
        shortMilli: short,
        toPurchase: Math.ceil(short / MILLI),
      });
    } else {
      covered.push(line);
    }
  }

  shortages.sort((a, b) => (a.componentId < b.componentId ? -1 : a.componentId > b.componentId ? 1 : 0));
  return { shortages, covered };
}

/**
 * Where-used: every assembly that (transitively) contains `componentId`.
 *
 * O(V + E). Answers "if I change this part, what else is affected?", which is
 * the question an engineer asks before an ECO and a buyer asks before
 * discontinuing a component.
 */
export function whereUsed(graph: BomGraph, componentId: string): Array<{ assemblyId: string; distance: number }> {
  assertAcyclic(graph);
  const parents = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const list = parents.get(edge.childId) ?? [];
    list.push(edge.parentId);
    parents.set(edge.childId, list);
  }

  const distance = new Map<string, number>();
  let frontier = [componentId];
  let level = 0;
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const node of frontier) {
      for (const parent of parents.get(node) ?? []) {
        if (distance.has(parent) || parent === componentId) continue;
        distance.set(parent, level + 1);
        next.push(parent);
      }
    }
    frontier = next;
    level += 1;
  }
  return [...distance.entries()]
    .map(([assemblyId, dist]) => ({ assemblyId, distance: dist }))
    .sort((a, b) => a.distance - b.distance || (a.assemblyId < b.assemblyId ? -1 : 1));
}

/**
 * Cost of one unit of `rootId`, rolling component costs up through the BOM.
 *
 * O(V + E) with memoisation; each node is costed once however many times it
 * appears. Costs are integer minor units; a component with no known cost
 * contributes zero and is reported in `unpriced` rather than silently making
 * the assembly look cheaper than it is.
 */
export function rolledUpCost(
  graph: BomGraph,
  rootId: string,
  unitCostMinor: ReadonlyMap<string, number>,
): { costMinor: number; unpriced: string[] } {
  assertAcyclic(graph);
  const index = childrenIndex(graph);
  const memo = new Map<string, number>();
  const unpriced = new Set<string>();

  const costOf = (node: string): number => {
    const cached = memo.get(node);
    if (cached !== undefined) return cached;

    const own = unitCostMinor.get(node);
    let total: number;
    if (own !== undefined) {
      // A recorded cost is the standard cost of that item and WINS over the
      // BOM: if the assembly is bought at a known price, its components are
      // not bought as well, so rolling them in on top would double-count.
      total = own;
    } else {
      const children = index.get(node) ?? [];
      total = 0;
      for (const edge of children) {
        // edge.quantity is in milli-units: divide once, after multiplying, so
        // the arithmetic stays integral until the final minor unit.
        total += Math.round((costOf(edge.childId) * edge.quantity) / MILLI);
      }
      // No price of its own and nothing derivable from below: this component's
      // cost is unknown, so say so rather than passing off 0 as a real figure.
      if (children.length === 0 || total === 0) unpriced.add(node);
    }
    memo.set(node, total);
    return total;
  };

  const costMinor = costOf(rootId);
  return { costMinor, unpriced: [...unpriced].sort() };
}
