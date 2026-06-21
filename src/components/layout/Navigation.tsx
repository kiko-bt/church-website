import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { NAV_ITEMS } from "@/constants/navigation";
import { NavLink } from "./NavLink";

type NavigationProps = {
  locale: Locale;
};

export async function Navigation({ locale }: NavigationProps) {
  const t = await getTranslations("navigation");

  return (
    <nav aria-label={t("ariaLabel")} className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <NavLink
              href={`/${locale}${item.path}`}
              exact={item.path === ""}
              className="px-3 py-1.5 text-sm font-medium"
            >
              {t(item.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
