import { test } from "node:test";
import assert from "node:assert/strict";
import { localized } from "./localize.ts";

// Run with:  node --test --experimental-strip-types  (wired up as `npm test`).

test("returns Macedonian for the default locale", () => {
  assert.equal(localized("Здраво", "Hello", "mk"), "Здраво");
});

test("returns English when the English value is present", () => {
  assert.equal(localized("Здраво", "Hello", "en"), "Hello");
});

test("falls back to Macedonian when the English value is undefined", () => {
  assert.equal(localized("Здраво", undefined, "en"), "Здраво");
});

test("falls back to Macedonian when the English value is null", () => {
  assert.equal(localized("Здраво", null, "en"), "Здраво");
});

test("falls back to Macedonian when the English value is blank/whitespace", () => {
  assert.equal(localized("Здраво", "", "en"), "Здраво");
  assert.equal(localized("Здраво", "   ", "en"), "Здраво");
});

test("does NOT fall back for a missing English value on the mk locale", () => {
  // mk is the base; an undefined `_en` is irrelevant when mk is requested.
  assert.equal(localized("Здраво", undefined, "mk"), "Здраво");
});

test("falls back for an optional string field that is unset on both sides", () => {
  // e.g. an SEO meta title never entered in either language.
  assert.equal(localized(undefined, undefined, "en"), undefined);
});

// The fallback is scoped to strings: Portable Text arrays are passed through so
// the caller's own `?? []` / generic-copy fallback still governs them, rather
// than leaking Macedonian prose onto the English page.
test("passes an empty English array through unchanged", () => {
  const mk = [{ _type: "block" }];
  assert.deepEqual(localized(mk, [], "en"), []);
});

test("does NOT fall back an undefined English array to Macedonian", () => {
  const mk = [{ _type: "block" }];
  assert.equal(localized(mk, undefined, "en"), undefined);
});
