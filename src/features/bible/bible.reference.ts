import type { BibleReference } from "./bible.types";

// Parses the canonical reference string used by the search index:
// `bookId.chapter.verse` (e.g. "john.3.16", "1-john.5.4"). The search UI turns
// each hit's reference into a /bible/<book>/<chapter>#verse-<verse> link.
//
// This module has ZERO dependencies (no React, no data, no Fuse) so the client
// search component can import it without pulling in the server data layer.

// Only plain digit strings ("1", "150") are accepted — no signs, decimals,
// exponents ("5e2"), hex or leading zeros — because the canonical form only
// ever emits plain integers.
function parsePositiveIntToken(token: string): number | null {
  if (!/^[1-9][0-9]*$/.test(token)) return null;
  return Number(token);
}

// Returns null for anything malformed rather than throwing, so a bad reference
// degrades to "skip this result" instead of breaking the search page.
export function parseReference(value: string): BibleReference | null {
  const parts = value.split(".");
  if (parts.length !== 3) return null;

  const [bookId, chapterRaw, verseRaw] = parts;
  if (!bookId) return null;

  const chapter = parsePositiveIntToken(chapterRaw);
  const verse = parsePositiveIntToken(verseRaw);
  if (chapter === null || verse === null) return null;

  return { bookId, chapter, verse };
}

// DOM id of a rendered verse — the single definition shared by the verse list,
// the verse jump bar and search result links.
export function verseAnchorId(verse: number): string {
  return `verse-${verse}`;
}

// The verse id format used before `verse-<n>`. Still emitted (as an empty
// inner anchor) so links shared in the old `#v<n>` form keep working.
export function legacyVerseAnchorId(verse: number): string {
  return `v${verse}`;
}
