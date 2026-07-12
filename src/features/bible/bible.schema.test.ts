import { test } from "node:test";
import assert from "node:assert/strict";
import {
  verseSchema,
  bookFileSchema,
  validateDataset,
  type ParsedBookFile,
  type ParsedManifest,
} from "./bible.schema.ts";

// Proves the dataset validation rejects every failure mode required by the
// engineering rules (see .claude/bible-module.md §6).
// Run via `npm test` (node --test --experimental-strip-types).

type Canon = Parameters<typeof validateDataset>[0]["canon"];

function makeBook(
  id: string,
  name: string,
  testament: "OT" | "NT",
  verseCounts: readonly number[]
): ParsedBookFile {
  return {
    id,
    name,
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
      genesis: makeBook("genesis", "Genesis", "OT", [2, 3]),
      john: makeBook("john", "John", "NT", [1]),
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
  const base = makeBook("john", "John", "NT", [1]);
  assert.ok(bookFileSchema.safeParse(base).success);
  // extra field
  assert.ok(!bookFileSchema.safeParse({ ...base, color: "gold" }).success);
  // missing field (no `name`)
  const withoutName = {
    id: base.id,
    testament: base.testament,
    chapters: base.chapters,
  };
  assert.ok(!bookFileSchema.safeParse(withoutName).success);
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
  d.filesByLocale.en["not-a-book"] = makeBook("not-a-book", "Nope", "NT", [1]);
  delete d.filesByLocale.en.john;
  assert.ok(validateDataset(d).some((e) => e.includes("unknown book slug")));
});

test("rejects a manifest/file chapter-count mismatch", () => {
  const d = makeValid();
  d.filesByLocale.en.genesis = makeBook("genesis", "Genesis", "OT", [2, 3, 4]);
  assert.ok(validateDataset(d).some((e) => e.includes("chapters")));
});

test("rejects a manifest/file verse-count mismatch", () => {
  const d = makeValid();
  d.filesByLocale.en.genesis = makeBook("genesis", "Genesis", "OT", [2, 5]);
  assert.ok(validateDataset(d).some((e) => e.includes("verses")));
});

test("rejects non-contiguous verse numbering (a duplicated verse)", () => {
  const d = makeValid();
  const book = makeBook("john", "John", "NT", [1]);
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
  d.filesByLocale.de = { genesis: makeBook("genesis", "Genesis", "OT", [2, 3]) };
  assert.ok(validateDataset(d).some((e) => e.includes('unknown locale "de"')));
});
