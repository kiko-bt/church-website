import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";

type BookPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function BookPage({ params }: BookPageProps) {
  const { locale, slug } = await params;
  void locale;
  const t = await getTranslations("books");

  return (
    <LayoutShell>
      <article>
        <PageHeader title={t("title")} subtitle={slug} />
      </article>
    </LayoutShell>
  );
}
