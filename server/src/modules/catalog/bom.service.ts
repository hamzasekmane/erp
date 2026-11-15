import { Injectable } from "@nestjs/common";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "../../db/client";
import { bomLines, products, stockLevels } from "../../db/schema";
import {
  assertAcyclic,
  bomDepth,
  explode,
  findCycle,
  fromMilli,
  netRequirements,
  rolledUpCost,
  toMilli,
  validateGraph,
  whereUsed,
  BomError,
  type BomEdge,
  type BomGraph,
  type ExplosionResult,
} from "../../../lib/algorithms/bom";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";

type Ctx = { tenantId: string; userId?: string };

export type BomLineView = {
  id: string;
  parentId: string;
  childId: string;
  childCode: string | null;
  childName: string | null;
  quantity: number;
  scrapBp: number;
};

/**
 * Bill of materials: storage plus the two questions a planner actually asks
 * ("what does one bike need?" and "what do I have to buy for 50 bikes?").
 *
 * The graph arithmetic is in `lib/algorithms/bom.ts`. This service only loads
 * rows, maps errors onto HTTP status codes, and never lets a `BomError` escape
 * as a 500: a cycle or a self-reference is bad input from the caller's point
 * of view, so it is a 400 with a message that names the offending products.
 */
@Injectable()
export class BomService {
  /** Every line in the tenant, as the library's edge shape. */
  private async loadGraph(ctx: Ctx): Promise<BomGraph> {
    const rows = await getDb()
      .select({
        parentId: bomLines.parentId,
        childId: bomLines.childId,
        quantity: bomLines.quantity,
        scrapBp: bomLines.scrapBp,
      })
      .from(bomLines)
      .where(eq(bomLines.tenantId, ctx.tenantId));

    return {
      edges: rows.map((row) => ({
        parentId: row.parentId,
        childId: row.childId,
        quantity: toMilli(Number(row.quantity)),
        scrapBp: row.scrapBp,
      })),
    };
  }

  /** Maps a library error onto the HTTP layer. Anything else is rethrown. */
  private translate(error: unknown): never {
    if (error instanceof BomError) {
      const code = error.code;
      if (code === "CYCLE" || code === "DEPTH_EXCEEDED") {
        throw AppError.badRequest(error.message);
      }
      if (code === "INVALID_EDGE" || code === "SELF_REFERENCE" || code === "DUPLICATE_EDGE") {
        throw AppError.badRequest(error.message);
      }
      if (code === "INVALID_QUANTITY" || code === "INVALID_SCRAP") {
        throw AppError.badRequest(error.message);
      }
      if (code === "AMOUNT_OVERFLOW") {
        // The requested quantity is representable, the plan is not.
        throw AppError.badRequest(error.message);
      }
      throw AppError.badRequest(error.message);
    }
    throw error;
  }

