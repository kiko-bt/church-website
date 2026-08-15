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

        <div className="mx-auto mt-14 max-w-2xl overflow-hidden rounded-2xl ring-1 ring-soft-gold/20 lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          <Image
            src="/images/branding/hero-cross-mountain.png"
            width={1536}
            height={406}
            priority
            // `priority` alone only makes the image eager and emits the preload
            // link — Next passes `fetchPriority` through verbatim, so the high
            // hint must be explicit. This is the homepage LCP element; without
            // it Lighthouse reports "fetchpriority=high should be applied to the
            // image preload request" (lcp-discovery).
            fetchPriority="high"
            sizes="(min-width: 1536px) 1152px, (min-width: 1280px) 1024px, (min-width: 1024px) 896px, 100vw"
            alt=""
            className="h-auto w-full object-cover"
          />
        </div>
      </SectionContainer>
    </section>
  );
}
