import Link from "next/link";
import type { Locale } from "@/constants/locales";
import { siteConfig } from "@/constants/site";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

type HeaderProps = {
  locale: Locale;
};

export function Header({ locale }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-soft-gold/30 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          aria-label={siteConfig.name}
          className={
            "shrink-0 rounded-sm font-heading text-base font-semibold leading-tight " +
            "text-deep-dark transition-colors hover:text-accent-gold " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
          }
        >
          <span className="hidden sm:inline">{siteConfig.name}</span>
          <span className="sm:hidden">ХЕ Битола</span>
        </Link>

        {/* Desktop navigation — hidden on mobile */}
        <Navigation locale={locale} />

        {/* Actions: theme + locale + mobile menu */}
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <LocaleSwitcher currentLocale={locale} />
          <MobileNav locale={locale} />
        </div>
      </div>
    </header>
  );
}
