import { getLocale, getTranslations } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/Button";

// Localized 404 boundary for content routes. Rendered when a page in this
// segment calls notFound() (e.g. an unknown sermon/book/album slug), inside the
// locale layout so it keeps the site header, footer, and active language. The
// active locale comes from the request context the calling page already set via
// setRequestLocale(); not-found.tsx receives no params, so getLocale() /
// getTranslations() read that context (falling back to the default locale).
export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations("common");

  return (
    <LayoutShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <p className="font-heading text-6xl font-bold text-accent-gold">404</p>
        <h1 className="mt-4 font-heading text-2xl font-bold text-deep-dark sm:text-3xl">
          {t("notFound")}
        </h1>
        <div className="mt-8">
          <Button href={`/${locale}`}>{t("backToHome")}</Button>
        </div>
      </div>
    </LayoutShell>
  );
}
