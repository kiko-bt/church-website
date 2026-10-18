import { Check, Copy, X } from "lucide-react";

// Classes for a verse "Copy" button — the outline/sm look of the shared Button,
// as a plain <button> because the copy controls are driven by data attributes.
// The button is a `group/copy`: `data-copy-state="copied" | "failed"` swaps the
// label below for 2s after a copy.
export const VERSE_COPY_BUTTON_CLASSES =
  "group/copy inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-accent-gold px-2.5 py-1 text-xs font-medium text-accent-gold-strong transition-colors hover:bg-accent-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2";

// The `bible.verseCopy` messages a client copy button needs, resolved on the
// server (plain strings; `copyLabel` and `citation` stay raw templates) so the
// button ships no translation code to the browser.
export type VerseCopyMessages = {
  readonly copy: string;
  readonly copied: string;
  readonly failed: string;
  readonly copyLabel: string;
  readonly citation: string;
};

type VerseCopyLabelProps = {
  readonly copy: string;
  readonly copied: string;
  readonly failed: string;
};

// The three label states of a verse copy button, all rendered up front so a
// Server Component (VerseList) and a Client Component (CopyVerseButton) share
// one markup; only the button's `data-copy-state` changes. Hidden from
// assistive technology — the button's aria-label names it, and the outcome is
// announced through a live region.
export function VerseCopyLabel({ copy, copied, failed }: VerseCopyLabelProps) {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5 group-data-[copy-state]/copy:hidden">
        <Copy size={14} />
        {copy}
      </span>
      <span className="hidden items-center gap-1.5 group-data-[copy-state=copied]/copy:inline-flex">
        <Check size={14} />
        {copied}
      </span>
      <span className="hidden items-center gap-1.5 group-data-[copy-state=failed]/copy:inline-flex">
        <X size={14} />
        {failed}
      </span>
    </span>
  );
}
