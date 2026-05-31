"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/constants/locales";
import { cn } from "@/lib/utils/cn";

type LocaleSwitcherProps = {
  currentLocale: Locale;
};

export function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("locale");

  function handleLocaleChange(newLocale: Locale) {
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname || `/${newLocale}`);
  }

  return (
    <div
      role="group"
      aria-label={t("switchTo")}
      className="flex items-center gap-0.5"
    >
      {locales.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <button
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            disabled={isActive}
            aria-pressed={isActive}
            className={cn(
              "rounded-sm px-2 py-1 text-xs font-semibold uppercase transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold",
              isActive
                ? "cursor-default text-accent-gold"
                : "text-text-primary/50 hover:text-text-primary"
            )}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
