import { defineType, defineField } from "sanity";
import { Settings } from "lucide-react";

// Global church identity & contact details. Singleton — the desk structure
// (sanity/structure.ts) pins it to a single, fixed document. Single source of
// truth for the header, footer, and contact page; nothing else should restate
// the church name, address, email, or social links.
//
// Localization: address/email/phone are language-neutral and single-valued;
// the service schedule is visitor-facing copy, so it is bilingual (`_en`).
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
      title: "Church name",
      type: "string",
      group: "general",
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
      title: "Service schedule (MK)",
      type: "text",
      rows: 3,
      group: "contact",
      description: "When services are held. Shown on the contact page.",
    }),
    defineField({
      name: "serviceSchedule_en",
      title: "Service schedule (EN)",
      type: "text",
      rows: 3,
      group: "contact",
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
