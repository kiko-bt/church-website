import { defineType, defineField } from "sanity";
import { BookOpen } from "lucide-react";
import { mkSlugify, isValidSlug } from "../lib/slug";

// A downloadable book: metadata + a PDF file asset + an optional cover image.
// Title/author/description are single-language (Macedonian) content.
//
// `publishedAt` drives ordering and is wired end-to-end; `featured` is ready
// for a future highlight. Both can change behaviour without schema rework.
export const book = defineType({
  name: "book",
  title: "Book",
  type: "document",
  icon: BookOpen,
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
      name: "author",
      title: "Author",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "pdfFile",
      title: "PDF file",
      type: "file",
      options: { accept: ".pdf" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "imageWithAlt",
    }),
    defineField({
      name: "publishedAt",
      title: "Published date",
      type: "datetime",
      description: "Used to order books (newest first).",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Published, newest first",
      name: "publishedDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Title, A–Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "author", media: "coverImage" },
  },
});
