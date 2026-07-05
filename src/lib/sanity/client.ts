import { createClient, type SanityClient } from "@sanity/client";

// Read-only Sanity client (infrastructure). Domain GROQ queries live in
// `features/<feature>/<feature>.queries.ts`; this module only owns the client.
//
// The client is instantiated ONLY when a project id is configured, so builds
// and local development without Sanity credentials still succeed — the feature
// data accessors detect a `null` client and fall back to empty content.
//
// Public dataset reads go through the CDN and need no token. NEVER place a
// write or management token here (see .claude/security-rules.md).
//
// `perspective: "published"` is explicit (not relied upon implicitly): only
// published documents are ever returned, so unpublished drafts can never leak
// to the public site even if a token is added here in the future. It also means
// published documents keep their bare `_id` (e.g. "churchSettings"), which the
// fixed-id singleton queries depend on.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export const sanityClient: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2024-01-01",
      useCdn: true,
      perspective: "published",
    })
  : null;
