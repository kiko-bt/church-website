export const siteConfig = {
  name: "Црква Христово Евангелие - Битола",
  nameEn: "Church of the Gospel of Christ - Bitola",
  shortName: "ХЕ Битола",
  shortNameEn: "CGC Bitola",
  description:
    "Добродојдовте во Црква Христово Евангелие - Битола",
  descriptionEn:
    "Official website of the Church of the Gospel of Christ in Bitola, Macedonia.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com",
  email: process.env.RESEND_TO_EMAIL ?? "contact@your-domain.com",
  address: "Битола, Македонија",
  social: {
    facebook: "",
    youtube: "",
  },
} as const;
