import { getTranslations } from "next-intl/server";
import type { BibleVerse } from "@/features/bible";

type VerseListProps = {
  readonly verses: readonly BibleVerse[];
  readonly ariaLabel: string;
};

// The reading view: an ordered list of verses. Each verse has a stable DOM id
// (`v1`, `v2`, …) so it can be deep-linked / shared via a URL fragment, with
// scroll-margin so the anchored verse is not hidden under the sticky header.
export async function VerseList({ verses, ariaLabel }: VerseListProps) {
  const t = await getTranslations("bible");

  return (
    <ol className="bible-text space-y-4" aria-label={ariaLabel}>
      {verses.map((verse) => (
        <li
          key={verse.number}
          id={`v${verse.number}`}
          className="flex gap-4 scroll-mt-24"
        >
          <span
            className="mt-1 shrink-0 text-xs font-semibold text-accent-gold"
            aria-label={`${t("verse")} ${verse.number}`}
          >
            {verse.number}
          </span>
          <p className="leading-relaxed text-text-primary">{verse.text}</p>
        </li>
      ))}
    </ol>
  );
}
