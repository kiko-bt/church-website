import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";

type BooksPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: BooksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "books" });
  return { title: t("title") };
}

export default async function BooksPage({ params }: BooksPageProps) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("books");

  return (
    <LayoutShell>
      <PageHeader title={t("title")} />
    </LayoutShell>
  );
}
