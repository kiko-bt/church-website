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

test("derives the PDF file id and the same-origin reader URL", () => {
  const hash = "30193d9acea49c510ec401baddb40f08f0a999fc";
  const book = mapBook({
    ...base,
    pdfUrl: `https://cdn.sanity.io/files/9nwz9xmi/production/${hash}.pdf`,
  });
  assert.equal(book.pdfFileId, hash);
  assert.equal(book.pdfReaderUrl, `/pdf/${hash}.pdf`);
  // The existing URLs are unchanged.
  assert.equal(book.pdfUrl, `https://cdn.sanity.io/files/9nwz9xmi/production/${hash}.pdf`);
});

test("no reader URL for a missing or non-Sanity PDF URL", () => {
  for (const pdfUrl of [
    null,
    "https://cdn.sanity.io/files/p/d/abc123.pdf",
    "https://example.com/files/p/d/30193d9acea49c510ec401baddb40f08f0a999fc.pdf",
    "https://cdn.sanity.io/files/p/d/30193d9acea49c510ec401baddb40f08f0a999fc.png",
    "https://cdn.sanity.io/files/p/d/30193d9acea49c510ec401baddb40f08f0a999fc.pdf?dl=x",
  ]) {
    const book = mapBook({ ...base, pdfUrl });
    assert.equal(book.pdfFileId, null, String(pdfUrl));
    assert.equal(book.pdfReaderUrl, null, String(pdfUrl));
  }
});
