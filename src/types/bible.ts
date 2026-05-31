import type { Testament } from "@/constants/bible";

export type { Testament };

export type BibleVerse = {
  readonly number: number;
  readonly text: string;
  readonly text_en: string;
};

export type BibleChapter = {
  readonly number: number;
  readonly verses: readonly BibleVerse[];
};

export type BibleBook = {
  readonly id: string;
  readonly name: string;
  readonly testament: Testament;
  readonly chapters: readonly BibleChapter[];
};

export type BibleHierarchical = {
  readonly books: readonly BibleBook[];
};

export type BibleSearchEntry = {
  readonly id: string;
  readonly bookId: string;
  readonly bookName: string;
  readonly chapter: number;
  readonly verse: number;
  readonly text: string;
  readonly fullReference: string;
};

export type BibleBookMetadata = {
  readonly id: string;
  readonly name: string;
  readonly testament: Testament;
};

export type BibleSearchIndex = {
  readonly searchIndex: readonly BibleSearchEntry[];
  readonly booksMetadata: readonly BibleBookMetadata[];
};
