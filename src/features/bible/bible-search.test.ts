import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createBibleSearch,
  highlightWords,
  queryWords,
  searchBible,
} from "./bible-search.ts";
import { parseReference } from "./bible.reference.ts";
import type { BibleSearchIndex } from "./bible.types.ts";

// Exercises the Fuse.js wrapper directly (no browser needed) so the search
// behaviour is regression-tested. Run via `npm test`.

const entries = [
  {
    reference: "john.3.16",
    bookName: "John",
    text: "mercy is shown to those who seek wisdom",
  },
  {
    reference: "genesis.1.1",
    bookName: "Genesis",
    text: "hope is renewed with each new morning",
  },
  {
    reference: "psalms.23.1",
    bookName: "Psalms",
    text: "peace settles upon the patient heart",
  },
];

test("finds verses by text content", () => {
  const fuse = createBibleSearch(entries);
  const results = searchBible(fuse, "wisdom");
  assert.ok(results.some((result) => result.reference === "john.3.16"));
});

test("finds verses by book name", () => {
  const fuse = createBibleSearch(entries);
  const results = searchBible(fuse, "Genesis");
  assert.ok(results.some((result) => result.reference === "genesis.1.1"));
});

test("returns no matches for an absent term", () => {
  const fuse = createBibleSearch(entries);
  assert.equal(searchBible(fuse, "xylophone").length, 0);
});

// Whole-word matching. The false positives below are exactly what fuzzy /
// substring matching used to return.
const wordEntries = [
  { reference: "genesis.37.5", bookName: "Genesis", text: "Јосиф сонува сон, и им го раскажа." },
  { reference: "genesis.40.1", bookName: "Genesis", text: "Во градината цвета Сончоглед." },
  { reference: "matthew.3.17", bookName: "Matthew", text: "This is my beloved Son, in whom I am well pleased." },
  { reference: "matthew.6.28", bookName: "Matthew", text: "Consider the Sunflower and the sons of men." },
  { reference: "psalms.1.1", bookName: "Psalms", text: "DAVID went to David; david's harp." },
  { reference: "psalms.1.2", bookName: "Psalms", text: "Davidson is not the king." },
];

const refsFor = (query: string) =>
  searchBible(createBibleSearch(wordEntries), query).map((e) => e.reference);

test("Cyrillic: 'Сон' matches the whole word only, never 'Сончоглед'", () => {
  assert.deepEqual(refsFor("Сон"), ["genesis.37.5"]);
  assert.deepEqual(refsFor("сон"), ["genesis.37.5"], "case-insensitive");
});

test("Latin: 'Son' matches the whole word only, never 'Sunflower' or 'sons'", () => {
  assert.deepEqual(refsFor("Son"), ["matthew.3.17"]);
  assert.deepEqual(refsFor("Sun"), []);
});

test("punctuation and apostrophes delimit words", () => {
  // "David;" and "david's" both contain the whole word; "Davidson" does not.
  assert.deepEqual(refsFor("david"), ["psalms.1.1"]);
  assert.deepEqual(refsFor("Son,"), ["matthew.3.17"]);
});

test("multi-word queries require every word as a whole word", () => {
  assert.deepEqual(refsFor("beloved son"), ["matthew.3.17"]);
  assert.deepEqual(refsFor("beloved sun"), []);
});

test("punctuation-only queries return nothing", () => {
  assert.deepEqual(refsFor("?!"), []);
});

test("returns every match — there is no result cap", () => {
  const many = Array.from({ length: 250 }, (_, i) => ({
    reference: `genesis.1.${i + 1}`,
    bookName: "Genesis",
    text: `and it was so ${i}`,
  }));
  const results = searchBible(createBibleSearch(many), "so");
  assert.equal(results.length, 250);
  // Canonical (index) order is preserved.
  assert.deepEqual(results.map((e) => e.reference), many.map((e) => e.reference));
});

test("queryWords normalises case, strips punctuation and de-duplicates", () => {
  assert.deepEqual(queryWords("  Сон, СОН son! "), ["сон", "son"]);
});

const marked = (value: string, query: string) =>
  highlightWords(value, queryWords(query))
    .filter((segment) => segment.match)
    .map((segment) => segment.text);

test("highlight marks whole words only, never a substring of another word", () => {
  assert.deepEqual(marked("Сон и Сончоглед", "сон"), ["Сон"]);
  assert.deepEqual(marked("the Sunflower and the Son", "son"), ["Son"]);
  assert.deepEqual(marked("Davidson", "david"), []);
});

test("highlight marks every occurrence, case-insensitively, through punctuation", () => {
  assert.deepEqual(marked("DAVID went to David; david's harp.", "David"), [
    "DAVID",
    "David",
    "david",
  ]);
});

test("highlight segments reassemble the original text exactly", () => {
  const value = "Јосиф сонува сон, и им го раскажа.";
  const segments = highlightWords(value, queryWords("сон"));
  assert.equal(segments.map((s) => s.text).join(""), value);
  assert.deepEqual(
    segments.filter((s) => s.match).map((s) => s.text),
    ["сон"]
  );
});

// Integration: build Fuse over the REAL shipped index and search it. This is
// the closest we get to the browser flow without a DOM — it proves the shipped
// index is searchable and results carry resolvable references.
const enIndexPath = join(process.cwd(), "src", "data", "bible", "search", "en.json");

test(
  "searches the real English index",
  { skip: existsSync(enIndexPath) ? false : "run `npm run bible:build` first" },
  () => {
    const index = JSON.parse(readFileSync(enIndexPath, "utf8")) as BibleSearchIndex;
    const fuse = createBibleSearch(index.entries);

    const results = searchBible(fuse, "wisdom");
    assert.ok(results.length > 0, "expected matches for a common scripture word");
    // Every result must carry a well-formed, resolvable reference (this is what
    // the UI turns into a /bible/<book>/<chapter>#v<verse> link).
    for (const result of results) {
      assert.ok(parseReference(result.reference), `bad reference: ${result.reference}`);
    }
  }
);

// Whole-word search over BOTH real indexes: results exceed the former 30-hit
// cap, span the Old and New Testaments, and every hit really contains the word.
for (const [locale, word] of [
  ["en", "God"],
  ["mk", "Бог"],
] as const) {
  const indexPath = join(process.cwd(), "src", "data", "bible", "search", `${locale}.json`);
  test(
    `real ${locale} index: "${word}" returns all whole-word hits across both testaments`,
    { skip: existsSync(indexPath) ? false : "run `npm run bible:build` first" },
    () => {
      const index = JSON.parse(readFileSync(indexPath, "utf8")) as BibleSearchIndex;
      const results = searchBible(createBibleSearch(index.entries), word);
      assert.ok(results.length > 30, `expected more than 30 hits, got ${results.length}`);

      const books = new Set(results.map((e) => e.reference.split(".")[0]));
      assert.ok(books.has("genesis"), "expected an Old Testament hit (Genesis)");
      assert.ok(books.has("revelation"), "expected a New Testament hit (Revelation)");

      const wanted = queryWords(word);
      for (const entry of results) {
        const hit =
          highlightWords(entry.text, wanted).some((s) => s.match) ||
          highlightWords(entry.bookName, wanted).some((s) => s.match);
        assert.ok(hit, `${entry.reference} has no whole-word "${word}"`);
      }
    }
  );
}
