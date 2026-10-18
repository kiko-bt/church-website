import type { SanitySlug } from "@/types/sanity";

// Raw projection from GROQ. The PDF and cover URLs are resolved in the query
// (`asset->url`), so the mapper only flattens and applies defaults.
export type BookDocument = {
  readonly _id: string;
  readonly title: string;
  readonly slug: SanitySlug;
  readonly author: string;
  readonly description?: string;
  readonly pdfUrl: string | null;
  readonly coverImage?: {
    readonly url: string | null;
    readonly alt: string;
  } | null;
  readonly publishedAt?: string;
  readonly featured?: boolean;
};

// Clean domain model consumed by the UI: ready-to-use URLs, flattened slug,
// `featured` always defined.
export type Book = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly author: string;
  readonly description?: string;
  // Plain asset URL, served inline — the browser displays it ("read online").
  readonly pdfUrl: string | null;
  // Same asset URL with Sanity's `?dl=` download flag, so clicking it saves the
  // file (Content-Disposition: attachment) instead of opening it inline. `null`
  // whenever `pdfUrl` is (a book with no PDF yet). See books.mappers.ts.
  readonly pdfDownloadUrl: string | null;
  // The PDF's Sanity asset hash — identifies this exact file, so a remembered
  // reading position is dropped when the PDF is replaced. `null` when the URL
  // is not a Sanity PDF asset URL.
  readonly pdfFileId: string | null;
  // Same-origin path of the PDF for the in-site reader (`/pdf/<hash>.pdf`,
  // proxied to the Sanity CDN by a rewrite in next.config.ts — the CDN refuses
  // cross-origin browser requests). `null` exactly when `pdfFileId` is; the
  // book page then links to `pdfUrl` directly, as before.
  readonly pdfReaderUrl: string | null;
  readonly coverImageUrl?: string;
  readonly coverImageAlt?: string;
  readonly publishedAt?: string;
  readonly featured: boolean;
};
