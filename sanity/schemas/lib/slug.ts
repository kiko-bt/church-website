// URL-safe slug utilities shared by every document type that exposes a `slug`
// (sermon, book, galleryAlbum). Kept inside `sanity/` so both this project and
// the standalone Studio (studio-church-ehb) get them from the single shared
// schema source.
//
// WHY THIS EXISTS: Macedonian (Cyrillic) titles produced Cyrillic slugs, and
// Next.js's static route resolver 404s on prerendered dynamic routes whose
// params contain non-ASCII characters — the prerendered key is stored decoded
// (e.g. `/mk/sermons/десетте…`) but browsers request the percent-encoded path,
// and the two never reconcile. Transliterating titles to Latin ASCII removes
// that whole failure class and keeps URLs shareable and SEO-friendly.

// Macedonian Cyrillic → ASCII Latin. Lowercase keys only; `mkSlugify`
// lowercases before mapping. Digraphs (ѓ→gj, ж→zh, …) keep the slug readable.
const CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ѓ: "gj", е: "e", ж: "zh",
  з: "z", ѕ: "dz", и: "i", ј: "j", к: "k", л: "l", љ: "lj", м: "m",
  н: "n", њ: "nj", о: "o", п: "p", р: "r", с: "s", т: "t", ќ: "kj",
  у: "u", ф: "f", х: "h", ц: "c", ч: "ch", џ: "dj", ш: "sh",
};

// A valid slug: lowercase Latin alphanumerics in hyphen-separated groups, with
// no leading/trailing or repeated hyphens.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Transliterate + normalize any title into a URL-safe ASCII slug. Wired into
 * each slug field's `options.slugify`, so the Studio's "Generate" button always
 * produces a routable slug from a Macedonian title.
 */
export function mkSlugify(input: string): string {
  return Array.from(input.toLowerCase())
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-") // any other run of chars → single hyphen
    .replace(/^-+|-+$/g, ""); // trim edge hyphens
}

/**
 * Studio validation: reject a slug that is not URL-safe ASCII, so a manually
 * typed Cyrillic/space/colon slug is caught in the editor before it can ship a
 * 404. Presence is enforced separately by `.required()`, so empty passes here.
 */
export function isValidSlug(value?: { current?: string }): true | string {
  const current = value?.current;
  if (!current) return true;
  return (
    SLUG_PATTERN.test(current) ||
    "Use lowercase Latin letters, numbers and hyphens only (no spaces, Cyrillic or punctuation). Click ‘Generate’ to fix."
  );
}
