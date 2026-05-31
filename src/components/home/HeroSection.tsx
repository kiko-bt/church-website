import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { Button } from "@/components/ui/Button";
import { SectionContainer } from "@/components/ui/SectionContainer";

type HeroSectionProps = {
  locale: Locale;
};

export async function HeroSection({ locale }: HeroSectionProps) {
  const t = await getTranslations("home.hero");

  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-warm-bg py-20 sm:py-28 lg:py-32"
    >
      <SectionContainer className="text-center">
        <h1
          id="hero-heading"
          className="font-heading text-4xl font-bold leading-tight text-deep-dark sm:text-5xl lg:text-6xl"
        >
          {t("title")}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-primary/80 sm:text-xl">
          {t("subtitle")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button href={`/${locale}/bible`} variant="primary" size="lg">
            {t("ctaPrimary")}
          </Button>
          <Button href={`/${locale}/contact`} variant="outline" size="lg">
            {t("ctaSecondary")}
          </Button>
        </div>
      </SectionContainer>
    </section>
  );
}
