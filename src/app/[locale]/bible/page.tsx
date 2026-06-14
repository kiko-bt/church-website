import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";

type BiblePageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: BiblePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bible" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function BiblePage({ params }: BiblePageProps) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("bible");

  return (
    <LayoutShell>
      <PageHeader title={t("title")} />
      <section className="mt-4">
        <h2 className="font-heading text-xl font-semibold text-deep-dark">
          {t("oldTestament")}
        </h2>
      </section>
      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold text-deep-dark">
          {t("newTestament")}
        </h2>
      </section>
    </LayoutShell>
  );
}
