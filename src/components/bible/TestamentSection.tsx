import Link from "next/link";
import type { Locale } from "@/constants/locales";

export type BookLink = {
  readonly id: string;
  readonly name: string;
};

type TestamentSectionProps = {
  readonly locale: Locale;
  readonly title: string;
  readonly books: readonly BookLink[];
};

// One testament block on the Bible landing page: a heading plus a responsive
// grid of book links. Books are rendered in the order given (canonical order).
export function TestamentSection({ locale, title, books }: TestamentSectionProps) {
  return (
    <section className="mt-10 first:mt-4">
      <h2 className="font-heading text-xl font-semibold text-deep-dark">{title}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => (
          <li key={book.id}>
            <Link
              href={`/${locale}/bible/${book.id}`}
              className="block rounded-sm border border-soft-gold/60 px-3 py-2 text-sm text-text-primary transition-colors hover:border-accent-gold hover:bg-accent-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
            >
              {book.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
