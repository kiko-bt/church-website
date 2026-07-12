import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createReference,
  formatReference,
  parseReference,
  referenceToAnchor,
  referencesEqual,
  createReferenceRange,
  isSingleVerseRange,
  formatReferenceRange,
  parseReferenceRange,
  rangeContainsReference,
} from "./bible.reference.ts";

// Run with:  node --test --experimental-strip-types
// (wired up as `npm test`). Zero external dependencies.

// ---------------------------------------------------------------------------
// BibleReference
// ---------------------------------------------------------------------------

test("createReference builds the value object", () => {
  assert.deepEqual(createReference("john", 3, 16), {
    bookId: "john",
    chapter: 3,
    verse: 16,
  });
});

test("formatReference produces the canonical string form", () => {
  assert.equal(formatReference(createReference("john", 3, 16)), "john.3.16");
  assert.equal(formatReference(createReference("1-john", 5, 4)), "1-john.5.4");
});

test("parseReference round-trips the canonical form", () => {
  for (const value of ["john.3.16", "1-john.5.4", "song-of-solomon.2.1"]) {
    const parsed = parseReference(value);
    assert.ok(parsed);
    assert.equal(formatReference(parsed), value);
  }
});

test("parseReference rejects malformed input", () => {
  const invalid = [
    "",
    "john",
    "john.3",
    "john.3.16.2", // too many parts
    ".3.16", // empty bookId
    "john.x.16", // non-numeric chapter
    "john.3.y", // non-numeric verse
    "john.0.16", // chapter < 1
    "john.3.0", // verse < 1
    "john.-1.16", // negative
    "john.3.1.5", // extra segment
    "john.3.5.", // trailing separator
  ];
  for (const value of invalid) {
    assert.equal(parseReference(value), null, `expected null for "${value}"`);
  }
});

test("parseReference rejects non-integer numbers", () => {
  assert.equal(parseReference("john.3.16.5"), null);
  assert.equal(parseReference("john.3.5e2"), null);
});

test("referenceToAnchor returns the verse anchor", () => {
  assert.equal(referenceToAnchor(createReference("john", 3, 16)), "v16");
});

test("referencesEqual compares by value", () => {
  const a = createReference("john", 3, 16);
  assert.ok(referencesEqual(a, createReference("john", 3, 16)));
  assert.ok(!referencesEqual(a, createReference("john", 3, 17)));
  assert.ok(!referencesEqual(a, createReference("john", 4, 16)));
  assert.ok(!referencesEqual(a, createReference("acts", 3, 16)));
});

// ---------------------------------------------------------------------------
// BibleReferenceRange
// ---------------------------------------------------------------------------

test("isSingleVerseRange detects one-verse spans", () => {
  assert.ok(
    isSingleVerseRange(
      createReferenceRange("john", { chapter: 3, verse: 16 }, { chapter: 3, verse: 16 })
    )
  );
  assert.ok(
    !isSingleVerseRange(
      createReferenceRange("john", { chapter: 3, verse: 16 }, { chapter: 3, verse: 18 })
    )
  );
});

test("formatReferenceRange handles all three shapes", () => {
  // single verse
  assert.equal(
    formatReferenceRange(
      createReferenceRange("john", { chapter: 3, verse: 16 }, { chapter: 3, verse: 16 })
    ),
    "john.3.16"
  );
  // same chapter
  assert.equal(
    formatReferenceRange(
      createReferenceRange("john", { chapter: 3, verse: 16 }, { chapter: 3, verse: 18 })
    ),
    "john.3.16-18"
  );
  // cross chapter
  assert.equal(
    formatReferenceRange(
      createReferenceRange("john", { chapter: 3, verse: 16 }, { chapter: 4, verse: 2 })
    ),
    "john.3.16-4.2"
  );
  // hyphenated bookId, cross chapter
  assert.equal(
    formatReferenceRange(
      createReferenceRange("1-john", { chapter: 1, verse: 9 }, { chapter: 2, verse: 2 })
    ),
    "1-john.1.9-2.2"
  );
});

test("parseReferenceRange round-trips every shape", () => {
  for (const value of [
    "john.3.16", // single verse
    "john.3.16-18", // same chapter
    "john.3.16-4.2", // cross chapter
    "1-john.1.9-2.2", // hyphenated bookId cross chapter
    "1-john.5.4-8", // hyphenated bookId same chapter
  ]) {
    const parsed = parseReferenceRange(value);
    assert.ok(parsed, `expected a range for "${value}"`);
    assert.equal(formatReferenceRange(parsed), value);
  }
});

test("parseReferenceRange rejects malformed and backwards ranges", () => {
  const invalid = [
    "",
    "john", // no coordinates
    "john.3", // missing verse
    "john.3.18-16", // end before start (same chapter)
    "john.4.1-3.5", // end chapter before start chapter
    "john.3.x-5", // non-numeric
    "john.0.1-5", // chapter < 1
    "john.3.0-5", // verse < 1
    "john.3.16-4.2.9", // too many end tokens
  ];
  for (const value of invalid) {
    assert.equal(
      parseReferenceRange(value),
      null,
      `expected null for "${value}"`
    );
  }
});

test("rangeContainsReference respects inclusive boundaries", () => {
  const range = createReferenceRange(
    "john",
    { chapter: 3, verse: 16 },
    { chapter: 4, verse: 2 }
  );

  // boundaries (inclusive)
  assert.ok(rangeContainsReference(range, createReference("john", 3, 16)));
  assert.ok(rangeContainsReference(range, createReference("john", 4, 2)));
  // interior, including a chapter between start and end
  assert.ok(rangeContainsReference(range, createReference("john", 3, 40)));
  assert.ok(rangeContainsReference(range, createReference("john", 4, 1)));

  // outside
  assert.ok(!rangeContainsReference(range, createReference("john", 3, 15))); // before start
  assert.ok(!rangeContainsReference(range, createReference("john", 4, 3))); // after end
  assert.ok(!rangeContainsReference(range, createReference("acts", 3, 20))); // wrong book
});

test("rangeContainsReference handles single-verse ranges", () => {
  const range = createReferenceRange(
    "john",
    { chapter: 3, verse: 16 },
    { chapter: 3, verse: 16 }
  );
  assert.ok(rangeContainsReference(range, createReference("john", 3, 16)));
  assert.ok(!rangeContainsReference(range, createReference("john", 3, 17)));
});
