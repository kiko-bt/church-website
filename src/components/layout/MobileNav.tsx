"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/constants/locales";
import { NAV_ITEMS } from "@/constants/navigation";
import { NavLink } from "./NavLink";

type MobileNavProps = {
  locale: Locale;
};

export function MobileNav({ locale }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("navigation");
  const pathname = usePathname();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Portals require the DOM; only render the panel after mount (avoids SSR
  // mismatch and `document` access during server rendering).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on route change.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll while the menu is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus management: move focus into the panel when it opens, and restore it
  // to the toggle button when it closes.
  useEffect(() => {
    if (!isOpen) return;

    const opener = buttonRef.current;
    const firstLink = panelRef.current?.querySelector<HTMLElement>("a[href]");
    firstLink?.focus();

    return () => {
      opener?.focus();
    };
  }, [isOpen]);

  // Trap Tab focus within the open panel for keyboard users.
  function handlePanelKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !panelRef.current) return;

    const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href]");
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? t("closeMenu") : t("openMenu")}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-menu"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-sm transition-colors",
          "text-text-primary hover:bg-warm-bg hover:text-accent-gold",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
        )}
      >
        {isOpen ? (
          <X size={22} aria-hidden="true" />
        ) : (
          <Menu size={22} aria-hidden="true" />
        )}
      </button>

      {/*
        Rendered through a portal to `document.body`. The header uses
        `backdrop-blur`, and a `backdrop-filter` ancestor becomes the containing
        block for `position: fixed` descendants — which previously collapsed
        this panel to the width of the header's actions. Portaling to <body>
        escapes that containing block so `fixed inset-x-0` spans the viewport.
      */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            id="mobile-nav-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("mobileNavLabel")}
            onKeyDown={handlePanelKeyDown}
            className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-background px-4 pb-8 pt-4 lg:hidden"
          >
            <nav aria-label={t("mobileNavLinks")}>
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      href={`/${locale}${item.path}`}
                      exact={item.path === ""}
                      onClick={() => setIsOpen(false)}
                      className="flex min-h-11 items-center px-4 py-3 text-lg font-medium"
                    >
                      {t(item.key)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>,
          document.body
        )}
    </div>
  );
}
