import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { siteConfig } from "@/constants/site";
import { NAV_ITEMS } from "@/constants/navigation";
import { routes } from "@/constants/routes";
import { getChurchSettings } from "@/features/church-settings";
import { Logo } from "@/components/ui/Logo";
import { SectionContainer } from "@/components/ui/SectionContainer";

export async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("navigation");
  const privacyT = await getTranslations("privacy");
  const locale = (await getLocale()) as Locale;
  // Official church name from the CMS singleton (locale-resolved); falls back to
  // the localized siteConfig name when Sanity is not configured.
  const settings = await getChurchSettings(locale);
  const name =
    settings?.churchName ??
    (locale === "mk" ? siteConfig.name : siteConfig.nameEn);
  const currentYear = new Date().getFullYear();

  const linkClass =
    "text-xs text-text-primary/70 transition-colors hover:text-accent-gold-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold rounded-sm";

  return (
    <footer className="border-t border-soft-gold/30 bg-warm-bg py-8">
      <SectionContainer className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Logo size="lg" label={name} />
          <div>
            <p className="font-heading text-sm font-semibold text-deep-dark">
              {name}
            </p>
            <p className="mt-1 text-xs text-text-primary/70">{t("tagline")}</p>
          </div>
        </div>

        {/* Footer navigation: repeats the primary links and surfaces the
            Privacy Policy, which is otherwise absent from the main nav. */}
        <nav aria-label={t("navLabel")} className="flex flex-col items-center gap-2 sm:items-end">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-end">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link href={`/${locale}${item.path}`} className={linkClass}>
                  {nav(item.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`/${locale}${routes.privacy}`} className={linkClass}>
                {privacyT("title")}
              </Link>
            </li>
          </ul>
          <p className="text-xs text-text-primary/70">
            &copy; {currentYear} {name}. {t("allRightsReserved")}
          </p>
        </nav>
      </SectionContainer>
    </footer>
  );
}
