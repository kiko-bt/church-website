import { defineType, defineField } from "sanity";
import { Images } from "lucide-react";

// A gallery album groups related photos (an event, a service, a holiday). Images
// are embedded `imageWithAlt` objects rather than separate documents, so a
// non-technical editor manages photos inline — no reference graph to maintain.
//
// Title/description/captions are single-language (Macedonian) content. `date`
// is the event date and drives ordering; `featured` is ready for future use.
export const galleryAlbum = defineType({
  name: "galleryAlbum",
  title: "Gallery Album",
  type: "document",
  icon: Images,
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
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "datetime",
      description: "When the photos were taken. Used to order albums.",
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "imageWithAlt" }],
      validation: (rule) => rule.required().min(1),
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
      title: "Date, newest first",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", images: "images", media: "images.0" },
    prepare: ({ title, images, media }) => ({
      title,
      subtitle: images?.length
        ? `${images.length} image${images.length === 1 ? "" : "s"}`
        : "No images",
      media,
    }),
  },
});
