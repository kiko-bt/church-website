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

// Run with:  node --test --experimental-strip-types  (wired up as `npm test`).
//
// These tests LOCK the approved book display names and order. They are the
// last line of defense that keeps a re-migration or a stray edit from reverting
// the names the content owner signed off on. If you are intentionally changing
// a name, edit bible.display-names.ts (and only there), run `npm run bible:build`,
// and these tests will confirm the whole dataset is consistent again.

const DATA_DIR = join(process.cwd(), "src", "data", "bible");
const canonIds = BIBLE_CANON.map((book) => book.id);

test("registry covers exactly the canon in every locale", () => {
  assert.deepEqual(assertDisplayNamesComplete(locales, canonIds), []);
});

test("getDisplayName returns the locked name and throws on unknown ids", () => {
  assert.equal(getDisplayName("mk", "matthew"), "Матеј");
  assert.equal(getDisplayName("en", "genesis"), "The First Book of Moses — Genesis");
  assert.throws(() => getDisplayName("mk", "not-a-book"));
});

// The names the content owner approved. Kept as an explicit literal (not derived
// from the registry) so an accidental edit to the registry is caught here too —
// both must change together and match production.
const EXPECTED_MK: Record<string, string> = {
  genesis: "1 Мојсеева — Битие",
  exodus: "2 Мојсеева — Излез",
  leviticus: "3 Мојсеева — Левит",
  numbers: "4 Мојсеева — Броеви",
  deuteronomy: "5 Мојсеева — Второзаконие",
  "1-samuel": "1 Самоил",
  "2-samuel": "2 Самоил",
  "1-kings": "1 Цареви",
  "2-kings": "2 Цареви",
  "1-chronicles": "1 Летописи",
  "2-chronicles": "2 Летописи",
  lamentations: "Плачот на Еремија",
  daniel: "Даниел",
  matthew: "Матеј",
  romans: "Римјаните",
  "1-thessalonians": "1 Солунјаните",
  "2-thessalonians": "2 Солунјаните",
  revelation: "Откровение",
};

test("registry matches the approved Macedonian names (spot check)", () => {
  for (const [id, name] of Object.entries(EXPECTED_MK)) {
    assert.equal(BIBLE_DISPLAY_NAMES.mk[id], name, `mk/${id}`);
  }
});

test("every book file on disk matches the locked name", () => {
  for (const locale of locales) {
    for (const id of canonIds) {
      const path = join(DATA_DIR, locale, `${id}.json`);
      const book = JSON.parse(readFileSync(path, "utf8")) as { name: string };
      assert.equal(
        book.name,
        BIBLE_DISPLAY_NAMES[locale][id],
        `${locale}/${id}.json name must equal the locked registry name`
      );
    }
  }
});

test("manifest preserves the locked canonical order", () => {
  const manifest = JSON.parse(
    readFileSync(join(DATA_DIR, "manifest.json"), "utf8")
  ) as { books: { id: string; order: number }[] };
  assert.deepEqual(
    manifest.books.map((b) => b.id),
    canonIds,
    "manifest book order must equal BIBLE_CANON order"
  );
});
