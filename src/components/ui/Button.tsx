import Link from "next/link";
import type { ReactNode, MouseEventHandler } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type SharedProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  "aria-label"?: string;
};

type ButtonAsButton = SharedProps & {
  href?: never;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  external?: never;
  download?: never;
};

type ButtonAsLink = SharedProps & {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
  // External file/URL (e.g. a PDF on the Sanity CDN): rendered as a plain
  // anchor that opens in a new tab with the standard security rel, rather than
  // a prefetched next/link. `download` hints the browser to save the file.
  external?: boolean;
  download?: boolean;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-gold text-white hover:bg-accent-gold/90 focus-visible:ring-accent-gold",
  secondary:
    "bg-warm-bg text-deep-dark hover:bg-soft-gold focus-visible:ring-soft-gold",
  ghost: "hover:bg-warm-bg text-text-primary focus-visible:ring-text-primary/30",
  outline:
    "border border-accent-gold text-accent-gold hover:bg-accent-gold/10 focus-visible:ring-accent-gold",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  onClick,
  type = "button",
  disabled,
  external,
  download,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = cn(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          download={download}
          className={classes}
          aria-label={ariaLabel}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
