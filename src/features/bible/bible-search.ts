import Fuse, { type IFuseOptions } from "fuse.js";
import type { BibleSearchEntry } from "./bible.types";

// Client-side Bible search powered by Fuse.js.
//
// This module imports Fuse and is therefore a CLIENT dependency. It is
// deliberately NOT re-exported from features/bible/index.ts so the feature
// barrel stays safe to import from Server Components — import it directly from
// the client search component instead.
//
// Matching is by WHOLE WORD only: "Сон" never matches "Сончоглед", "Son" never
// matches "Sunflower". Fuse narrows the index with exact (non-fuzzy) substring
// tokens; every candidate is then checked word by word, using the same word
// definition that drives highlighting. Matching is case-insensitive.

// A "word" is a run of Unicode letters, combining marks and digits, so
// Cyrillic, Latin and accented letters are handled alike. Anything else —
// spaces, punctuation, apostrophes, hyphens, dashes — separates words.
const WORD_PATTERN = "[\\p{L}\\p{M}\\p{N}]+";

const FUSE_OPTIONS: IFuseOptions<BibleSearchEntry> = {
  keys: ["text", "bookName"],
  useExtendedSearch: true,
  ignoreLocation: true,
  // Results come back in canonical order (Genesis → Revelation, verse order),
  // which is the index order — Fuse's relevance score carries no meaning when
  // every hit is an exact whole-word match.
  shouldSort: false,
};

// Normalised (lower-cased, de-duplicated) words of a search query.
export function queryWords(query: string): string[] {
  const words = query.match(new RegExp(WORD_PATTERN, "gu")) ?? [];
  return [...new Set(words.map((word) => word.toLowerCase()))];
}

function wordsOf(value: string): Set<string> {
  const words = value.match(new RegExp(WORD_PATTERN, "gu")) ?? [];
  return new Set(words.map((word) => word.toLowerCase()));
}

// True when every query word occurs in `value` as a whole word.
function containsAllWords(value: string, words: readonly string[]): boolean {
  const present = wordsOf(value);
  return words.every((word) => present.has(word));
}

export function createBibleSearch(
  entries: readonly BibleSearchEntry[]
): Fuse<BibleSearchEntry> {
  return new Fuse(entries as BibleSearchEntry[], FUSE_OPTIONS);
}

// Returns EVERY verse in which all query words appear as whole words — in the
// verse text, or in the book name. There is no result cap.
export function searchBible(
  fuse: Fuse<BibleSearchEntry>,
  query: string
): BibleSearchEntry[] {
  const words = queryWords(query);
  if (words.length === 0) return [];

  // Extended search: `'word` is an exact include-match; space-separated terms
  // are AND-ed. Words contain only letters/marks/digits, so they can never be
  // read as extended-search operators.
  const pattern = words.map((word) => `'${word}`).join(" ");

  return fuse
    .search(pattern)
    .map((result) => result.item)
    .filter(
      (entry) =>
        containsAllWords(entry.text, words) ||
        containsAllWords(entry.bookName, words)
    );
}

export type HighlightSegment = {
  readonly text: string;
  readonly match: boolean;
};

// Splits `value` into plain and matched segments. Only whole words equal
// (case-insensitively) to a query word are marked — the same word rule that
// `searchBible` matches on. Joining the segments reproduces `value` exactly.
export function highlightWords(
  value: string,
  words: readonly string[]
): HighlightSegment[] {
  if (words.length === 0) return [{ text: value, match: false }];

  const wanted = new Set(words);
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const found of value.matchAll(new RegExp(WORD_PATTERN, "gu"))) {
    const start = found.index ?? 0;
    const word = found[0];
    if (!wanted.has(word.toLowerCase())) continue;
    if (start > cursor) {
      segments.push({ text: value.slice(cursor, start), match: false });
    }
    segments.push({ text: word, match: true });
    cursor = start + word.length;
  }

  if (cursor < value.length) {
    segments.push({ text: value.slice(cursor), match: false });
  }
  return segments;
}
