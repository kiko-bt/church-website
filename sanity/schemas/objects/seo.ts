import { defineType, defineField } from "sanity";

// Bilingual SEO defaults. Currently attached to `churchSettings` as site-wide
// fallbacks. Designed so it can later be added as an optional per-document
// override (sermon, book) without any architectural change. All fields are
// optional — sensible metadata is derived from titles when these are empty.
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title (MK)",
      type: "string",
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: "metaTitle_en",
      title: "Meta title (EN)",
      type: "string",
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description (MK)",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: "metaDescription_en",
      title: "Meta description (EN)",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: "ogImage",
      title: "Social share image",
      type: "imageWithAlt",
      description: "Optional. Falls back to the church logo when empty.",
    }),
  ],
});
