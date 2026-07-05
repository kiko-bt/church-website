import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { getHomeContent } from "@/features/home-content";
import { Button } from "@/components/ui/Button";
import { PortableTextRenderer } from "@/components/portable-text/PortableTextRenderer";
import { SectionContainer } from "@/components/ui/SectionContainer";

type WelcomeSectionProps = {
  locale: Locale;
};

// Heading and body are CMS-driven (HomeContent.welcomeTitle / welcomeBody,
// locale-resolved by the mapper). welcomeBody is Portable Text, rendered by the
// shared PortableTextRenderer. When Sanity is not configured (or the body is
// left empty) the section falls back to the translated home.welcome.* copy, so
// the page always renders.
export async function WelcomeSection({ locale }: WelcomeSectionProps) {
  const t = await getTranslations("home.welcome");
  const content = await getHomeContent(locale);
  const title = content?.welcomeTitle ?? t("title");
  const body = content?.welcomeBody ?? [];

  return (
    <section
      aria-labelledby="welcome-heading"
      className="bg-warm-bg py-16 sm:py-20"
    >
      <SectionContainer>
        <div className="mx-auto max-w-3xl">
          <h2
            id="welcome-heading"
            className="font-heading text-3xl font-bold text-deep-dark sm:text-4xl"
          >
            {title}
          </h2>

          {body.length > 0 ? (
            <PortableTextRenderer
              value={body}
              className="mt-6 space-y-4 text-lg leading-relaxed text-text-primary/80"
            />
          ) : (
            <p className="mt-6 text-lg leading-relaxed text-text-primary/80">
              {t("body")}
            </p>
          )}

          <div className="mt-8">
            <Button href={`/${locale}/about`} variant="secondary" size="md">
              {t("cta")}
            </Button>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
