import { test } from "node:test";
import assert from "node:assert/strict";
import { mkSlugify, isValidSlug, SLUG_PATTERN } from "./slug.ts";

// Run with:  node --test --experimental-strip-types  (wired up as `npm test`).
// Guards the Cyrillic→ASCII transliteration that keeps dynamic routes off the
// non-ASCII 404 path.

test("transliterates the real church slugs to ASCII", () => {
  assert.equal(mkSlugify("десетте-божји-ветувања"), "desette-bozhji-vetuvanja");
  assert.equal(
    mkSlugify("основата-на-христијанството"),
    "osnovata-na-hristijanstvoto"
  );
});

test("normalizes spaces, colons and uppercase (the malformed sermon slug)", () => {
  assert.equal(
    mkSlugify("Второ Послание до Тимотеј: Глава 4"),
    "vtoro-poslanie-do-timotej-glava-4"
  );
});

test("leaves an already-valid Latin slug unchanged", () => {
  assert.equal(mkSlugify("evangelska-crkva-bitola"), "evangelska-crkva-bitola");
});

test("collapses punctuation runs and trims edge hyphens", () => {
  assert.equal(mkSlugify("  Hello,  World!  "), "hello-world");
  assert.equal(mkSlugify("--a__b--"), "a-b");
});

test("every produced slug matches SLUG_PATTERN", () => {
  for (const title of [
    "Второ Послание до Тимотеј: Глава 4",
    "десетте-божји-ветувања",
    "ПРОПОВЕДАЈ ГО БОЖЈИОТ ЗБОР",
  ]) {
    assert.match(mkSlugify(title), SLUG_PATTERN);
  }
});

test("isValidSlug accepts ASCII slugs and rejects non-ASCII/space/colon", () => {
  assert.equal(isValidSlug({ current: "desette-bozhji-vetuvanja" }), true);
  assert.notEqual(isValidSlug({ current: "Второ Послание" }), true);
  assert.notEqual(isValidSlug({ current: "has space" }), true);
  assert.notEqual(isValidSlug({ current: "Trailing-" }), true);
  assert.notEqual(isValidSlug({ current: "UPPER" }), true);
  // Presence is handled by `.required()`, so empty/undefined pass here.
  assert.equal(isValidSlug(undefined), true);
  assert.equal(isValidSlug({ current: "" }), true);
});
