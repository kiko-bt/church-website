// Per-chapter reading position, remembered in the reader's browser.
//
// The position is anchored to a VERSE rather than a raw pixel offset: `verse`
// is the first verse still visible at the top of the viewport and `offset` is
// how far (in px) the viewport top sits below that verse's top edge. A verse
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
