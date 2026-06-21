import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { siteConfig } from "@/constants/site";

export function generateBaseMetadata(locale: Locale, path: string = ""): Metadata {
  const isEn = locale === "en";
  const title = isEn ? siteConfig.nameEn : siteConfig.name;
  const description = isEn ? siteConfig.descriptionEn : siteConfig.description;
  const canonicalUrl = `${siteConfig.url}/${locale}${path}`;

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      type: "website",
      locale: isEn ? "en_US" : "mk_MK",
      siteName: title,
      title,
      description,
      url: canonicalUrl,
      // Resolved against `metadataBase`. Intrinsic dimensions of the lockup.
      // Future CMS integration: churchSettings.logo
      images: [
        {
          url: "/images/branding/church-logo.png",
          width: 1184,
          height: 864,
          alt: title,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        mk: `${siteConfig.url}/mk${path}`,
        en: `${siteConfig.url}/en${path}`,
      },
    },
  };
}
