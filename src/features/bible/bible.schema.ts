import { z } from "zod";
import type { Testament } from "./bible.constants";

// ---------------------------------------------------------------------------
// Validation for the Bible dataset (single source of truth).
//
// This module intentionally has only ONE value import (zod). Everything else is
// a type-only import, which Node's type-stripping erases — so this file can be
// consumed both by the app/build typecheck AND by the standalone Node validator
// (`scripts/validate-bible.ts`) without module-resolution friction.
//
// Two layers of checking:
//   1. Zod schemas  — per-file SHAPE and field validity (strict objects reject
//      unexpected fields; verse text may not be empty/whitespace).
//   2. validateDataset() — holistic, cross-file integrity that Zod cannot express
//      on its own (canonical ordering, duplicates, contiguity, missing/extra
//      chapters & verses, and manifest ↔ file agreement).
// ---------------------------------------------------------------------------

// A non-empty, non-whitespace-only string.
const nonBlankString = z
  .string()
  .refine((value) => value.trim().length > 0, {
    message: "must not be empty or whitespace-only",
  });

const testamentSchema = z.enum(["OT", "NT"]);

// --- Per-book data file (data/bible/<locale>/<id>.json) ---

export const verseSchema = z.strictObject({
  number: z.number().int().positive(),
  text: nonBlankString,
});

export const chapterSchema = z.strictObject({
  number: z.number().int().positive(),
  verses: z.array(verseSchema).min(1),
});

export const bookFileSchema = z.strictObject({
  id: nonBlankString,
  name: nonBlankString,
  testament: testamentSchema,
  chapters: z.array(chapterSchema).min(1),
});

// --- Manifest (data/bible/manifest.json) ---

export const manifestBookSchema = z.strictObject({
  id: nonBlankString,
  order: z.number().int().positive(),
  testament: testamentSchema,
  // chapters[i] = number of verses in chapter (i + 1); length = chapter count.
  chapters: z.array(z.number().int().positive()).min(1),
});

export const manifestSchema = z.strictObject({
  version: z.number().int().positive(),
  metadata: z.strictObject({
    translation: nonBlankString,
    generatedAt: nonBlankString,
    generatorVersion: nonBlankString,
  }),
  books: z.array(manifestBookSchema).min(1),
});

// --- Search index (data/bible/search/<locale>.json) ---

export const searchEntrySchema = z.strictObject({
  reference: nonBlankString, // canonical "bookId.chapter.verse"
  bookName: nonBlankString,
  text: nonBlankString,
});

export const searchIndexSchema = z.strictObject({
  locale: nonBlankString,
  entries: z.array(searchEntrySchema).min(1),
});

export type ParsedBookFile = z.infer<typeof bookFileSchema>;
export type ParsedManifest = z.infer<typeof manifestSchema>;
export type ParsedSearchIndex = z.infer<typeof searchIndexSchema>;

// ---------------------------------------------------------------------------
// Holistic cross-file validation.
// ---------------------------------------------------------------------------

type CanonEntry = {
  readonly id: string;
  readonly order: number;
  readonly testament: Testament;
};

export type ValidateDatasetInput = {
  readonly canon: readonly CanonEntry[];
  readonly manifest: ParsedManifest;
  // filesByLocale[locale][bookId] = the parsed per-book file.
  readonly filesByLocale: Readonly<
    Record<string, Readonly<Record<string, ParsedBookFile>>>
  >;
  readonly expectedLocales: readonly string[];
};

