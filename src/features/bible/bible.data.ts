import type { Locale } from "@/constants/locales";
import type {
  BibleBook,
  BibleChapter,
  BibleManifest,
  BibleManifestBook,
} from "./bible.types";
import { manifestSchema, bookFileSchema } from "./bible.schema";
import manifestJson from "@/data/bible/manifest.json";

// ---------------------------------------------------------------------------
// The ONLY module that reads the Bible JSON files.
//
// Routing and metadata read the MANIFEST only (tiny, no verse text), so
// `generateStaticParams` never touches the verse corpus. Verse text is loaded
// lazily, per book, per locale, and each book is parsed and validated at most
// once per process, then cached. The cache is never evicted, so a full build
// ends up holding the books it rendered; that is expected and bounded by the
// dataset size.
//
// Files are validated with the shared Zod schemas as they are read — a second
// gate behind the standalone `bible:validate` prebuild check.
// ---------------------------------------------------------------------------

const manifest: BibleManifest = manifestSchema.parse(manifestJson);

const bookMetaById = new Map<string, BibleManifestBook>(
  manifest.books.map((book) => [book.id, book])
);

// Routing / static params — no verse text.
export function getAllBookMeta(): readonly BibleManifestBook[] {
  return manifest.books;
}

const bookCache = new Map<string, BibleBook>();

// A single dynamic segment inside a fixed directory keeps the bundler's dynamic
// import context clean and predictable (one per locale).
function importBookModule(
  locale: Locale,
  bookId: string
): Promise<{ default: unknown }> {
  return locale === "en"
    ? import(`../../data/bible/en/${bookId}.json`)
    : import(`../../data/bible/mk/${bookId}.json`);
}

async function getBook(
  locale: Locale,
  bookId: string
): Promise<BibleBook | undefined> {
  // Only known canonical books exist; unknown ids resolve to "not found".
  if (!bookMetaById.has(bookId)) return undefined;

  const cacheKey = `${locale}:${bookId}`;
  const cached = bookCache.get(cacheKey);
  if (cached) return cached;

  const raw: unknown = (await importBookModule(locale, bookId)).default;
  const book: BibleBook = bookFileSchema.parse(raw);
  bookCache.set(cacheKey, book);
  return book;
}

export async function getChapter(
  locale: Locale,
  bookId: string,
  chapterNumber: number
): Promise<BibleChapter | undefined> {
  const book = await getBook(locale, bookId);
  return book?.chapters.find((chapter) => chapter.number === chapterNumber);
}
