import type { Book, BookDocument } from "./books.types";

// Maps a raw Sanity book document to the clean domain model.
export function mapBook(doc: BookDocument): Book {
  const slug = doc.slug.current;
  const pdfUrl = doc.pdfUrl ?? null;
  return {
    id: doc._id,
    slug,
    title: doc.title,
    author: doc.author,
    description: doc.description,
    pdfUrl,
    // `?dl=<name>` makes Sanity serve the asset as an attachment (forces a
    // download with a clean, slug-based filename) — the preferred "click →
    // download" flow. Reused by the card and the detail-page button.
    pdfDownloadUrl: pdfUrl ? `${pdfUrl}?dl=${slug}.pdf` : null,
    coverImageUrl: doc.coverImage?.url ?? undefined,
    coverImageAlt: doc.coverImage?.alt,
    publishedAt: doc.publishedAt,
    featured: doc.featured ?? false,
  };
}

export function mapBooks(docs: readonly BookDocument[]): readonly Book[] {
  return docs.map(mapBook);
}
