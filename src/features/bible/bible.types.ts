import type { Testament } from "./bible.constants";

export type { Testament };

// ---------------------------------------------------------------------------
// Domain model (Translation-rooted, single-language)
// ---------------------------------------------------------------------------
//
// A loaded Book/Chapter/Verse always belongs to exactly ONE translation of ONE
// language. The Macedonian site and the English site read DIFFERENT source
// Bibles (not machine translations of each other), so verse text is never
// stored as a bilingual pair — it is resolved per locale from the per-locale
// data files. This deliberately avoids assuming that verse N in one language
// aligns with verse N in another (versification can differ between translations).

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
  // Localized display name for the loaded translation (e.g. "Битие" / "Genesis").
  readonly name: string;
  readonly testament: Testament;
  readonly chapters: readonly BibleChapter[];
};

// ---------------------------------------------------------------------------
// Reference (value object)
// ---------------------------------------------------------------------------
//
// A language-independent pointer to a place in scripture. It carries no text —
// only coordinates. This is the universal currency for future features
// (search hits, cross-references, sermon links, verse sharing): each of those
// stores/produces a Reference and resolves it to text per locale on demand.

export type BibleReference = {
  readonly bookId: string;
  readonly chapter: number;
  readonly verse: number;
};

// A contiguous span of verses within a SINGLE book (start..end inclusive).
// Introduced now — ahead of its first consumer — so that reading plans, sermon
// references and cross-references can be modelled later without changing the
// domain model. A range never crosses a book boundary; multi-book selections
// are represented as a list of ranges.
export type BibleReferenceRange = {
  readonly bookId: string;
  readonly start: { readonly chapter: number; readonly verse: number };
  readonly end: { readonly chapter: number; readonly verse: number };
};

// ---------------------------------------------------------------------------
// Manifest (single source of truth for routing / generateStaticParams)
// ---------------------------------------------------------------------------
//
// The manifest describes the SHAPE of the dataset (which books exist, their
// order/testament, and how many verses each chapter has) WITHOUT any verse
// text. Routing and static-param generation read only the manifest, so they
// never load the full corpus. Verse text is loaded lazily, per book, per locale.

export type BibleManifestBook = {
  readonly id: string;
  readonly order: number;
  readonly testament: Testament;
  // verseCounts[i] = number of verses in chapter (i + 1).
  // The length of this array is the chapter count for the book.
  readonly chapters: readonly number[];
};

export type BibleManifestMetadata = {
  readonly translation: string;
  readonly generatedAt: string;
  readonly generatorVersion: string;
};

export type BibleManifest = {
  readonly version: number;
  readonly metadata: BibleManifestMetadata;
  readonly books: readonly BibleManifestBook[];
};

// ---------------------------------------------------------------------------
// Search index (built artifact — consumed only by the client search surface)
// ---------------------------------------------------------------------------

export type BibleSearchEntry = {
  readonly reference: string; // canonical Reference string, e.g. "john.3.16"
  readonly bookName: string; // localized display name at build time
  readonly text: string;
};

export type BibleSearchIndex = {
  readonly locale: string;
  readonly entries: readonly BibleSearchEntry[];
};
