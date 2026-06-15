import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import type { Book } from "@/features/books";

type BookCardProps = {
  book: Book;
  locale: Locale;
};

/**
 * Presentational card for a single book in the listing.
 *
 * Future CMS integration point: `book.coverImage` will be resolved through
 * the Sanity image URL builder once `src/lib/sanity/client.ts` is activated.
 * Until then (and as a fallback for books without a cover) a typographic
 * placeholder is shown.
 */
export async function BookCard({ book, locale }: BookCardProps) {
  const t = await getTranslations("books");

  return (
    <Link
      href={`/${locale}/books/${book.slug.current}`}
      className="group flex flex-col overflow-hidden rounded-md border border-soft-gold/40 bg-background transition-colors hover:border-accent-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
    >
      <div
        className="flex aspect-[3/4] items-center justify-center bg-warm-bg text-accent-gold/50"
        aria-hidden="true"
      >
        <BookOpen size={40} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-heading text-lg font-semibold text-deep-dark group-hover:text-accent-gold">
          {book.title}
        </h2>
        <p className="mt-1 text-sm text-text-primary/60">
          {t("by")}: {book.author}
        </p>
        {book.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-primary/75">
            {book.description}
          </p>
        )}
      </div>
    </Link>
  );
}
