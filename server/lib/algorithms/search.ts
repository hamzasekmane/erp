/**
 * Search: Arabic/Latin text normalization, a prefix trie, and bounded fuzzy
 * matching.
 *
 * Why this exists
 * ---------------
 * Every module in this codebase searched with `lower(name) like '%term%'`:
 * a sequential scan that cannot use an index, and that fails on the most
 * ordinary thing a user does — typing a name without the diacritics they see
 * on the screen, or with a different alef.
 *
 * Both halves of that are real bugs, not polish:
 *
 * 1. **No normalization.** `أحمد` and `احمد` are the same person; `دراجة` typed
 *    as `دراجه` is the same product. `like '%أحمد%'` finds one spelling only.
 *    pg_trgm does not rescue this: measured here, `similarity('دراجة هوائية',
 *    'دراجه هوائيه')` = **0.53**, because trigrams are computed on the raw
 *    characters. Normalization must happen before indexing, not after.
 * 2. **No index.** A leading `%` makes a btree useless, so every search read the
 *    whole table.
 *
 * The answer is a normalized search column, a trigram index over it, and the
 * ranking logic here. `normalizeSearchText` is mirrored by
 * `search_normalize()` in SQL (migration 0013); the two must agree exactly, and
 * `search.e2e.test.ts` asserts that on a table of real spellings rather than
 * trusting two hand-written implementations to stay in step.
 *
 * Framework-free on purpose: no NestJS, no database handle, so the ranking is
 * testable as pure functions and reusable from a worker.
 */

/** Arabic-Indic and extended Arabic-Indic digits, in code-point order. */
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC_INDIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ASCII_DIGITS = "0123456789";

/**
 * Diacritics (tashkeel) and Quranic marks. Nobody searches for `اَلْحَاسُوب`,
 * and a column that stores the marks is unsearchable without removing them.
 * Ranges per Unicode: U+0610-061A, U+064B-065F, U+0670, U+06D6-06ED.
 */
const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

/** Tatweel (kashida): purely typographic elongation, never significant. */
const TATWEEL = /\u0640/g;

/**
 * Alef forms. `أ إ آ ٱ` are the same letter for search purposes: a user typing
 * `أحمد` and a record stored as `احمد` must match, in both directions.
 */
const ALEF_FORMS = /[\u0622\u0623\u0625\u0671]/g; // آ أ إ ٱ -> ا (U+0627)

/** Hamza on yaa `ئ` and hamza on waw `ؤ` fold to their plain carrier letter. */
const HAMZA_ON_YAA = /\u0626/g; // ئ -> ي
const HAMZA_ON_WAW = /\u0624/g; // ؤ -> و

/** Alef maqsura `ى` and yaa `ي` are written interchangeably in practice. */
const ALEF_MAQSURA = /\u0649/g; // ى -> ي

/**
 * Taa marbuta `ة` and haa `ه`. This is a deliberate recall/precision trade:
 * `مدرسة` and `مدرسه` must match, at the cost of conflating words that genuinely
 * differ only by that letter. Arabic IR systems overwhelmingly make the same
 * choice; it is recorded here so the trade is visible rather than accidental.
 */
const TAA_MARBUTA = /\u0629/g; // ة -> ه

const WHITESPACE = /\s+/g;

/**
 * Latin combining marks left over after NFD, e.g. the accent in `é`.
 *
 * Deliberately only U+0300-036F. The wider Unicode combining ranges are left out
 * because this regex must be mirrored exactly by the SQL function, and a range
 * that is easy to get subtly wrong in one language is worse than one that is
 * slightly narrower in both.
 */
const COMBINING_MARKS = /[\u0300-\u036F]/g;

/**
 * The canonical form used for both indexing and querying.
 *
 * Deterministic and idempotent: `normalize(normalize(x)) === normalize(x)` for
 * every input. That is not a nicety — if normalizing twice changed the string,
 * a document and a query that normalize to the same thing today could diverge
 * tomorrow, and the property test that asserts idempotence is what keeps the JS
 * and SQL versions honest.
 *
 * O(n) in the length of the input.
 */
