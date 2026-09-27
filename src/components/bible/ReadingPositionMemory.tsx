"use client";

import { useEffect } from "react";
import { verseAnchorId } from "@/features/bible/bible.reference";
import {
  loadReadingPosition,
  readingPositionKey,
  saveReadingPosition,
  type ReadingPosition,
} from "@/features/bible/bible.reading-position";

type ReadingPositionMemoryProps = {
  readonly locale: string;
  readonly bookId: string;
  readonly chapter: number;
  readonly verseCount: number;
};

const SAVE_DELAY_MS = 250;

function localStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // storage disabled or blocked
  }
}

function verseElement(verse: number): HTMLElement | null {
  return document.getElementById(verseAnchorId(verse));
}

// First verse whose bottom edge is still below the viewport top (binary search
// — verses are in document order), plus how far the viewport has scrolled past
// that verse's top edge.
function currentPosition(verseCount: number): ReadingPosition | null {
  let low = 1;
  let high = verseCount;
  let found = verseCount;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const element = verseElement(mid);
    if (!element) return null;
    if (element.getBoundingClientRect().bottom > 0) {
      found = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  const element = verseElement(found);
  if (!element) return null;
  return { verse: found, offset: -element.getBoundingClientRect().top };
}

// Remembers where the reader is in this chapter (localStorage, per locale +
// book + chapter) and restores it once when they come back. Renders nothing;
// the chapter itself stays server-rendered.
//
// - Restores only on arrival, and never over a verse fragment (#verse-5 from a
//   search result, the jump bar or a shared link) — the fragment wins.
// - Saving is throttled to one measurement per animation frame and one write
//   per SAVE_DELAY_MS after scrolling settles, plus a final write on leave.
export function ReadingPositionMemory({
  locale,
  bookId,
  chapter,
  verseCount,
}: ReadingPositionMemoryProps) {
  useEffect(() => {
    const storage = localStore();
    const firstVerse = verseElement(1);
    if (!storage || !firstVerse) return;
    const key = readingPositionKey(locale, bookId, chapter);

    if (!window.location.hash) {
      const saved = loadReadingPosition(storage, key);
      const target =
        saved && saved.verse <= verseCount ? verseElement(saved.verse) : null;
      if (saved && target) {
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY + saved.offset,
          behavior: "instant",
        });
      }
    }

    let latest: ReadingPosition | null = null;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const persist = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      if (latest) saveReadingPosition(storage, key, latest);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // After a client-side navigation the next page may already be in the
        // DOM (with its own verse ids) — never measure it under this key.
        if (!firstVerse.isConnected) return;
        latest = currentPosition(verseCount);
        if (timer !== undefined) clearTimeout(timer);
        timer = setTimeout(persist, SAVE_DELAY_MS);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
      cancelAnimationFrame(frame);
      if (timer !== undefined) persist();
    };
  }, [locale, bookId, chapter, verseCount]);

  return null;
}