// Returns a list of human-readable error strings. Empty ⇒ the dataset is valid.
export function validateDataset(input: ValidateDatasetInput): string[] {
  const errors: string[] = [];
  const { canon, manifest, filesByLocale, expectedLocales } = input;
  const canonById = new Map(canon.map((entry) => [entry.id, entry]));

  // 1. Manifest books: canonical membership, ordering, testament, duplicates,
  //    and completeness against the canon.
  const seenIds = new Set<string>();
  manifest.books.forEach((book, index) => {
    if (seenIds.has(book.id)) {
      errors.push(`manifest: duplicate book id "${book.id}"`);
    }
    seenIds.add(book.id);

    const canonBook = canonById.get(book.id);
    if (!canonBook) {
      errors.push(`manifest: unknown book slug "${book.id}" (not in canon)`);
      return;
    }
    if (book.order !== canonBook.order) {
      errors.push(
        `manifest: book "${book.id}" has order ${book.order}, canon says ${canonBook.order}`
      );
    }
    if (book.order !== index + 1) {
      errors.push(
        `manifest: book "${book.id}" at index ${index} has order ${book.order}, expected contiguous ${index + 1}`
      );
    }
    if (book.testament !== canonBook.testament) {
      errors.push(
        `manifest: book "${book.id}" testament "${book.testament}" != canon "${canonBook.testament}"`
      );
    }
  });
  for (const canonBook of canon) {
    if (!seenIds.has(canonBook.id)) {
      errors.push(`manifest: missing canonical book "${canonBook.id}"`);
    }
  }

  // 2. Locales present must exactly match the expected set.
  for (const locale of Object.keys(filesByLocale)) {
    if (!expectedLocales.includes(locale)) {
      errors.push(`unknown locale "${locale}" (expected ${expectedLocales.join(", ")})`);
    }
  }
  for (const locale of expectedLocales) {
    if (!(locale in filesByLocale)) {
      errors.push(`missing locale "${locale}"`);
    }
  }

  // 3. Every book file must agree with the manifest, for every expected locale.
  const manifestIds = new Set(manifest.books.map((book) => book.id));
  for (const locale of expectedLocales) {
    const files = filesByLocale[locale];
    if (!files) continue; // already reported as a missing locale above

    for (const fileId of Object.keys(files)) {
      if (!manifestIds.has(fileId)) {
        errors.push(`${locale}: file "${fileId}" is not listed in the manifest`);
      }
    }

    for (const manifestBook of manifest.books) {
      const file = files[manifestBook.id];
      if (!file) {
        errors.push(`${locale}: missing book file "${manifestBook.id}"`);
        continue;
      }
      if (file.id !== manifestBook.id) {
        errors.push(
          `${locale}/${manifestBook.id}: file id "${file.id}" does not match its filename`
        );
      }
      if (file.testament !== manifestBook.testament) {
        errors.push(
          `${locale}/${manifestBook.id}: testament "${file.testament}" != manifest "${manifestBook.testament}"`
        );
      }
      if (file.chapters.length !== manifestBook.chapters.length) {
        errors.push(
          `${locale}/${manifestBook.id}: has ${file.chapters.length} chapters, manifest says ${manifestBook.chapters.length}`
        );
      }

      file.chapters.forEach((chapter, chapterIndex) => {
        if (chapter.number !== chapterIndex + 1) {
          errors.push(
            `${locale}/${manifestBook.id}: chapter at index ${chapterIndex} numbered ${chapter.number}, expected contiguous ${chapterIndex + 1}`
          );
        }
        const expectedVerses = manifestBook.chapters[chapterIndex];
        if (
          expectedVerses !== undefined &&
          chapter.verses.length !== expectedVerses
        ) {
          errors.push(
            `${locale}/${manifestBook.id} ch.${chapter.number}: has ${chapter.verses.length} verses, manifest says ${expectedVerses}`
          );
        }
        chapter.verses.forEach((verse, verseIndex) => {
          if (verse.number !== verseIndex + 1) {
            errors.push(
              `${locale}/${manifestBook.id} ch.${chapter.number}: verse at index ${verseIndex} numbered ${verse.number}, expected contiguous ${verseIndex + 1}`
            );
          }
        });
      });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Search-index integrity — every entry references a real verse, and the index
// covers every verse exactly once (no out-of-canon references, duplicates, or
// gaps). References are compared as strings against the exact expected set, so
// no reference parsing is needed here.
// ---------------------------------------------------------------------------

export function validateSearchIndex(
  manifest: ParsedManifest,
  index: ParsedSearchIndex,
  locale: string
): string[] {
  const errors: string[] = [];
  const label = `search/${locale}.json`;

  if (index.locale !== locale) {
    errors.push(`${label}: locale field "${index.locale}" != "${locale}"`);
  }

  // The exact set of references the index must contain: one per verse.
  const expected = new Set<string>();
  for (const book of manifest.books) {
    book.chapters.forEach((verseCount, chapterIndex) => {
      for (let verse = 1; verse <= verseCount; verse++) {
        expected.add(`${book.id}.${chapterIndex + 1}.${verse}`);
      }
    });
  }
  if (index.entries.length !== expected.size) {
    errors.push(
      `${label}: has ${index.entries.length} entries, expected ${expected.size} (one per verse)`
    );
  }

  // Every entry must reference a real verse, and the index must cover every
  // verse exactly once — no references outside the canon, no duplicates, no
  // gaps. Cap reported samples so a systemic problem doesn't flood the output.
  const invalid: string[] = [];
  const duplicated: string[] = [];
  const seen = new Set<string>();
  for (const entry of index.entries) {
    if (!expected.has(entry.reference)) {
      if (invalid.length < 5) invalid.push(entry.reference);
    } else if (seen.has(entry.reference)) {
      if (duplicated.length < 5) duplicated.push(entry.reference);
    } else {
      seen.add(entry.reference);
    }
  }

  if (invalid.length > 0) {
    errors.push(
      `${label}: reference(s) that do not resolve within the manifest, e.g. ${invalid.join(", ")}`
    );
  }
  if (duplicated.length > 0) {
    errors.push(
      `${label}: duplicate reference(s), e.g. ${duplicated.join(", ")}`
    );
  }
  const missing = expected.size - seen.size;
  if (missing > 0) {
    errors.push(`${label}: ${missing} verse(s) missing from the search index`);
  }

  return errors;
}
