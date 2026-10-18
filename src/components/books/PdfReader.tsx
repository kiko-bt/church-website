"use client";

import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  bookReadingPositionKey,
  loadBookReadingPosition,
  positionAt,
  saveBookReadingPosition,
  scrollTopFor,
  type PageBox,
} from "@/features/books/books.reading-position";
import { cn } from "@/lib/utils/cn";

// The `books.reader` messages, resolved on the server so the reader ships no
// translation code to the browser. `pageOf` and `loadingProgress` stay raw
// templates (`{total}`, `{percent}`), filled by `fillTemplate`.
export type PdfReaderMessages = {
  readonly toolbar: string;
  readonly document: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly pageNumber: string;
  readonly pageOf: string;
  readonly zoomIn: string;
  readonly zoomOut: string;
  readonly openPdf: string;
  readonly download: string;
  readonly loading: string;
  readonly loadingProgress: string;
  readonly error: string;
};

function fillTemplate(template: string, key: string, value: string | number): string {
  return template.replaceAll(`{${key}}`, () => String(value));
}

type PdfReaderProps = {
  readonly slug: string;
  // Sanity asset hash of this PDF (see Book.pdfFileId).
  readonly fileId: string;
  // Same-origin path the reader loads (`/pdf/<hash>.pdf`).
  readonly src: string;
  // The original PDF and its forced-download URL — always offered, and the
  // fallback whenever the reader cannot display the book.
  readonly pdfUrl: string;
  readonly downloadUrl: string;
  readonly messages: PdfReaderMessages;
};

type Status =
  | { readonly kind: "loading"; readonly percent: number | null }
  | { readonly kind: "ready" }
  | { readonly kind: "error" };

// The part of the pdf.js viewer the toolbar drives.
type ViewerControls = {
  readonly goToPage: (page: number) => void;
  readonly previousPage: () => void;
  readonly nextPage: () => void;
  readonly zoom: (direction: 1 | -1) => void;
};

// A place reached by scrolling is written once the reader has stayed on it
// this long; leaving the page (tab hidden, app switched, device locked, tab or
// browser closed, in-site navigation) writes at once, without waiting.
const SAVE_DELAY_MS = 1000;
// Zoom steps and bounds of the toolbar buttons (pdf.js's own step is 1.1).
const ZOOM_STEP = 1.2;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function localStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // storage disabled or blocked
  }
}

const TOOL_BUTTON_CLASSES =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-sm px-2 text-sm text-text-primary transition-colors hover:bg-soft-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold disabled:pointer-events-none disabled:opacity-40";

