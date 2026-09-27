import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  // Fixed arrows that stay reachable while reading. Below 2xl they float in the
  // bottom corners (the text column is too wide for side placement); at 2xl
  // the page margin is wide enough to centre them vertically beside the text.
  // z-30 keeps them under the mobile menu overlay (z-40) and header (z-50).
  const linkClass =
    "fixed bottom-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-soft-gold bg-background/95 text-text-primary shadow-sm transition-colors hover:border-accent-gold hover:bg-accent-gold hover:text-accent-gold-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold 2xl:bottom-auto 2xl:top-1/2 2xl:-translate-y-1/2";

  // The nav box itself only reserves space after the last verse, so it can be
  // scrolled clear of the bottom-corner arrows.
  return (
    <nav aria-label={t("aria.chapterNav")} className="h-16 2xl:h-0">
      {previous && (
        <Link
          href={`/${locale}/bible/${previous.bookId}/${previous.chapter}`}
          className={`${linkClass} left-4`}
          rel="prev"
          aria-label={t("prevChapter")}
          title={t("prevChapter")}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}

      {next && (
        <Link
          href={`/${locale}/bible/${next.bookId}/${next.chapter}`}
          className={`${linkClass} right-4`}
          rel="next"
          aria-label={t("nextChapter")}
          title={t("nextChapter")}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
