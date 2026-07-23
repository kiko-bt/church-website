"use server";

import { getContactEmailConfig, sendEmail } from "@/lib/resend";
import { isLikelySpam } from "./contact.antispam";
import { renderContactEmail } from "./contact.email";
import { collectFieldErrors, contactFormSchema } from "./contact.schema";
import type { ContactActionResult } from "./contact.types";

// Server action for the contact form (the project's approved Contact transport —
// see .claude/architecture.rules.md "Contact Flow: Use Server Actions").
//
// Flow: re-validate with the shared Zod schema (never trust the client) →
// confirm email is configured → render + send via Resend → map every failure to
// a generic, user-safe result. Real errors are logged server-side only; the
// browser never sees provider/exception details.

// Stable, user-safe i18n key the client resolves against `contact.error`.
const SERVER_ERROR_KEY = "error";

export async function submitContactForm(
  input: unknown
): Promise<ContactActionResult> {
  // Silent anti-abuse gate (honeypot + submit timing). A hit is acknowledged as
  // success — so a bot learns nothing about the trap — but no email is sent.
  if (isLikelySpam(input)) {
    console.warn(
      "[contact] Submission blocked by anti-spam gate (honeypot/timing). No email sent."
    );
    return { status: "success" };
  }

  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "validation-error",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }

  const config = getContactEmailConfig();
  if (!config) {
    console.error(
      "[contact] Email is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL / RESEND_TO_EMAIL). Message not sent."
    );
    return { status: "server-error", message: SERVER_ERROR_KEY };
  }

  try {
    const email = renderContactEmail(parsed.data);
    const sent = await sendEmail({
      from: config.from,
      to: config.to,
      // Validated email (no CR/LF possible) — safe as a Reply-To header.
      replyTo: parsed.data.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (!sent) {
      return { status: "server-error", message: SERVER_ERROR_KEY };
    }

    return { status: "success" };
  } catch (error) {
    console.error("[contact] Unexpected error while sending message:", error);
    return { status: "server-error", message: SERVER_ERROR_KEY };
  }
}
