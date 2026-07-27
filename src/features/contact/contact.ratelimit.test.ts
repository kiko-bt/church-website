import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  RATE_LIMIT,
  __resetRateLimitForTests,
  checkRateLimit,
} from "./contact.ratelimit.ts";

// Run with:  node --test --experimental-strip-types  (wired up as `npm test`).

beforeEach(() => __resetRateLimitForTests());

test("allows submissions up to the limit", () => {
  for (let i = 1; i <= RATE_LIMIT.maxSubmissions; i++) {
    assert.equal(checkRateLimit("1.2.3.4"), true, `submission ${i} should pass`);
  }
});

test("blocks the submission after the limit is reached", () => {
  for (let i = 0; i < RATE_LIMIT.maxSubmissions; i++) checkRateLimit("1.2.3.4");
  assert.equal(checkRateLimit("1.2.3.4"), false);
  // Still blocked on further attempts within the same window.
  assert.equal(checkRateLimit("1.2.3.4"), false);
});

test("tracks each IP independently", () => {
  for (let i = 0; i < RATE_LIMIT.maxSubmissions; i++) checkRateLimit("1.2.3.4");
  assert.equal(checkRateLimit("1.2.3.4"), false, "first IP is exhausted");
  assert.equal(checkRateLimit("5.6.7.8"), true, "a different IP is unaffected");
});

// Fail-open is deliberate: an unidentifiable client must never be funnelled
// into a shared bucket, or one anonymous caller could lock out real visitors.
test("never limits a request with no identifiable IP", () => {
  for (let i = 0; i < RATE_LIMIT.maxSubmissions * 3; i++) {
    assert.equal(checkRateLimit(null), true);
  }
});

test("allows submissions again once the window has elapsed", () => {
  const realNow = Date.now;
  const start = realNow.call(Date);
  try {
    Date.now = () => start;
    for (let i = 0; i < RATE_LIMIT.maxSubmissions; i++) checkRateLimit("1.2.3.4");
    assert.equal(checkRateLimit("1.2.3.4"), false, "exhausted inside the window");

    // Move past the window; the bucket expires and the caller starts fresh.
    Date.now = () => start + RATE_LIMIT.windowMs + 1;
    assert.equal(checkRateLimit("1.2.3.4"), true);
  } finally {
    Date.now = realNow;
  }
});
