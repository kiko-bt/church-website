// Per-IP rate limiting for the contact form (.claude/security-rules.md — "use
// rate limiting"). Complements `contact.antispam.ts`: the honeypot/timing gate
// catches naive bots, this bounds how often ANY single client — bot or human —
// can send mail, protecting the church inbox and the Resend quota from a flood.
//
// DELIBERATELY DEPENDENCY-FREE. A durable limiter would need a shared store
// (Redis/Upstash), which the architecture rules exclude ("no backend
// complexity", "no new libraries without approval). This is an in-memory fixed
// window, with the limits that implies — stated plainly rather than overclaimed:
//
//   • Per serverless instance. Vercel may run several concurrent instances, so
//     the effective global limit is MAX_SUBMISSIONS × instances.
//   • Reset by a cold start. An idle instance is reclaimed and its counters go
//     with it.
//   • Per IP, so it does not stop a distributed flood from many addresses.
//
// It reliably stops the realistic threat — one script hammering the endpoint —
// and costs nothing. If abuse ever gets past it, the upgrade path is a shared
// store behind this same `checkRateLimit()` signature; no caller changes.

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SUBMISSIONS = 5; // per IP, per window

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Drop expired buckets so the map cannot grow without bound on a long-lived
// instance. Cheap: the map only ever holds IPs seen within the last window.
function prune(now: number): void {
  for (const [ip, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(ip);
  }
}

/**
 * Records a submission attempt and reports whether it is allowed.
 *
 * Fails OPEN for an unidentifiable client: when the platform gives us no IP we
 * skip limiting rather than funnel every such request into one shared bucket,
 * which would let a single anonymous caller lock out genuine visitors. Bot
 * traffic without an IP is still covered by the honeypot/timing gate.
 */
export function checkRateLimit(ip: string | null): boolean {
  if (!ip) return true;

  const now = Date.now();
  prune(now);

  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= MAX_SUBMISSIONS;
}

// Exposed for tests and for logging context; not part of the request path.
export const RATE_LIMIT = {
  windowMs: WINDOW_MS,
  maxSubmissions: MAX_SUBMISSIONS,
} as const;

// Test-only: reset module state between cases (the map is module-level by
// design, which would otherwise leak counts across tests).
export function __resetRateLimitForTests(): void {
  buckets.clear();
}
