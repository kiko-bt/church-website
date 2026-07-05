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
//   - PRODUCTION (recommended): send the secret in the
//     `x-sanity-revalidate-secret` HTTP header. Configure the Sanity webhook to
//     attach this header. Headers are not captured in URL/access logs.
//   - LOCAL / MANUAL TESTING ONLY: the `?secret=` query param is accepted as a
//     fallback for quick curl/browser checks. Avoid it in production — query
//     strings can be recorded in proxy and access logs.
// The header takes precedence; the query param is only consulted when the
// header is absent. Webhook body must be JSON including `_type`.

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

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return false;

  // Header is the production transport; the query param is a local/manual
  // testing fallback only (see file header). Header wins when both are present.
  const provided =
    request.headers.get("x-sanity-revalidate-secret") ??
    new URL(request.url).searchParams.get("secret");

  return provided === secret;
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
