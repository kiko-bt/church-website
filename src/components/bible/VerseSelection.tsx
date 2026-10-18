"use client";

import { useEffect } from "react";
import { formatVerseCitation } from "@/features/bible/bible.citation";
import { copyText } from "@/lib/utils/clipboard";

type VerseSelectionProps = {
  readonly copiedMessage: string;
  readonly failedMessage: string;
};

type CopyState = "copied" | "failed";

// How long a Copy button shows "Copied" / "Copy failed".
const FEEDBACK_MS = 2000;

const collapseSpace = (value: string) => value.replace(/\s+/g, " ").trim();

// The parts of a verse rendered by VerseList.
function verseParts(item: Element) {
  const content = item.querySelector<HTMLElement>("[data-verse-content]");
  const text = item.querySelector<HTMLElement>("[data-verse-text]");
  const reference = item.querySelector<HTMLElement>("[data-verse-reference]");
  const template = item
    .closest("[data-verse-citation]")
    ?.getAttribute("data-verse-citation");
  if (!content || !text || !reference || !template) return null;
  return { content, text, reference, template };
}

function citationOf(item: Element): string | null {
  const parts = verseParts(item);
  if (!parts) return null;
  return formatVerseCitation(
    parts.template,
    parts.text.textContent ?? "",
    parts.reference.dataset.verseReference ?? ""
  );
}

// One-click verse sharing on a chapter page. Renders nothing; the verses,
// their references and Copy buttons are server-rendered by VerseList.
//
// - A click on a verse number selects that verse (one at a time): it marks the
//   verse `data-selected` (revealing its reference and Copy button) and
//   selects "text (Reference)" in the page. A second click, or Escape, clears it.
// - Copy puts „text“ (Reference) on the clipboard and reports the outcome on
//   the button and in a live region.
// - Copying that same selection with Ctrl+C or a mobile "Copy" menu yields the
//   same citation. Any other selection the reader makes is left alone.
// - Verse text is only read, never changed.
export function VerseSelection({
  copiedMessage,
  failedMessage,
}: VerseSelectionProps) {
  useEffect(() => {
    let selected: HTMLElement | null = null;
    // What the selection read when the verse was selected — a later copy is
    // rewritten only while the selection still reads the same.
    let selectedText = "";
    let feedback: { button: HTMLElement; timer: ReturnType<typeof setTimeout> } | null =
      null;

    const status = () =>
      document.querySelector<HTMLElement>("[data-verse-copy-status]");

    const selectContents = (element: HTMLElement) => {
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      selectedText = collapseSpace(selection.toString());
    };

    const setPressed = (item: HTMLElement, pressed: boolean) => {
      item
        .querySelector("[data-verse-select]")
        ?.setAttribute("aria-pressed", String(pressed));
    };

    const deselect = () => {
      if (!selected) return;
      const item = selected;
      selected = null;
      // Compare before hiding the reference — hiding it changes the text.
      const selection = window.getSelection();
      if (selection && collapseSpace(selection.toString()) === selectedText) {
        selection.removeAllRanges();
      }
      selectedText = "";
      item.removeAttribute("data-selected");
      setPressed(item, false);
    };

    const select = (item: HTMLElement) => {
      const parts = verseParts(item);
      if (!parts) return;
      deselect();
      selected = item;
      // Set first: the reference must be displayed to be part of the selection.
      item.setAttribute("data-selected", "");
      setPressed(item, true);
      selectContents(parts.content);
    };

    const showFeedback = (button: HTMLElement, state: CopyState) => {
      if (feedback) {
        clearTimeout(feedback.timer);
        feedback.button.removeAttribute("data-copy-state");
      }
      button.setAttribute("data-copy-state", state);
      const region = status();
      if (region) region.textContent = state === "copied" ? copiedMessage : failedMessage;
      feedback = {
        button,
        timer: setTimeout(() => {
          button.removeAttribute("data-copy-state");
          const current = status();
          if (current) current.textContent = "";
          feedback = null;
        }, FEEDBACK_MS),
      };
    };

    const copy = async (item: HTMLElement, button: HTMLElement) => {
      const citation = citationOf(item);
      if (!citation) return;
      const copied = await copyText(citation);
      // Pressing the button can clear the page selection — restore it while
      // this verse is still the selected one.
      const parts = item === selected ? verseParts(item) : null;
      if (parts) selectContents(parts.content);
      showFeedback(button, copied ? "copied" : "failed");
    };

    const onClick = (event: MouseEvent) => {
      if (selected && !selected.isConnected) selected = null; // page changed
      const target = event.target instanceof Element ? event.target : null;
      const selectButton = target?.closest<HTMLElement>("[data-verse-select]");
      const copyButton = target?.closest<HTMLElement>("[data-verse-copy]");
      const item = (selectButton ?? copyButton)?.closest<HTMLElement>("li");
      if (!item) return;
      if (selectButton) {
        if (item === selected) deselect();
        else select(item);
      } else if (copyButton) {
        void copy(item, copyButton);
      }
    };

    const onCopy = (event: ClipboardEvent) => {
      if (!selected?.isConnected || !event.clipboardData) return;
      const selection = window.getSelection();
      if (!selection || collapseSpace(selection.toString()) !== selectedText) return;
      const citation = citationOf(selected);
      if (!citation) return;
      event.clipboardData.setData("text/plain", citation);
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") deselect();
    };

    document.addEventListener("click", onClick);
    document.addEventListener("copy", onCopy);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("keydown", onKeyDown);
      if (feedback) clearTimeout(feedback.timer);
      if (selected?.isConnected) deselect();
    };
  }, [copiedMessage, failedMessage]);

  return null;
}
