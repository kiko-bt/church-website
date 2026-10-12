// Per-chapter reading position, remembered in the reader's browser.
//
// The position is anchored to a VERSE rather than a raw pixel offset: `verse`
// is the reader's verse (see `createReadingTracker`) and `offset` is how
// far (in px) the viewport top sits below that verse's top edge. A verse
// anchor survives font loading, window resizes and theme changes far better
// than `scrollY` alone.
//
// This module has ZERO dependencies and never touches `window` itself, so it is
// safe to import anywhere and testable under plain Node with a fake storage.

export type ReadingPosition = {
  readonly verse: number;
  readonly offset: number;
};

// The minimal slice of the Web Storage API used here (localStorage satisfies it).
export type PositionStorage = Pick<Storage, "getItem" | "setItem">;

const KEY_PREFIX = "bible:reading-position:v1";

// One key per locale + book + chapter. Each locale is its own translation, so
// `locale` also identifies the translation. `bookId` is the canonical slug.
export function readingPositionKey(
  locale: string,
  bookId: string,
  chapter: number
): string {
  return `${KEY_PREFIX}:${locale}:${bookId}:${chapter}`;
}

// Returns null for anything that is not a well-formed position, so corrupt or
// hand-edited storage degrades to "no saved position" instead of an error.
export function parseReadingPosition(raw: string | null): ReadingPosition | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { verse, offset } = value as Record<string, unknown>;
    if (typeof verse !== "number" || !Number.isInteger(verse) || verse < 1) {
      return null;
    }
    if (typeof offset !== "number" || !Number.isFinite(offset)) return null;
    return { verse, offset };
  } catch {
    return null;
  }
}

// Storage can be unavailable or throw (private mode, quota, disabled cookies);
// both helpers swallow that so reading never breaks.
export function loadReadingPosition(
  storage: PositionStorage,
  key: string
): ReadingPosition | null {
  try {
    return parseReadingPosition(storage.getItem(key));
  } catch {
    return null;
  }
}

export function saveReadingPosition(
  storage: PositionStorage,
  key: string,
  position: ReadingPosition
): void {
  try {
    storage.setItem(
      key,
      JSON.stringify({ verse: position.verse, offset: Math.round(position.offset) })
    );
  } catch {
    // Ignore — a lost reading position is harmless.
  }
}

// A verse's vertical extent in viewport coordinates (getBoundingClientRect).
export type VerseBox = {
  readonly top: number;
  readonly bottom: number;
};

// The live layout of one chapter, as the reading tracker needs it.
export type ReadingLayout = {
  readonly verseCount: number;
  // Box of verse n (1-based), or null if it is not in the document.
  readonly boxOf: (verse: number) => VerseBox | null;
  // Viewport y of the reading line: where a verse jump (#verse-n) places the
  // verse, i.e. just below the sticky header (the verses' scroll-margin-top).
  readonly line: number;
  // Viewport height.
  readonly viewportBottom: number;
};

// The verse at the reading line, plus the offset that reproduces the exact
// scroll position (viewport top relative to that verse's top edge).
//
// - The reading verse is the first verse still extending below the reading
//   line, so it is never one hidden behind the sticky header.
// - Returns null while the reader is ABOVE the text (breadcrumb, title or
//   verse-number bar in view): that is navigating, not reading, so it must not
//   overwrite the remembered place.
export function readingAnchor({
  verseCount,
  boxOf,
  line,
}: ReadingLayout): ReadingPosition | null {
  if (verseCount < 1) return null;
  const first = boxOf(1);
  if (!first || first.top > line + 1) return null;

  // Binary search — verses are in document order.
  let low = 1;
  let high = verseCount;
  let found = verseCount;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const box = boxOf(mid);
    if (!box) return null;
    if (box.bottom > line) {
      found = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  const box = boxOf(found);
  return box ? { verse: found, offset: -box.top } : null;
}

// Verse number in a `#verse-n` fragment or href, or null for anything else.
export function verseFromFragment(fragment: string | null): number | null {
  const match = /^#verse-([1-9][0-9]*)$/.exec(fragment ?? "");
  return match ? Number(match[1]) : null;
}

export type ReadingTracker = {
  // The reader explicitly chose this verse (verse-number bar, search result,
  // or the remembered place being restored); null clears the choice.
  select(verse: number | null): void;
  // The place to remember for the current layout, or null for "keep the
  // previously remembered place".
  measure(layout: ReadingLayout): ReadingPosition | null;
};

// Tracks the reader's place in one chapter.
//
// A SELECTED verse is the place for as long as it is on screen — even where
// the page cannot scroll it up to the reading line (the last verses of a
// chapter) — and while the page is still scrolling towards it. Only once the
// reader scrolls it out of view does the place follow the reading line again.
// So the verse selected last is the verse that comes back; it is never
// re-guessed from the scroll position.
export function createReadingTracker(): ReadingTracker {
  let selected: number | null = null;
  let seen = false;

  return {
    select(verse) {
      selected =
        verse !== null && Number.isInteger(verse) && verse >= 1 ? verse : null;
      seen = false;
    },

    measure(layout) {
      if (selected !== null && selected <= layout.verseCount) {
        const box = layout.boxOf(selected);
        if (box && box.bottom > layout.line && box.top < layout.viewportBottom) {
          seen = true;
          return { verse: selected, offset: -box.top };
        }
        // Still on the way to it: remember it as placed on the reading line.
        if (!seen) return { verse: selected, offset: -layout.line };
      }
      // Scrolled away from the selected verse (or none): follow the reading line.
      selected = null;
      return readingAnchor(layout);
    },
  };
}

// ---------------------------------------------------------------------------
// Last-read chapter, remembered per locale, so the "Bible" menu link can take
// the reader back to the chapter they were reading (the per-chapter position
// above then restores the verse).
// ---------------------------------------------------------------------------

export type LastRead = {
  readonly bookId: string;
  readonly chapter: number;
};

const LAST_READ_PREFIX = "bible:last-read:v1";

// Canonical book slugs are lowercase, hyphen-separated (`genesis`, `1-john`).
const BOOK_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function lastReadKey(locale: string): string {
  return `${LAST_READ_PREFIX}:${locale}`;
}

// Returns null for anything that is not a well-formed value, so corrupt or
// hand-edited storage degrades to "nothing remembered" instead of an error.
export function parseLastRead(raw: string | null): LastRead | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { bookId, chapter } = value as Record<string, unknown>;
    if (typeof bookId !== "string" || !BOOK_ID_PATTERN.test(bookId)) return null;
    if (typeof chapter !== "number" || !Number.isInteger(chapter) || chapter < 1) {
      return null;
    }
    return { bookId, chapter };
  } catch {
    return null;
  }
}

// `isKnownBook` rejects a stored slug that is not in the canon, so a stale or
// tampered value never produces a link to a missing page.
export function loadLastRead(
  storage: PositionStorage,
  key: string,
  isKnownBook: (bookId: string) => boolean
): LastRead | null {
  try {
    const lastRead = parseLastRead(storage.getItem(key));
    return lastRead && isKnownBook(lastRead.bookId) ? lastRead : null;
  } catch {
    return null;
  }
}

export function saveLastRead(
  storage: PositionStorage,
  key: string,
  lastRead: LastRead
): void {
  try {
    storage.setItem(
      key,
      JSON.stringify({ bookId: lastRead.bookId, chapter: lastRead.chapter })
    );
  } catch {
    // Ignore — a lost last-read chapter is harmless.
  }
}

export function lastReadHref(locale: string, lastRead: LastRead): string {
  return `/${locale}/bible/${lastRead.bookId}/${lastRead.chapter}`;
}
