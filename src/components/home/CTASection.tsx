import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { Button } from "@/components/ui/Button";
import { SectionContainer } from "@/components/ui/SectionContainer";

type CTASectionProps = {
  locale: Locale;
};

// Future CMS integration point: title/body will come from
// HomeContent.shortMessage(_en) (@/features/home-content).
// Until Sanity is wired in, content is sourced from home.cta.* messages.
export async function CTASection({ locale }: CTASectionProps) {
  const t = await getTranslations("home.cta");

  return (
    <section
      aria-labelledby="cta-heading"
      className="bg-deep-dark py-16 sm:py-20"
    >
      <SectionContainer className="text-center">
        <h2
          id="cta-heading"
          className="font-heading text-3xl font-bold text-background sm:text-4xl"
        >
          {t("title")}
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lg text-background/70">
          {t("body")}
        </p>

        <div className="mt-10">
          <Button href={`/${locale}/contact`} variant="primary" size="lg">
            {t("button")}
          </Button>
        </div>
      </SectionContainer>
    </section>
  );
}
