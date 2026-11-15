import { describe, expect, it } from "vitest";
import { SearchTrie, levenshtein, normalizeSearchText, tokenize } from "./search";

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

describe("normalizeSearchText — Arabic", () => {
  it("strips tashkeel so a vocalised record matches a plain query", () => {
    expect(normalizeSearchText("اَلْحَاسُوب")).toBe("الحاسوب");
    expect(normalizeSearchText("مُحَمَّد")).toBe("محمد");
    // Tanween and shadda, the marks most likely to be pasted from a document.
    expect(normalizeSearchText("كِتَابٌ")).toBe("كتاب");
  });

  it("folds every alef form, in both directions", () => {
    // The single most common reason a search fails in an Arabic UI: the record
    // says أحمد, the user types احمد.
    for (const spelling of ["أحمد", "إحمد", "آحمد", "ٱحمد", "احمد"]) {
      expect(normalizeSearchText(spelling)).toBe("احمد");
    }
  });

  it("folds alef maqsura to yaa", () => {
    expect(normalizeSearchText("مصطفى")).toBe(normalizeSearchText("مصطفي"));
    expect(normalizeSearchText("على")).toBe("علي");
  });

  it("folds taa marbuta to haa", () => {
    expect(normalizeSearchText("مدرسة")).toBe(normalizeSearchText("مدرسه"));
    expect(normalizeSearchText("دراجة")).toBe(normalizeSearchText("دراجه"));
  });

  it("removes tatweel, which is purely decorative elongation", () => {
    expect(normalizeSearchText("مـــدرســـة")).toBe("مدرسه");
  });

  it("converts Arabic-Indic and extended Arabic-Indic digits", () => {
    expect(normalizeSearchText("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    expect(normalizeSearchText("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    // A phone number typed in Arabic digits must match one stored in ASCII.
    expect(normalizeSearchText("هاتف ٠٥٥٥١٢٣٤٥٦")).toBe("هاتف 0555123456");
  });

  it("collapses whitespace and trims", () => {
    // Note the two folds visible here: ة -> ه, and ئ -> ي (هوائية -> هواييه),
    // the second of which only became explicit when hamza carriers were folded
    // before NFD.
    expect(normalizeSearchText("  دراجة   هوائية \n")).toBe("دراجه هواييه");
  });
});

describe("normalizeSearchText — Latin and mixed", () => {
  it("strips Latin accents", () => {
    expect(normalizeSearchText("Café")).toBe("cafe");
    expect(normalizeSearchText("ÉCOLE")).toBe("ecole");
    expect(normalizeSearchText("naïve")).toBe("naive");
  });

  it("lowercases and handles mixed scripts in one field", () => {
    expect(normalizeSearchText("Clé à molette 12mm")).toBe("cle a molette 12mm");
  });

  it("decomposes compatibility ligatures", () => {
    // U+FEFB ARABIC LIGATURE LAM WITH ALEF ISOLATED FORM.
    expect(normalizeSearchText("\uFEFB")).toBe("لا");
  });

  it("returns an empty string for null-ish input instead of the text 'null'", () => {
    expect(normalizeSearchText("")).toBe("");
    expect(normalizeSearchText(null as unknown as string)).toBe("");
    expect(normalizeSearchText(undefined as unknown as string)).toBe("");
  });
});

describe("normalizeSearchText — the invariants that keep JS and SQL in step", () => {
  const samples = [
    "أَلْحَاسُوب",
    "مدرسة",
    "دراجة هوائية",
    "Café Élégant",
    "٠١٢٣",
    "مـــدرســـة",
    "  spaced   out  ",
    "Clé à molette",
    "ﻻ",
    "المصطفى",
    "",
  ];

  it("is idempotent for every sample", () => {
    for (const sample of samples) {
      const once = normalizeSearchText(sample);
      expect(normalizeSearchText(once)).toBe(once);
    }
  });

  it("is idempotent over generated combinations too", () => {
    const pieces = ["أ", "إ", "ى", "ة", "َ", "ـ", "٠", "café", "ﻻ", " ", "م"];
    for (let mask = 0; mask < 1 << pieces.length; mask += 1) {
      let text = "";
      for (let bit = 0; bit < pieces.length; bit += 1) {
        if (mask & (1 << bit)) text += pieces[bit];
      }
      const once = normalizeSearchText(text);
      expect(normalizeSearchText(once)).toBe(once);
    }
  });

  it("never produces a string with leading or trailing whitespace", () => {
    for (const sample of samples) {
      const normalized = normalizeSearchText(sample);
      expect(normalized).toBe(normalized.trim());
    }
  });
});

describe("tokenize", () => {
  it("splits on whitespace after normalizing", () => {
    expect(tokenize("  دراجة   هوائية ")).toEqual(["دراجه", "هواييه"]);
  });

  it("returns nothing for an empty query", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* Levenshtein                                                         */
/* ------------------------------------------------------------------ */

describe("levenshtein", () => {
  it("measures the standard cases", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("same", "same")).toBe(0);
  });

  it("is symmetric", () => {
    expect(levenshtein("دراجة", "دراسه")).toBe(levenshtein("دراسه", "دراجة"));
  });

  it("returns a value above the bound when it abandons early", () => {
    // The contract callers rely on: anything over the bound is simply "too far".
    expect(levenshtein("kitten", "sitting", 1)).toBeGreaterThan(1);
    expect(levenshtein("kitten", "sitten", 1)).toBe(1);
  });

  it("handles a length difference larger than the bound without work", () => {
    expect(levenshtein("a", "abcdefgh", 2)).toBeGreaterThan(2);
  });

  it("agrees with the unbounded result whenever it does not abandon", () => {
    const words = ["", "a", "ab", "abc", "abcd", "abd", "xyz", "kitten"];
    for (const left of words) {
      for (const right of words) {
        const full = levenshtein(left, right);
        const bounded = levenshtein(left, right, full);
        expect(bounded).toBe(full);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Trie                                                                */
/* ------------------------------------------------------------------ */

function catalogue(): SearchTrie {
  const trie = new SearchTrie();
  trie.insert("1", "دراجة هوائية");
  trie.insert("2", "دراجة نارية");
  trie.insert("3", "حاسوب محمول");
  trie.insert("4", "Clé à molette");
  return trie;
}

describe("SearchTrie — prefix", () => {
  it("finds every document by the start of a token", () => {
    expect(catalogue().prefix("دراج").sort()).toEqual(["1", "2"]);
  });

  it("matches through normalization, not raw text", () => {
    // The stored text is دراجة with a taa marbuta; the query uses haa.
    expect(catalogue().prefix("دراجه").sort()).toEqual(["1", "2"]);
    expect(catalogue().prefix("حاسوب")).toEqual(["3"]);
  });

  it("matches a later token, not only the first word", () => {
    expect(catalogue().prefix("نار")).toEqual(["2"]);
  });

  it("returns nothing for an unknown prefix rather than everything", () => {
    expect(catalogue().prefix("zzz")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(catalogue().prefix("دراج", 1)).toHaveLength(1);
  });

  it("gives deterministic ordering", () => {
    expect(catalogue().prefix("دراج")).toEqual(catalogue().prefix("دراج"));
  });
});

describe("SearchTrie — completions", () => {
  it("suggests whole tokens that start with the prefix", () => {
    // Three documents share the token دراجه, so it is one suggestion, not three:
    // completions are distinct tokens, not per-document entries.
    expect(catalogue().completions("دراج")).toEqual(["دراجه"]);
    // Eight distinct tokens across the four documents, sorted by code point, so
    // the Latin ones come before the Arabic ones. `a` is its own token because
    // the stored text is "Clé à molette".
    expect(catalogue().completions("")).toEqual([
      "a",
      "cle",
      "molette",
      "حاسوب",
      "دراجه",
      "محمول",
      "ناريه",
      "هواييه",
    ]);
  });

  it("suggests in a stable order and honours the limit", () => {
    const trie = catalogue();
    // Eight distinct tokens exist but a limit of 5 must return five, not pad.
    expect(trie.completions("", 5)).toHaveLength(5);
    expect(trie.completions("")).toHaveLength(8);
    const first = trie.completions("", 2);
    expect(first).toHaveLength(2);
    expect(trie.completions("", 2)).toEqual(first);
    expect(first).toEqual([...first].sort());
  });
});

describe("SearchTrie — fuzzy", () => {
  it("finds a document whose token is one edit away", () => {
    // A single-letter typo in a Latin word (molette -> molete).
    const hits = catalogue().fuzzy("molete");
    expect(hits.map((hit) => hit.id)).toContain("4");
    // And a typo in a Latin word that also carries an accent when stored.
    expect(catalogue().fuzzy("cle", 0).map((hit) => hit.id)).toContain("4");
  });

  it("finds a document when the typo is in the FIRST letter", () => {
    // The pruning case: the initial row starts at 1, so every branch must be
    // explored one level before it can be abandoned. Normalized, the stored
    // token is "حاسوب" and the query is "حاسوب" with the first letter wrong.
    expect(catalogue().fuzzy("خاسوب").map((hit) => hit.id)).toContain("3");
    // A six-letter word two edits away is still reachable, but not within one.
    expect(catalogue().fuzzy("khasoub", 1)).toEqual([]);
  });

  it("reports the smallest distance, not just any match", () => {
    const trie = new SearchTrie();
    trie.insert("exact", "drage");
    trie.insert("near", "dragee");
    const hits = trie.fuzzy("drage");
    // The exact match must outrank the one-edit match.
    expect(hits[0]).toEqual({ id: "exact", distance: 0 });
    expect(hits.find((hit) => hit.id === "near")!.distance).toBe(1);
  });

  it("requires every token of a multi-word query", () => {
    // "دراجة نارية" and "دراجة هوائية" share the first word only.
    const hits = catalogue().fuzzy("دراجه ناريه");
    expect(hits.map((hit) => hit.id)).not.toContain("1");
    expect(hits.map((hit) => hit.id)).toContain("2");
  });

  it("returns nothing for an empty query instead of the whole catalogue", () => {
    expect(catalogue().fuzzy("")).toEqual([]);
    expect(catalogue().fuzzy("   ")).toEqual([]);
  });

  it("respects the bound", () => {
    expect(catalogue().fuzzy("xyzzy", 1)).toEqual([]);
  });

  it("is deterministic", () => {
    expect(catalogue().fuzzy("molete")).toEqual(catalogue().fuzzy("molete"));
  });
});

describe("SearchTrie — mutation", () => {
  it("replaces a document on re-insert without leaving stale hits", () => {
    const trie = new SearchTrie();
    trie.insert("1", "دراجة هوائية");
    trie.insert("1", "حاسوب محمول");
    expect(trie.prefix("دراج")).toEqual([]);
    expect(trie.prefix("حاسوب")).toEqual(["1"]);
    expect(trie.size).toBe(1);
  });

  it("removes every token of a document", () => {
    const trie = new SearchTrie();
    trie.insert("1", "دراجة هوائية");
    trie.remove("1");
    expect(trie.prefix("دراج")).toEqual([]);
    expect(trie.prefix("هوائ")).toEqual([]);
    expect(trie.size).toBe(0);
  });

  it("keeps a shared prefix alive when only one document is removed", () => {
    const trie = catalogue();
    trie.remove("1");
    expect(trie.prefix("دراج")).toEqual(["2"]);
  });

  it("ignores removing an id that was never inserted", () => {
    const trie = catalogue();
    expect(() => trie.remove("ghost")).not.toThrow();
    expect(trie.size).toBe(4);
  });

  it("prunes nodes so a removed document cannot be found by completion", () => {
    const trie = new SearchTrie();
    trie.insert("1", "zzzunique");
    trie.remove("1");
    expect(trie.completions("zzz")).toEqual([]);
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

const LATIN = "abcdefghijklmnopqrstuvwxyz";

function randomWord(random: () => number, length: number): string {
  let word = "";
  for (let index = 0; index < length; index += 1) {
    word += LATIN[Math.floor(random() * LATIN.length)]!;
  }
  return word;
}

/** A single edit: insertion, deletion, substitution or transposition. */
function mutate(random: () => number, word: string): string {
  const kind = Math.floor(random() * 4);
  const at = Math.floor(random() * (word.length + 1));
  switch (kind) {
    case 0:
      return word.slice(0, at) + LATIN[Math.floor(random() * 26)]! + word.slice(at);
    case 1:
      return word.slice(0, at) + word.slice(at + 1);
    case 2:
      return word.slice(0, at) + LATIN[Math.floor(random() * 26)]! + word.slice(at + 1);
    default: {
      if (at + 1 >= word.length) return word;
      return word.slice(0, at) + word[at + 1]! + word[at]! + word.slice(at + 2);
    }
  }
}

describe("property: the trie agrees with brute force", () => {
  it("prefix search returns exactly the documents whose token starts with it", () => {
    const random = mulberry32(20_261_115);
    for (let run = 0; run < 100; run += 1) {
      const trie = new SearchTrie();
      const documents = new Map<string, string>();
      for (let index = 0; index < 30; index += 1) {
        const text = `${randomWord(random, 2 + Math.floor(random() * 6))} ${randomWord(random, 2 + Math.floor(random() * 6))}`;
        documents.set(`d${index}`, text);
        trie.insert(`d${index}`, text);
      }
      for (let query = 0; query < 5; query += 1) {
        const prefix = randomWord(random, 1 + Math.floor(random() * 3));
        const expected = [...documents.entries()]
          .filter(([, text]) =>
            normalizeSearchText(text)
              .split(" ")
              .some((token) => token.startsWith(normalizeSearchText(prefix))),
          )
          .map(([id]) => id)
          .sort();
        expect(trie.prefix(prefix)).toEqual(expected);
      }
    }
  });

  it("fuzzy search finds every document within the bound and nothing beyond it", () => {
    const random = mulberry32(7);
    for (let run = 0; run < 60; run += 1) {
      const trie = new SearchTrie();
      const words = new Map<string, string>();
      for (let index = 0; index < 25; index += 1) {
        const word = randomWord(random, 3 + Math.floor(random() * 5));
        words.set(`d${index}`, word);
        trie.insert(`d${index}`, word);
      }
      const base = randomWord(random, 5);
      const query = mutate(random, base);
      const bound = 1;
      const expected = new Set(
        [...words.entries()]
          .filter(([, word]) => levenshtein(normalizeSearchText(query), normalizeSearchText(word), bound) <= bound)
          .map(([id]) => id),
      );

      const found = new Set(trie.fuzzy(query, bound).map((hit) => hit.id));
      // The trie prunes, so it must not MISS anything brute force finds.
      for (const id of expected) expect(found.has(id)).toBe(true);
      // And it must not invent a hit beyond the bound.
      for (const id of found) {
        expect(levenshtein(normalizeSearchText(query), words.get(id)!, bound)).toBeLessThanOrEqual(bound);
      }
    }
  });

  it("a one-edit mutation of an inserted word is always found", () => {
    const random = mulberry32(99);
    for (let run = 0; run < 200; run += 1) {
      const word = randomWord(random, 4 + Math.floor(random() * 5));
      const trie = new SearchTrie();
      trie.insert("target", word);
      const typo = mutate(random, word);
      if (typo === word) continue;
      // Transpositions cost 2 under plain Levenshtein, so one edit is not always
      // within a bound of 1; the guarantee is for the other three kinds.
      const expected = levenshtein(typo, word, 1) <= 1;
      const found = trie.fuzzy(typo, 1).some((hit) => hit.id === "target");
      expect(found).toBe(expected);
    }
  });

  it("insert then remove always leaves the trie empty", () => {
    const random = mulberry32(31_337);
    for (let run = 0; run < 100; run += 1) {
      const trie = new SearchTrie();
      const ids: string[] = [];
      for (let index = 0; index < 10; index += 1) {
        const id = `d${index}`;
        ids.push(id);
        trie.insert(id, randomWord(random, 4));
      }
      for (const id of ids) trie.remove(id);
      expect(trie.size).toBe(0);
      // No prefix of any latin letter can survive.
      for (const letter of LATIN) expect(trie.prefix(letter)).toEqual([]);
    }
  });
});
