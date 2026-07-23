import { test } from "node:test";
import assert from "node:assert/strict";
import { ANTISPAM, isLikelySpam } from "./contact.antispam.ts";

// Run with:  node --test --experimental-strip-types  (wired up as `npm test`).

const validPayload = {
  name: "John Doe",
  email: "john@example.com",
  subject: "A question",
  message: "Hello, I would like to learn more.",
  [ANTISPAM.honeypotField]: "",
  elapsedMs: ANTISPAM.minSubmitMs + 5_000,
};

test("passes a genuine, slow, empty-honeypot submission", () => {
  assert.equal(isLikelySpam(validPayload), false);
});

test("flags a filled honeypot as spam", () => {
  assert.equal(
    isLikelySpam({ ...validPayload, [ANTISPAM.honeypotField]: "spam" }),
    true
  );
});

test("ignores a whitespace-only honeypot (treated as empty)", () => {
  assert.equal(
    isLikelySpam({ ...validPayload, [ANTISPAM.honeypotField]: "   " }),
    false
  );
});

test("flags a submission faster than the minimum submit time", () => {
  assert.equal(
    isLikelySpam({ ...validPayload, elapsedMs: ANTISPAM.minSubmitMs - 1 }),
    true
  );
});

test("allows a submission exactly at the minimum submit time", () => {
  assert.equal(
    isLikelySpam({ ...validPayload, elapsedMs: ANTISPAM.minSubmitMs }),
    false
  );
});

test("ignores a missing duration rather than dropping the message", () => {
  const noTiming = {
    name: validPayload.name,
    email: validPayload.email,
    subject: validPayload.subject,
    message: validPayload.message,
    [ANTISPAM.honeypotField]: "",
  };
  assert.equal(isLikelySpam(noTiming), false);
});

test("ignores garbage or negative durations (no false positive)", () => {
  assert.equal(isLikelySpam({ ...validPayload, elapsedMs: NaN }), false);
  assert.equal(isLikelySpam({ ...validPayload, elapsedMs: "soon" }), false);
  assert.equal(isLikelySpam({ ...validPayload, elapsedMs: Infinity }), false);
  // A negative delta (e.g. a monotonic-clock quirk) must not count as too-fast.
  assert.equal(isLikelySpam({ ...validPayload, elapsedMs: -100 }), false);
});

test("a filled honeypot is spam even with a slow, valid duration", () => {
  assert.equal(
    isLikelySpam({
      ...validPayload,
      [ANTISPAM.honeypotField]: "bot",
      elapsedMs: 60_000,
    }),
    true
  );
});

test("returns false for non-object input (schema validation handles it)", () => {
  assert.equal(isLikelySpam(null), false);
  assert.equal(isLikelySpam(undefined), false);
  assert.equal(isLikelySpam("string"), false);
  assert.equal(isLikelySpam(42), false);
});
