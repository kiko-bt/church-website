import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import type { Book } from "@/features/books";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookCard } from "./BookCard";

type BooksGridProps = {
  books: readonly Book[];
  locale: Locale;
};

/**
 * Responsive grid of books with a built-in empty state. The page passes the
 * result of `getBooks()` (@/features/books); an empty list renders the empty
 * state (also the fallback when Sanity is not configured).
 */
export async function BooksGrid({ books, locale }: BooksGridProps) {
  const t = await getTranslations("books");

  if (books.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <li key={book.id}>
          <BookCard book={book} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
