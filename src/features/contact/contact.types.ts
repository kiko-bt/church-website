import type { ContactFieldErrors } from "./contact.schema";

// Typed result of the contact server action — a discriminated union that the
// client consumes by switching on `status`. `message` is a stable, user-safe
// i18n KEY (never a raw provider/exception message); real failures are logged
// server-side only.
export type ContactActionResult =
  | { status: "success" }
  | { status: "validation-error"; fieldErrors: ContactFieldErrors }
  | { status: "server-error"; message: string };
