import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { getHomeContent } from "@/features/home-content";
import { Button } from "@/components/ui/Button";
import { PortableTextRenderer } from "@/components/portable-text/PortableTextRenderer";
import { SectionContainer } from "@/components/ui/SectionContainer";

type CTASectionProps = {
  locale: Locale;
};

// The body is the CMS-driven Portable Text `shortMessage` (HomeContent),
// rendered by the shared PortableTextRenderer and falling back to the
// home.cta.body message when Sanity is not configured or the field is empty.
// The title and button label remain UI copy (no dedicated CTA fields are
// modeled on the singleton yet); the destination route stays hardcoded.
export async function CTASection({ locale }: CTASectionProps) {
  const t = await getTranslations("home.cta");
  const content = await getHomeContent(locale);
  const message = content?.shortMessage ?? [];

  return (
    <section
      aria-labelledby="cta-heading"
      className="bg-deep-dark py-16 sm:py-20"
    >
      <SectionContainer className="text-center">
        <h2
          id="cta-heading"
          className="font-heading text-3xl font-bold text-background sm:text-4xl"
        >
          {t("title")}
        </h2>

        {message.length > 0 ? (
          <PortableTextRenderer
            value={message}
            className="mx-auto mt-6 max-w-xl space-y-4 text-lg text-background/70"
          />
        ) : (
          <p className="mx-auto mt-6 max-w-xl text-lg text-background/70">
            {t("body")}
          </p>
        )}

        <div className="mt-10">
          <Button href={`/${locale}/contact`} variant="primary" size="lg">
            {t("button")}
          </Button>
        </div>
      </SectionContainer>
    </section>
  );
}
