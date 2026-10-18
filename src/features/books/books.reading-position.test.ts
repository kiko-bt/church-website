import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bookReadingPositionKey,
  loadBookReadingPosition,
  parseBookReadingPosition,
  positionAt,
  saveBookReadingPosition,
  scrollTopFor,
  type PageBox,
  type PositionStorage,
} from "./books.reading-position.ts";

const FILE_A = "30193d9acea49c510ec401baddb40f08f0a999fc";
const FILE_B = "109bd6587666332edcfb1a7f68f544d2e1a2d772";

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
  const key = bookReadingPositionKey("book-a");
  saveBookReadingPosition(storage, key, { file: FILE_A, page: 60, ratio: 0.42 });
  assert.deepEqual(loadBookReadingPosition(storage, key, FILE_A, 262), {
    file: FILE_A,
    page: 60,
    ratio: 0.42,
  });
});

test("books are remembered independently (A on 60, B on 120)", () => {
  const storage = memoryStorage();
  const keyA = bookReadingPositionKey("book-a");
  const keyB = bookReadingPositionKey("book-b");
  assert.notEqual(keyA, keyB);

  saveBookReadingPosition(storage, keyA, { file: FILE_A, page: 60, ratio: 0.1 });
  saveBookReadingPosition(storage, keyB, { file: FILE_B, page: 120, ratio: 0.5 });
  // Reading A again, then B again, never disturbs the other.
  saveBookReadingPosition(storage, keyA, { file: FILE_A, page: 60, ratio: 0.2 });

  assert.equal(loadBookReadingPosition(storage, keyA, FILE_A, 262)?.page, 60);
  assert.equal(loadBookReadingPosition(storage, keyB, FILE_B, 300)?.page, 120);
  assert.equal(loadBookReadingPosition(storage, keyA, FILE_A, 262)?.ratio, 0.2);
});

test("a replaced PDF ignores the old position; the next save takes over", () => {
  const storage = memoryStorage();
  const key = bookReadingPositionKey("book-a");
  saveBookReadingPosition(storage, key, { file: FILE_A, page: 60, ratio: 0.3 });

  // The preacher uploads a new PDF: the asset hash changes.
  assert.equal(loadBookReadingPosition(storage, key, FILE_B, 262), null);

  saveBookReadingPosition(storage, key, { file: FILE_B, page: 2, ratio: 0 });
  assert.equal(storage.data.size, 1); // same key overwritten, nothing piles up
  assert.equal(loadBookReadingPosition(storage, key, FILE_B, 262)?.page, 2);
  assert.equal(loadBookReadingPosition(storage, key, FILE_A, 262), null);
});

test("a page beyond the document is clamped to its last page", () => {
  const storage = memoryStorage();
  const key = bookReadingPositionKey("book-a");
  saveBookReadingPosition(storage, key, { file: FILE_A, page: 300, ratio: 0.5 });
  assert.deepEqual(loadBookReadingPosition(storage, key, FILE_A, 262), {
    file: FILE_A,
    page: 262,
    ratio: 1,
  });
  assert.equal(loadBookReadingPosition(storage, key, FILE_A, 0), null);
});

test("corrupt or hand-edited values are ignored", () => {
  const bad = [
    "",
    "not json",
    "null",
    "42",
    '"text"',
    "[1,2]",
    "{}",
    `{"file":"","page":1,"ratio":0}`,
    `{"file":7,"page":1,"ratio":0}`,
    `{"file":"${FILE_A}","page":0,"ratio":0}`,
    `{"file":"${FILE_A}","page":-3,"ratio":0}`,
    `{"file":"${FILE_A}","page":1.5,"ratio":0}`,
    `{"file":"${FILE_A}","page":"60","ratio":0}`,
    `{"file":"${FILE_A}","page":1,"ratio":-0.1}`,
    `{"file":"${FILE_A}","page":1,"ratio":1.1}`,
    `{"file":"${FILE_A}","page":1,"ratio":"0.5"}`,
    `{"file":"${FILE_A}","page":1}`,
  ];
  for (const raw of bad) {
    assert.equal(parseBookReadingPosition(raw), null, raw);
  }
  assert.equal(parseBookReadingPosition(null), null);
});

test("storage that throws never breaks reading", () => {
  const throwing: PositionStorage = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  const key = bookReadingPositionKey("book-a");
  assert.equal(loadBookReadingPosition(throwing, key, FILE_A, 10), null);
  assert.doesNotThrow(() =>
    saveBookReadingPosition(throwing, key, { file: FILE_A, page: 1, ratio: 0 })
  );
});

test("saving clamps and rounds the ratio", () => {
  const storage = memoryStorage();
  const key = bookReadingPositionKey("book-a");
  saveBookReadingPosition(storage, key, { file: FILE_A, page: 3, ratio: 1.7 });
  assert.equal(loadBookReadingPosition(storage, key, FILE_A, 10)?.ratio, 1);
  saveBookReadingPosition(storage, key, { file: FILE_A, page: 3, ratio: 0.123456 });
  assert.equal(loadBookReadingPosition(storage, key, FILE_A, 10)?.ratio, 0.1235);
});

// Pages of equal height with a gap between them, at a given zoom.
function layout(pageHeight: number, gap: number) {
  return (page: number): PageBox => ({
    top: gap + (page - 1) * (pageHeight + gap),
    height: pageHeight,
  });
}

test("positionAt finds the page under the view top and the ratio within it", () => {
  const boxOf = layout(1000, 10);
  // Page 60 starts at 10 + 59 * 1010 = 59600.
  assert.deepEqual(positionAt(59600 + 250, 262, boxOf), { page: 60, ratio: 0.25 });
  assert.deepEqual(positionAt(0, 262, boxOf), { page: 1, ratio: 0 });
  assert.deepEqual(positionAt(5, 262, boxOf), { page: 1, ratio: 0 });
  // In the gap below a page: the bottom of that page.
  assert.deepEqual(positionAt(10 + 1000 + 5, 262, boxOf), { page: 1, ratio: 1 });
  // Past the end: the last page.
  assert.equal(positionAt(10_000_000, 262, boxOf)?.page, 262);
  assert.equal(positionAt(100, 0, boxOf), null);
});

test("a position restores to the same place at any zoom or screen width", () => {
  const phone = layout(520, 4);
  const desktop = layout(1300, 10);
  const saved = positionAt(scrollTopFor(0.6, phone(60)), 262, phone);
  assert.deepEqual(saved, { page: 60, ratio: 0.6 });
  const restoredTop = scrollTopFor(saved!.ratio, desktop(saved!.page));
  assert.deepEqual(positionAt(restoredTop, 262, desktop), { page: 60, ratio: 0.6 });
});

test("positionAt uses a logarithmic number of measurements", () => {
  let calls = 0;
  const boxOf = layout(1000, 10);
  positionAt(123_456, 262, (page) => {
    calls += 1;
    return boxOf(page);
  });
  assert.ok(calls <= 10, `measured ${calls} pages`);
});
