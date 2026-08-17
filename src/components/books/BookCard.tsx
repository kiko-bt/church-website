import Image from "next/image";
import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import type { Book } from "@/features/books";

type BookCardProps = {
  book: Book;
  locale: Locale;
};

/**
 * Presentational card for a single book in the listing. `book` is a mapped
 * domain model from `getBooks()` (@/features/books).
 *
 * Books are downloadable resources, so the whole card acts as the download
 * trigger: clicking it saves the PDF directly (Sanity's `?dl=` attachment URL)
 * rather than navigating to an intermediate page. A book without a PDF renders
 * as a non-interactive card with a "coming soon" badge — never a broken link.
 *
 * The cover is a resolved Sanity CDN URL (dereferenced in GROQ), rendered with
 * next/image inside a fixed 3:4 box (no CLS). Books without a cover fall back
 * to a typographic placeholder.
 */
export async function BookCard({ book, locale }: BookCardProps) {
  const t = await getTranslations("books");

  // `publishedAt` is an optional ISO date string; format it for the active
  // locale, matching the sermon listing convention.
  const formattedDate = book.publishedAt
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(book.publishedAt))
    : null;

  // Shared visual body — identical whether or not the book is downloadable, so
  // the design stays consistent across both states.
  const content = (
    <>
<div className="relative mx-auto h-24 w-20 overflow-hidden rounded-md bg-warm-bg">
{book.coverImageUrl ? (
<Image
            src={book.coverImageUrl}
            alt={book.coverImageAlt ?? book.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-accent-gold/50"
            aria-hidden="true"
          >
            <BookOpen size={40} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-heading text-lg font-semibold text-deep-dark group-hover:text-accent-gold-strong">
          {book.title}
        </h2>
        <p className="mt-1 text-sm text-text-primary/70">
          {t("by")}: {book.author}
        </p>
        {formattedDate && (
          <p className="mt-1 text-xs text-text-primary/70">{formattedDate}</p>
        )}
        {!book.pdfDownloadUrl && (
          <p className="mt-3 inline-flex w-fit items-center rounded-sm bg-warm-bg px-2.5 py-1 text-xs font-medium text-text-primary/70">
            {t("comingSoon")}
          </p>
        )}
        {book.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-primary/75">
            {book.description}
          </p>
        )}
      </div>
    </>
  );

  // No PDF → non-interactive card (no navigation, no 404).
  if (!book.pdfUrl) {
    return (
      <div className="group flex flex-col overflow-hidden rounded-md border border-soft-gold/40 bg-background">
        {content}
      </div>
    );
  }

  // Whole card downloads the PDF. `download` + Sanity's `?dl=` force an
  // attachment; same-tab keeps the browser on the listing.
  return (
    <a
      href={book.pdfUrl}
      
      aria-label={`${t("downloadPdf")}: ${book.title}`}
      className="group flex flex-col overflow-hidden rounded-md border border-soft-gold/40 bg-background transition-colors hover:border-accent-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
    >
      {content}
    </a>
  );
}
