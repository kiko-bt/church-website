import Image from "next/image";
import { siteConfig } from "@/constants/site";
import { cn } from "@/lib/utils/cn";

// Future CMS integration:
// churchSettings.logo
// The static asset below will later be replaced by a Sanity image asset.
// Swapping `LOGO_SRC` (and, for a remote asset, the dimensions) is the only
// change required — the component API, sizing, and a11y contract stay identical.
const LOGO_SRC = "/images/branding/church-logo.png";

// Intrinsic source dimensions are 1184 × 864 (aspect ratio ≈ 1.37:1). Every
// entry below preserves that ratio exactly, so next/image reserves the correct
// box and the logo never causes layout shift (CLS). Heights drive the scale:
// sm ≈ 32px tall, md ≈ 44px tall, lg ≈ 80px tall.
const LOGO_SIZES = {
  sm: { width: 44, height: 32 },
  md: { width: 60, height: 44 },
  lg: { width: 110, height: 80 },
} as const;

type LogoProps = {
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  showText?: boolean;
};

/**
 * Church logo. Server component — renders the official lockup via next/image
 * with deterministic, ratio-preserving dimensions (no CLS).
 *
 * The artwork already contains the church name, so `showText` is opt-in and
 * defaults to off. When enabled, the adjacent text becomes the accessible name
 * and the image is treated as decorative to avoid a duplicate announcement.
 */
export function Logo({
  size = "md",
  priority = false,
  showText = false,
}: LogoProps) {
  const { width, height } = LOGO_SIZES[size];

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md",
          // The artwork sits on a light background. In dark mode we place it on
          // a subtle light surface with a soft-gold ring so it stays legible —
          // without ever altering the image file itself.
          "dark:bg-warm-bg dark:p-1 dark:ring-1 dark:ring-soft-gold/20"
        )}
      >
        <Image
          src={LOGO_SRC}
          width={width}
          height={height}
          priority={priority}
          sizes={`${width}px`}
          alt={showText ? "" : siteConfig.name}
          className="object-contain"
        />
      </span>

      {showText && (
        <span className="font-heading text-base font-semibold leading-tight text-deep-dark">
          {siteConfig.name}
        </span>
      )}
    </span>
  );
}
