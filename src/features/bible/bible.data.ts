import type { BibleBook, BibleChapter, BibleHierarchical } from "./bible.types";
import bibleData from "@/data/bible/bible-hierarchical.json";

// Single, validated entry point for the local Bible JSON.
// The `as` assertion happens exactly once here; pages and components
// MUST read Bible data through these accessors, never by importing the
// JSON directly. This keeps the cast in one place and prevents the
// duplicated data-loading pattern that previously lived in each page.
const bible = bibleData as BibleHierarchical;

export function getAllBooks(): readonly BibleBook[] {
  return bible.books;
}

export function getBook(bookSlug: string): BibleBook | undefined {
  return bible.books.find((book) => book.id === bookSlug);
}

export function getChapter(
  bookSlug: string,
  chapterNumber: number
): BibleChapter | undefined {
  return getBook(bookSlug)?.chapters.find(
    (chapter) => chapter.number === chapterNumber
  );
}
