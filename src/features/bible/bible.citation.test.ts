import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCopyLabel,
  formatVerseCitation,
  verseReference,
} from "./bible.citation.ts";

test("formatCopyLabel fills the reference literally", () => {
  assert.equal(
    formatCopyLabel("Копирај го стихот {reference}", "Јован 11:35"),
    "Копирај го стихот Јован 11:35"
  );
  assert.equal(formatCopyLabel("Copy verse {reference}", "$& 1:1"), "Copy verse $& 1:1");
});

test("verseReference joins book, chapter and verse", () => {
  assert.equal(verseReference("Ефесјаните", 1, 21), "Ефесјаните 1:21");
  assert.equal(verseReference("1 John", 5, 4), "1 John 5:4");
});

test("formatVerseCitation puts the verse first and the reference last", () => {
  assert.equal(
    formatVerseCitation('"{text}" ({reference})', "Jesus wept.", "John 11:35"),
    '"Jesus wept." (John 11:35)'
  );
  assert.equal(
    formatVerseCitation("„{text}“ ({reference})", "Исус заплака.", "Јован 11:35"),
    "„Исус заплака.“ (Јован 11:35)"
  );
});

test("formatVerseCitation trims surrounding whitespace only", () => {
  assert.equal(
    formatVerseCitation("{text} ({reference})", "\n  a  b \t", "R 1:1"),
    "a  b (R 1:1)"
  );
});

test("formatVerseCitation copies replacement patterns in the text literally", () => {
  assert.equal(
    formatVerseCitation("{text} ({reference})", "$& $1 $$ {reference}", "R 1:1"),
    "$& $1 $$ {reference} (R 1:1)"
  );
});
