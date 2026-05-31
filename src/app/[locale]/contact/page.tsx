import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";

type ContactPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("title") };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("contact");

  return (
    <LayoutShell>
      <PageHeader title={t("title")} />
    </LayoutShell>
  );
}
