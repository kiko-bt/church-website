// Dependency-free anti-abuse gate for the contact form (see .claude/security-
// rules.md — "rate limiting for contact forms"). A durable per-IP limiter needs
// a shared store (a new dependency + infra); this is the no-dependency layer
// that stops the common, naive bot traffic within the existing architecture:
//
//   1. Honeypot — a hidden field a human never sees or fills. Any value in it
//      means an automated agent filled every input on the form.
//   2. Submit timing — the client measures how long the form was on screen
//      before submission; a delta faster than a human could plausibly type the
//      message is a bot.
//
// The timing value is `elapsedMs`, a duration the CLIENT computes from a single
// monotonic clock (`performance.now()`), NOT an absolute timestamp compared
// against the server clock. This is deliberate: comparing a client timestamp to
// the server's `Date.now()` would misfire on any device whose clock is skewed
// ahead of the server, silently dropping a genuine message. A same-clock delta
// cannot be affected by skew or by a mid-session clock correction.
//
// A hit is handled by the server action as a SILENT success (logged, no email
// sent) so bots gain no signal about the trap. Both signals are best-effort by
// nature (a client can omit or forge the timing value), but together they
// eliminate the bulk of drive-by spam without a store or a third-party service.

export const ANTISPAM = {
  // Name of the hidden honeypot input. The client input and the payload key
  // both derive from this constant so they can never drift apart.
  honeypotField: "website",
  // Minimum plausible time (ms) the form is on screen before a genuine submit.
  // The message field alone requires ≥10 typed characters, so a real human
  // submission is always far slower than this — the threshold is deliberately
  // conservative to avoid ever silently dropping a real message.
  minSubmitMs: 1500,
} as const;

// Returns true when the submission looks automated. Pure: it reads only the
// (client-measured) `elapsedMs` duration and the honeypot value, so there is no
// clock-skew failure mode and it is fully deterministic to test.
export function isLikelySpam(input: unknown): boolean {
  if (typeof input !== "object" || input === null) return false;
  const record = input as Record<string, unknown>;

  // Honeypot: real users never fill this hidden field.
  const honeypot = record[ANTISPAM.honeypotField];
  if (typeof honeypot === "string" && honeypot.trim() !== "") return true;

  // Timing: only enforced when the client supplied a sane, non-negative
  // duration. A missing/garbage/negative value is ignored rather than treated
  // as spam, so a real user is never dropped by a measurement quirk — the
  // honeypot still covers naive bots in that case.
  const elapsedMs = record.elapsedMs;
  if (
    typeof elapsedMs === "number" &&
    Number.isFinite(elapsedMs) &&
    elapsedMs >= 0 &&
    elapsedMs < ANTISPAM.minSubmitMs
  ) {
    return true;
  }

  return false;
}
