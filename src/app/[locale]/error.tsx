"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/Button";

// Route-segment error boundary for the localized app. Catches render/runtime
// exceptions thrown by any page under [locale] so a single failing component
// degrades to a styled, localized fallback with a retry — instead of crashing
// the route. The surrounding layout (header, footer, nav, providers) stays
// mounted, which is why translations are available here.
export default function LocaleError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const t = useTranslations("common");
  const locale = useLocale();

  useEffect(() => {
    // Log for server/monitoring; provider details never reach the visitor.
    console.error("[app] Unhandled render error:", error);
  }, [error]);

  return (
    <LayoutShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-deep-dark sm:text-3xl">
          {t("errorTitle")}
        </h1>
        <p className="mt-4 max-w-md text-text-primary/70">{t("errorBody")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="primary">
            {t("retry")}
          </Button>
          <Button href={`/${locale}`} variant="outline">
            {t("backToHome")}
          </Button>
        </div>
      </div>
    </LayoutShell>
  );
}
