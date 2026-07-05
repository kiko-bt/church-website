import { Mail, MapPin, CalendarDays, Phone, Share2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { siteConfig } from "@/constants/site";
import { getChurchSettings } from "@/features/church-settings";

/**
 * Read-only contact details block.
 *
 * Church identity (address, email, phone, service schedule, social links) is
 * sourced from the `churchSettings` singleton (@/features/church-settings).
 * Each value falls back to `siteConfig` / the `contact.info.*` messages so the
 * page still renders when Sanity is not configured. Phone and social rows are
 * rendered only when the corresponding value is present.
 *
 * The contact form itself is intentionally deferred (no forms in this phase);
 * visitors are directed to email until it is implemented.
 */
export async function ContactInfo() {
  const t = await getTranslations("contact.info");
  const locale = (await getLocale()) as Locale;
  const settings = await getChurchSettings(locale);

  const address = settings?.address ?? siteConfig.address;
  const email = settings?.email ?? siteConfig.email;
  const schedule = settings?.serviceSchedule ?? t("scheduleValue");
  const phone = settings?.phone;

  // Plain-text detail rows (icon + label + value).
  const items = [
    { key: "address", icon: MapPin, label: t("addressLabel"), value: address },
    {
      key: "schedule",
      icon: CalendarDays,
      label: t("scheduleLabel"),
      value: schedule,
    },
  ];

  // Social profiles — labels are proper nouns, not translated. Rendered only
  // when set.
  const socialLinks = [
    { key: "facebook", label: "Facebook", href: settings?.social.facebook },
    { key: "youtube", label: "YouTube", href: settings?.social.youtube },
    { key: "instagram", label: "Instagram", href: settings?.social.instagram },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href));

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

        {phone && (
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-gold/30 text-accent-gold"
              aria-hidden="true"
            >
              <Phone size={18} />
            </span>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-primary/55">
                {t("phoneLabel")}
              </dt>
              <dd className="mt-0.5 text-base">
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="text-accent-gold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
                >
                  {phone}
                </a>
              </dd>
            </div>
          </div>
        )}

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
                href={`mailto:${email}`}
                className="text-accent-gold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
              >
                {email}
              </a>
            </dd>
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-gold/30 text-accent-gold"
              aria-hidden="true"
            >
              <Share2 size={18} />
            </span>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-primary/55">
                {t("followLabel")}
              </dt>
              <dd className="mt-1 flex flex-wrap gap-4 text-base">
                {socialLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-gold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
                  >
                    {link.label}
                  </a>
                ))}
              </dd>
            </div>
          </div>
        )}
      </dl>
    </section>
  );
}
