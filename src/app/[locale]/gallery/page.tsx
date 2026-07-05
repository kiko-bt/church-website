import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getGalleryAlbums } from "@/features/gallery";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { GalleryAlbumsGrid } from "@/components/gallery/GalleryAlbumsGrid";

type GalleryPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: GalleryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return generateBaseMetadata(locale, "/gallery", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");

  // Albums are sourced from Sanity (cached, tag-revalidated). Each album links
  // to its detail page. Empty list when Sanity is not configured.
  const albums = await getGalleryAlbums();

  return (
    <LayoutShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="pb-12">
        <GalleryAlbumsGrid albums={albums} locale={locale} />
      </div>
    </LayoutShell>
  );
}
