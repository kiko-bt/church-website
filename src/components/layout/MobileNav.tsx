"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/constants/locales";
import { NAV_ITEMS } from "@/constants/navigation";

type MobileNavProps = {
  locale: Locale;
};

export function MobileNav({ locale }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("nav");
  const pathname = usePathname();

  // Close menu on route change.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? t("closeMenu") : t("openMenu")}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-menu"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm transition-colors",
          "text-text-primary hover:bg-warm-bg hover:text-accent-gold",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
        )}
      >
        {isOpen ? (
          <X size={20} aria-hidden="true" />
        ) : (
          <Menu size={20} aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t("mobileNavLabel")}
          className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-background px-4 pb-8 pt-4"
        >
          <nav aria-label={t("mobileNavLinks")}>
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <Link
                    href={`/${locale}${item.path}`}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block rounded-sm px-4 py-3 text-lg font-medium text-text-primary",
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
        </div>
      )}
    </div>
  );
}
