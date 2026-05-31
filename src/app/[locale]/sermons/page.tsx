import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";

type SermonsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: SermonsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sermons" });
  return { title: t("title") };
}

export default async function SermonsPage({ params }: SermonsPageProps) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("sermons");

  return (
    <LayoutShell>
      <PageHeader title={t("title")} />
    </LayoutShell>
  );
}