// In-site PDF reader for books and commentaries, built on the official pdf.js
// viewer components (pdfjs-dist, legacy build for older mobile browsers),
// loaded only on this route.
//
// It remembers where the reader is, per book, in localStorage
// (books.reading-position.ts): the page under the top of the view plus how
// far down that page the view starts, so the place survives reloads, closing
// the tab or browser, and a different zoom, screen width or orientation.
//
// - Restores once the pages are laid out, and again when the real sizes of all
//   pages are known (unless the reader has started moving) — so books whose
//   pages differ in size still land on the exact spot.
// - Nothing is saved until that restore is done, so an early scroll event can
//   never overwrite the saved place with page 1.
// - Scrolling is measured once per animation frame (a binary search over the
//   pages) and written after SAVE_DELAY_MS of rest; `visibilitychange`
//   (hidden), `pagehide` and unmounting write synchronously — the place
//   measured right then, or the last one measured if the layout is already
//   gone (unmount).
// - Any failure (old browser, worker, network, damaged file) shows the
//   original "open" / "download" links instead of an empty box.
export function PdfReader({
  slug,
  fileId,
  src,
  pdfUrl,
  downloadUrl,
  messages,
}: PdfReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ViewerControls | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading", percent: null });
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    const container = containerRef.current;
    const viewerElement = viewerRef.current;
    if (!container || !viewerElement) return;

    let disposed = false;
    let dispose = () => {};

    const start = async () => {
      // pdf_viewer.mjs reads `globalThis.pdfjsLib`, which pdf.mjs sets — the
      // order of these imports matters.
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const { EventBus, PDFLinkService, PDFViewer } = await import(
        "pdfjs-dist/legacy/web/pdf_viewer.mjs"
      );
      if (disposed) return;

      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const eventBus = new EventBus();
      const linkService = new PDFLinkService({ eventBus });
      const viewer = new PDFViewer({
        container,
        viewer: viewerElement,
        eventBus,
        linkService,
      });
      linkService.setViewer(viewer);

      const storage = localStore();
      const key = bookReadingPositionKey(slug);
      let restored = false; // nothing is saved before the restore
      let readerMoved = false; // the reader scrolled, zoomed or navigated
      let frame = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const loadingTask = pdfjs.getDocument({ url: src });
      // The file keeps streaming in after the first pages are shown — progress
      // is reported only until then.
      loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
        if (disposed || restored || !total) return;
        setStatus({ kind: "loading", percent: Math.min(100, Math.round((loaded / total) * 100)) });
      };

      const boxOf = (pageNumber: number): PageBox => {
        const div = viewer.getPageView(pageNumber - 1)?.div as HTMLElement | undefined;
        if (!div) return { top: 0, height: 0 };
        const box = div.getBoundingClientRect();
        const origin = container.getBoundingClientRect().top - container.scrollTop;
        return { top: box.top - origin, height: box.height };
      };
      // Measuring needs a live layout. React removes the reader's DOM before it
      // runs this effect's cleanup, and a detached container reports empty
      // boxes (which would read as "the last page") — so every measurement is
      // also kept as `latest`, and that is what gets saved once the layout is
      // gone.
      let latest: { readonly page: number; readonly ratio: number } | null = null;
      const isLaidOut = () => container.isConnected && container.clientHeight > 0;
      const track = () => {
        const position = isLaidOut()
          ? positionAt(container.scrollTop, viewer.pagesCount, boxOf)
          : null;
        if (position) latest = position;
        return latest;
      };
      const scrollTo = (pageNumber: number, ratio: number) => {
        container.scrollTop = scrollTopFor(ratio, boxOf(pageNumber));
      };

      const save = () => {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
        if (!restored || !storage || viewer.pagesCount < 1) return;
        const position = track();
        if (position) saveBookReadingPosition(storage, key, { file: fileId, ...position });
      };

      const restore = () => {
        const saved = storage
          ? loadBookReadingPosition(storage, key, fileId, viewer.pagesCount)
          : null;
        if (saved) scrollTo(saved.page, saved.ratio);
      };

      // Keeps the exact place while the page size changes (zoom, rotation).
      const keepPlace = (change: () => void) => {
        const position = restored ? track() : null;
        change();
        if (position) scrollTo(position.page, position.ratio);
      };

      const onScroll = () => {
        if (!restored || frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          track();
          if (timer !== undefined) clearTimeout(timer);
          timer = setTimeout(save, SAVE_DELAY_MS);
        });
      };
      const onVisibilityChange = () => {
        if (document.visibilityState === "hidden") save();
      };
      const onReaderInput = () => {
        readerMoved = true;
      };

      eventBus.on("pagesinit", () => {
        viewer.currentScaleValue = "auto";
        restore();
        restored = true;
        track();
        setScale(viewer.currentScale);
        setStatus({ kind: "ready" });
      });
      // All page sizes are now exact: land on the precise spot again unless
      // the reader has already moved on.
      eventBus.on("pagesloaded", () => {
        if (readerMoved) return;
        restore();
        track();
      });
      eventBus.on("pagechanging", ({ pageNumber }: { pageNumber: number }) => {
        setPage(pageNumber);
        setPageInput(String(pageNumber));
      });
      eventBus.on("scalechanging", ({ scale: next }: { scale: number }) => setScale(next));

      // Re-fit on width changes (rotation, window resize) while at the
      // automatic zoom, keeping the place. A last notification can arrive
      // after React has removed the reader (width 0) — re-fitting a detached
      // viewer makes pdf.js log "offsetParent is not set -- cannot scroll".
      let lastWidth = container.clientWidth;
      const resizeObserver = new ResizeObserver(() => {
        const width = container.clientWidth;
        if (width === lastWidth || !restored || !isLaidOut()) return;
        lastWidth = width;
        if (viewer.currentScaleValue === "auto") {
          keepPlace(() => {
            viewer.currentScaleValue = "auto";
          });
        }
      });

      controlsRef.current = {
        goToPage: (pageNumber) => {
          readerMoved = true;
          const target = Math.min(Math.max(1, pageNumber), viewer.pagesCount);
          scrollTo(target, 0);
          save();
        },
        previousPage: () => {
          readerMoved = true;
          viewer.previousPage();
        },
        nextPage: () => {
          readerMoved = true;
          viewer.nextPage();
        },
        zoom: (direction) => {
          readerMoved = true;
          const next = viewer.currentScale * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP);
          keepPlace(() => {
            viewer.currentScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
          });
          save();
        },
      };

      container.addEventListener("scroll", onScroll, { passive: true });
      for (const type of ["wheel", "touchstart", "keydown", "pointerdown"] as const) {
        container.addEventListener(type, onReaderInput, { passive: true });
      }
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("pagehide", save);
      resizeObserver.observe(container);

      dispose = () => {
        save(); // in-site navigation away from the reader
        controlsRef.current = null;
        cancelAnimationFrame(frame);
        container.removeEventListener("scroll", onScroll);
        for (const type of ["wheel", "touchstart", "keydown", "pointerdown"] as const) {
          container.removeEventListener(type, onReaderInput);
        }
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("pagehide", save);
        resizeObserver.disconnect();
        viewer.setDocument(null);
        linkService.setDocument(null);
        void loadingTask.destroy();
      };

      const document_ = await loadingTask.promise;
      if (disposed) return;
      viewer.setDocument(document_);
      linkService.setDocument(document_);
      setPageCount(document_.numPages);
    };

    start().catch((error: unknown) => {
      if (disposed) return;
      // Destroying the task on unmount rejects it — not an error to show.
      console.error("PdfReader:", error);
      setStatus({ kind: "error" });
    });

    return () => {
      disposed = true;
      dispose();
    };
  }, [slug, fileId, src]);

  const ready = status.kind === "ready";

  const onPageSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requested = Number.parseInt(pageInput, 10);
    if (Number.isInteger(requested)) controlsRef.current?.goToPage(requested);
    else setPageInput(String(page));
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[28rem] flex-col overflow-hidden rounded-md border border-soft-gold/40">
      <div
        role="toolbar"
        aria-label={messages.toolbar}
        className="flex flex-wrap items-center justify-between gap-2 border-b border-soft-gold/40 bg-background px-2 py-1.5"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={TOOL_BUTTON_CLASSES}
            aria-label={messages.previousPage}
            disabled={!ready || page <= 1}
            onClick={() => controlsRef.current?.previousPage()}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <form onSubmit={onPageSubmit} className="flex items-center gap-1.5 text-sm">
            <input
              type="text"
              inputMode="numeric"
              aria-label={messages.pageNumber}
              value={pageInput}
              disabled={!ready}
              onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ""))}
              onBlur={() => setPageInput(String(page))}
              className="h-9 w-14 rounded-sm border border-soft-gold/60 bg-background text-center text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
            />
            <span className="whitespace-nowrap text-text-primary/70">
              {fillTemplate(messages.pageOf, "total", pageCount || "…")}
            </span>
          </form>
          <button
            type="button"
            className={TOOL_BUTTON_CLASSES}
            aria-label={messages.nextPage}
            disabled={!ready || page >= pageCount}
            onClick={() => controlsRef.current?.nextPage()}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={TOOL_BUTTON_CLASSES}
            aria-label={messages.zoomOut}
            disabled={!ready || scale <= MIN_ZOOM + 0.001}
            onClick={() => controlsRef.current?.zoom(-1)}
          >
            <ZoomOut size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={TOOL_BUTTON_CLASSES}
            aria-label={messages.zoomIn}
            disabled={!ready || scale >= MAX_ZOOM - 0.001}
            onClick={() => controlsRef.current?.zoom(1)}
          >
            <ZoomIn size={18} aria-hidden="true" />
          </button>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={TOOL_BUTTON_CLASSES}
            aria-label={messages.openPdf}
          >
            <ExternalLink size={18} aria-hidden="true" />
            <span className="hidden md:inline">{messages.openPdf}</span>
          </a>
          <a
            href={downloadUrl}
            download
            className={TOOL_BUTTON_CLASSES}
            aria-label={messages.download}
          >
            <Download size={18} aria-hidden="true" />
            <span className="hidden md:inline">{messages.download}</span>
          </a>
        </div>
      </div>

      <div className="relative flex-1 bg-warm-bg">
        {/* pdf.js requires an absolutely positioned scroll container. */}
        <div
          ref={containerRef}
          tabIndex={0}
          role="region"
          aria-label={messages.document}
          className={cn(
            "absolute inset-0 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-gold",
            status.kind === "error" && "hidden"
          )}
        >
          <div ref={viewerRef} className="pdfViewer" />
        </div>

        {status.kind === "loading" && (
          <p
            role="status"
            className="absolute inset-x-0 top-8 text-center text-sm text-text-primary/70"
          >
            {status.percent === null
              ? messages.loading
              : fillTemplate(messages.loadingProgress, "percent", status.percent)}
          </p>
        )}

        {status.kind === "error" && (
          <div role="alert" className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="max-w-md text-text-primary/80">{messages.error}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-accent-gold px-5 py-2.5 text-sm font-medium text-accent-gold-foreground hover:bg-accent-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2"
              >
                <ExternalLink size={18} aria-hidden="true" />
                {messages.openPdf}
              </a>
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 rounded-sm border border-accent-gold px-5 py-2.5 text-sm font-medium text-accent-gold-strong hover:bg-accent-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2"
              >
                <Download size={18} aria-hidden="true" />
                {messages.download}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
