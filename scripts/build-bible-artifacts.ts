// Derives the routing manifest and the per-locale search indexes FROM the
// committed per-book files.
//
// The book files are the single source of truth for verse text; book names come
// from bible.display-names.ts. manifest.json and search/*.json are always
// derived, never hand-written.
//
// Run: npm run bible:build

import { writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  bookFileSchema,
  type ParsedBookFile,
} from "../src/features/bible/bible.schema.ts";
import { BIBLE_CANON } from "../src/features/bible/bible.constants.ts";
import {
  BIBLE_DISPLAY_NAMES,
  assertDisplayNamesComplete,
} from "../src/features/bible/bible.display-names.ts";
import { locales, defaultLocale } from "../src/constants/locales.ts";

const DATA_DIR = join(process.cwd(), "src", "data", "bible");
const BUILDER_VERSION = "1.0.0";
const MANIFEST_VERSION = 1;

// Provenance, recorded in the manifest so the dataset's origin travels with it.
const TRANSLATION =
  "mk: content owner's Macedonian edition (Nestle-Aland 28 basis) · " +
  "en: World English Bible (public domain)";

function readBook(locale: string, id: string): ParsedBookFile {
  const path = join(DATA_DIR, locale, `${id}.json`);
  if (!existsSync(path)) {
    throw new Error(`missing book file: ${locale}/${id}.json`);
  }
  return bookFileSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main(): void {
  const nameErrors = assertDisplayNamesComplete(
    locales,
    BIBLE_CANON.map((book) => book.id)
  );
  if (nameErrors.length > 0) {
    throw new Error(
      `display-name registry is incomplete:\n  - ${nameErrors.join("\n  - ")}`
    );
  }

  // Manifest: canonical order/testament come from BIBLE_CANON; verse counts
  // come from the default-locale files. `bible:validate` then confirms every
  // other locale matches this shape.
  const manifestBooks = BIBLE_CANON.map((canonBook) => {
    const book = readBook(defaultLocale, canonBook.id);
    return {
      id: canonBook.id,
      order: canonBook.order,
      testament: canonBook.testament,
      chapters: book.chapters.map((chapter) => chapter.verses.length),
    };
  });

  writeJson(join(DATA_DIR, "manifest.json"), {
    version: MANIFEST_VERSION,
    metadata: {
      translation: TRANSLATION,
      generatedAt: new Date().toISOString(),
      generatorVersion: BUILDER_VERSION,
    },
    books: manifestBooks,
  });

  // Search indexes: one flat entry per verse, per locale. `bookName` is stamped
  // in from the registry so Fuse can match on it — that is why renaming a book
  // needs a `bible:build` to show up in search results.
  const searchDir = join(DATA_DIR, "search");
  rmSync(searchDir, { recursive: true, force: true });
  mkdirSync(searchDir, { recursive: true });

  for (const locale of locales) {
    const entries: { reference: string; bookName: string; text: string }[] = [];
    for (const canonBook of BIBLE_CANON) {
      const book = readBook(locale, canonBook.id);
      const bookName = BIBLE_DISPLAY_NAMES[locale][canonBook.id];
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          entries.push({
            reference: `${book.id}.${chapter.number}.${verse.number}`,
            bookName,
            text: verse.text,
          });
        }
      }
    }
    writeJson(join(searchDir, `${locale}.json`), { locale, entries });
  }

  const totalVerses = manifestBooks.reduce(
    (sum, book) => sum + book.chapters.reduce((s, n) => s + n, 0),
    0
  );
  console.log(
    `Built manifest (${manifestBooks.length} books) + search indexes ` +
      `(${totalVerses} verses/locale: ${locales.join(", ")}) from src/data/bible/.`
  );
}

try {
  main();
} catch (error) {
  console.error(`\n✖ Failed to build Bible artifacts: ${(error as Error).message}\n`);
  process.exit(1);
}
