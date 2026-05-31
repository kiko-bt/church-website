import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";

type AboutPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("about");

  return (
    <LayoutShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
    </LayoutShell>
  );
}
