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

  return (
    <header className="sticky top-0 z-50 border-b border-soft-gold/30 bg-background/95 backdrop-blur-sm">
      <SectionContainer className="flex h-16 items-center justify-between gap-4">
        {/* Brand — the lockup already contains the church name, so no adjacent
            text is rendered (avoids duplication and any width pressure). The
            link's aria-label carries the localized name as the accessible name. */}
        <Link
          href={`/${locale}`}
          aria-label={name}
          className={
            "shrink-0 rounded-sm transition-opacity hover:opacity-90 " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
          }
        >
          <Logo size="md" priority label={name} />
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
