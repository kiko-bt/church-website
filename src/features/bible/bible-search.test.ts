import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createBibleSearch, searchBible } from "./bible-search.ts";
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

test("respects the result limit", () => {
  const fuse = createBibleSearch(entries);
  assert.ok(searchBible(fuse, "the", 1).length <= 1);
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

    const results = searchBible(fuse, "wisdom", 30);
    assert.ok(results.length > 0, "expected matches for a common scripture word");
    // Every result must carry a well-formed, resolvable reference (this is what
    // the UI turns into a /bible/<book>/<chapter>#v<verse> link).
    for (const result of results) {
      assert.ok(parseReference(result.reference), `bad reference: ${result.reference}`);
    }
  }
);
