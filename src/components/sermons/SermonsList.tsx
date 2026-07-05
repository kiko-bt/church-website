import { Mic } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import type { Sermon } from "@/features/sermons";
import { EmptyState } from "@/components/ui/EmptyState";
import { SermonCard } from "./SermonCard";

type SermonsListProps = {
  sermons: readonly Sermon[];
  locale: Locale;
};

/**
 * Responsive list of sermons with a built-in empty state. The page passes the
 * result of `getSermons()` (@/features/sermons); an empty list renders the
 * empty state (also the fallback when Sanity is not configured).
 */
export async function SermonsList({ sermons, locale }: SermonsListProps) {
  const t = await getTranslations("sermons");

  if (sermons.length === 0) {
    return (
      <EmptyState
        icon={Mic}
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {sermons.map((sermon) => (
        <li key={sermon.id}>
          <SermonCard sermon={sermon} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
