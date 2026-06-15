import { Mail, MapPin, CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/constants/site";

/**
 * Read-only contact details block.
 *
 * Future CMS integration point: address / email / service schedule and the
 * social links will come from the `churchSettings` singleton
 * (@/features/church-settings). Until Sanity is wired in, values are sourced
 * from `siteConfig` and the `contact.info.*` messages as placeholders.
 *
 * The contact form itself is intentionally deferred (no forms in this phase);
 * visitors are directed to email until it is implemented.
 */
export async function ContactInfo() {
  const t = await getTranslations("contact.info");

  const items = [
    {
      key: "address",
      icon: MapPin,
      label: t("addressLabel"),
      value: siteConfig.address,
    },
    {
      key: "schedule",
      icon: CalendarDays,
      label: t("scheduleLabel"),
      value: t("scheduleValue"),
    },
  ] as const;

  return (
    <section
      aria-labelledby="contact-info-heading"
      className="rounded-md border border-soft-gold/40 bg-warm-bg/40 p-6 sm:p-8"
    >
      <h2
        id="contact-info-heading"
        className="font-heading text-2xl font-semibold text-deep-dark"
      >
        {t("heading")}
      </h2>

      <dl className="mt-6 space-y-5">
        {items.map((item) => (
          <div key={item.key} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-gold/30 text-accent-gold"
              aria-hidden="true"
            >
              <item.icon size={18} />
            </span>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-primary/55">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-base text-text-primary/85">
                {item.value}
              </dd>
            </div>
          </div>
        ))}

        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-gold/30 text-accent-gold"
            aria-hidden="true"
          >
            <Mail size={18} />
          </span>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-text-primary/55">
              {t("emailLabel")}
            </dt>
            <dd className="mt-0.5 text-base">
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-accent-gold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
              >
                {siteConfig.email}
              </a>
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
