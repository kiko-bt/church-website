// Per-book reading position for the in-site PDF reader, remembered in the
// reader's browser (localStorage).
//
// The position is a PAGE plus a RATIO: how far down that page (0 = its top,
// 1 = its bottom) the top of the reading view sits. A ratio is independent of
// zoom, screen width and orientation, so a place saved on a phone in portrait
// restores to the same spot in landscape or at another zoom level.
//
// Each position also records the PDF it belongs to (`file`, the Sanity asset
// hash). When the PDF of a book is replaced, the hash changes and the old
// position is ignored rather than jumping into a different edition; the next
// save overwrites it, so storage never accumulates stale keys.
//
// This module has ZERO dependencies and never touches `window` itself, so it is
// safe to import anywhere and testable under plain Node with a fake storage.

export type BookReadingPosition = {
  readonly file: string;
  readonly page: number;
  readonly ratio: number;
};

// The minimal slice of the Web Storage API used here (localStorage satisfies it).
export type PositionStorage = Pick<Storage, "getItem" | "setItem">;

const KEY_PREFIX = "books:reading-position:v1";

// One key per book (books and commentaries alike), by slug.
export function bookReadingPositionKey(slug: string): string {
  return `${KEY_PREFIX}:${slug}`;
}

const clampRatio = (ratio: number) => Math.min(1, Math.max(0, ratio));

// Returns null for anything that is not a well-formed position, so corrupt or
// hand-edited storage degrades to "no saved position" instead of an error.
export function parseBookReadingPosition(
  raw: string | null
): BookReadingPosition | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null;
    }
    const { file, page, ratio } = value as Record<string, unknown>;
    if (typeof file !== "string" || file.length === 0) return null;
    if (typeof page !== "number" || !Number.isInteger(page) || page < 1) {
      return null;
    }
    if (typeof ratio !== "number" || !Number.isFinite(ratio)) return null;
    if (ratio < 0 || ratio > 1) return null;
    return { file, page, ratio };
  } catch {
    return null;
  }
}

// The saved position for this exact PDF, or null — also when the stored
// position belongs to a different (replaced) PDF of the same book. The page is
// clamped to the document's page count.
export function loadBookReadingPosition(
  storage: PositionStorage,
  key: string,
  file: string,
  pageCount: number
): BookReadingPosition | null {
  let position: BookReadingPosition | null;
  try {
    position = parseBookReadingPosition(storage.getItem(key));
  } catch {
    return null; // storage disabled or blocked
  }
  if (!position || position.file !== file || pageCount < 1) return null;
  if (position.page <= pageCount) return position;
  return { file, page: pageCount, ratio: 1 };
}

// Storage can be unavailable or throw (private mode, quota, disabled cookies);
// a lost reading position is harmless, so errors are swallowed.
export function saveBookReadingPosition(
  storage: PositionStorage,
  key: string,
  position: BookReadingPosition
): void {
  try {
    storage.setItem(
      key,
      JSON.stringify({
        file: position.file,
        page: position.page,
        // 4 decimals: sub-pixel precision even on a very tall page.
        ratio: Math.round(clampRatio(position.ratio) * 10000) / 10000,
      })
    );
  } catch {
    // Ignore.
  }
}

// A page's vertical extent in the scroll container's content coordinates.
export type PageBox = {
  readonly top: number;
  readonly height: number;
};

// The page under `viewTop` (the scroll offset of the reading view) and how far
// down it the view starts. Pages are in document order, so a binary search
// needs only ~log2(pageCount) measurements (9 for a 260-page book) — cheap
// enough to run on every animation frame while scrolling. `boxOf(page)` takes
// a 1-based page number.
export function positionAt(
  viewTop: number,
  pageCount: number,
  boxOf: (page: number) => PageBox
): { readonly page: number; readonly ratio: number } | null {
  if (pageCount < 1) return null;
  // The last page whose top is at or above the view top.
  let low = 1;
  let high = pageCount;
  let page = 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (boxOf(mid).top <= viewTop) {
      page = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  const box = boxOf(page);
  const ratio = box.height > 0 ? clampRatio((viewTop - box.top) / box.height) : 0;
  return { page, ratio };
}

// The scroll offset that puts the view top back at `ratio` of the page.
export function scrollTopFor(ratio: number, box: PageBox): number {
  return box.top + clampRatio(ratio) * box.height;
}
