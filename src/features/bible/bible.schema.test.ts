import { test } from "node:test";
import assert from "node:assert/strict";
import {
  verseSchema,
  bookFileSchema,
  validateDataset,
  validateSearchIndex,
  type ParsedBookFile,
  type ParsedManifest,
  type ParsedSearchIndex,
} from "./bible.schema.ts";

// Proves the dataset validation rejects every failure mode required by the
// engineering rules (see .claude/bible-module.md §6).
// Run via `npm test` (node --test).

type Canon = Parameters<typeof validateDataset>[0]["canon"];

function makeBook(
  id: string,
  testament: "OT" | "NT",
  verseCounts: readonly number[]
): ParsedBookFile {
  return {
    id,
    testament,
    chapters: verseCounts.map((count, chapterIndex) => ({
      number: chapterIndex + 1,
      verses: Array.from({ length: count }, (_unused, verseIndex) => ({
        number: verseIndex + 1,
        text: `Original placeholder line ${verseIndex + 1}.`,
      })),
    })),
  };
}

// A minimal, fully valid two-book dataset (single locale) used as the baseline
// that each test mutates to introduce exactly one fault.
function makeValid() {
  const canon: Canon = [
    { id: "genesis", order: 1, testament: "OT" },
    { id: "john", order: 2, testament: "NT" },
  ];
  const manifest: ParsedManifest = {
    version: 1,
    metadata: { translation: "test", generatedAt: "2026-01-01", generatorVersion: "1.0.0" },
    books: [
      { id: "genesis", order: 1, testament: "OT", chapters: [2, 3] },
      { id: "john", order: 2, testament: "NT", chapters: [1] },
    ],
  };
  const filesByLocale: Record<string, Record<string, ParsedBookFile>> = {
    en: {
      genesis: makeBook("genesis", "OT", [2, 3]),
      john: makeBook("john", "NT", [1]),
    },
  };
  return { canon, manifest, filesByLocale, expectedLocales: ["en"] as const };
}

// ---------------------------------------------------------------------------
// Zod schema (per-file shape / field validity)
// ---------------------------------------------------------------------------

test("verseSchema rejects empty or whitespace-only text", () => {
  assert.ok(!verseSchema.safeParse({ number: 1, text: "" }).success);
  assert.ok(!verseSchema.safeParse({ number: 1, text: "   " }).success);
  assert.ok(!verseSchema.safeParse({ number: 1, text: "\n\t " }).success);
  assert.ok(verseSchema.safeParse({ number: 1, text: "A real line." }).success);
});

test("verseSchema rejects non-positive / non-integer verse numbers", () => {
  assert.ok(!verseSchema.safeParse({ number: 0, text: "x" }).success);
  assert.ok(!verseSchema.safeParse({ number: -1, text: "x" }).success);
  assert.ok(!verseSchema.safeParse({ number: 1.5, text: "x" }).success);
});

test("bookFileSchema rejects extra and missing fields (strict)", () => {
  const base = makeBook("john", "NT", [1]);
  assert.ok(bookFileSchema.safeParse(base).success);
  // extra field
  assert.ok(!bookFileSchema.safeParse({ ...base, color: "gold" }).success);
  // a display name in a book file is a rejected extra field — names belong to
  // bible.display-names.ts only
  assert.ok(!bookFileSchema.safeParse({ ...base, name: "John" }).success);
  // missing field
  assert.ok(!bookFileSchema.safeParse({ id: base.id, testament: base.testament }).success);
  // invalid testament
  assert.ok(!bookFileSchema.safeParse({ ...base, testament: "XX" }).success);
});

// ---------------------------------------------------------------------------
// Cross-file dataset integrity
// ---------------------------------------------------------------------------

test("validateDataset accepts a well-formed dataset", () => {
  assert.deepEqual(validateDataset(makeValid()), []);
});

test("rejects a duplicate book id in the manifest", () => {
  const d = makeValid();
  d.manifest = {
    ...d.manifest,
    books: [d.manifest.books[0], { ...d.manifest.books[0] }],
  };
  assert.ok(validateDataset(d).some((e) => e.includes("duplicate book id")));
});

test("rejects a missing canonical book", () => {
  const d = makeValid();
  d.manifest = { ...d.manifest, books: [d.manifest.books[0]] };
  delete d.filesByLocale.en.john;
  assert.ok(validateDataset(d).some((e) => e.includes("missing canonical book")));
});

test("rejects invalid ordering", () => {
  const d = makeValid();
  const [a, b] = d.manifest.books;
  d.manifest = { ...d.manifest, books: [{ ...b, order: 1 }, { ...a, order: 2 }] };
  assert.ok(validateDataset(d).length > 0);
});

test("rejects a testament that disagrees with the canon", () => {
  const d = makeValid();
  const books = [...d.manifest.books];
  books[0] = { ...books[0], testament: "NT" };
  d.manifest = { ...d.manifest, books };
  assert.ok(validateDataset(d).some((e) => e.includes("testament")));
});

test("rejects an unknown book slug", () => {
  const d = makeValid();
  const books = [...d.manifest.books];
  books[1] = { ...books[1], id: "not-a-book" };
  d.manifest = { ...d.manifest, books };
  d.filesByLocale.en["not-a-book"] = makeBook("not-a-book", "NT", [1]);
  delete d.filesByLocale.en.john;
  assert.ok(validateDataset(d).some((e) => e.includes("unknown book slug")));
});

