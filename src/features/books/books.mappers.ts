import type { Book, BookDocument } from "./books.types";

// A Sanity file asset URL: https://cdn.sanity.io/files/<project>/<dataset>/<sha1>.pdf
const SANITY_PDF_URL = /^https:\/\/cdn\.sanity\.io\/files\/[^/]+\/[^/]+\/([a-f0-9]{40})\.pdf$/;

// The asset hash of a Sanity PDF URL, or null for anything else.
export function pdfFileIdFromUrl(pdfUrl: string | null): string | null {
  return pdfUrl?.match(SANITY_PDF_URL)?.[1] ?? null;
}

// Maps a raw Sanity book document to the clean domain model.
export function mapBook(doc: BookDocument): Book {
  const slug = doc.slug.current;
  const pdfUrl = doc.pdfUrl ?? null;
  const pdfFileId = pdfFileIdFromUrl(pdfUrl);
  return {
    id: doc._id,
    slug,
    title: doc.title,
    author: doc.author,
    description: doc.description,
    pdfUrl,
    // `?dl=<name>` makes Sanity serve the asset as an attachment (forces a
    // download with a clean, slug-based filename). Used only by the explicit
    // "Download PDF" button; reading online uses the plain `pdfUrl`.
    pdfDownloadUrl: pdfUrl ? `${pdfUrl}?dl=${slug}.pdf` : null,
    pdfFileId,
    pdfReaderUrl: pdfFileId ? `/pdf/${pdfFileId}.pdf` : null,
    coverImageUrl: doc.coverImage?.url ?? undefined,
    coverImageAlt: doc.coverImage?.alt,
    publishedAt: doc.publishedAt,
    featured: doc.featured ?? false,
  };
}

export function mapBooks(docs: readonly BookDocument[]): readonly Book[] {
  return docs.map(mapBook);
}
