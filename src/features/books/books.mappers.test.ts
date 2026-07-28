import { test } from "node:test";
import assert from "node:assert/strict";
import { mapBook } from "./books.mappers.ts";
import type { BookDocument } from "./books.types.ts";

// Run with:  node --test  (wired up as `npm test`).

const base: BookDocument = {
  _id: "book-1",
  title: "The Pilgrim's Progress",
  slug: { current: "pilgrims-progress" },
  author: "John Bunyan",
  pdfUrl: "https://cdn.sanity.io/files/p/d/abc123.pdf",
};

test("derives a forced-download URL with a slug-based filename", () => {
  const book = mapBook(base);
  assert.equal(book.pdfUrl, "https://cdn.sanity.io/files/p/d/abc123.pdf");
  assert.equal(
    book.pdfDownloadUrl,
    "https://cdn.sanity.io/files/p/d/abc123.pdf?dl=pilgrims-progress.pdf"
  );
});

test("leaves download URL null when the book has no PDF", () => {
  const book = mapBook({ ...base, pdfUrl: null });
  assert.equal(book.pdfUrl, null);
  assert.equal(book.pdfDownloadUrl, null);
});

test("flattens the slug and defaults featured to false", () => {
  const book = mapBook(base);
  assert.equal(book.slug, "pilgrims-progress");
  assert.equal(book.featured, false);
});
