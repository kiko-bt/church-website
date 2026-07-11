import type { MetadataRoute } from "next";
import { siteConfig } from "@/constants/site";

// Static robots.txt (generated at build). Allows all crawling and points to the
// sitemap. Both derive their absolute host from `siteConfig.url`
// (NEXT_PUBLIC_SITE_URL), so they stay correct per environment.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The single dynamic route carries no indexable content.
      disallow: "/api/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
