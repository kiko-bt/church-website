import { z } from "zod";

// Single source of truth for Contact form validation. The SAME schema runs on
// the client (pre-submit UX) and inside the server action (never trust the
// client). Field-level error messages are stable i18n KEYS, not human text —
// the client resolves them against `contact.validation.*` so validation copy is
// translated in one place and never duplicated.
//
// Every field is trimmed BEFORE its length checks, so surrounding whitespace is
// stripped and whitespace-only input collapses to "" and fails `min`.

export const CONTACT_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  subject: { min: 2, max: 150 },
  message: { min: 10, max: 5000 },
} as const;

// Coerce any non-string (undefined / number / object from a tampered payload)
// to "" so validation always fails with a known field code instead of Zod's
// generic "expected string" — keeps every error mappable to a translation key.
const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const contactFormSchema = z.object({
  name: z.preprocess(
    asString,
    z
      .string()
      .trim()
      .min(CONTACT_LIMITS.name.min, "nameMin")
      .max(CONTACT_LIMITS.name.max, "nameMax")
  ),
  email: z.preprocess(
    asString,
    z
      .string()
      .trim()
      .max(CONTACT_LIMITS.email.max, "emailMax")
      .email("emailInvalid")
  ),
  subject: z.preprocess(
    asString,
    z
      .string()
      .trim()
      .min(CONTACT_LIMITS.subject.min, "subjectMin")
      .max(CONTACT_LIMITS.subject.max, "subjectMax")
  ),
  message: z.preprocess(
    asString,
    z
      .string()
      .trim()
      .min(CONTACT_LIMITS.message.min, "messageMin")
      .max(CONTACT_LIMITS.message.max, "messageMax")
  ),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// A translation-key code per invalid field (first error wins), keyed by field.
export type ContactFieldErrors = Partial<Record<keyof ContactFormData, string>>;

// Reduce a ZodError to one code per field. Shared by the client (to render
// inline errors) and the server action (to return the same shape) — one mapping,
// no duplication.
export function collectFieldErrors(error: z.ZodError): ContactFieldErrors {
  const fieldErrors: ContactFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as keyof ContactFormData] = issue.message;
    }
  }
  return fieldErrors;
}
