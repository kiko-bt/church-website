import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { getAllBookMeta } from "@/features/bible";

type ChapterNavProps = {
  readonly locale: Locale;
  readonly bookId: string;
  readonly chapter: number;
};

type ChapterTarget = {
  readonly bookId: string;
  readonly chapter: number;
};

// Previous/next chapter navigation, computed from the manifest (no verse text
// is loaded). Navigation flows ACROSS book boundaries: the chapter after a
// book's last chapter is chapter 1 of the next book, and vice versa. The very
// first chapter (Genesis 1) has no previous; the very last (Revelation 22) has
// no next — those edges render only the available direction.
export async function ChapterNav({ locale, bookId, chapter }: ChapterNavProps) {
  const t = await getTranslations("bible");
  const books = getAllBookMeta();
  const index = books.findIndex((book) => book.id === bookId);
  if (index === -1) return null;

  const chapterCount = books[index].chapters.length;

  const previous: ChapterTarget | null =
    chapter > 1
      ? { bookId, chapter: chapter - 1 }
      : index > 0
        ? { bookId: books[index - 1].id, chapter: books[index - 1].chapters.length }
        : null;

  const next: ChapterTarget | null =
    chapter < chapterCount
      ? { bookId, chapter: chapter + 1 }
      : index < books.length - 1
        ? { bookId: books[index + 1].id, chapter: 1 }
        : null;

  const linkClass =
    "inline-flex items-center gap-1 rounded-sm border border-soft-gold px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent-gold hover:bg-accent-gold hover:text-accent-gold-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold";

  return (
    <nav
      aria-label={t("aria.chapterNav")}
      className="mt-12 flex items-center justify-between gap-4 border-t border-soft-gold/40 pt-6"
    >
      {previous ? (
        <Link href={`/${locale}/bible/${previous.bookId}/${previous.chapter}`} className={linkClass} rel="prev">
          <span aria-hidden="true">‹</span>
          {t("prevChapter")}
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link href={`/${locale}/bible/${next.bookId}/${next.chapter}`} className={linkClass} rel="next">
          {t("nextChapter")}
          <span aria-hidden="true">›</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
