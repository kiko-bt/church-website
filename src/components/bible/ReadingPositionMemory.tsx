"use client";

import { useEffect } from "react";
import { verseAnchorId } from "@/features/bible/bible.reference";
import {
  createReadingTracker,
  lastReadKey,
  loadReadingPosition,
  readingAnchor,
  readingPositionKey,
  saveLastRead,
  saveReadingPosition,
  verseFromFragment,
  type ReadingLayout,
  type ReadingPosition,
} from "@/features/bible/bible.reading-position";

type ReadingPositionMemoryProps = {
  readonly locale: string;
  readonly bookId: string;
  readonly chapter: number;
  readonly verseCount: number;
};

// A place reached by scrolling counts once the reader has stayed on it this
// long, so brief stops while scrolling back up to the breadcrumb or the
// verse-number bar never replace it. Leaving the page saves at once.
const SAVE_DELAY_MS = 1000;

// The restored verse gets the same mark as a verse-number jump (`:target` in
// VerseList): the 3s `verse-highlight` animation from globals.css, or a static
// background under reduced motion. Applied by hand because a restored
// position has no URL fragment.
const HIGHLIGHT_MS = 3000;
const HIGHLIGHT_CLASSES = ["animate-verse-highlight", "motion-reduce:bg-soft-gold"];

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

function isVisible(element: HTMLElement, line: number): boolean {
  const box = element.getBoundingClientRect();
  return box.bottom > line && box.top < window.innerHeight;
}

// Remembers where the reader is in this chapter (localStorage, per locale +
// book + chapter) and restores it once when they come back. It also records
// this chapter as the locale's last-read chapter (see NavLink). Renders nothing;
// the chapter itself stays server-rendered.
//
// - The verse the reader SELECTS (verse-number bar, search result, or the
//   restored place) is the remembered verse until they scroll it out of view
//   (see createReadingTracker); otherwise the verse at the reading line is.
// - Restores only on arrival, and never over a verse fragment (#verse-5 from a
//   search result, the jump bar or a shared link) — the fragment wins.
// - The restored verse, and a #verse-n reached by client-side navigation (a
//   search result), are highlighted like a verse-number jump.
// - Positions above the text (breadcrumb, title, verse-number bar) are never
//   saved: that is navigating, not reading.
// - Measuring is throttled to one per animation frame; the write happens once
//   the reader has stayed put for SAVE_DELAY_MS, plus a final write on leave.
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

    // This chapter is now the one the "Bible" menu link returns to.
    saveLastRead(storage, lastReadKey(locale), { bookId, chapter });

    // The reading line is where a verse jump lands: the verses' scroll margin.
    const line = parseFloat(getComputedStyle(firstVerse).scrollMarginTop) || 0;
    const layout = (): ReadingLayout => ({
      verseCount,
      boxOf: (verse) => verseElement(verse)?.getBoundingClientRect() ?? null,
      line,
      viewportBottom: window.innerHeight,
    });
    const tracker = createReadingTracker();

    let highlighted: HTMLElement | null = null;
    let highlightTimer: ReturnType<typeof setTimeout> | undefined;
    const clearHighlight = () => {
      if (highlightTimer !== undefined) clearTimeout(highlightTimer);
      highlightTimer = undefined;
      highlighted?.classList.remove(...HIGHLIGHT_CLASSES);
      highlighted = null;
    };
    const highlight = (element: HTMLElement | null) => {
      if (!element) return;
      highlighted = element;
      element.classList.add(...HIGHLIGHT_CLASSES);
      highlightTimer = setTimeout(clearHighlight, HIGHLIGHT_MS);
    };

    const arrivedAt = verseFromFragment(window.location.hash);
    if (arrivedAt !== null) {
      tracker.select(arrivedAt);
      // A client-side navigation to #verse-n (a search result) does not update
      // `:target`, so mark the verse by hand; a full page load already has it.
      const element = arrivedAt <= verseCount ? verseElement(arrivedAt) : null;
      if (element && !element.matches(":target")) highlight(element);
    } else if (!window.location.hash) {
      const saved = loadReadingPosition(storage, key);
      const target =
        saved && saved.verse <= verseCount ? verseElement(saved.verse) : null;
      if (saved && target) {
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY + saved.offset,
          behavior: "instant",
        });
        // The remembered verse is the selected one again. (A position saved
        // before this rule existed may name a verse hidden under the header;
        // then the verse at the reading line is used instead.)
        if (isVisible(target, line)) {
          tracker.select(saved.verse);
          highlight(target);
        } else {
          const shown = readingAnchor(layout());
          highlight(shown ? verseElement(shown.verse) : null);
        }
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

    const measure = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // After a client-side navigation the next page may already be in the
        // DOM (with its own verse ids) — never measure it under this key.
        if (!firstVerse.isConnected) return;
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
        // null above the text: drop any pending write and keep the saved place.
        latest = tracker.measure(layout());
        if (latest) timer = setTimeout(persist, SAVE_DELAY_MS);
      });
    };

    // A click on a verse number selects that verse — also when the URL
    // fragment is already #verse-n, where no hashchange event follows.
    const onClick = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href^='#verse-']")
          : null;
      const verse = verseFromFragment(link?.getAttribute("href") ?? null);
      if (verse === null) return;
      tracker.select(verse);
      measure();
    };
    // Back/forward between fragments of this chapter.
    const onHashChange = () => {
      const verse = verseFromFragment(window.location.hash);
      if (verse === null) return;
      tracker.select(verse);
      measure();
    };

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("pagehide", persist);
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick, true);
    // Measure the arrival position too: Next.js scrolls to a #verse-n fragment
    // before this effect runs, so no scroll event would ever report it.
    measure();
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("pagehide", persist);
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick, true);
      cancelAnimationFrame(frame);
      clearHighlight();
      if (timer !== undefined) persist();
    };
  }, [locale, bookId, chapter, verseCount]);

  return null;
}
