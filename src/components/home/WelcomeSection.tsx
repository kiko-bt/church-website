import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { Button } from "@/components/ui/Button";
import { SectionContainer } from "@/components/ui/SectionContainer";

type WelcomeSectionProps = {
  locale: Locale;
};

export async function WelcomeSection({ locale }: WelcomeSectionProps) {
  const t = await getTranslations("home.welcome");

  return (
    <section
      aria-labelledby="welcome-heading"
      className="bg-warm-bg py-16 sm:py-20"
    >
      <SectionContainer className="max-w-3xl">
        <h2
          id="welcome-heading"
          className="font-heading text-3xl font-bold text-deep-dark sm:text-4xl"
        >
          {t("title")}
        </h2>

        <p className="mt-6 text-lg leading-relaxed text-text-primary/80">
          {t("body")}
        </p>

        <div className="mt-8">
          <Button href={`/${locale}/about`} variant="secondary" size="md">
            {t("cta")}
          </Button>
        </div>
      </SectionContainer>
    </section>
  );
}
