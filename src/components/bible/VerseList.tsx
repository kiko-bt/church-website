import { getTranslations } from "next-intl/server";
import type { BibleVerse } from "@/features/bible";
import { verseReference } from "@/features/bible/bible.citation";
import {
  legacyVerseAnchorId,
  verseAnchorId,
} from "@/features/bible/bible.reference";
import { cn } from "@/lib/utils/cn";
import {
  VERSE_COPY_BUTTON_CLASSES,
  VerseCopyLabel,
} from "@/components/bible/VerseCopyLabel";

type VerseListProps = {
  readonly verses: readonly BibleVerse[];
  readonly bookName: string;
  readonly chapter: number;
  readonly ariaLabel: string;
};

// Each verse carries a stable DOM id (`verse-1`, `verse-2`, …) so it can be
// deep-linked and shared via a URL fragment; scroll-margin keeps the anchored
// verse clear of the sticky header. An empty inner anchor keeps the previous
// `v1`, `v2`, … ids working for links shared before the rename.
//
// The targeted verse (from the jump bar, a search result or a shared link) is
// highlighted with CSS `:target`: a soft-gold flash that fades out, or a
// static background under reduced motion. Client-side navigations do not set
// `:target`; ReadingPositionMemory applies the same classes in that case and
// when it restores a remembered reading position.
//
// Verse sharing: the verse number is a button. VerseSelection (a client
// island) marks its verse `data-selected`, which reveals the reference after
// the text and a Copy button, and selects text + reference. Everything here is
// server-rendered; the copy template is sent once, on the list.
export async function VerseList({
  verses,
  bookName,
  chapter,
  ariaLabel,
}: VerseListProps) {
  const t = await getTranslations("bible");

  return (
    <>
      <ol
        className="bible-text space-y-4"
        aria-label={ariaLabel}
        data-verse-citation={String(t.raw("verseCopy.citation"))}
      >
        {verses.map((verse) => {
          const reference = verseReference(bookName, chapter, verse.number);
          return (
            <li
              key={verse.number}
              id={verseAnchorId(verse.number)}
              className="group/verse flex gap-4 scroll-mt-24 rounded-sm target:animate-verse-highlight has-[:target]:animate-verse-highlight motion-reduce:target:bg-soft-gold motion-reduce:has-[:target]:bg-soft-gold data-[selected]:bg-soft-gold/40"
            >
              <button
                type="button"
                data-verse-select={verse.number}
                aria-pressed="false"
                aria-label={t("verseCopy.select", { number: verse.number })}
                className="mt-1 shrink-0 self-start rounded-sm text-xs font-semibold text-accent-gold-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
              >
                <span id={legacyVerseAnchorId(verse.number)} className="scroll-mt-24" />
                {verse.number}
              </button>
              <div className="min-w-0">
                <p className="leading-relaxed text-text-primary" data-verse-content>
                  <span data-verse-text>{verse.text}</span>
                  <span
                    data-verse-reference={reference}
                    className="hidden group-data-[selected]/verse:inline"
                  >
                    {` (${reference})`}
                  </span>
                </p>
                <button
                  type="button"
                  data-verse-copy
                  aria-label={t("verseCopy.copyLabel", { reference })}
                  className={cn(
                    VERSE_COPY_BUTTON_CLASSES,
                    "mt-2 hidden group-data-[selected]/verse:inline-flex"
                  )}
                >
                  <VerseCopyLabel
                    copy={t("verseCopy.copy")}
                    copied={t("verseCopy.copied")}
                    failed={t("verseCopy.failed")}
                  />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {/* Copy outcome, announced by VerseSelection. */}
      <p role="status" className="sr-only" data-verse-copy-status />
    </>
  );
}
