import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/constants/locales";
import { NAV_ITEMS } from "@/constants/navigation";

type NavigationProps = {
  locale: Locale;
};

export async function Navigation({ locale }: NavigationProps) {
  const t = await getTranslations("nav");

  return (
    <nav
      aria-label={locale === "mk" ? "Главна навигација" : "Main navigation"}
      className="hidden sm:block"
    >
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <Link
              href={`/${locale}${item.path}`}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium text-text-primary",
                "transition-colors hover:bg-warm-bg hover:text-accent-gold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
              )}
            >
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
