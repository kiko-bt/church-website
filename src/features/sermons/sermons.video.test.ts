import { test } from "node:test";
import assert from "node:assert/strict";
import { getYouTubeEmbed } from "./sermons.video.ts";

// Run with:  node --test --experimental-strip-types  (wired up as `npm test`).
// Zero external dependencies.

const ID = "dQw4w9WgXcQ"; // 11 chars, a valid YouTube id shape.
const EMBED = `https://www.youtube-nocookie.com/embed/${ID}`;

test("parses a standard watch URL", () => {
  assert.deepEqual(getYouTubeEmbed(`https://www.youtube.com/watch?v=${ID}`), {
    videoId: ID,
    embedUrl: EMBED,
  });
});

test("parses a youtu.be short link", () => {
  assert.deepEqual(getYouTubeEmbed(`https://youtu.be/${ID}`), {
    videoId: ID,
    embedUrl: EMBED,
  });
});

test("parses embed, shorts, and live path forms", () => {
  for (const path of ["embed", "shorts", "live", "v"]) {
    assert.equal(
      getYouTubeEmbed(`https://www.youtube.com/${path}/${ID}`)?.videoId,
      ID,
      `expected ${path} form to resolve`
    );
  }
});

test("ignores extra query params and timestamps", () => {
  assert.equal(
    getYouTubeEmbed(`https://www.youtube.com/watch?v=${ID}&t=42s&list=abc`)
      ?.videoId,
    ID
  );
  assert.equal(getYouTubeEmbed(`https://youtu.be/${ID}?t=42`)?.videoId, ID);
});

test("handles the mobile and nocookie hosts", () => {
  assert.equal(
    getYouTubeEmbed(`https://m.youtube.com/watch?v=${ID}`)?.videoId,
    ID
  );
  assert.equal(
    getYouTubeEmbed(`https://www.youtube-nocookie.com/embed/${ID}`)?.videoId,
    ID
  );
});

test("returns null for non-YouTube URLs", () => {
  assert.equal(getYouTubeEmbed("https://vimeo.com/123456789"), null);
  assert.equal(getYouTubeEmbed("https://example.com/watch?v=abc"), null);
});

test("returns null for malformed ids and inputs", () => {
  assert.equal(getYouTubeEmbed(`https://youtu.be/tooShort`), null);
  assert.equal(getYouTubeEmbed("https://www.youtube.com/watch?v="), null);
  assert.equal(getYouTubeEmbed("not a url"), null);
  assert.equal(getYouTubeEmbed(""), null);
  assert.equal(getYouTubeEmbed(undefined), null);
  assert.equal(getYouTubeEmbed(null), null);
});

test("rejects non-http protocols", () => {
  assert.equal(getYouTubeEmbed(`javascript:alert(1)//youtu.be/${ID}`), null);
});
