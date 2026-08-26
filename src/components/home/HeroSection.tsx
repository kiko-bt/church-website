import Image from "next/image";
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

        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl ring-1 ring-soft-gold/20 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-7xl">
          <Image
            src="/images/branding/hero-cross-mountain.png"
            width={1536}
            height={406}
            priority
            sizes="(min-width: 1536px) 1400px, (min-width: 1400px) 1152px, (min-width: 1024px) 1024px, 100vw"
            alt="Hero image"
            className="h-auto w-full object-cover"
          />
        </div>
      </SectionContainer>
    </section>
  );
}
