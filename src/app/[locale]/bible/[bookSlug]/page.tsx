import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAllBooks, getBook } from "@/features/bible";

type BibleBookPageProps = {
  params: Promise<{ locale: Locale; bookSlug: string }>;
};

export async function generateStaticParams() {
  return getAllBooks().map((book) => ({ bookSlug: book.id }));
}

export async function generateMetadata({
  params,
}: BibleBookPageProps): Promise<Metadata> {
  const { bookSlug } = await params;
  const book = getBook(bookSlug);
  return { title: book?.name ?? bookSlug };
}

export default async function BibleBookPage({ params }: BibleBookPageProps) {
  const { locale, bookSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bible");
  const book = getBook(bookSlug);

  if (!book) {
    return (
      <LayoutShell>
        <p className="py-12 text-center text-text-primary/70">
          {t("notFound.book")}
        </p>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <PageHeader title={book.name} />

      <nav aria-label={t("aria.chapters")}>
        <ul className="flex flex-wrap gap-2">
          {book.chapters.map((chapter) => (
            <li key={chapter.number}>
              <Link
                href={`/${locale}/bible/${bookSlug}/${chapter.number}`}
                className={
                  "inline-flex h-10 w-10 items-center justify-center rounded-sm border border-soft-gold " +
                  "text-sm font-medium text-text-primary transition-colors " +
                  "hover:bg-accent-gold hover:text-white hover:border-accent-gold " +
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
                }
                aria-label={`${t("chapter")} ${chapter.number}`}
              >
                {chapter.number}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </LayoutShell>
  );
}
