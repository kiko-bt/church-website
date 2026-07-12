// Derives the routing manifest and the per-locale search indexes FROM the
// committed per-book files. This is the tool that makes swapping in a real Bible
// a no-code change: replace the book files under src/data/bible/{mk,en}/, run
// `npm run bible:build`, and the manifest + search indexes are regenerated to
// match — then validated.
//
// The book files are the single source of truth; manifest.json and search/*.json
// are always derived, never hand-written.
//
// Run: node --experimental-strip-types scripts/build-bible-artifacts.ts [translationLabel]

import {
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import {
  bookFileSchema,
  type ParsedBookFile,
} from "../src/features/bible/bible.schema.ts";
import { BIBLE_CANON } from "../src/features/bible/bible.constants.ts";
import { locales, defaultLocale } from "../src/constants/locales.ts";

const DATA_DIR = join(process.cwd(), "src", "data", "bible");
const BUILDER_VERSION = "1.0.0";
const MANIFEST_VERSION = 1;

// Provenance label only (e.g. "placeholder", or the real translation name).
const translationLabel = process.argv[2] ?? "custom";

type SearchEntry = {
  readonly reference: string;
  readonly bookName: string;
  readonly text: string;
};

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
  // Manifest: canonical order/testament come from the registry; verse counts
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
      translation: translationLabel,
      generatedAt: new Date().toISOString(),
      generatorVersion: BUILDER_VERSION,
    },
    books: manifestBooks,
  });

  // Search indexes: one flat entry per verse, per locale.
  const searchDir = join(DATA_DIR, "search");
  rmSync(searchDir, { recursive: true, force: true });
  mkdirSync(searchDir, { recursive: true });

  for (const locale of locales) {
    const entries: SearchEntry[] = [];
    for (const canonBook of BIBLE_CANON) {
      const book = readBook(locale, canonBook.id);
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          entries.push({
            reference: `${book.id}.${chapter.number}.${verse.number}`,
            bookName: book.name,
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
