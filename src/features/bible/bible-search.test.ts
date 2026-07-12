import { test } from "node:test";
import assert from "node:assert/strict";
import { createBibleSearch, searchBible } from "./bible-search.ts";

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
