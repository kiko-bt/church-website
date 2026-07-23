export const siteConfig = {
  name: "Црква Евангелие Христово - Битола",
  nameEn: "Church of the Gospel of Christ - Bitola",
  shortName: "ХЕ Битола",
  shortNameEn: "CGC Bitola",
  description: "Добредојдовте во Црква Евангелие Христово - Битола",
  descriptionEn:
    "Official website of the Church of the Gospel of Christ in Bitola, Macedonia.",
  // Canonical/OG/hreflang base. Set NEXT_PUBLIC_SITE_URL in every environment;
  // the fallback is the real production domain (not a placeholder) so a missing
  // env var degrades to correct URLs instead of poisoning SEO with a dummy host.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hristovoevangelie.org",
  // Public contact address shown on the site (ContactInfo). Overridden by the
  // churchSettings.email CMS field when set; RESEND_TO_EMAIL is the fallback.
  email: process.env.RESEND_TO_EMAIL ?? "contact@hristovoevangelie.org",
  address: "Битола, Македонија",
  // Locale/region for the place of worship (used by structured data & OG).
  addressLocality: "Битола",
  addressCountry: "MK",
  social: {
    facebook: "",
    youtube: "",
  },
  // Meta keywords. Note: Google has ignored the keywords meta tag since 2009 and
  // it carries no ranking weight; it is included only for completeness and the
  // few crawlers that still read it. Kept short and relevant (never stuffed).
  keywords: [
    "црква",
    "Битола",
    "евангелие",
    "христијанство",
    "Библија",
    "проповеди",
  ],
  keywordsEn: [
    "church",
    "Bitola",
    "gospel",
    "Christianity",
    "Bible",
    "sermons",
  ],
} as const;
