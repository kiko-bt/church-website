import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactInfo } from "@/components/contact/ContactInfo";

type ContactPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return generateBaseMetadata(locale, "/contact", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <LayoutShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid grid-cols-1 gap-10 pb-12 lg:grid-cols-2 lg:gap-12">
        <div className="max-w-xl">
          <p className="text-lg leading-relaxed text-text-primary/80">
            {t("intro")}
          </p>
        </div>

        {/*
          Future phase: the contact form (React Hook Form + Zod + Resend) will
          live here. It is intentionally omitted in this phase — visitors are
          directed to email via the contact details.
        */}
        <ContactInfo />
      </div>
    </LayoutShell>
  );
}
