import Link from "next/link";
import { Headphones, Video } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import type { Sermon } from "@/features/sermons";

type SermonCardProps = {
  sermon: Sermon;
  locale: Locale;
};

/**
 * Presentational card for a single sermon in the listing.
 *
 * Future CMS integration point: `sermon` will come from `sermonListQuery`
 * (@/features/sermons). The `audioUrl` / `videoUrl` badges reflect which
 * media a sermon offers; playback itself is deferred (no business logic).
 */
export async function SermonCard({ sermon, locale }: SermonCardProps) {
  const t = await getTranslations("sermons");

  // `date` is an ISO date string from Sanity; format it for the active
  // locale without hardcoding a locale-specific pattern.
  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(sermon.date));

  return (
    <Link
      href={`/${locale}/sermons/${sermon.slug.current}`}
      className="group flex flex-col rounded-md border border-soft-gold/40 bg-background p-6 transition-colors hover:border-accent-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
    >
      <div className="flex items-center gap-3 text-xs font-medium text-text-primary/60">
        <span>{formattedDate}</span>
        <span aria-hidden="true">·</span>
        <span>
          {t("by")}: {sermon.preacher}
        </span>
      </div>

      <h2 className="mt-3 font-heading text-lg font-semibold text-deep-dark group-hover:text-accent-gold">
        {sermon.title}
      </h2>

      {sermon.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-primary/75">
          {sermon.description}
        </p>
      )}

      {(sermon.audioUrl || sermon.videoUrl) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {sermon.audioUrl && (
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-warm-bg px-2.5 py-1 text-xs font-medium text-text-primary/80">
              <Headphones size={14} aria-hidden="true" />
              {t("listen")}
            </span>
          )}
          {sermon.videoUrl && (
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-warm-bg px-2.5 py-1 text-xs font-medium text-text-primary/80">
              <Video size={14} aria-hidden="true" />
              {t("watch")}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
