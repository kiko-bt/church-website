import { defineType, defineField } from "sanity";
import { Settings } from "lucide-react";

// Global church identity & contact details. Singleton — the desk structure
// (sanity/structure.ts) pins it to a single, fixed document. Single source of
// truth for the header, footer, and contact page; nothing else should restate
// the church name, address, email, or social links.
//
// Localization: address/email/phone are language-neutral and single-valued;
// the church name and the service schedule are visitor-facing copy, so they are
// bilingual (`_en`).
export const churchSettings = defineType({
  name: "churchSettings",
  title: "Church Settings",
  type: "document",
  icon: Settings,
  groups: [
    { name: "general", title: "General", default: true },
    { name: "contact", title: "Contact" },
    { name: "social", title: "Social" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "churchName",
      title: "Church name (MK)",
      type: "string",
      group: "general",
      description:
        "The official church name. Shown in the header and footer, and used in page titles and search-engine listings.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "churchName_en",
      title: "Church name (EN)",
      type: "string",
      group: "general",
      description:
        'English version of the church name, e.g. "Church of the Gospel of Christ - Bitola". Always update this together with the Macedonian name — the English pages read this field only.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "imageWithAlt",
      group: "general",
      description:
        "Optional. Reserved for a future logo override — the site currently uses the built-in logo everywhere.",
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
      group: "contact",
    }),
    defineField({
      name: "serviceSchedule",
      title: "Service times (MK)",
      type: "text",
      rows: 3,
      group: "contact",
      description:
        'Shown on the contact page under "Време на богослужби". Write it exactly as visitors should read it, e.g. "Секоја недела во 10:00". Use a new line for each additional service.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "serviceSchedule_en",
      title: "Service times (EN)",
      type: "text",
      rows: 3,
      group: "contact",
      description:
        'English version of the same text, e.g. "Every Sunday at 10:00". Always update this together with the Macedonian text — the English page reads this field only.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "social",
      title: "Social links",
      type: "socialLinks",
      group: "social",
    }),
    defineField({
      name: "seo",
      title: "SEO defaults",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: {
    select: { title: "churchName" },
    prepare: ({ title }) => ({ title: title ?? "Church Settings" }),
  },
});
