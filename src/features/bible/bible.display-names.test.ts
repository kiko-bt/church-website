import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BIBLE_DISPLAY_NAMES,
  getDisplayName,
  assertDisplayNamesComplete,
} from "./bible.display-names.ts";
import { BIBLE_CANON } from "./bible.constants.ts";
import { locales } from "../../constants/locales.ts";

// Locks the book ORDER and guards the display-name registry.
//
// Names are deliberately NOT duplicated here: bible.display-names.ts is their
// single definition, so renaming a book stays a one-line edit. What is locked
// is the order (which must never change) and the properties a name must hold.
// That a rename reached the derived search index is checked by the validator
// (validateSearchIndex), which runs on every build.

const DATA_DIR = join(process.cwd(), "src", "data", "bible");

// The canonical 66-book order. Written out literally so a reordering of
// BIBLE_CANON fails here instead of silently reshuffling the landing page.
const CANONICAL_ORDER = [
  "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua",
  "judges", "ruth", "1-samuel", "2-samuel", "1-kings", "2-kings",
  "1-chronicles", "2-chronicles", "ezra", "nehemiah", "esther", "job",
  "psalms", "proverbs", "ecclesiastes", "song-of-solomon", "isaiah",
  "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos",
  "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai",
  "zechariah", "malachi",
  "matthew", "mark", "luke", "john", "acts", "romans", "1-corinthians",
  "2-corinthians", "galatians", "ephesians", "philippians", "colossians",
  "1-thessalonians", "2-thessalonians", "1-timothy", "2-timothy", "titus",
  "philemon", "hebrews", "james", "1-peter", "2-peter", "1-john", "2-john",
  "3-john", "jude", "revelation",
];

test("BIBLE_CANON holds the 66 books in the locked order", () => {
  assert.deepEqual(BIBLE_CANON.map((book) => book.id), CANONICAL_ORDER);
  // `order` must be contiguous 1..66 and the OT/NT split must fall at book 40.
  BIBLE_CANON.forEach((book, index) => {
    assert.equal(book.order, index + 1, `${book.id} order`);
    assert.equal(book.testament, index < 39 ? "OT" : "NT", `${book.id} testament`);
  });
});

test("the manifest preserves the locked canonical order", () => {
  const manifest = JSON.parse(
    readFileSync(join(DATA_DIR, "manifest.json"), "utf8")
  ) as { books: { id: string }[] };
  assert.deepEqual(manifest.books.map((book) => book.id), CANONICAL_ORDER);
});

test("the registry covers exactly the canon in every locale", () => {
  assert.deepEqual(
    assertDisplayNamesComplete(locales, BIBLE_CANON.map((book) => book.id)),
    []
  );
});

test("getDisplayName resolves a name and throws on an unknown id", () => {
  assert.equal(getDisplayName("mk", "matthew"), BIBLE_DISPLAY_NAMES.mk.matthew);
  assert.throws(() => getDisplayName("mk", "not-a-book"));
});

// A Macedonian name typed with a Latin look-alike letter (e.g. "Рутa" with a
// Latin "a") renders correctly but silently breaks search-by-book-name. The
// delivered verse text had exactly this defect, so guard the names too.
test("names use one script only — no Latin/Cyrillic look-alikes", () => {
  const LATIN_LETTER = /\p{Script=Latin}/u;
  const CYRILLIC_LETTER = /\p{Script=Cyrillic}/u;
  for (const [id, name] of Object.entries(BIBLE_DISPLAY_NAMES.mk)) {
    assert.ok(name.trim().length > 0, `mk/${id} is blank`);
    assert.ok(!LATIN_LETTER.test(name), `mk/${id} contains a Latin letter: ${name}`);
  }
  for (const [id, name] of Object.entries(BIBLE_DISPLAY_NAMES.en)) {
    assert.ok(name.trim().length > 0, `en/${id} is blank`);
    assert.ok(!CYRILLIC_LETTER.test(name), `en/${id} contains a Cyrillic letter: ${name}`);
  }
});

test("book files carry no display name of their own", () => {
  for (const locale of locales) {
    for (const id of CANONICAL_ORDER) {
      const book = JSON.parse(
        readFileSync(join(DATA_DIR, locale, `${id}.json`), "utf8")
      ) as Record<string, unknown>;
      assert.ok(
        !("name" in book),
        `${locale}/${id}.json must not define a name — names live in bible.display-names.ts`
      );
    }
  }
});
