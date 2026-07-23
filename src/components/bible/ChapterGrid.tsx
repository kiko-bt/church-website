import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";

type ChapterGridProps = {
  readonly locale: Locale;
  readonly bookId: string;
  readonly chapterCount: number;
};

// `chapterCount` comes from the manifest (the per-book file is validated to match
// it), so the grid always reflects the canonical chapter count.
export async function ChapterGrid({ locale, bookId, chapterCount }: ChapterGridProps) {
  const t = await getTranslations("bible");
  const chapters = Array.from({ length: chapterCount }, (_unused, index) => index + 1);

  return (
    <nav aria-label={t("aria.chapters")}>
      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {chapters.map((chapterNumber) => (
          <li key={chapterNumber}>
            <Link
              href={`/${locale}/bible/${bookId}/${chapterNumber}`}
              aria-label={`${t("chapter")} ${chapterNumber}`}
              className="flex h-10 w-full items-center justify-center rounded-sm border border-soft-gold text-sm font-medium text-text-primary transition-colors hover:border-accent-gold hover:bg-accent-gold hover:text-accent-gold-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
            >
              {chapterNumber}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
