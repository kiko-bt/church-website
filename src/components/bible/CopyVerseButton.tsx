"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatCopyLabel,
  formatVerseCitation,
} from "@/features/bible/bible.citation";
import { copyText } from "@/lib/utils/clipboard";
import {
  VERSE_COPY_BUTTON_CLASSES,
  VerseCopyLabel,
  type VerseCopyMessages,
} from "@/components/bible/VerseCopyLabel";

type CopyVerseButtonProps = {
  readonly text: string;
  readonly reference: string;
  readonly messages: VerseCopyMessages;
  readonly className?: string;
};

type CopyState = "copied" | "failed";

const FEEDBACK_MS = 2000;

// Copies one verse as „text“ (Reference) — for Bible search results, which
// are shown outside a chapter page. Chapter pages use the
// server-rendered buttons in VerseList, driven by VerseSelection.
export function CopyVerseButton({
  text,
  reference,
  messages,
  className,
}: CopyVerseButtonProps) {
  const [state, setState] = useState<CopyState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const onClick = async () => {
    const citation = formatVerseCitation(messages.citation, text, reference);
    const copied = await copyText(citation);
    // A search result can be replaced while the clipboard call is pending.
    if (!mounted.current) return;
    clearTimeout(timer.current);
    setState(copied ? "copied" : "failed");
    timer.current = setTimeout(() => setState(null), FEEDBACK_MS);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={formatCopyLabel(messages.copyLabel, reference)}
        data-copy-state={state ?? undefined}
        // Joined, not cn(): callers only add layout classes (margins), and
        // tailwind-merge would ship ~8 kB to every page with this button.
        className={className ? `${VERSE_COPY_BUTTON_CLASSES} ${className}` : VERSE_COPY_BUTTON_CLASSES}
      >
        <VerseCopyLabel
          copy={messages.copy}
          copied={messages.copied}
          failed={messages.failed}
        />
      </button>
      <span role="status" className="sr-only">
        {state ? messages[state] : ""}
      </span>
    </>
  );
}
