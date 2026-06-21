import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/constants/site";
import { Logo } from "@/components/ui/Logo";
import { SectionContainer } from "@/components/ui/SectionContainer";

export async function Footer() {
  const t = await getTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-soft-gold/30 bg-warm-bg py-8">
      <SectionContainer className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Logo size="lg" />
          <div>
            <p className="font-heading text-sm font-semibold text-deep-dark">
              {siteConfig.name}
            </p>
            <p className="mt-1 text-xs text-text-primary/60">{t("tagline")}</p>
          </div>
        </div>
        <p className="text-xs text-text-primary/60">
          &copy; {currentYear} {siteConfig.name}. {t("allRightsReserved")}
        </p>
      </SectionContainer>
    </footer>
  );
}
