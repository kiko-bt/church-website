import type { JsonLdObject } from "@/lib/seo/structured-data";

// Renders one or more Schema.org nodes as a JSON-LD <script>. Server component
// (no client JS). The payload is serialized with `<` escaped to `<` so a
// value containing "</script>" can never break out of the script element — the
// standard, required guard for inlined JSON-LD.
type JsonLdProps = {
  readonly data: JsonLdObject | readonly JsonLdObject[];
};

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
