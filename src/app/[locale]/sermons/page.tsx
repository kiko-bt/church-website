import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getSermons } from "@/features/sermons";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { SermonsList } from "@/components/sermons/SermonsList";

type SermonsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: SermonsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sermons" });
  return generateBaseMetadata(locale, "/sermons", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function SermonsPage({ params }: SermonsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sermons");

  // Sourced from Sanity via the sermons data accessor (cached, tag-revalidated).
  // Falls back to an empty list (empty state) when Sanity is not configured.
  const sermons = await getSermons();

  return (
    <LayoutShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="pb-12">
        <SermonsList sermons={sermons} locale={locale} />
      </div>
    </LayoutShell>
  );
}
