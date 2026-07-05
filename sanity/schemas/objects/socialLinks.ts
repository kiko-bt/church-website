import { defineType, defineField } from "sanity";

// Grouped social profile URLs for the church. Lives on `churchSettings` as the
// single source of truth (header, footer, contact page all read from here).
// Extensible: add a new platform field without touching consumers.
export const socialLinks = defineType({
  name: "socialLinks",
  title: "Social links",
  type: "object",
  fields: [
    defineField({
      name: "facebook",
      title: "Facebook URL",
      type: "url",
      validation: (rule) =>
        rule.uri({ scheme: ["https"] }).error("Must be a valid https URL."),
    }),
    defineField({
      name: "youtube",
      title: "YouTube URL",
      type: "url",
      validation: (rule) =>
        rule.uri({ scheme: ["https"] }).error("Must be a valid https URL."),
    }),
    defineField({
      name: "instagram",
      title: "Instagram URL",
      type: "url",
      validation: (rule) =>
        rule.uri({ scheme: ["https"] }).error("Must be a valid https URL."),
    }),
  ],
});
