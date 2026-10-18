// Copies plain text to the clipboard from a user gesture. Uses the async
// Clipboard API where available (secure contexts); otherwise falls back to
// `execCommand("copy")`, with a one-shot `copy` listener that supplies the
// exact text, for older mobile browsers and WebViews. Never throws.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or unavailable — try the legacy path below.
  }

  const onCopy = (event: ClipboardEvent) => {
    event.clipboardData?.setData("text/plain", text);
    event.preventDefault();
  };
  document.addEventListener("copy", onCopy, { once: true });
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.removeEventListener("copy", onCopy);
  }
}
