export const siteConfig = {
  name: "Црква Евангелие Христово - Битола",
  nameEn: "Church of the Gospel of Christ - Bitola",
  shortName: "ХЕ Битола",
  shortNameEn: "CGC Bitola",
  description: "Добродојдовте во Црква Евангелие Христово - Битола",
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
  social: {
    facebook: "",
    youtube: "",
  },
} as const;
