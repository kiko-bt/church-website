import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Headphones, Video } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import {
  getSermons,
  getSermonBySlug,
  getYouTubeEmbed,
} from "@/features/sermons";
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

  // A YouTube video is embedded inline; any other video URL keeps the external
  // "Watch" button so the media is never lost. `watchUrl` is set only when the
  // video is a non-YouTube link, so the button and its container can narrow off
  // a single string | undefined.
  const youTube = getYouTubeEmbed(sermon.videoUrl);
  const watchUrl = youTube ? undefined : sermon.videoUrl;

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

          {/* Inline YouTube player (privacy-enhanced host). Responsive 16:9
              box keeps layout stable and avoids CLS. */}
          {youTube && (
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-md border border-soft-gold/40 bg-warm-bg">
              <iframe
                src={youTube.embedUrl}
                title={sermon.title}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* External media links — audio, and video that isn't an embeddable
              YouTube link. */}
          {(sermon.audioUrl || watchUrl) && (
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
              {watchUrl && (
                <Button href={watchUrl} external variant="outline" size="lg">
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

          {/* Scripture references, shown only when the sermon has any. */}
          {sermon.bibleReferences.length > 0 && (
            <div className="mt-8">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-text-primary/70">
                {t("references")}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {sermon.bibleReferences.map((reference) => (
                  <li
                    key={reference}
                    className="inline-flex items-center gap-1.5 rounded-sm bg-warm-bg px-2.5 py-1 text-sm font-medium text-text-primary/80"
                  >
                    <BookOpen size={14} aria-hidden="true" />
                    {reference}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </LayoutShell>
  );
}
