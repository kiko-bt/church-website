import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import type { Sermon } from "@/features/sermons";
import { getTranslations } from "next-intl/server";
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
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function SermonsPage({ params }: SermonsPageProps) {
  const { locale } = await params;
  const t = await getTranslations("sermons");

  // Future CMS integration point: replace with the result of `sermonListQuery`
  // (@/features/sermons) once Sanity is wired in. Empty for now — the list
  // renders its empty state.
  const sermons: readonly Sermon[] = [];

  return (
    <LayoutShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="pb-12">
        <SermonsList sermons={sermons} locale={locale} />
      </div>
    </LayoutShell>
  );
}
