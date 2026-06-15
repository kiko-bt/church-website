import Link from "next/link";
import type { Locale } from "@/constants/locales";
import { siteConfig } from "@/constants/site";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { SectionContainer } from "@/components/ui/SectionContainer";

type HeaderProps = {
  locale: Locale;
};

export function Header({ locale }: HeaderProps) {
  const name = locale === "mk" ? siteConfig.name : siteConfig.nameEn;
  const shortName = locale === "mk" ? siteConfig.shortName : siteConfig.shortNameEn;

  return (
    <header className="sticky top-0 z-50 border-b border-soft-gold/30 bg-background/95 backdrop-blur-sm">
      <SectionContainer className="flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          aria-label={name}
          className={
            "shrink-0 rounded-sm font-heading text-base font-semibold leading-tight " +
            "text-deep-dark transition-colors hover:text-accent-gold " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
          }
        >
          {/* Full name only fits comfortably once the desktop nav has room (xl+) */}
          <span className="hidden xl:inline">{name}</span>
          <span className="xl:hidden">{shortName}</span>
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
