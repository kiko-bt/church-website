import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentSection } from "@/components/ui/ContentSection";

type PrivacyPageProps = {
  params: Promise<{ locale: Locale }>;
};

const SECTIONS = [
  "collect",
  "use",
  "cookies",
  "thirdParty",
  "rights",
  "contact",
] as const;

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return generateBaseMetadata(locale, "/privacy", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <LayoutShell>
      <PageHeader title={t("title")} />

      <div className="max-w-3xl pb-12">
        <p className="text-sm text-text-primary/70">
          {t("lastUpdatedLabel")}: {t("lastUpdatedDate")}
        </p>

        <p className="mt-6 text-base leading-relaxed text-text-primary/80">
          {t("intro")}
        </p>

        <div className="mt-12 space-y-12">
          {SECTIONS.map((section) => (
            <ContentSection
              key={section}
              heading={t(`sections.${section}.heading`)}
              headingId={`privacy-${section}`}
            >
              <p>{t(`sections.${section}.body`)}</p>
            </ContentSection>
          ))}
        </div>
      </div>
    </LayoutShell>
  );
}
