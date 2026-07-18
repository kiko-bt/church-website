import { test } from "node:test";
import assert from "node:assert/strict";
import { renderContactEmail } from "./contact.email.ts";
import type { ContactFormData } from "./contact.schema.ts";

// Run with:  node --test --experimental-strip-types  (wired up as `npm test`).

const baseData: ContactFormData = {
  name: "John Doe",
  email: "john@example.com",
  subject: "A question",
  message: "Hello there.",
};

const fixedDate = new Date("2026-07-16T10:30:00.000Z");

test("includes every field and a timestamp", () => {
  const email = renderContactEmail(baseData, fixedDate);
  assert.match(email.html, /John Doe/);
  assert.match(email.html, /john@example\.com/);
  assert.match(email.html, /A question/);
  assert.match(email.html, /Hello there\./);
  assert.match(email.html, /2026-07-16T10:30:00\.000Z/);
  assert.match(email.text, /Name: John Doe/);
  assert.match(email.text, /Email: john@example\.com/);
  assert.match(email.text, /Subject: A question/);
  assert.match(email.text, /Submitted: 2026-07-16T10:30:00\.000Z/);
});

test("escapes HTML in user input (no injection / XSS)", () => {
  const email = renderContactEmail(
    {
      ...baseData,
      name: '<script>alert("x")</script>',
      message: "<img src=x onerror=alert(1)>",
    },
    fixedDate
  );
  assert.ok(!email.html.includes("<script>"));
  assert.ok(!email.html.includes("<img src=x"));
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.html, /&lt;img src=x/);
});

test("strips CR/LF from the subject to prevent header injection", () => {
  const email = renderContactEmail(
    { ...baseData, subject: "Hi\r\nBcc: victim@example.com" },
    fixedDate
  );
  assert.ok(!email.subject.includes("\n"));
  assert.ok(!email.subject.includes("\r"));
  assert.equal(email.subject, "Contact form: Hi Bcc: victim@example.com");
});

test("converts message newlines to <br /> in the HTML body", () => {
  const email = renderContactEmail(
    { ...baseData, message: "Line one\nLine two" },
    fixedDate
  );
  assert.match(email.html, /Line one<br \/>Line two/);
});
