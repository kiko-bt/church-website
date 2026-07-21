"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  CONTACT_LIMITS,
  collectFieldErrors,
  contactFormSchema,
  type ContactFieldErrors,
  type ContactFormData,
} from "@/features/contact";
import { submitContactForm } from "@/features/contact/contact.action";
import { Button } from "@/components/ui/Button";

type FieldName = keyof ContactFormData;

const EMPTY_VALUES: ContactFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const FIELD_ORDER: readonly FieldName[] = ["name", "email", "subject", "message"];

// Controlled, accessible contact form. Validates with the SHARED Zod schema
// before submitting (client UX), then calls the server action which re-validates
// and sends. `useTransition` drives the pending/disabled state and, together
// with an explicit guard, prevents double submission.
export function ContactForm() {
  const t = useTranslations("contact");
  const baseId = useId();
  const [values, setValues] = useState<ContactFormData>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  const statusRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<FieldName, HTMLElement | null>>({
    name: null,
    email: null,
    subject: null,
    message: null,
  });

  const fieldId = (field: FieldName) => `${baseId}-${field}`;
  const errorId = (field: FieldName) => `${baseId}-${field}-error`;

  // Resolve a stable validation code to localized copy; fall back to the generic
  // message for any unexpected code (defensive — codes always come from the
  // shared schema).
  const errorText = (code: string | undefined): string | undefined => {
    if (!code) return undefined;
    const key = `validation.${code}`;
    return t.has(key) ? t(key) : t("error");
  };

  const focusFirstInvalid = (fieldErrors: ContactFieldErrors) => {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (first) fieldRefs.current[first]?.focus();
  };

  const handleChange = (field: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear this field's error and any submit-level status as the user edits.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    if (status !== "idle") setStatus("idle");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return; // guard against double submission

    const parsed = contactFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = collectFieldErrors(parsed.error);
      setErrors(fieldErrors);
      setStatus("idle");
      focusFirstInvalid(fieldErrors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await submitContactForm(parsed.data);

      if (result.status === "success") {
        setValues(EMPTY_VALUES);
        setErrors({});
        setStatus("success");
        statusRef.current?.focus();
        return;
      }

      if (result.status === "validation-error") {
        setErrors(result.fieldErrors);
        setStatus("idle");
        focusFirstInvalid(result.fieldErrors);
        return;
      }

      setStatus("error");
      statusRef.current?.focus();
    });
  };

  const inputClasses =
    "w-full rounded-sm border border-soft-gold bg-transparent px-4 py-2.5 text-text-primary placeholder:text-text-primary/40 focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold disabled:cursor-not-allowed disabled:opacity-60";
  const labelClasses = "mb-1.5 block text-sm font-medium text-text-primary/85";
  const errorClasses = "mt-1.5 text-sm text-red-700 dark:text-red-400";

  return (
    <section aria-labelledby={`${baseId}-heading`}>
      <h2
        id={`${baseId}-heading`}
        className="font-heading text-2xl font-semibold text-deep-dark"
      >
        {t("formHeading")}
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor={fieldId("name")} className={labelClasses}>
            {t("name")}
          </label>
          <input
            ref={(node) => {
              fieldRefs.current.name = node;
            }}
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(event) => handleChange("name", event.target.value)}
            maxLength={CONTACT_LIMITS.name.max}
            required
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? errorId("name") : undefined}
            disabled={isPending}
            placeholder={t("namePlaceholder")}
            className={inputClasses}
          />
          {errors.name && (
            <p id={errorId("name")} className={errorClasses}>
              {errorText(errors.name)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId("email")} className={labelClasses}>
            {t("email")}
          </label>
          <input
            ref={(node) => {
              fieldRefs.current.email = node;
            }}
            id={fieldId("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => handleChange("email", event.target.value)}
            maxLength={CONTACT_LIMITS.email.max}
            required
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? errorId("email") : undefined}
            disabled={isPending}
            placeholder={t("emailPlaceholder")}
            className={inputClasses}
          />
          {errors.email && (
            <p id={errorId("email")} className={errorClasses}>
              {errorText(errors.email)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId("subject")} className={labelClasses}>
            {t("subject")}
          </label>
          <input
            ref={(node) => {
              fieldRefs.current.subject = node;
            }}
            id={fieldId("subject")}
            name="subject"
            type="text"
            autoComplete="off"
            value={values.subject}
            onChange={(event) => handleChange("subject", event.target.value)}
            maxLength={CONTACT_LIMITS.subject.max}
            required
            aria-required="true"
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={errors.subject ? errorId("subject") : undefined}
            disabled={isPending}
            placeholder={t("subjectPlaceholder")}
            className={inputClasses}
          />
          {errors.subject && (
            <p id={errorId("subject")} className={errorClasses}>
              {errorText(errors.subject)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId("message")} className={labelClasses}>
            {t("message")}
          </label>
          <textarea
            ref={(node) => {
              fieldRefs.current.message = node;
            }}
            id={fieldId("message")}
            name="message"
            rows={6}
            autoComplete="off"
            value={values.message}
            onChange={(event) => handleChange("message", event.target.value)}
            maxLength={CONTACT_LIMITS.message.max}
            required
            aria-required="true"
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? errorId("message") : undefined}
            disabled={isPending}
            placeholder={t("messagePlaceholder")}
            className={`${inputClasses} resize-y`}
          />
          <div className="mt-1.5 flex items-start justify-between gap-4">
            {errors.message ? (
              <p id={errorId("message")} className={errorClasses.replace("mt-1.5 ", "")}>
                {errorText(errors.message)}
              </p>
            ) : (
              <span />
            )}
            <span
              aria-live="polite"
              className="shrink-0 text-sm tabular-nums text-text-primary/50"
            >
              {t("messageCounter", {
                count: values.message.length,
                max: CONTACT_LIMITS.message.max,
              })}
            </span>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {isPending ? t("sending") : t("send")}
        </Button>

        <div
          ref={statusRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className="focus-visible:outline-none"
        >
          {status === "success" && (
            <p className="rounded-sm border border-accent-gold/40 bg-warm-bg/60 px-4 py-3 text-sm text-text-primary">
              {t("success")}
            </p>
          )}
          {status === "error" && (
            <p className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-950/30 dark:text-red-300">
              {t("error")}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
