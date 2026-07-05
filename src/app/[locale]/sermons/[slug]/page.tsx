import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Headphones, Video } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { getSermons, getSermonBySlug } from "@/features/sermons";
import { generateBaseMetadata, toMetaDescription } from "@/lib/seo/metadata";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/Button";

type SermonPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

// Prerender every sermon at build time (per locale, via the parent segment).
// Empty when Sanity is not configured — new sermons are then generated
// on-demand and cached (ISR), so publishing never requires a redeploy.
// Mirrors the Books implementation exactly.
export async function generateStaticParams() {
  const sermons = await getSermons();
  return sermons.map((sermon) => ({ slug: sermon.slug }));
}

export async function generateMetadata({
  params,
}: SermonPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const sermon = await getSermonBySlug(slug);
  const path = `/sermons/${slug}`;

  // Unknown slug → generic base metadata (the page itself renders a 404).
  if (!sermon) return generateBaseMetadata(locale, path);

  // Reuse the shared SEO helper (canonical, hreflang, robots, churchSettings
  // brand + OG defaults); override only the sermon-specific fields. Sermons
  // have no cover image in the schema, so no OG image override is passed.
  return generateBaseMetadata(locale, path, {
    title: sermon.title,
    description: toMetaDescription(sermon.description),
  });
}

export default async function SermonPage({ params }: SermonPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sermons");

  // Cached, tag-revalidated accessor (deduped with generateMetadata's call).
  const sermon = await getSermonBySlug(slug);
  if (!sermon) notFound();

  // `date` is a required ISO datetime string; format it for the active locale,
  // matching the sermon listing convention.
  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(sermon.date));

  return (
    <LayoutShell>
      <article className="py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-3xl font-bold text-deep-dark sm:text-4xl">
            {sermon.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-text-primary/70">
            <span>{formattedDate}</span>
            <span aria-hidden="true">·</span>
            <span>
              {t("by")}: {sermon.preacher}
            </span>
          </div>

          {/* External media links — rendered only for the URLs that exist. */}
          {(sermon.audioUrl || sermon.videoUrl) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {sermon.audioUrl && (
                <Button
                  href={sermon.audioUrl}
                  external
                  variant="primary"
                  size="lg"
                >
                  <Headphones size={18} aria-hidden="true" />
                  {t("listen")}
                </Button>
              )}
              {sermon.videoUrl && (
                <Button
                  href={sermon.videoUrl}
                  external
                  variant="outline"
                  size="lg"
                >
                  <Video size={18} aria-hidden="true" />
                  {t("watch")}
                </Button>
              )}
            </div>
          )}

          {sermon.description && (
            <div className="mt-8 whitespace-pre-line text-lg leading-relaxed text-text-primary/80">
              {sermon.description}
            </div>
          )}
        </div>
      </article>
    </LayoutShell>
  );
}
