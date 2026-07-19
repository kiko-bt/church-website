// Pure helper that turns a stored sermon video URL into an embeddable YouTube
// player URL. Zero dependencies (no React, no data, no Fuse), so it is safe to
// import from Server Components and build scripts alike and is unit-tested in
// isolation (see sermons.video.test.ts).
//
// Only YouTube URLs are recognised; anything else returns null and the UI falls
// back to a plain external "watch" link. The embed uses the privacy-enhanced
// host (youtube-nocookie.com), so no cookies are set until the visitor plays.

// A YouTube video id is exactly 11 URL-safe base64 characters.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

// Path prefixes that carry the id as the segment after them, e.g.
// /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>.
const ID_PATH_PREFIXES = new Set(["embed", "shorts", "live", "v"]);

export type YouTubeEmbed = {
  readonly videoId: string;
  readonly embedUrl: string;
};

function extractVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // Short share links: youtu.be/<id>
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && YOUTUBE_ID.test(id) ? id : null;
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    // Standard watch link: youtube.com/watch?v=<id>
    const v = url.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) return v;

    // Path-based forms: /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const [prefix, id] = url.pathname.split("/").filter(Boolean);
    if (prefix && ID_PATH_PREFIXES.has(prefix) && id && YOUTUBE_ID.test(id)) {
      return id;
    }
  }

  return null;
}

/**
 * Returns the embeddable YouTube player URL for a sermon video URL, or null if
 * the URL is missing, malformed, or not a recognised YouTube link.
 */
export function getYouTubeEmbed(
  url: string | undefined | null
): YouTubeEmbed | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  const videoId = extractVideoId(parsed);
  if (!videoId) return null;

  return {
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}
