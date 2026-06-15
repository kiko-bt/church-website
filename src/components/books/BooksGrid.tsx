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
 * Responsive grid of books with a built-in empty state.
 *
 * Future CMS integration point: the page will pass the result of
 * `bookListQuery` (@/features/books) here. Until Sanity is wired in, an
 * empty array is passed and the empty state is shown.
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
        <li key={book._id}>
          <BookCard book={book} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
