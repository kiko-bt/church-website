import { getTranslations } from "next-intl/server";
import type { BibleVerse } from "@/features/bible";
import {
  legacyVerseAnchorId,
  verseAnchorId,
} from "@/features/bible/bible.reference";

type VerseListProps = {
  readonly verses: readonly BibleVerse[];
  readonly ariaLabel: string;
};

// Each verse carries a stable DOM id (`verse-1`, `verse-2`, …) so it can be
// deep-linked and shared via a URL fragment; scroll-margin keeps the anchored
// verse clear of the sticky header. An empty inner anchor keeps the previous
// `v1`, `v2`, … ids working for links shared before the rename.
//
// The targeted verse (from the jump bar, a search result or a shared link) is
// highlighted with CSS `:target` only: a soft-gold flash that fades out, or a
// static background under reduced motion.
export async function VerseList({ verses, ariaLabel }: VerseListProps) {
  const t = await getTranslations("bible");

  return (
    <ol className="bible-text space-y-4" aria-label={ariaLabel}>
      {verses.map((verse) => (
        <li
          key={verse.number}
          id={verseAnchorId(verse.number)}
          className="flex gap-4 scroll-mt-24 rounded-sm target:animate-verse-highlight has-[:target]:animate-verse-highlight motion-reduce:target:bg-soft-gold motion-reduce:has-[:target]:bg-soft-gold"
        >
          <span
            className="mt-1 shrink-0 text-xs font-semibold text-accent-gold-strong"
            aria-label={`${t("verse")} ${verse.number}`}
          >
            <span id={legacyVerseAnchorId(verse.number)} className="scroll-mt-24" />
            {verse.number}
          </span>
          <p className="leading-relaxed text-text-primary">{verse.text}</p>
        </li>
      ))}
    </ol>
  );
}
