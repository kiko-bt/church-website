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
// Bible data layer — the ONLY module that reads the Bible JSON files.
//
// Routing and metadata read the MANIFEST only (tiny, no verse text), so
// `generateStaticParams` never touches the verse corpus. Verse text is loaded
// lazily, per book, per locale — never as one monolithic file — and each book
// is parsed and validated at most once, then cached for the lifetime of the
// process. (The cache is not evicted, so a full build ends up holding the books
// it rendered; that is expected and bounded by the dataset size.)
//
// Every file is validated with the shared Zod schemas as it is read, so a
// malformed dataset fails the build here too — a second gate behind the
// standalone `bible:validate` prebuild check.
// ---------------------------------------------------------------------------

// Validate the manifest shape once, at module load.
const manifest: BibleManifest = manifestSchema.parse(manifestJson);

const bookMetaById = new Map<string, BibleManifestBook>(
  manifest.books.map((book) => [book.id, book])
);

// --- Manifest accessors (routing / static params — no verse text) ---

export function getManifest(): BibleManifest {
  return manifest;
}

export function getAllBookMeta(): readonly BibleManifestBook[] {
  return manifest.books;
}

// --- Verse-text accessors (lazy, cached, validated) ---

// Cache of validated book files, keyed by `${locale}:${bookId}`. Persists for
// the lifetime of the process (build), so a book is read and validated at most
// once even though it backs many chapter pages.
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

export async function getBook(
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

// Loads every book for a locale (in canonical order). Used by the Bible landing
// page, which needs localized book names. Backed by the same cache, so it does
// not cost more than the chapter pages already do.
export async function getAllBooks(
  locale: Locale
): Promise<readonly BibleBook[]> {
  const books = await Promise.all(
    manifest.books.map((meta) => getBook(locale, meta.id))
  );
  return books.filter((book): book is BibleBook => book !== undefined);
}
