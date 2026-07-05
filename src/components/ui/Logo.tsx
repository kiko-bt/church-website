import Image from "next/image";
import { siteConfig } from "@/constants/site";
import { cn } from "@/lib/utils/cn";

// The logo IMAGE is the built-in static asset. A CMS override
// (`churchSettings.logo`, modeled but not projected) is an intentional
// deferral: the built-in lockup is the site's identity, and social-share
// branding is already served by the dedicated `churchSettings.seo.ogImage`. If
// wired later it needs no new dependency — projecting `asset->metadata.dimensions`
// gives CLS-safe sizing — and this component's API would stay the same.
//
// The logo's accessible LABEL (the church name) is church identity and is
// already CMS-driven: callers pass `label` resolved from `churchSettings`,
// defaulting to `siteConfig` only when the CMS is unconfigured.
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
  /**
   * Accessible label / brand text (the church name). Sourced from
   * `churchSettings` by callers; defaults to `siteConfig.name` so the component
   * still renders correctly when used standalone or without a configured CMS.
   */
  label?: string;
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
  label = siteConfig.name,
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
          alt={showText ? "" : label}
          className="object-contain"
        />
      </span>

      {showText && (
        <span className="font-heading text-base font-semibold leading-tight text-deep-dark">
          {label}
        </span>
      )}
    </span>
  );
}
