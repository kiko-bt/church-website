import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

// Conservative, site-wide security response headers. Deliberately no
// Content-Security-Policy here: a CSP needs per-site tuning (Sanity image CDN,
// OG scrapers, future embeds) and a wrong one silently breaks the site — add it
// as a dedicated, tested change if a security review requires it.
//   - HSTS: force HTTPS for a year incl. subdomains (safe: the site is HTTPS-only
//     on Vercel; the apex + www both serve over TLS).
//   - X-Content-Type-Options: block MIME sniffing.
//   - Referrer-Policy: send origin only on cross-origin navigations.
//   - X-Frame-Options: deny framing (clickjacking protection).
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
