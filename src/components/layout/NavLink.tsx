"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type NavLinkProps = {
  href: string;
  exact?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

// Small client island so Navigation/MobileNav can stay server-rendered
// while only the active-state check runs on the client.
export function NavLink({ href, exact = false, className, onClick, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "rounded-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold",
        isActive
          ? "bg-warm-bg text-accent-gold"
          : "text-text-primary hover:bg-warm-bg hover:text-accent-gold",
        className
      )}
    >
      {children}
    </Link>
  );
}
