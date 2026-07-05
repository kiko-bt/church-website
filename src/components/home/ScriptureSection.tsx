import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { getHomeContent } from "@/features/home-content";
import { SectionContainer } from "@/components/ui/SectionContainer";

type ScriptureSectionProps = {
  locale: Locale;
};

// Verse text and reference are CMS-driven (HomeContent.mainVerseText /
// mainVerseReference, locale-resolved by the mapper). Each falls back to the
// home.scripture.* messages when Sanity is not configured, so the section
// always renders. The section label stays a UI string (chrome, not content).
export async function ScriptureSection({ locale }: ScriptureSectionProps) {
  const t = await getTranslations("home.scripture");
  const content = await getHomeContent(locale);
  const verse = content?.mainVerseText ?? t("verse");
  const reference = content?.mainVerseReference ?? t("reference");

  return (
    <section
      aria-label={t("label")}
      className="border-y border-soft-gold/30 bg-background py-16 sm:py-20"
    >
      <SectionContainer className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-gold">
          {t("label")}
        </p>

        <blockquote className="mt-6">
          <p className="font-heading text-2xl font-medium italic leading-relaxed text-deep-dark sm:text-3xl">
            &ldquo;{verse}&rdquo;
          </p>
          <footer className="mt-5">
            <cite className="not-italic text-sm font-medium text-text-primary/60">
              — {reference}
            </cite>
          </footer>
        </blockquote>
      </SectionContainer>
    </section>
  );
}