export function normalizeSearchText(input: string): string {
  if (input === null || input === undefined) return "";
  let text = String(input);

  // Compatibility decomposition first so that ligatures and presentation forms
  // (e.g. ﻻ U+FEFB) become their letters before any Arabic-specific rule runs.
  text = text.normalize("NFKC");

  text = text.toLowerCase();

  // Arabic folding comes BEFORE any NFD. NFD decomposes the hamza carriers
  // (أ -> ا + U+0654, ئ -> ي + U+0654), so running it first would fold them "by
  // accident" through the diacritic strip, and the two halves of that accident
  // (the decomposition and the range in the strip regex) would have to stay in
  // step forever. Folding the carriers explicitly first makes each rule
  // something a reader — or the SQL mirror — can see.
  text = text.replace(DIACRITICS, "").replace(TATWEEL, "");
  text = text.replace(ALEF_FORMS, "\u0627");
  text = text.replace(HAMZA_ON_YAA, "\u064A");
  text = text.replace(HAMZA_ON_WAW, "\u0648");
  text = text.replace(ALEF_MAQSURA, "\u064A");
  text = text.replace(TAA_MARBUTA, "\u0647");

  // Latin accents, last: decompose, then drop only the Latin combining marks.
  text = text.normalize("NFD").replace(COMBINING_MARKS, "");

  // Digits: a phone number entered as `٠٥٥٥` must match one stored as `0555`.
  for (let index = 0; index < 10; index += 1) {
    const arabic = ARABIC_INDIC_DIGITS[index]!;
    const extended = EXTENDED_ARABIC_INDIC_DIGITS[index]!;
    if (text.includes(arabic) || text.includes(extended)) {
      text = text.split(arabic).join(ASCII_DIGITS[index]!).split(extended).join(ASCII_DIGITS[index]!);
    }
  }

  // Collapse runs of whitespace and trim: `  دراجة   هوائية ` and
  // `دراجة هوائية` are the same query.
  return text.replace(WHITESPACE, " ").trim();
}

/**
 * Splits a normalized query into tokens.
 *
 * A multi-word query is an AND of its tokens: `دراجة هوائية` must not match a
 * product that only says `دراجة`. Empty tokens are dropped so double spaces and
 * leading punctuation never produce an impossible query.
 */
export function tokenize(query: string): string[] {
  return normalizeSearchText(query)
    .split(" ")
    .filter((token) => token.length > 0);
}

/**
 * Levenshtein edit distance, optionally abandoning early once it exceeds
 * `maxDistance` (returns `maxDistance + 1` in that case).
 *
 * Two-row DP: O(|a| · |b|) time, O(min(|a|,|b|)) space. The early exit makes the
 * common case — a word that is nowhere near the query — cheap, which is what
 * makes fuzzy search affordable in a request.
 */
export function levenshtein(a: string, b: string, maxDistance = Number.POSITIVE_INFINITY): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Iterate over the shorter string to keep the row small.
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];

  let previous: number[] = Array.from({ length: short.length + 1 }, (_, index) => index);
  for (let row = 1; row <= long.length; row += 1) {
    const current: number[] = [row];
    let rowMin = row;
    for (let column = 1; column <= short.length; column += 1) {
      const substitution = previous[column - 1]! + (long[row - 1] === short[column - 1] ? 0 : 1);
      const deletion = previous[column]! + 1;
      const insertion = current[column - 1]! + 1;
      const value = Math.min(substitution, deletion, insertion);
      current.push(value);
      if (value < rowMin) rowMin = value;
    }
    // Every later row is at least this large, so the bound can be abandoned.
    if (rowMin > maxDistance) return maxDistance + 1;
    previous = current;
  }
  return previous[short.length]!;
}

export type SearchDoc = {
  id: string;
  /** Raw text; normalized on insert so callers never have to remember. */
  text: string;
};

type TrieNode = {
  children: Map<string, TrieNode>;
  /** Document ids whose text passes through this node. Used by prefix search. */
  ids: Set<string>;
  /**
   * Document ids whose TOKEN ENDS here. Kept separate from `ids` because a fuzzy
   * match must be scored against the token a document actually has: scoring
   * "dragee" at the node for "drage" would report it as an exact match for
   * "drage", which it is not.
   */
  ends: Set<string>;
};

function createNode(): TrieNode {
  return { children: new Map(), ids: new Set(), ends: new Set() };
}

export type PrefixHit = { id: string; term: string };

/**
 * A prefix trie over normalized text.
 *
 * Each node carries the ids of every document whose text passes through it, so a
 * prefix lookup is one walk plus a set read: O(len(prefix)) rather than O(N).
 * Storing ids at every node costs memory proportional to total text length,
 * which is the correct trade for a catalogue that is read far more than written.
 */
export class SearchTrie {
  private readonly root: TrieNode = createNode();
  private readonly inserted = new Map<string, string>();

  get size(): number {
    return this.inserted.size;
  }

  /** Inserts (or replaces) a document. Re-inserting the same id is safe. */
  insert(id: string, text: string): void {
    if (this.inserted.has(id)) this.remove(id);
    const normalized = normalizeSearchText(text);
    this.inserted.set(id, normalized);
    for (const token of normalized.split(" ")) {
      if (!token) continue;
      this.insertToken(token, id);
    }
  }

  private insertToken(token: string, id: string): void {
    let node = this.root;
    node.ids.add(id);
    for (const character of token) {
      let child = node.children.get(character);
      if (!child) {
        child = createNode();
        node.children.set(character, child);
      }
      node = child;
      node.ids.add(id);
    }
    node.ends.add(id);
  }

