import type { BibleReference, BibleReferenceRange } from "./bible.types";

// Pure helpers for the BibleReference value object.
//
// This module has ZERO dependencies (no React, no data, no Fuse) so it is safe
// to import from Server Components, Client Components and build scripts alike.
// The canonical string form is `bookId.chapter.verse` (e.g. "john.3.16",
// "1-john.5.4") — stable, URL-safe and locale-independent, which makes it a
// good key for bookmarks, cross-references and share links.

const REFERENCE_SEPARATOR = ".";

// Strict positive-integer token parser. Only plain digit strings ("1", "150")
// are accepted — no signs, decimals, exponents ("5e2"), hex or leading zeros —
// because the canonical string form only ever emits plain integers. Returns
// null for anything else.
function parsePositiveIntToken(token: string): number | null {
  if (!/^[1-9][0-9]*$/.test(token)) return null;
  return Number(token);
}

export function createReference(
  bookId: string,
  chapter: number,
  verse: number
): BibleReference {
  return { bookId, chapter, verse };
}

// Serialize to the canonical string form: "bookId.chapter.verse".
export function formatReference(ref: BibleReference): string {
  return [ref.bookId, ref.chapter, ref.verse].join(REFERENCE_SEPARATOR);
}

// Parse the canonical string form back into a BibleReference.
// Returns null for anything malformed rather than throwing, so callers
// (e.g. parsing a URL fragment) can handle bad input gracefully.
export function parseReference(value: string): BibleReference | null {
  const parts = value.split(REFERENCE_SEPARATOR);
  if (parts.length !== 3) return null;

  const [bookId, chapterRaw, verseRaw] = parts;
  if (!bookId) return null;

  const chapter = parsePositiveIntToken(chapterRaw);
  const verse = parsePositiveIntToken(verseRaw);
  if (chapter === null || verse === null) return null;

  return { bookId, chapter, verse };
}

// The DOM id / URL fragment for a verse within a chapter page (e.g. "v16").
// Kept here so the anchor scheme is defined in exactly one place and reused by
// rendering, deep links and future verse-sharing.
export function referenceToAnchor(ref: BibleReference): string {
  return `v${ref.verse}`;
}

export function referencesEqual(a: BibleReference, b: BibleReference): boolean {
  return a.bookId === b.bookId && a.chapter === b.chapter && a.verse === b.verse;
}

// ---------------------------------------------------------------------------
// BibleReferenceRange
// ---------------------------------------------------------------------------
//
// Canonical string form is compact and human-friendly:
//   same chapter:   "john.3.16-18"
//   cross chapter:  "john.3.16-4.2"
// Parsing is unambiguous because the bookId (which may itself contain hyphens,
// e.g. "1-john") is delimited by the FIRST ".", and a slug never contains ".".

const RANGE_SEPARATOR = "-";

// end must not come before start (same book assumed).
function isForwardOrdered(range: BibleReferenceRange): boolean {
  if (range.end.chapter !== range.start.chapter) {
    return range.end.chapter > range.start.chapter;
  }
  return range.end.verse >= range.start.verse;
}

export function createReferenceRange(
  bookId: string,
  start: { chapter: number; verse: number },
  end: { chapter: number; verse: number }
): BibleReferenceRange {
  return { bookId, start, end };
}

// A range that begins and ends at the same verse.
export function isSingleVerseRange(range: BibleReferenceRange): boolean {
  return (
    range.start.chapter === range.end.chapter &&
    range.start.verse === range.end.verse
  );
}

export function formatReferenceRange(range: BibleReferenceRange): string {
  const head = `${range.bookId}${REFERENCE_SEPARATOR}${range.start.chapter}${REFERENCE_SEPARATOR}${range.start.verse}`;
  if (isSingleVerseRange(range)) return head;

  const tail =
    range.end.chapter === range.start.chapter
      ? `${range.end.verse}`
      : `${range.end.chapter}${REFERENCE_SEPARATOR}${range.end.verse}`;
  return `${head}${RANGE_SEPARATOR}${tail}`;
}

export function parseReferenceRange(value: string): BibleReferenceRange | null {
  const firstDot = value.indexOf(REFERENCE_SEPARATOR);
  if (firstDot <= 0) return null;

  const bookId = value.slice(0, firstDot);
  const rest = value.slice(firstDot + 1); // "startCh.startV[-endTail]"

  const [startPart, endPart, ...extra] = rest.split(RANGE_SEPARATOR);
  if (extra.length > 0) return null; // more than one "-" is malformed

  const startTokens = startPart.split(REFERENCE_SEPARATOR);
  if (startTokens.length !== 2) return null;

  const startChapter = parsePositiveIntToken(startTokens[0]);
  const startVerse = parsePositiveIntToken(startTokens[1]);
  if (startChapter === null || startVerse === null) return null;

  // No "-" ⇒ single-verse range.
  if (endPart === undefined) {
    return createReferenceRange(
      bookId,
      { chapter: startChapter, verse: startVerse },
      { chapter: startChapter, verse: startVerse }
    );
  }

  const endTokens = endPart.split(REFERENCE_SEPARATOR);
  // One token ⇒ same-chapter end ("16-18"); two ⇒ cross-chapter ("16-4.2").
  const endChapter =
    endTokens.length === 1
      ? startChapter
      : endTokens.length === 2
        ? parsePositiveIntToken(endTokens[0])
        : null;
  const endVerse =
    endTokens.length === 1
      ? parsePositiveIntToken(endTokens[0])
      : endTokens.length === 2
        ? parsePositiveIntToken(endTokens[1])
        : null;

  if (endChapter === null || endVerse === null) return null;

  const range = createReferenceRange(
    bookId,
    { chapter: startChapter, verse: startVerse },
    { chapter: endChapter, verse: endVerse }
  );
  return isForwardOrdered(range) ? range : null;
}

// Is a single verse reference contained within a range (inclusive)?
export function rangeContainsReference(
  range: BibleReferenceRange,
  ref: BibleReference
): boolean {
  if (ref.bookId !== range.bookId) return false;

  const afterStart =
    ref.chapter > range.start.chapter ||
    (ref.chapter === range.start.chapter && ref.verse >= range.start.verse);
  const beforeEnd =
    ref.chapter < range.end.chapter ||
    (ref.chapter === range.end.chapter && ref.verse <= range.end.verse);

  return afterStart && beforeEnd;
}
