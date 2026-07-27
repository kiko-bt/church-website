import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SANITY_TAGS, type SanityTag } from "@/lib/sanity/tags";

// On-demand SSG revalidation for Sanity content (the project's single approved
// infrastructure API route — see .claude/architecture.rules.md). A Sanity
// webhook POSTs the changed document here on publish; this route validates a
// shared secret, maps the document `_type` to a cache tag, and revalidates it.
//
// Secret transport:
//   - PRODUCTION: the secret MUST be sent in the `x-sanity-revalidate-secret`
//     HTTP header. Configure the Sanity webhook to attach this header. Headers
//     are not captured in URL/access logs. The `?secret=` query param is
//     IGNORED in production (NODE_ENV === "production") so a misconfigured
//     webhook can never leak the secret into proxy/access logs.
//   - LOCAL / MANUAL TESTING ONLY: outside production the `?secret=` query
//     param is accepted as a fallback for quick curl/browser checks.
// The header always takes precedence; the query param is only consulted (and
// only outside production) when the header is absent. Body must be JSON with `_type`.

// Maps a Sanity document type to the cache tag used by the feature data layer.
const TYPE_TO_TAG: Record<string, SanityTag> = {
  sermon: SANITY_TAGS.sermon,
  book: SANITY_TAGS.book,
  galleryAlbum: SANITY_TAGS.gallery,
  churchSettings: SANITY_TAGS.churchSettings,
  homeContent: SANITY_TAGS.homeContent,
};

const webhookBodySchema = z.object({
  _type: z.string().min(1),
});

// Length-independent, constant-time secret comparison. `timingSafeEqual` throws
// unless both buffers are the same length, so the length check comes first —
// that leak (the length of the expected secret) is accepted and standard, while
// the byte-by-byte comparison itself reveals nothing through timing.
function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return false;

  // Header is the production transport and always wins. The query param is a
  // local/manual-testing fallback only and is ignored in production (see file
  // header) so it can never leak the secret into access logs.
  const headerSecret = request.headers.get("x-sanity-revalidate-secret");
  const querySecret =
    process.env.NODE_ENV === "production"
      ? null
      : new URL(request.url).searchParams.get("secret");

  const provided = headerSecret ?? querySecret;
  if (!provided) return false;
  return secretsMatch(provided, secret);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = webhookBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const tag = TYPE_TO_TAG[parsed.data._type];
  if (!tag) {
    // Unknown type — acknowledge without revalidating anything.
    return NextResponse.json({ revalidated: false, type: parsed.data._type });
  }

  revalidateTag(tag);
  return NextResponse.json({ revalidated: true, tag });
}