test("rejects a manifest/file chapter-count mismatch", () => {
  const d = makeValid();
  d.filesByLocale.en.genesis = makeBook("genesis", "OT", [2, 3, 4]);
  assert.ok(validateDataset(d).some((e) => e.includes("chapters")));
});

test("rejects a manifest/file verse-count mismatch", () => {
  const d = makeValid();
  d.filesByLocale.en.genesis = makeBook("genesis", "OT", [2, 5]);
  assert.ok(validateDataset(d).some((e) => e.includes("verses")));
});

test("rejects non-contiguous verse numbering (a duplicated verse)", () => {
  const d = makeValid();
  const book = makeBook("john", "NT", [1]);
  const patched: ParsedBookFile = {
    ...book,
    chapters: [
      {
        number: 1,
        verses: [
          { number: 1, text: "One." },
          { number: 1, text: "Duplicate." },
        ],
      },
    ],
  };
  d.filesByLocale.en.john = patched;
  d.manifest = {
    ...d.manifest,
    books: d.manifest.books.map((b) => (b.id === "john" ? { ...b, chapters: [2] } : b)),
  };
  assert.ok(validateDataset(d).some((e) => e.includes("verse at index")));
});

test("rejects a missing locale", () => {
  const d = makeValid();
  const errors = validateDataset({ ...d, expectedLocales: ["mk", "en"] });
  assert.ok(errors.some((e) => e.includes('missing locale "mk"')));
});

test("rejects an unknown locale", () => {
  const d = makeValid();
  d.filesByLocale.de = { genesis: makeBook("genesis", "OT", [2, 3]) };
  assert.ok(validateDataset(d).some((e) => e.includes('unknown locale "de"')));
});

// ---------------------------------------------------------------------------
// Search-index integrity
// ---------------------------------------------------------------------------

// The valid dataset's manifest describes genesis [2,3] + john [1] = 6 verses.
const VALID_REFERENCES = [
  "genesis.1.1",
  "genesis.1.2",
  "genesis.2.1",
  "genesis.2.2",
  "genesis.2.3",
  "john.1.1",
];

// makeSearchIndex stamps the bookId as the book name, so the expected registry
// for these fixtures is the identity mapping.
const NAMES: Record<string, string> = { genesis: "genesis", john: "john" };

function makeSearchIndex(
  locale: string,
  references: readonly string[]
): ParsedSearchIndex {
  return {
    locale,
    entries: references.map((reference) => ({
      reference,
      bookName: reference.split(".")[0],
      text: `Placeholder for ${reference}.`,
    })),
  };
}

test("accepts a well-formed search index", () => {
  const { manifest } = makeValid();
  const index = makeSearchIndex("en", VALID_REFERENCES);
  assert.deepEqual(validateSearchIndex(manifest, index, "en", NAMES), []);
});

test("rejects a search index whose entry count != verse count", () => {
  const { manifest } = makeValid();
  const index = makeSearchIndex("en", VALID_REFERENCES.slice(0, 5));
  assert.ok(
    validateSearchIndex(manifest, index, "en", NAMES).some((e) =>
      e.includes("expected 6")
    )
  );
});

test("rejects a search index with an out-of-range reference", () => {
  const { manifest } = makeValid();
  const broken = [...VALID_REFERENCES.slice(0, 5), "genesis.9.9"];
  const index = makeSearchIndex("en", broken);
  assert.ok(
    validateSearchIndex(manifest, index, "en", NAMES).some((e) =>
      e.includes("do not resolve")
    )
  );
});

test("rejects a search index with a duplicate + a missing verse (same count)", () => {
  const { manifest } = makeValid();
  // Same length (6), but "genesis.1.2" is replaced by a duplicate "genesis.1.1"
  // — so the count matches yet one verse is duplicated and another is missing.
  const broken = [
    "genesis.1.1",
    "genesis.1.1",
    "genesis.2.1",
    "genesis.2.2",
    "genesis.2.3",
    "john.1.1",
  ];
  const index = makeSearchIndex("en", broken);
  const errors = validateSearchIndex(manifest, index, "en", NAMES);
  assert.ok(errors.some((e) => e.includes("duplicate reference")));
  assert.ok(errors.some((e) => e.includes("missing")));
});

test("rejects a search index whose locale field is wrong", () => {
  const { manifest } = makeValid();
  const index = makeSearchIndex("de", VALID_REFERENCES);
  assert.ok(
    validateSearchIndex(manifest, index, "en", NAMES).some((e) => e.includes("locale field"))
  );
});

test("rejects a search index whose book name is stale", () => {
  const { manifest } = makeValid();
  const index = makeSearchIndex("en", VALID_REFERENCES);
  const renamed = { ...NAMES, john: "The Gospel of John" };
  assert.ok(
    validateSearchIndex(manifest, index, "en", renamed).some((e) =>
      e.includes("bible:build")
    )
  );
});

// A partial rewrite is the nastier case: most entries are correct, so a check
// that only sampled one entry per book would miss it.
test("rejects a search index where only SOME entries carry the stale name", () => {
  const { manifest } = makeValid();
  const index = makeSearchIndex("en", VALID_REFERENCES);
  const entries = index.entries.map((entry, i) =>
    i === 1 ? { ...entry, bookName: "Old Name" } : entry
  );
  const errors = validateSearchIndex(manifest, { ...index, entries }, "en", NAMES);
  assert.ok(
    errors.some((e) => e.includes('"genesis"') && e.includes("Old Name")),
    `expected a stale-name error, got: ${errors.join(" | ")}`
  );
});
