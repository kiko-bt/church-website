"use client";

import { useEffect } from "react";

// Root error boundary — the last line of defense. This only fires if the ROOT
// layout itself fails (very rare), so it replaces the entire document and must
// render its own <html>/<body>. It cannot rely on the app's providers, fonts,
// or translations, so it is deliberately minimal, dependency-free, and inline-
// styled, with bilingual copy because the active locale is unknown here.
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Fatal root error:", error);
  }, [error]);

  return (
    <html lang="mk">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#fdfdfd",
          color: "#2d2d2d",
        }}
      >
        <div style={{ maxWidth: 480, padding: "2rem", textAlign: "center" }}>
          <h1
            style={{ fontSize: "1.5rem", margin: "0 0 0.75rem", color: "#0f172a" }}
          >
            Настана грешка · Something went wrong
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            Обидете се повторно. · Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: 4,
              background: "#806309",
              color: "#ffffff",
              padding: "0.6rem 1.25rem",
              fontSize: "1rem",
            }}
          >
            Обиди се повторно · Try again
          </button>
        </div>
      </body>
    </html>
  );
}
