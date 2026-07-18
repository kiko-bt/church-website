import type { ContactFormData } from "./contact.schema";

// Builds the notification email sent to the church when the contact form is
// submitted. All user input is HTML-escaped before it reaches the markup (no
// HTML injection / stored-XSS in the inbox), and header-bound values are
// stripped of CR/LF (no email header injection).

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

// Collapse CR/LF to a space so a crafted value can never inject extra email
// headers (Subject / Reply-To etc.).
function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export type RenderedContactEmail = {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
};

// `submittedAt` is injectable so the output is deterministic in tests.
export function renderContactEmail(
  data: ContactFormData,
  submittedAt: Date = new Date()
): RenderedContactEmail {
  const timestamp = submittedAt.toISOString();
  const subject = sanitizeHeader(`Contact form: ${data.subject}`);

  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const subjectText = escapeHtml(data.subject);
  const messageHtml = escapeHtml(data.message).replace(/\r?\n/g, "<br />");
  const submitted = escapeHtml(timestamp);

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f5f1e9;font-family:Inter,Arial,sans-serif;color:#2d2d2d;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fdfdfd;border:1px solid #e6d7a3;border-radius:8px;">
      <tr>
        <td style="padding:24px 28px;border-bottom:1px solid #e6d7a3;">
          <h1 style="margin:0;font-size:18px;color:#0f172a;">New contact message</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#8a825f;">Name</p>
          <p style="margin:0 0 18px;font-size:15px;">${name}</p>
          <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#8a825f;">Email</p>
          <p style="margin:0 0 18px;font-size:15px;"><a href="mailto:${email}" style="color:#c9a227;">${email}</a></p>
          <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#8a825f;">Subject</p>
          <p style="margin:0 0 18px;font-size:15px;">${subjectText}</p>
          <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#8a825f;">Message</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">${messageHtml}</p>
          <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#8a825f;">Submitted</p>
          <p style="margin:0;font-size:13px;color:#6b6b6b;">${submitted}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "New contact message",
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Subject: ${data.subject}`,
    `Submitted: ${timestamp}`,
    "",
    data.message,
  ].join("\n");

  return { subject, html, text };
}
