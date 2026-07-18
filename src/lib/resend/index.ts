import { Resend } from "resend";

// Resend email client (cross-cutting infrastructure). Domain email CONTENT is
// built in the contact feature (`features/contact/contact.email.ts`); this
// module owns only the client, its configuration, and a typed send.
//
// The client is instantiated ONLY when RESEND_API_KEY is present, mirroring the
// nullable Sanity client pattern — so builds and local dev without email
// credentials never crash. Callers treat a missing config / failed send as a
// graceful, generic failure (they never see provider internals).

const apiKey = process.env.RESEND_API_KEY;

const client = apiKey ? new Resend(apiKey) : null;

export type ContactEmailConfig = {
  readonly from: string;
  readonly to: string;
};

// Sender + recipient for the contact notification. Returns null when email is
// not fully configured (missing key, from, or to) so the caller can fail
// gracefully instead of throwing. `RESEND_TO_EMAIL` is the recipient (the same
// var already used as the site's public contact address); `RESEND_FROM_EMAIL`
// must be an address on a Resend-verified domain.
export function getContactEmailConfig(): ContactEmailConfig | null {
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.RESEND_TO_EMAIL;
  if (!client || !from || !to) return null;
  return { from, to };
}

export type SendEmailParams = {
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly replyTo?: string;
};

// Sends one email. Returns true on success. On a Resend-reported error it logs
// the real reason SERVER-SIDE and returns false — provider details never leave
// this module. Thrown network/unexpected errors propagate to the caller to
// catch and map to a generic failure.
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!client) return false;

  const { error } = await client.emails.send({
    from: params.from,
    to: params.to,
    replyTo: params.replyTo,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    console.error(`[resend] Email send failed: ${error.name} — ${error.message}`);
    return false;
  }

  return true;
}
