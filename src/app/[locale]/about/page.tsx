import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Heart, Users, BookMarked, Check } from "lucide-react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentSection } from "@/components/ui/ContentSection";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Button } from "@/components/ui/Button";

type AboutPageProps = {
  params: Promise<{ locale: Locale }>;
};

const VALUES = [
  { key: "love", icon: Heart },
  { key: "community", icon: Users },
  { key: "word", icon: BookMarked },
] as const;

const BELIEFS = ["item1", "item2", "item3", "item4"] as const;

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <LayoutShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="space-y-16 pb-12">
        <ContentSection heading={t("intro.heading")} headingId="about-intro">
          <p>{t("intro.body")}</p>
          <p>{t("intro.body2")}</p>
        </ContentSection>

        <ContentSection heading={t("mission.heading")} headingId="about-mission">
          <p>{t("mission.body")}</p>
        </ContentSection>

        <section aria-labelledby="about-values">
          <h2
            id="about-values"
            className="font-heading text-2xl font-semibold text-deep-dark sm:text-3xl"
          >
            {t("values.heading")}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ key, icon }) => (
              <FeatureCard
                key={key}
                icon={icon}
                title={t(`values.${key}.title`)}
                body={t(`values.${key}.body`)}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="about-beliefs" className="max-w-3xl">
          <h2
            id="about-beliefs"
            className="font-heading text-2xl font-semibold text-deep-dark sm:text-3xl"
          >
            {t("beliefs.heading")}
          </h2>
          <ul className="mt-6 space-y-3">
            {BELIEFS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-soft-gold/40 text-accent-gold"
                  aria-hidden="true"
                >
                  <Check size={13} />
                </span>
                <span className="text-base leading-relaxed text-text-primary/80">
                  {t(`beliefs.${item}`)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <ContentSection heading={t("visit.heading")} headingId="about-visit">
          <p>{t("visit.body")}</p>
          <div className="pt-2">
            <Button href={`/${locale}/contact`} variant="primary" size="md">
              {t("visit.cta")}
            </Button>
          </div>
        </ContentSection>
      </div>
    </LayoutShell>
  );
}
