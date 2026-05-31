import { getTranslations } from "next-intl/server";
import { SectionContainer } from "@/components/ui/SectionContainer";

export async function ScriptureSection() {
  const t = await getTranslations("home.scripture");

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
            &ldquo;{t("verse")}&rdquo;
          </p>
          <footer className="mt-5">
            <cite className="not-italic text-sm font-medium text-text-primary/60">
              — {t("reference")}
            </cite>
          </footer>
        </blockquote>
      </SectionContainer>
    </section>
  );
}
