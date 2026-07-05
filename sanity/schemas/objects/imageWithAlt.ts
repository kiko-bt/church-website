import { defineType, defineField } from "sanity";

// Standard image object used everywhere images appear (gallery, book covers,
// OG images). Alt text is REQUIRED for accessibility and SEO; caption is an
// optional single-language label (per the localization policy, image captions
// are Macedonian content, not translated UI).
export const imageWithAlt = defineType({
  name: "imageWithAlt",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alternative text",
      type: "string",
      description:
        "Short description of the image for screen readers and SEO. Required.",
      validation: (rule) => rule.required().min(3).max(160),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "Optional caption shown with the image.",
    }),
  ],
  preview: {
    select: { media: "asset", title: "alt", subtitle: "caption" },
  },
});
