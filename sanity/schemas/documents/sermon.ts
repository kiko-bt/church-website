import { defineType, defineField } from "sanity";
import { Mic } from "lucide-react";
import { mkSlugify, isValidSlug } from "../lib/slug";

// A sermon: metadata plus optional external audio/video links. Per the
// translation policy, sermon title/description/preacher are preacher-generated
// CONTENT and are single-language (Macedonian) — NOT bilingual.
//
// `date` is the sermon date and drives default ordering (it also serves the
// "published" role, so no separate publishedAt is needed). `featured` is wired
// end-to-end and ready for a future homepage highlight without schema changes.
export const sermon = defineType({
  name: "sermon",
  title: "Sermon",
  type: "document",
  icon: Mic,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96, slugify: mkSlugify },
      validation: (rule) => rule.required().custom(isValidSlug),
    }),
    defineField({
      name: "preacher",
      title: "Preacher",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "audioUrl",
      title: "Audio URL",
      type: "url",
      description: "Optional link to the audio recording.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      type: "url",
      description:
        "Optional link to the video. YouTube links are embedded on the sermon page; other links show a 'Watch' button.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "bibleReferences",
      title: "Bible references",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Optional scripture references for this sermon, e.g. 'John 3:16'. One per entry.",
      options: { layout: "tags" },
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Highlight this sermon (e.g. on the homepage).",
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Date, newest first",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "preacher", date: "date" },
    prepare: ({ title, subtitle, date }) => ({
      title,
      subtitle: [subtitle, date ? new Date(date).getFullYear() : null]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
