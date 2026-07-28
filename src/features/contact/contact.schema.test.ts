import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_LIMITS,
  collectFieldErrors,
  contactFormSchema,
} from "./contact.schema.ts";

// Run with:  node --test  (wired up as `npm test`).
// Zero external dependencies beyond Zod.

const validInput = {
  name: "John Doe",
  email: "john@example.com",
  subject: "A question about services",
  message: "Hello, I would like to learn more about your community.",
};

test("valid input parses successfully", () => {
  const result = contactFormSchema.safeParse(validInput);
  assert.ok(result.success);
  assert.deepEqual(result.data, validInput);
});

test("trims surrounding whitespace on every field", () => {
  const result = contactFormSchema.safeParse({
    name: "  John Doe  ",
    email: "  john@example.com  ",
    subject: "  Hello there  ",
    message: "  This is a message with padding around it.  ",
  });
  assert.ok(result.success);
  assert.equal(result.data.name, "John Doe");
  assert.equal(result.data.email, "john@example.com");
  assert.equal(result.data.subject, "Hello there");
  assert.equal(result.data.message, "This is a message with padding around it.");
});

test("whitespace-only input fails required checks", () => {
  const result = contactFormSchema.safeParse({
    name: "   ",
    email: "   ",
    subject: "   ",
    message: "          ",
  });
  assert.ok(!result.success);
  const errors = collectFieldErrors(result.error);
  assert.equal(errors.name, "nameMin");
  assert.equal(errors.email, "emailInvalid");
  assert.equal(errors.subject, "subjectMin");
  assert.equal(errors.message, "messageMin");
});

test("empty payload fails with a code per field", () => {
  const result = contactFormSchema.safeParse({});
  assert.ok(!result.success);
  const errors = collectFieldErrors(result.error);
  assert.equal(errors.name, "nameMin");
  assert.equal(errors.email, "emailInvalid");
  assert.equal(errors.subject, "subjectMin");
  assert.equal(errors.message, "messageMin");
});

test("rejects an invalid email", () => {
  const result = contactFormSchema.safeParse({ ...validInput, email: "not-an-email" });
  assert.ok(!result.success);
  assert.equal(collectFieldErrors(result.error).email, "emailInvalid");
});

test("rejects a name shorter than the minimum", () => {
  const result = contactFormSchema.safeParse({ ...validInput, name: "A" });
  assert.ok(!result.success);
  assert.equal(collectFieldErrors(result.error).name, "nameMin");
});

test("rejects a name longer than the maximum", () => {
  const result = contactFormSchema.safeParse({
    ...validInput,
    name: "a".repeat(CONTACT_LIMITS.name.max + 1),
  });
  assert.ok(!result.success);
  assert.equal(collectFieldErrors(result.error).name, "nameMax");
});

test("rejects a subject longer than the maximum", () => {
  const result = contactFormSchema.safeParse({
    ...validInput,
    subject: "a".repeat(CONTACT_LIMITS.subject.max + 1),
  });
  assert.ok(!result.success);
  assert.equal(collectFieldErrors(result.error).subject, "subjectMax");
});

test("rejects a message shorter than the minimum", () => {
  const result = contactFormSchema.safeParse({ ...validInput, message: "too short" });
  assert.ok(!result.success);
  assert.equal(collectFieldErrors(result.error).message, "messageMin");
});

test("rejects a message longer than the maximum", () => {
  const result = contactFormSchema.safeParse({
    ...validInput,
    message: "a".repeat(CONTACT_LIMITS.message.max + 1),
  });
  assert.ok(!result.success);
  assert.equal(collectFieldErrors(result.error).message, "messageMax");
});

test("coerces non-string fields to a known validation failure", () => {
  const result = contactFormSchema.safeParse({
    name: 42,
    email: null,
    subject: undefined,
    message: {},
  });
  assert.ok(!result.success);
  const errors = collectFieldErrors(result.error);
  assert.equal(errors.name, "nameMin");
  assert.equal(errors.email, "emailInvalid");
  assert.equal(errors.subject, "subjectMin");
  assert.equal(errors.message, "messageMin");
});

test("strips unexpected fields from the parsed output", () => {
  const result = contactFormSchema.safeParse({
    ...validInput,
    isAdmin: true,
    extra: "ignored",
  });
  assert.ok(result.success);
  assert.deepEqual(Object.keys(result.data).sort(), [
    "email",
    "message",
    "name",
    "subject",
  ]);
});
