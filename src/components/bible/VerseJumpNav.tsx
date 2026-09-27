import { getTranslations } from "next-intl/server";
import { verseAnchorId } from "@/features/bible/bible.reference";

type VerseJumpNavProps = {
  readonly verses: readonly number[];
};

// Quick-jump bar: one link per verse of the current chapter, derived from the
// chapter data. Plain same-page fragment links — no client JavaScript on the
// reading path. The browser scrolls (smoothly, unless reduced motion is set)
// and the target verse is highlighted via `:target` in VerseList.
export async function VerseJumpNav({ verses }: VerseJumpNavProps) {
  const t = await getTranslations("bible");

  return (
    <nav aria-label={t("aria.verseNav")} className="mt-6">
      <ol className="flex flex-wrap gap-1.5">
        {verses.map((verse) => (
          <li key={verse}>
            <a
              href={`#${verseAnchorId(verse)}`}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-soft-gold px-2 text-sm font-medium tabular-nums text-text-primary transition-colors hover:border-accent-gold hover:bg-accent-gold hover:text-accent-gold-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
            >
              {verse}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
