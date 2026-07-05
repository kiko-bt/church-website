import type { Book, BookDocument } from "./books.types";

// Maps a raw Sanity book document to the clean domain model.
export function mapBook(doc: BookDocument): Book {
  return {
    id: doc._id,
    slug: doc.slug.current,
    title: doc.title,
    author: doc.author,
    description: doc.description,
    pdfUrl: doc.pdfUrl ?? null,
    coverImageUrl: doc.coverImage?.url ?? undefined,
    coverImageAlt: doc.coverImage?.alt,
    publishedAt: doc.publishedAt,
    featured: doc.featured ?? false,
  };
}

export function mapBooks(docs: readonly BookDocument[]): readonly Book[] {
  return docs.map(mapBook);
}
