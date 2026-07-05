import { defineType, defineArrayMember } from "sanity";

// Portable Text rich-text content for long-form editorial copy (homepage
// welcome / short message). Intentionally minimal: a small set of block styles,
// lists, inline marks, and external links — no embedded images or custom blocks
// yet. The matching domain type is `RichTextContent` (src/types/sanity.ts) and
// rendering is handled by the shared PortableTextRenderer
// (src/components/portable-text/PortableTextRenderer.tsx).
export const richText = defineType({
  name: "richText",
  title: "Rich text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            title: "Link",
            type: "object",
            fields: [
              {
                name: "href",
                title: "URL",
                type: "url",
                validation: (rule) =>
                  rule
                    .uri({ scheme: ["https", "mailto"] })
                    .error("Must be a valid https or mailto URL."),
              },
            ],
          },
        ],
      },
    }),
  ],
});
