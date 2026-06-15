import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import type { GalleryImage } from "@/features/gallery";
import { getTranslations } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

type GalleryPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: GalleryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("gallery");

  // Future CMS integration point: replace with the result of `galleryListQuery`
  // (@/features/gallery) once Sanity is wired in. Empty for now — the grid
  // renders its empty state.
  const images: readonly GalleryImage[] = [];

  return (
    <LayoutShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="pb-12">
        <GalleryGrid images={images} />
      </div>
    </LayoutShell>
  );
}
