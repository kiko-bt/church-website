import Link from "next/link";
import type { Locale } from "@/constants/locales";
import { siteConfig } from "@/constants/site";
import { getChurchSettings } from "@/features/church-settings";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { SectionContainer } from "@/components/ui/SectionContainer";

type HeaderProps = {
  locale: Locale;
};

export async function Header({ locale }: HeaderProps) {
  // Brand name from the CMS singleton (cached, tag-revalidated); falls back to
  // the localized siteConfig name when Sanity is not configured.
  const settings = await getChurchSettings(locale);
  const name =
    settings?.churchName ?? (locale === "mk" ? siteConfig.name : siteConfig.nameEn);

  // Short brand wordmark shown beside the cross logo. The full church name stays
  // the link's accessible name (aria-label); this is the visible site title.
  const brandTitle = locale === "mk" ? "Евангелие Христово" : "Gospel of Christ";

  return (
    <header className="sticky top-0 z-50 border-b border-soft-gold/30 bg-background/95 backdrop-blur-sm">
      <SectionContainer className="flex h-16 items-center justify-between gap-4">
        {/* Brand — cross logo + site title as one responsive unit. The title is
            hidden on the smallest phones (< sm) so it can never overflow, wrap,
            or crowd the actions; from sm up it sits beside the logo. The link's
            aria-label carries the full localized name as the accessible name. */}
        <Link
          href={`/${locale}`}
          aria-label={name}
          className={
            "flex shrink-0 items-center gap-2 rounded-sm transition-opacity hover:opacity-90 " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
          }
        >
          <Logo size="md" priority label={name} />
          <span className="hidden whitespace-nowrap font-heading text-lg font-semibold leading-none text-text-primary sm:inline-block">
            {brandTitle}
          </span>
        </Link>

        {/* Desktop navigation — hidden below lg, where it has room to fit */}
        <Navigation locale={locale} />

        {/* Actions: theme + locale + mobile menu */}
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <LocaleSwitcher currentLocale={locale} />
          <MobileNav locale={locale} />
        </div>
      </SectionContainer>
    </header>
  );
}
