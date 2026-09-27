import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadReadingPosition,
  parseReadingPosition,
  readingPositionKey,
  saveReadingPosition,
  type PositionStorage,
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
