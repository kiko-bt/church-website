import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { generateBaseMetadata } from "@/lib/seo/metadata";
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

  return (
    <>
      <HeroSection locale={locale} />
      <ScriptureSection />
      <WelcomeSection locale={locale} />
      <CTASection locale={locale} />
    </>
  );
}
