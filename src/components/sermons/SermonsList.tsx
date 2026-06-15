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
 * Responsive list of sermons with a built-in empty state.
 *
 * Future CMS integration point: the page will pass the result of
 * `sermonListQuery` (@/features/sermons) here. Until Sanity is wired in, an
 * empty array is passed and the empty state is shown.
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
        <li key={sermon._id}>
          <SermonCard sermon={sermon} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
