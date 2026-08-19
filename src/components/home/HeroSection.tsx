import Image from "next/image";
import Link from "next/link";
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
      className="bg-warm-bg py-20 sm:py-28 lg:py-16"
    >
      <SectionContainer className="text-left">
        <h1
          id="hero-heading"
          className="font-heading text-4xl font-bold leading-tight text-deep-dark sm:text-5xl lg:text-5xl"
        >
          {t("title")}
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-text-primary/80 sm:text-xl">
          {t("subtitle")}
        </p>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:justify-start">
          <Button href={`/${locale}/bible`} variant="primary" size="lg">
            {t("ctaPrimary")}
          </Button>
          <Button href={`/${locale}/contact`} variant="outline" size="lg">
            {t("ctaSecondary")}
          </Button>
        </div>

        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl ring-1 ring-soft-gold/20">
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
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
  <Link
    href={"/" + locale + "/bible"}
    className="rounded-2xl border bg-amber-100 p-6 text-center !text-black shadow-sm flex min-h-32 flex-col items-center justify-center"
  >
    <h2 className="text-4xl font-bold !text-black">
      {locale === "mk" ? "Библија" : "Bible"}
    </h2>
    <p className="mt-3 text-2xl font-semibold !text-black">
      {locale === "mk" ? "Читај го Божјиот Збор" : "Read God's Word"}
    </p>
  </Link>

  <Link
    href={"/" + locale + "/sermons"}
    className="rounded-2xl border bg-amber-100 p-6 text-center !text-black shadow-sm flex min-h-32 flex-col items-center justify-center"
  >
    <h2 className="text-xl font-bold">
      {locale === "mk" ? "Проповеди" : "Sermons"}
    </h2>
    <p className="mt-2">
      {locale === "mk" ? "Библиски пораки" : "Bible messages"}
    </p>
  </Link>

  <Link
    href={"/" + locale + "/books"}
    className="rounded-2xl border bg-amber-100 p-6 text-center !text-black shadow-sm flex min-h-32 flex-col items-center justify-center"
  >
    <h2 className="text-xl font-bold">
      {locale === "mk" ? "Книги" : "Books"}
    </h2>
    <p className="mt-2">
      {locale === "mk" ? "Бесплатни христијански книги" : "Free Christian books"}
    </p>
  </Link>
</div>
      </SectionContainer>
    </section>
  );
}
