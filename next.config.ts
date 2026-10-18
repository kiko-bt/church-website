import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

// Conservative, site-wide security response headers. Deliberately no
// Content-Security-Policy here: a CSP needs per-site tuning (Sanity image CDN,
// OG scrapers, future embeds) and a wrong one silently breaks the site — add it
// as a dedicated, tested change if a security review requires it.
//
// IF A CSP IS EVER ADDED it must allow Vercel Analytics and Speed Insights,
// which inject <script src="/_vercel/insights/script.js"> and
// "/_vercel/speed-insights/script.js" at runtime and beacon back to the same
// origin. They are same-origin (served by Vercel's edge, not a third-party CDN),
// so `script-src 'self'` covers them — but a stricter nonce/hash-only policy
// would block them silently: no error on the site, just an analytics dashboard
// that quietly stays empty.
//   - HSTS: force HTTPS for a year incl. subdomains (safe: the site is HTTPS-only
//     on Vercel; the apex + www both serve over TLS).
//   - X-Content-Type-Options: block MIME sniffing.
//   - Referrer-Policy: send origin only on cross-origin navigations.
//   - X-Frame-Options: deny framing (clickjacking protection).
//   - Permissions-Policy: switch off powerful features the site never uses
//     (camera, microphone, geolocation, payment, USB) and opt out of the Topics
//     API. Features the YouTube sermon embed relies on (autoplay, accelerometer,
//     encrypted-media, gyroscope, picture-in-picture) are deliberately left at
//     their defaults so playback is not broken.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

// Same-origin path for the book PDFs, used by the in-site PDF reader
// (`/[locale]/books/[slug]/read`). The Sanity CDN answers cross-origin browser
// requests with "403 CORS Origin not allowed", and pdf.js has to fetch the file
// itself, so `/pdf/<sha1>.pdf` is proxied to this project's file assets. The
// pattern only admits a 40-hex asset hash + `.pdf`, so the rewrite can serve
// this project's PDFs and nothing else. The path contains a dot, so the i18n
// middleware (see its matcher) never sees it. Omitted when Sanity is not
// configured — the reader is then never linked (no PDFs).
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const pdfRewrites =
  sanityProjectId &&
  /^[a-z0-9-]+$/i.test(sanityProjectId) &&
  /^[a-z0-9_-]+$/i.test(sanityDataset)
    ? [
        {
          source: "/pdf/:file([a-f0-9]{40}\\.pdf)",
          destination: `https://cdn.sanity.io/files/${sanityProjectId}/${sanityDataset}/:file`,
        },
      ]
    : [];

const nextConfig: NextConfig = {
  images: {
    // Serve AVIF first (smaller than WebP), falling back to WebP — both are
    // reencoded on demand and cached by the image optimizer, so the LCP hero,
    // gallery photos, and book covers ship fewer bytes with no visual change.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Never cache the PDF proxy on Vercel's CDN. Its cache key ignores the
      // Range header, so the first partial (206) response cached for a file
      // would be served for every later range — pdf.js then cannot read the
      // book. Sanity's own CDN still caches the files.
      // https://vercel.com/docs/routing/rewrites#disabling-caching-for-rewrites-to-external-origins
      {
        source: "/pdf/:file*",
        headers: [{ key: "x-vercel-enable-rewrite-caching", value: "0" }],
      },
    ];
  },
  async rewrites() {
    return pdfRewrites;
  },
};

export default withNextIntl(nextConfig);
