import { defineType, defineField } from "sanity";
import { Home } from "lucide-react";

// Preacher-editable homepage copy. Singleton — pinned by the desk structure.
// Owns ONLY homepage editorial text; church identity (name, logo, contact)
// lives on `churchSettings` and is never duplicated here.
//
// Every field is bilingual via the `_en` suffix convention. Rich-text fields
// use the shared `richText` (Portable Text) type.
//
// Hero heading/subtext and a CTA label can be added here later without any
// architectural change (extra fields on the same singleton).
export const homeContent = defineType({
  name: "homeContent",
  title: "Home Page",
  type: "document",
  icon: Home,
  fieldsets: [
    { name: "welcome", title: "Welcome section" },
    { name: "verse", title: "Main verse" },
    { name: "message", title: "Short message" },
  ],
  fields: [
    defineField({
      name: "welcomeTitle",
      title: "Welcome title (MK)",
      type: "string",
      fieldset: "welcome",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "welcomeTitle_en",
      title: "Welcome title (EN)",
      type: "string",
      fieldset: "welcome",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "welcomeBody",
      title: "Welcome body (MK)",
      type: "richText",
      fieldset: "welcome",
    }),
    defineField({
      name: "welcomeBody_en",
      title: "Welcome body (EN)",
      type: "richText",
      fieldset: "welcome",
    }),
    defineField({
      name: "mainVerseText",
      title: "Verse text (MK)",
      type: "text",
      rows: 3,
      fieldset: "verse",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mainVerseText_en",
      title: "Verse text (EN)",
      type: "text",
      rows: 3,
      fieldset: "verse",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mainVerseReference",
      title: "Verse reference (MK)",
      type: "string",
      fieldset: "verse",
      description: "E.g. Јован 3:16",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mainVerseReference_en",
      title: "Verse reference (EN)",
      type: "string",
      fieldset: "verse",
      description: "E.g. John 3:16",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "shortMessage",
      title: "Short message (MK)",
      type: "richText",
      fieldset: "message",
    }),
    defineField({
      name: "shortMessage_en",
      title: "Short message (EN)",
      type: "richText",
      fieldset: "message",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Home Page" }),
  },
});
