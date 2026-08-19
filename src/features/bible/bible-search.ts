import Fuse, { type IFuseOptions } from "fuse.js";
import type { BibleSearchEntry } from "./bible.types";
import { BIBLE_CANON } from "./bible.constants";
// Client-side Bible search powered by Fuse.js.
//
// This module imports Fuse and is therefore a CLIENT dependency. It is
// deliberately NOT re-exported from features/bible/index.ts so the feature
// barrel stays safe to import from Server Components — import it directly from
// the client search component instead.

const FUSE_OPTIONS: IFuseOptions<BibleSearchEntry> = {
  keys: ["text", "bookName"],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
  useExtendedSearch: true,
};
const BOOK_ORDER = new Map(
  BIBLE_CANON.map((book) => [book.id, book.order] as const)
);

export function createBibleSearch(
  entries: readonly BibleSearchEntry[]
): Fuse<BibleSearchEntry> {
  return new Fuse(entries as BibleSearchEntry[], FUSE_OPTIONS);
}

export function searchBible(
  fuse: Fuse<BibleSearchEntry>,
  query: string,
  _limit = 30
): BibleSearchEntry[] {
  void _limit;const term = query.trim().toLowerCase();

  if (!term) return [];

  return fuse
    .search("'" + query.trim())
    .map((result) => result.item)
    .filter((item) =>
      (item.bookName + " " + item.text)
        .toLowerCase()
        .split(/[^0-9A-Za-z\u0400-\u04FF]+/)
        .includes(term)
    )
  .sort((a, b) => {
  const [aBook, aChapter, aVerse] = a.reference.split(".");
  const [bBook, bChapter, bVerse] = b.reference.split(".");

  return (
    (BOOK_ORDER.get(aBook) ?? 999) - (BOOK_ORDER.get(bBook) ?? 999) ||
    Number(aChapter) - Number(bChapter) ||
    Number(aVerse) - Number(bVerse)
  );
});
}


