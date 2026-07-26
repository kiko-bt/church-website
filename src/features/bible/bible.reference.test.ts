import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReference } from "./bible.reference.ts";

test("parseReference reads the canonical form", () => {
  assert.deepEqual(parseReference("john.3.16"), {
    bookId: "john",
    chapter: 3,
    verse: 16,
  });
  // Book ids may contain hyphens, so only the dots are separators.
  assert.deepEqual(parseReference("1-john.5.4"), {
    bookId: "1-john",
    chapter: 5,
    verse: 4,
  });
  assert.deepEqual(parseReference("song-of-solomon.2.1"), {
    bookId: "song-of-solomon",
    chapter: 2,
    verse: 1,
  });
});

test("parseReference rejects malformed input", () => {
  const invalid = [
    "",
    "john",
    "john.3", // missing verse
    "john.3.16.2", // too many parts
    ".3.16", // empty bookId
    "john.x.16", // non-numeric chapter
    "john.3.y", // non-numeric verse
    "john.0.16", // chapter < 1
    "john.3.0", // verse < 1
    "john.-1.16", // negative
    "john.3.5.", // trailing separator
    "john.3.5e2", // exponent notation
    "john.03.16", // leading zero is not the canonical form
  ];
  for (const value of invalid) {
    assert.equal(parseReference(value), null, `expected null for "${value}"`);
  }
});