  remove(id: string): void {
    const normalized = this.inserted.get(id);
    if (normalized === undefined) return;
    this.inserted.delete(id);
    for (const token of normalized.split(" ")) {
      if (!token) continue;
      this.removeToken(token, id);
    }
  }

  private removeToken(token: string, id: string): void {
    const trail: Array<{ parent: TrieNode; character: string; node: TrieNode }> = [];
    let node = this.root;
    node.ids.delete(id);
    for (const character of token) {
      const child = node.children.get(character);
      if (!child) return;
      trail.push({ parent: node, character, node: child });
      node = child;
      node.ids.delete(id);
    }
    node.ends.delete(id);
    // Prune nodes that no longer hold any document, deepest first.
    for (let index = trail.length - 1; index >= 0; index -= 1) {
      const step = trail[index]!;
      if (step.node.ids.size > 0 || step.node.children.size > 0) break;
      step.parent.children.delete(step.character);
    }
  }

  /** Ids of every document with a token starting with `prefix`. O(len(prefix)). */
  prefix(prefix: string, limit = Number.POSITIVE_INFINITY): string[] {
    const node = this.walk(normalizeSearchText(prefix));
    if (!node) return [];
    return [...node.ids].sort().slice(0, limit);
  }

  /** Tokens that start with `prefix`, for type-ahead suggestions. */
  completions(prefix: string, limit = 10): string[] {
    const normalized = normalizeSearchText(prefix);
    const node = this.walk(normalized);
    if (!node) return [];
    const out: string[] = [];
    const walk = (current: TrieNode, built: string): void => {
      if (out.length >= limit) return;
      if (current.ends.size > 0) out.push(built);
      // Sorted children keep completions deterministic between runs.
      for (const character of [...current.children.keys()].sort()) {
        if (out.length >= limit) return;
        walk(current.children.get(character)!, built + character);
      }
    };
    walk(node, normalized);
    return out;
  }

  private walk(text: string): TrieNode | null {
    let node = this.root;
    for (const character of text) {
      const child = node.children.get(character);
      if (!child) return null;
      node = child;
    }
    return node;
  }

  /**
   * Ids with a token within `maxDistance` edits of every query token, nearest
   * first.
   *
   * The trie is walked with one DP row per depth, so an entire subtree is
   * abandoned as soon as its row minimum exceeds the bound. That is what makes
   * this cheap: a typo in the first letter of a long word prunes almost
   * everything, instead of comparing the query against every id.
   *
   * O(|query| · Σ · depth) worst case, far less in practice.
   */
  fuzzy(query: string, maxDistance = 1): Array<{ id: string; distance: number }> {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    let survivors: Map<string, number> | null = null;
    for (const token of tokens) {
      const hits = this.fuzzyToken(token, maxDistance);
      if (survivors === null) {
        survivors = hits;
        continue;
      }
      // Multi-word query: a document must satisfy every token. Distance sums,
      // so a document that is one edit off in each of two words ranks below one
      // that is one edit off in a single word.
      const next = new Map<string, number>();
      for (const [id, distance] of hits) {
        const previous = survivors.get(id);
        if (previous !== undefined) next.set(id, previous + distance);
      }
      survivors = next;
    }

    return [...(survivors ?? new Map<string, number>()).entries()]
      .map(([id, distance]) => ({ id, distance }))
      .sort((a, b) => a.distance - b.distance || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  private fuzzyToken(token: string, maxDistance: number): Map<string, number> {
    const results = new Map<string, number>();
    const length = token.length;
    const initial = Array.from({ length: length + 1 }, (_, index) => index);

    const visit = (node: TrieNode, character: string, previous: number[], depth: number): void => {
      const current: number[] = [previous[0]! + 1];
      let rowMin = current[0]!;
      for (let column = 1; column <= length; column += 1) {
        const substitution = previous[column - 1]! + (character === token[column - 1] ? 0 : 1);
        const deletion = previous[column]! + 1;
        const insertion = current[column - 1]! + 1;
        const value = Math.min(substitution, deletion, insertion);
        current.push(value);
        if (value < rowMin) rowMin = value;
      }

      const distance = current[length]!;
      if (node.ends.size > 0 && distance <= maxDistance) {
        for (const id of node.ends) {
          const existing = results.get(id);
          if (existing === undefined || distance < existing) results.set(id, distance);
        }
      }
      // Prune: no descendant can score better than this row's minimum.
      if (rowMin > maxDistance) return;
      for (const [childCharacter, child] of node.children) {
        visit(child, childCharacter, current, depth + 1);
      }
    };

    for (const [character, node] of this.root.children) {
      visit(node, character, initial, 1);
    }
    return results;
  }

  /** The normalized text a document was indexed under (for diagnostics). */
  normalizedOf(id: string): string | undefined {
    return this.inserted.get(id);
  }
}