  private async assertProductExists(ctx: Ctx, productId: string): Promise<void> {
    const [product] = await getDb()
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)))
      .limit(1);
    if (!product) throw AppError.notFound("Produit introuvable");
  }

  /** The direct components of one product, with names for display. */
  async list(ctx: Ctx, productId: string): Promise<BomLineView[]> {
    await this.assertProductExists(ctx, productId);
    const rows = await getDb()
      .select({
        id: bomLines.id,
        parentId: bomLines.parentId,
        childId: bomLines.childId,
        quantity: bomLines.quantity,
        scrapBp: bomLines.scrapBp,
        childCode: products.code,
        childName: products.name,
      })
      .from(bomLines)
      .leftJoin(products, eq(products.id, bomLines.childId))
      .where(and(eq(bomLines.tenantId, ctx.tenantId), eq(bomLines.parentId, productId)))
      .orderBy(bomLines.childId);

    return rows.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      childId: row.childId,
      childCode: row.childCode ?? null,
      childName: row.childName ?? null,
      quantity: Number(row.quantity),
      scrapBp: row.scrapBp,
    }));
  }

  /**
   * Replaces the component list of one product.
   *
   * Replace rather than patch: a BOM is read as a whole ("a bike is two wheels
   * and a frame"), so sending the new list is the only edit that leaves no room
   * for a forgotten deletion. The whole set is validated as a graph BEFORE
   * anything is written, and the write happens in one transaction, so a cycle is
   * rejected without leaving half a BOM behind.
   */
  async replace(ctx: Ctx, productId: string, lines: Array<{ childId: string; quantity: number; scrapBp?: number }>): Promise<BomLineView[]> {
    await this.assertProductExists(ctx, productId);

    const childIds = [...new Set(lines.map((line) => line.childId))];
    if (childIds.length > 0) {
      const found = await getDb()
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.tenantId, ctx.tenantId), inArray(products.id, childIds), isNull(products.deletedAt)));
      const known = new Set(found.map((row) => row.id));
      const missing = childIds.filter((id) => !known.has(id));
      if (missing.length > 0) {
        throw AppError.badRequest(`Composants inconnus : ${missing.join(", ")}`);
      }
    }

    const db = getDb();
    const existing = await this.loadGraph(ctx);
    const proposed: BomGraph = {
      edges: [
        ...existing.edges.filter((edge) => edge.parentId !== productId),
        ...lines.map<BomEdge>((line) => ({
          parentId: productId,
          childId: line.childId,
          quantity: toMilli(line.quantity),
          scrapBp: line.scrapBp ?? 0,
        })),
      ],
    };

    try {
      validateGraph(proposed);
      assertAcyclic(proposed);
    } catch (error) {
      // The cycle path is the useful part: name it, so the caller sees
      // "PRODUIT A -> PRODUIT B -> PRODUIT A" instead of "invalid BOM".
      if (error instanceof BomError && error.code === "CYCLE") {
        const path = findCycle(proposed);
        if (path) {
          const names = await this.namesOf(ctx, path);
          throw AppError.badRequest(
            `La nomenclature créerait un cycle : ${path.map((id) => names.get(id) ?? id).join(" -> ")}`,
          );
        }
      }
      this.translate(error);
    }

    await db.transaction(async (tx) => {
      await tx.delete(bomLines).where(and(eq(bomLines.tenantId, ctx.tenantId), eq(bomLines.parentId, productId)));
      if (lines.length === 0) return;
      await tx.insert(bomLines).values(
        lines.map((line) => ({
          id: newId(),
          tenantId: ctx.tenantId,
          parentId: productId,
          childId: line.childId,
          quantity: String(line.quantity),
          scrapBp: line.scrapBp ?? 0,
        })),
      );
    });

    return this.list(ctx, productId);
  }

  async remove(ctx: Ctx, productId: string, childId: string): Promise<void> {
    await this.assertProductExists(ctx, productId);
    const deleted = await getDb()
      .delete(bomLines)
      .where(and(eq(bomLines.tenantId, ctx.tenantId), eq(bomLines.parentId, productId), eq(bomLines.childId, childId)))
      .returning({ id: bomLines.id });
    if (deleted.length === 0) throw AppError.notFound("Ligne de nomenclature introuvable");
  }

  private async namesOf(ctx: Ctx, ids: string[]): Promise<Map<string, string>> {
    const rows = await getDb()
      .select({ id: products.id, code: products.code, name: products.name })
      .from(products)
      .where(and(eq(products.tenantId, ctx.tenantId), inArray(products.id, ids)));
    return new Map(rows.map((row) => [row.id, `${row.code} — ${row.name}`]));
  }

  /** Everything one unit (or `quantity` units) of `productId` needs. */
  async explosion(ctx: Ctx, productId: string, quantity: number): Promise<ExplosionResult & { depth: number; names: Record<string, string> }> {
    await this.assertProductExists(ctx, productId);
    const graph = await this.loadGraph(ctx);
    try {
      const result = explode(graph, productId, quantity);
      const ids = [productId, ...result.lines.map((line) => line.componentId)];
      const names = await this.namesOf(ctx, ids);
      return {
        ...result,
        depth: bomDepth(graph, productId),
        names: Object.fromEntries([...names.entries()].map(([id, label]) => [id, label])),
      };
    } catch (error) {
      return this.translate(error);
    }
  }

  /**
   * Net requirement: the explosion, netted against stock on hand.
   *
   * Only leaves are reported as purchases by default. A sub-assembly is built,
   * not bought, so listing it as a purchase would order it twice.
   */
  async requirements(ctx: Ctx, productId: string, quantity: number, includeAssemblies = false) {
    await this.assertProductExists(ctx, productId);
    const graph = await this.loadGraph(ctx);
    let result: ExplosionResult;
    try {
      result = explode(graph, productId, quantity);
    } catch (error) {
      return this.translate(error);
    }

    const componentIds = result.lines.map((line) => line.componentId);
    const levels = componentIds.length
      ? await getDb()
          .select({ productId: stockLevels.productId, quantity: stockLevels.quantity })
          .from(stockLevels)
          .where(and(eq(stockLevels.tenantId, ctx.tenantId), inArray(stockLevels.productId, componentIds)))
      : [];
    const onHand = new Map(levels.map((row) => [row.productId, toMilli(Number(row.quantity))]));

    const netted = netRequirements(result, onHand, graph, { includeAssemblies });
    const names = await this.namesOf(ctx, [...new Set([...netted.shortages.map((s) => s.componentId), ...netted.covered.map((c) => c.componentId)])]);
    return {
      productId,
      quantity,
      shortages: netted.shortages.map((shortage) => ({
        componentId: shortage.componentId,
        name: names.get(shortage.componentId) ?? shortage.componentId,
        requiredMilli: shortage.requiredMilli,
        required: fromMilli(shortage.requiredMilli),
        onHand: fromMilli(shortage.onHandMilli),
        short: fromMilli(shortage.shortMilli),
        toPurchase: shortage.toPurchase,
      })),
      covered: netted.covered.map((line) => ({
        componentId: line.componentId,
        name: names.get(line.componentId) ?? line.componentId,
        required: fromMilli(line.requiredMilli),
      })),
    };
  }

  /** Where a component is used, nearest parent first. */
  async whereUsed(ctx: Ctx, componentId: string) {
    await this.assertProductExists(ctx, componentId);
    const graph = await this.loadGraph(ctx);
    const usage = whereUsed(graph, componentId);
    const names = await this.namesOf(ctx, usage.map((entry) => entry.assemblyId));
    return usage.map((entry) => ({
      ...entry,
      name: names.get(entry.assemblyId) ?? entry.assemblyId,
    }));
  }

  /**
   * Cost of one unit, rolled up from the BOM.
   *
   * A product's own `cost_minor` is authoritative when present: it is the
   * standard cost of that item, and if it is bought, its components are not
   * bought as well. `unpriced` names everything the figure is missing.
   */
  async cost(ctx: Ctx, productId: string) {
    await this.assertProductExists(ctx, productId);
    const graph = await this.loadGraph(ctx);
    const rows = await getDb()
      .select({ id: products.id, costMinor: products.costMinor })
      .from(products)
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)));
    const costs = new Map<string, number>();
    for (const row of rows) {
      // `products.cost_minor` is NOT NULL DEFAULT 0, so this schema cannot tell
      // "nobody entered a cost" from "this item is free". Treating 0 as missing
      // is the useful reading: a zero cost in a catalogue means nobody filled it
      // in, and reporting it as a real price would silently under-cost the
      // product. The consequence is deliberate and worth stating: a genuinely
      // free component is reported as unpriced rather than as 0.
      if (row.costMinor !== null && row.costMinor > 0) costs.set(row.id, row.costMinor);
    }
    const result = rolledUpCost(graph, productId, costs);
    return {
      productId,
      costMinor: result.costMinor,
      cost: result.costMinor / 100,
      unpriced: result.unpriced,
    };
  }
}
