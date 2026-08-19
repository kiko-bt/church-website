import { getTranslations } from "next-intl/server";
import type { BibleVerse } from "@/features/bible";

type VerseListProps = {
  readonly verses: readonly BibleVerse[];
  readonly ariaLabel: string;
};

// Each verse carries a stable DOM id (`v1`, `v2`, …) so it can be deep-linked and
// shared via a URL fragment; scroll-margin keeps the anchored verse clear of the
// sticky header.
export async function VerseList({ verses, ariaLabel }: VerseListProps) {
  const t = await getTranslations("bible");

  return (
    <>
    <nav className="mb-4 flex flex-wrap gap-2" aria-label="Verse navigation">
  {verses.map((verse) => (
    <a
      key={verse.number}
      href={"#v" + verse.number}
      className="text-sm font-semibold text-accent-gold-strong hover:underline"
    >
      {verse.number}
    </a>
  ))}
</nav>
    <ol className="bible-text space-y-4" aria-label={ariaLabel}>
      {verses.map((verse) => (
        <li
          key={verse.number}
          id={`v${verse.number}`}
          className="flex gap-4 scroll-mt-24"
        >
          <span
            className="mt-1 shrink-0 text-xs font-semibold text-accent-gold-strong"
            aria-label={`${t("verse")} ${verse.number}`}
          >
            {verse.number}
          </span>
          <p className="leading-relaxed text-text-primary">{verse.text}</p>
        </li>
      ))}
    </ol>
    </>
  );
}
