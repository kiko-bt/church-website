import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createReadingTracker,
  lastReadHref,
  lastReadKey,
  loadLastRead,
  loadReadingPosition,
  parseLastRead,
  parseReadingPosition,
  readingAnchor,
  readingPositionKey,
  saveLastRead,
  saveReadingPosition,
  verseFromFragment,
  type PositionStorage,
  type ReadingLayout,
} from "./bible.reading-position.ts";

function memoryStorage(): PositionStorage & { readonly data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

test("a saved position reads back unchanged", () => {
  const storage = memoryStorage();
  const key = readingPositionKey("mk", "genesis", 1);
  saveReadingPosition(storage, key, { verse: 12, offset: 37 });
  assert.deepEqual(loadReadingPosition(storage, key), { verse: 12, offset: 37 });
});

test("chapters, books and locales are remembered independently", () => {
  const storage = memoryStorage();
  const keys = [
    readingPositionKey("mk", "genesis", 1),
    readingPositionKey("mk", "genesis", 2),
    readingPositionKey("mk", "exodus", 1),
    readingPositionKey("en", "genesis", 1),
  ];
  assert.equal(new Set(keys).size, keys.length, "keys must be distinct");

  keys.forEach((key, index) =>
    saveReadingPosition(storage, key, { verse: index + 1, offset: index * 10 })
  );
  keys.forEach((key, index) =>
    assert.deepEqual(loadReadingPosition(storage, key), {
      verse: index + 1,
      offset: index * 10,
    })
  );
});

test("a chapter with nothing saved has no position", () => {
  assert.equal(
    loadReadingPosition(memoryStorage(), readingPositionKey("en", "john", 3)),
    null
  );
});

test("the offset is stored as whole pixels", () => {
  const storage = memoryStorage();
  const key = readingPositionKey("en", "john", 3);
  saveReadingPosition(storage, key, { verse: 16, offset: -12.6 });
  assert.deepEqual(loadReadingPosition(storage, key), { verse: 16, offset: -13 });
});

test("invalid stored data is ignored, not thrown", () => {
  for (const raw of [
    "not json",
    "null",
    "42",
    "[]",
    '{"verse":0,"offset":0}',
    '{"verse":1.5,"offset":0}',
    '{"verse":"3","offset":0}',
    '{"verse":3}',
    '{"verse":3,"offset":"x"}',
  ]) {
    assert.equal(parseReadingPosition(raw), null, raw);
  }
});

test("unavailable storage never throws", () => {
  const broken: PositionStorage = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  const key = readingPositionKey("mk", "psalms", 119);
  assert.doesNotThrow(() => saveReadingPosition(broken, key, { verse: 1, offset: 0 }));
  assert.equal(loadReadingPosition(broken, key), null);
});

// --- Last-read chapter -----------------------------------------------------

const knownBook = (bookId: string) =>
  ["genesis", "john", "2-peter", "1-john"].includes(bookId);

test("the last-read chapter reads back unchanged", () => {
  const storage = memoryStorage();
  const key = lastReadKey("mk");
  saveLastRead(storage, key, { bookId: "2-peter", chapter: 3 });
  assert.deepEqual(loadLastRead(storage, key, knownBook), {
    bookId: "2-peter",
    chapter: 3,
  });
});

test("opening another chapter replaces the last-read chapter", () => {
  const storage = memoryStorage();
  const key = lastReadKey("mk");
  saveLastRead(storage, key, { bookId: "2-peter", chapter: 3 });
  saveLastRead(storage, key, { bookId: "john", chapter: 1 });
  assert.deepEqual(loadLastRead(storage, key, knownBook), {
    bookId: "john",
    chapter: 1,
  });
});

test("locales remember their last-read chapter independently", () => {
  const storage = memoryStorage();
  assert.notEqual(lastReadKey("mk"), lastReadKey("en"));
  saveLastRead(storage, lastReadKey("mk"), { bookId: "genesis", chapter: 2 });
  saveLastRead(storage, lastReadKey("en"), { bookId: "1-john", chapter: 4 });
  assert.deepEqual(loadLastRead(storage, lastReadKey("mk"), knownBook), {
    bookId: "genesis",
    chapter: 2,
  });
  assert.deepEqual(loadLastRead(storage, lastReadKey("en"), knownBook), {
    bookId: "1-john",
    chapter: 4,
  });
});

test("last-read keys never collide with reading-position keys", () => {
  assert.ok(!readingPositionKey("mk", "john", 1).startsWith(lastReadKey("mk")));
});

test("nothing remembered means no last-read chapter", () => {
  assert.equal(loadLastRead(memoryStorage(), lastReadKey("en"), knownBook), null);
});

test("invalid last-read data is ignored, not thrown", () => {
  for (const raw of [
    "not json",
    "null",
    "42",
    "[]",
    '{"bookId":"john"}',
    '{"chapter":3}',
    '{"bookId":"john","chapter":0}',
    '{"bookId":"john","chapter":-1}',
    '{"bookId":"john","chapter":1.5}',
    '{"bookId":"john","chapter":"3"}',
    '{"bookId":"","chapter":1}',
    '{"bookId":"John","chapter":1}',
    '{"bookId":"../contact","chapter":1}',
    '{"bookId":"john/1","chapter":1}',
    '{"bookId":"-john","chapter":1}',
  ]) {
    assert.equal(parseLastRead(raw), null, raw);
  }
});

test("a book outside the canon is rejected", () => {
  const storage = memoryStorage();
  const key = lastReadKey("mk");
  saveLastRead(storage, key, { bookId: "tobit", chapter: 1 });
  assert.equal(loadLastRead(storage, key, knownBook), null);
});

test("unavailable storage never throws for the last-read chapter", () => {
  const broken: PositionStorage = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  const key = lastReadKey("mk");
  assert.doesNotThrow(() => saveLastRead(broken, key, { bookId: "john", chapter: 1 }));
  assert.equal(loadLastRead(broken, key, knownBook), null);
});

test("the last-read link points at the chapter page", () => {
  assert.equal(
    lastReadHref("mk", { bookId: "2-peter", chapter: 3 }),
    "/mk/bible/2-peter/3"
  );
  assert.equal(
    lastReadHref("en", { bookId: "1-john", chapter: 5 }),
    "/en/bible/1-john/5"
  );
});


// --- Reading place -----------------------------------------------------------

// A fake chapter laid out like VerseList: 40 verses, 40px tall with a 16px gap,
// verse 1 starting 400px down the page, 200px of page after the last verse and
// a 640px viewport. The page can scroll at most MAX_SCROLL px.
const VERSES = 40;
const TEXT_TOP = 400;
const STEP = 56;
const VIEWPORT = 640;
const LINE = 96;
const MAX_SCROLL = TEXT_TOP + VERSES * STEP + 200 - VIEWPORT;

const verseTopOnPage = (verse: number) => TEXT_TOP + (verse - 1) * STEP;

function layoutAt(scrollY: number): ReadingLayout {
  return {
    verseCount: VERSES,
    boxOf: (verse) => {
      if (verse < 1 || verse > VERSES) return null;
      const top = verseTopOnPage(verse) - scrollY;
      return { top, bottom: top + 40 };
    },
    line: LINE,
    viewportBottom: VIEWPORT,
  };
}

// Where the browser scrolls for #verse-n: the verse on the reading line, or as
// far as the page goes for the last verses of the chapter.
const jumpTo = (verse: number) =>
  Math.min(verseTopOnPage(verse) - LINE, MAX_SCROLL);

// Where a saved position scrolls back to (clamped like the browser does).
const restoreTo = (position: { verse: number; offset: number }) =>
  Math.min(verseTopOnPage(position.verse) + position.offset, MAX_SCROLL);

test("the verse on the reading line is the reading place", () => {
  assert.deepEqual(readingAnchor(layoutAt(jumpTo(10))), { verse: 10, offset: -LINE });
  // Once verse 10 has moved above the line, the next verse takes over.
  assert.equal(readingAnchor(layoutAt(jumpTo(10) + 45))?.verse, 11);
});

test("the saved offset reproduces the exact scroll position", () => {
  const scrollY = jumpTo(7) + 23;
  const position = readingAnchor(layoutAt(scrollY));
  assert.ok(position);
  assert.equal(restoreTo(position), scrollY);
});

test("the breadcrumb and verse-number area is not a reading place", () => {
  assert.equal(readingAnchor(layoutAt(0)), null);
  assert.equal(readingAnchor(layoutAt(200)), null);
});

test("verse fragments are parsed strictly", () => {
  assert.equal(verseFromFragment("#verse-32"), 32);
  for (const value of [null, "", "#verse-0", "#verse-03", "#verse-x", "#v32", "verse-32", "#verse-32a"]) {
    assert.equal(verseFromFragment(value), null, String(value));
  }
});

test("a selected verse near the chapter end stays the place", () => {
  // Verse 38 cannot reach the reading line; an earlier verse sits on it.
  assert.ok(jumpTo(38) === MAX_SCROLL);
  assert.equal(readingAnchor(layoutAt(jumpTo(38)))?.verse, 35);

  const tracker = createReadingTracker();
  tracker.select(38);
  assert.equal(tracker.measure(layoutAt(jumpTo(38)))?.verse, 38);
});

test("a selected verse is kept while the page is still scrolling to it", () => {
  const tracker = createReadingTracker();
  tracker.select(32);
  // Start of the smooth scroll: verse 32 is not on screen yet.
  assert.deepEqual(tracker.measure(layoutAt(0)), { verse: 32, offset: -LINE });
  assert.deepEqual(tracker.measure(layoutAt(900)), { verse: 32, offset: -LINE });
  assert.deepEqual(tracker.measure(layoutAt(jumpTo(32))), { verse: 32, offset: -LINE });
});

test("scrolling the selected verse out of view follows the reading line again", () => {
  const tracker = createReadingTracker();
  tracker.select(10);
  assert.equal(tracker.measure(layoutAt(jumpTo(10)))?.verse, 10);
  // Read on: verse 10 scrolls above the reading line.
  assert.equal(tracker.measure(layoutAt(jumpTo(15)))?.verse, 15);
  // And it does not come back when scrolling up past it later.
  assert.equal(tracker.measure(layoutAt(jumpTo(10) + 20))?.verse, 10);
  assert.equal(tracker.measure(layoutAt(jumpTo(12)))?.verse, 12);
});

test("reported sequence: 38, leave, return, 32, leave, return gives 32 — and back to 38", () => {
  const storage = memoryStorage();
  const key = readingPositionKey("mk", "john", 18);

  // Visit 1: select 38, leave.
  let tracker = createReadingTracker();
  tracker.select(38);
  let place = tracker.measure(layoutAt(jumpTo(38)));
  assert.ok(place);
  saveReadingPosition(storage, key, place);

  // Visit 2: restored — 38 must stay 38 (it used to be re-measured as 35).
  let saved = loadReadingPosition(storage, key);
  assert.ok(saved);
  assert.equal(saved.verse, 38);
  tracker = createReadingTracker();
  tracker.select(saved.verse);
  place = tracker.measure(layoutAt(restoreTo(saved)));
  assert.equal(place?.verse, 38);
  saveReadingPosition(storage, key, place!);
  // Scroll up to the verse numbers: keeps 38.
  assert.equal(tracker.measure(layoutAt(0)), null);
  // Select 32, leave.
  tracker.select(32);
  place = tracker.measure(layoutAt(jumpTo(32)));
  assert.equal(place?.verse, 32);
  saveReadingPosition(storage, key, place!);

  // Visit 3: restored to 32.
  saved = loadReadingPosition(storage, key);
  assert.equal(saved?.verse, 32);
  tracker = createReadingTracker();
  tracker.select(saved!.verse);
  assert.equal(tracker.measure(layoutAt(restoreTo(saved!)))?.verse, 32);
  // Vice versa: select 38 again, leave, return → 38.
  assert.equal(tracker.measure(layoutAt(0)), null);
  tracker.select(38);
  place = tracker.measure(layoutAt(jumpTo(38)));
  saveReadingPosition(storage, key, place!);
  saved = loadReadingPosition(storage, key);
  tracker = createReadingTracker();
  tracker.select(saved!.verse);
  assert.equal(tracker.measure(layoutAt(restoreTo(saved!)))?.verse, 38);
});

test("invalid selections are ignored", () => {
  for (const verse of [0, -1, 1.5, 99]) {
    const tracker = createReadingTracker();
    tracker.select(verse);
    assert.equal(tracker.measure(layoutAt(jumpTo(10)))?.verse, 10, String(verse));
  }
});
