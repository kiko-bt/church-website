import type { Testament } from "./bible.constants";

// ---------------------------------------------------------------------------
// Domain model
// ---------------------------------------------------------------------------
//
// A loaded Book/Chapter/Verse always belongs to exactly ONE translation of ONE
// language. The Macedonian and English sites read DIFFERENT source Bibles (not
// machine translations of each other), so verse text is never stored as a
// bilingual pair — it is resolved per locale from the per-locale data files.
//
// A book carries no display name: names live only in bible.display-names.ts,
// resolved by id at render time.

export type BibleVerse = {
  readonly number: number;
  readonly text: string;
};

export type BibleChapter = {
  readonly number: number;
  readonly verses: readonly BibleVerse[];
};

export type BibleBook = {
  // Canonical, language-independent slug (e.g. "genesis"). Identical across
  // every translation; used for URLs, the manifest and references.
  readonly id: string;
  readonly testament: Testament;
  readonly chapters: readonly BibleChapter[];
};

// A language-independent pointer to a single verse — coordinates, no text.
export type BibleReference = {
  readonly bookId: string;
  readonly chapter: number;
  readonly verse: number;
};

// ---------------------------------------------------------------------------
// Manifest (single source of truth for routing / generateStaticParams)
// ---------------------------------------------------------------------------
//
// The manifest describes the SHAPE of the dataset (which books exist, their
// order/testament, and how many verses each chapter has) WITHOUT any verse
// text. Routing and static-param generation read only the manifest, so they
// never load the full corpus.

export type BibleManifestBook = {
  readonly id: string;
  readonly order: number;
  readonly testament: Testament;
  // verseCounts[i] = number of verses in chapter (i + 1).
  // The length of this array is the chapter count for the book.
  readonly chapters: readonly number[];
};

export type BibleManifest = {
  readonly version: number;
  readonly metadata: {
    readonly translation: string;
    readonly generatedAt: string;
    readonly generatorVersion: string;
  };
  readonly books: readonly BibleManifestBook[];
};

// ---------------------------------------------------------------------------
// Search index (built artifact — consumed only by the client search surface)
// ---------------------------------------------------------------------------

export type BibleSearchEntry = {
  readonly reference: string; // canonical "bookId.chapter.verse", e.g. "john.3.16"
  readonly bookName: string; // localized display name, stamped in at build time
  readonly text: string;
};

export type BibleSearchIndex = {
  readonly locale: string;
  readonly entries: readonly BibleSearchEntry[];
};
