import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { HeroSection } from "@/components/home/HeroSection";
import { ScriptureSection } from "@/components/home/ScriptureSection";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { CTASection } from "@/components/home/CTASection";

type HomePageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateBaseMetadata(locale);
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [organization, website] = await Promise.all([
    buildOrganizationSchema(locale),
    buildWebSiteSchema(locale),
  ]);

  return (
    <>
      <JsonLd data={[organization, website]} />
      <HeroSection locale={locale} />
      <ScriptureSection locale={locale} />
      <WelcomeSection locale={locale} />
      <CTASection locale={locale} />
    </>
  );
}
