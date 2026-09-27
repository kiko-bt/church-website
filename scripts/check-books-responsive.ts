// Responsive + behaviour check for reading and downloading book PDFs.
//
// Books open their PDF for reading in a new tab (plain Sanity asset URL, served
// `Content-Disposition: inline`); downloading is an explicit button on the book
// detail page (`?dl=` URL, served as an attachment). This script verifies that
// contract end to end.
//
// Per device viewport — from a 320px phone to a 2560px desktop:
//
//   Listing (/mk/books)
//     - no horizontal page scroll
//     - every book with a PDF is a card link that opens the plain PDF URL in a
//       new tab (target=_blank, rel=noopener, no `download`, no `?dl=`)
//     - every card fits inside the viewport width and can be tapped (it is the
//       top element at its centre once scrolled into view)
//
//   Detail page (/mk/books/<slug>)
//     - no horizontal page scroll
//     - "Read online" and "Download PDF" are both present, visible, tappable,
//       inside the viewport, at least 44 CSS px tall, and do not overlap
//     - "Read online" → plain PDF URL in a new tab; "Download PDF" → `?dl=` URL
//
// Once, in a real browser session on a 390×844 phone viewport:
//   - clicking a card opens a new tab on the PDF (not a download)
//   - clicking "Download PDF" downloads a complete file named <slug>.pdf that
//     starts with the PDF signature
//
// For every book on the listing (network only):
//   - the read URL answers 200, application/pdf, Content-Disposition: inline
//   - the download URL answers 200, application/pdf, Content-Disposition:
//     attachment with filename <slug>.pdf
//
// Run against a running site (dev or production build):
//
//   npm run dev                         # in another terminal
//   npm run test:responsive:books       # BASE_URL defaults to http://localhost:3000
//
// Options (environment variables):
//   BASE_URL=http://localhost:3123   site to test
//   CHROME_PATH=...                  Chrome/Edge executable (auto-detected)
//   SCREENSHOT_DIR=./shots           save listing + detail screenshots per device
//
// LIMITS — what this cannot prove: how a PDF *renders* inside each device's own
// viewer (iOS Safari, Android Chrome, Samsung Internet, desktop viewers). That
// viewer is the browser's, not the site's, and headless Chrome does not render
// PDFs. The script proves every device is served the right URL with the right
// headers; rendering must be spot-checked on real devices.
//
// DELIBERATELY DEPENDENCY-FREE, like check-chapter-nav-responsive.ts: it drives
// Chrome through the DevTools protocol using only Node built-ins, adds no
// package, and is not part of `npm test` — it needs a browser and a server.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

// --- Configuration -------------------------------------------------------

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR;
const LISTING = "/mk/books";
const MIN_TARGET_SIZE = 44;

type Device = {
  readonly name: string;
  readonly width: number; // CSS px (logical viewport)
  readonly height: number;
  readonly scale: number; // device pixel ratio
  readonly mobile: boolean;
};

const DEVICES: readonly Device[] = [
  { name: "iPhone SE (1st gen)", width: 320, height: 568, scale: 2, mobile: true },
  { name: "Android small", width: 360, height: 640, scale: 3, mobile: true },
  { name: "iPhone SE (2nd/3rd gen)", width: 375, height: 667, scale: 2, mobile: true },
  { name: "iPhone 12/13/14 (1170×2532)", width: 390, height: 844, scale: 3, mobile: true },
  { name: "iPhone 15/16", width: 393, height: 852, scale: 3, mobile: true },
  { name: "Pixel 7", width: 412, height: 915, scale: 2.625, mobile: true },
  { name: "iPhone Pro Max", width: 430, height: 932, scale: 3, mobile: true },
  { name: "iPhone 12/13/14 landscape", width: 844, height: 390, scale: 3, mobile: true },
  { name: "iPad Mini portrait", width: 768, height: 1024, scale: 2, mobile: true },
  { name: "iPad Air portrait", width: 820, height: 1180, scale: 2, mobile: true },
  { name: "iPad landscape", width: 1024, height: 768, scale: 2, mobile: true },
  { name: "iPad Pro 12.9 portrait", width: 1024, height: 1366, scale: 2, mobile: true },
  { name: "Laptop 1280", width: 1280, height: 800, scale: 1, mobile: false },
  { name: "Laptop 1366", width: 1366, height: 768, scale: 1, mobile: false },
  { name: "Laptop 1440", width: 1440, height: 900, scale: 1, mobile: false },
  { name: "Full HD", width: 1920, height: 1080, scale: 1, mobile: false },
  { name: "QHD", width: 2560, height: 1440, scale: 1, mobile: false },
];

const PHONE = DEVICES.find((device) => device.width === 390)!;

// --- Chrome / DevTools protocol -------------------------------------------

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = candidates.find((path) => path && existsSync(path));
  if (!found) throw new Error("Chrome not found. Set CHROME_PATH to a Chrome or Edge executable.");
  return found;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

// On Windows the launched chrome.exe may hand off to a child process and exit
// immediately, so poll the DevTools HTTP endpoint until the browser answers.
async function launchChrome(profileDir: string): Promise<string> {
  const port = await freePort();
  const chrome = spawn(findChrome(), [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: "ignore", detached: false });
  chrome.unref();

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      const { webSocketDebuggerUrl } = (await response.json()) as { webSocketDebuggerUrl: string };
      return webSocketDebuggerUrl;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("Chrome did not start its DevTools endpoint within 20 seconds.");
}

type CdpMessage = {
  id?: number;
  method?: string;
  sessionId?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { message: string };
};

class Cdp {
  private nextId = 1;
  private readonly pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private readonly listeners = new Set<(message: CdpMessage) => void>();

  private readonly socket: WebSocket;

  private constructor(socket: WebSocket) {
    this.socket = socket;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as CdpMessage;
      if (message.id !== undefined && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)!;
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  static connect(url: string): Promise<Cdp> {
    const socket = new WebSocket(url);
    return new Promise((resolve, reject) => {
      socket.addEventListener("open", () => resolve(new Cdp(socket)));
      socket.addEventListener("error", () => reject(new Error(`Cannot connect to ${url}`)));
    });
  }

  send<T = Record<string, unknown>>(method: string, params: object = {}, sessionId?: string): Promise<T> {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    });
  }

  // Resolves with the params of the first event matching `method` (and, when
  // given, `sessionId` and `predicate`).
  waitFor(
    method: string,
    { sessionId, predicate, timeoutMs = 60_000 }: {
      sessionId?: string;
      predicate?: (params: Record<string, unknown>) => boolean;
      timeoutMs?: number;
    } = {},
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const listener = (message: CdpMessage) => {
        if (message.method !== method) return;
        if (sessionId !== undefined && message.sessionId !== sessionId) return;
        const params = message.params ?? {};
        if (predicate && !predicate(params)) return;
        clearTimeout(timer);
        this.listeners.delete(listener);
        resolve(params);
      };
      this.listeners.add(listener);
    });
  }

  on(listener: (message: CdpMessage) => void) {
    this.listeners.add(listener);
  }

  close() {
    this.socket.close();
  }
}

// --- In-page measurement ----------------------------------------------------

type Box = { top: number; left: number; right: number; bottom: number; width: number; height: number };
type LinkState = Box & {
  pageTop: number; // top in document coordinates (independent of scroll)
  href: string;
  target: string;
  rel: string;
  hasDownloadAttr: boolean;
  visible: boolean;
  onTop: boolean;
};
type ListingReport = { viewportWidth: number; overflowX: boolean; page: string; cards: LinkState[] };
type DetailReport = { viewportWidth: number; overflowX: boolean; read: LinkState | null; download: LinkState | null };

// Serialised with toString() and evaluated inside the page, so it may only use
// browser globals. Each link is scrolled into view before it is hit-tested, so
// "onTop" means "a reader can tap it", wherever it sits on the page.
async function measureLinks(selectors: Record<string, string>): Promise<{
  viewportWidth: number;
  overflowX: boolean;
  page: string;
  links: Record<string, LinkState[]>;
}> {
  const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const root = document.documentElement;
  root.style.scrollBehavior = "auto";
  // Next.js dev-mode indicator (not present in production) — ignore it.
  document.querySelectorAll("nextjs-portal").forEach((node) => node.remove());
  await frame();

  const links: Record<string, LinkState[]> = {};
  for (const [key, selector] of Object.entries(selectors)) {
    links[key] = [];
    for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>(selector))) {
      link.scrollIntoView({ block: "center", inline: "nearest" });
      await frame();
      const rect = link.getBoundingClientRect();
      const style = getComputedStyle(link);
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      links[key].push({
        top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height,
        pageTop: rect.top + scrollY,
        href: link.href,
        target: link.target,
        rel: link.rel,
        hasDownloadAttr: link.hasAttribute("download"),
        visible: style.display !== "none" && style.visibility === "visible" && Number(style.opacity) > 0,
        onTop: hit !== null && link.contains(hit),
      });
    }
  }
  scrollTo(0, 0);
  const page = `${location.pathname} "${document.querySelector("h1")?.textContent?.trim() ?? document.title}"`;
  return { viewportWidth: root.clientWidth, overflowX: root.scrollWidth > root.clientWidth, page, links };
}

// Selectors describe the rendered contract, not implementation details: a PDF
// link on the Sanity CDN, split into "read" (no ?dl=) and "download" (?dl=).
const PDF_LINK = 'a[href^="https://cdn.sanity.io/files/"][href*=".pdf"]';
const READ_LINK = `${PDF_LINK}:not([href*="?dl="])`;
const DOWNLOAD_LINK = `${PDF_LINK}[href*="?dl="]`;

async function setDevice(cdp: Cdp, sessionId: string, device: Device) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: device.width, height: device.height, deviceScaleFactor: device.scale, mobile: device.mobile,
  }, sessionId);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: device.mobile }, sessionId);
}

// Browser-side errors (uncaught exceptions, failed resource loads) since the
// last navigation. A page that renders its error boundary always logs one, so
// every failure report says why.
const pageErrors: string[] = [];

function collectPageErrors(cdp: Cdp, sessionId: string) {
  cdp.on((message) => {
    if (message.sessionId !== sessionId || !message.params) return;
    const params = message.params as {
      exceptionDetails?: { text: string; exception?: { description?: string } };
      entry?: { level: string; text: string; url?: string };
    };
    if (message.method === "Runtime.exceptionThrown" && params.exceptionDetails) {
      const details = params.exceptionDetails;
      pageErrors.push((details.exception?.description ?? details.text).split("\n")[0]);
    }
    // /_vercel/* (Analytics, Speed Insights) only exists on Vercel hosting, so
    // it always 404s against a local server — not a page error.
    const vercelOnly = /\/_vercel\//.test(`${params.entry?.url ?? ""} ${params.entry?.text ?? ""}`);
    if (message.method === "Log.entryAdded" && params.entry?.level === "error" && !vercelOnly) {
      pageErrors.push(`${params.entry.text}${params.entry.url ? ` (${params.entry.url})` : ""}`);
    }
  });
}

async function navigate(cdp: Cdp, sessionId: string, path: string) {
  pageErrors.length = 0;
  const loaded = cdp.waitFor("Page.loadEventFired", { sessionId });
  await cdp.send("Page.navigate", { url: BASE_URL + path }, sessionId);
  await loaded;
}

async function evaluate<T>(cdp: Cdp, sessionId: string, expression: string): Promise<T> {
  const { result, exceptionDetails } = await cdp.send<{
    result: { value: T };
    exceptionDetails?: { text: string; exception?: { description?: string } };
  }>("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
  if (exceptionDetails) throw new Error(`In-page error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  return result.value;
}

async function measure(cdp: Cdp, sessionId: string, selectors: Record<string, string>) {
  return evaluate<Awaited<ReturnType<typeof measureLinks>>>(
    cdp, sessionId, `(${measureLinks.toString()})(${JSON.stringify(selectors)})`,
  );
}

async function screenshot(cdp: Cdp, sessionId: string, device: Device, page: string) {
  if (!SCREENSHOT_DIR) return;
  const { data } = await cdp.send<{ data: string }>("Page.captureScreenshot", { format: "png" }, sessionId);
  const file = `${page}-${device.width}x${device.height}-${device.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
  writeFileSync(join(SCREENSHOT_DIR, file), Buffer.from(data, "base64"));
}

// --- Assertions --------------------------------------------------------------

const intersects = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const px = (n: number) => Math.round(n);

function checkNewTabLink(label: string, link: LinkState, viewportWidth: number, fail: (m: string) => void) {
  if (!link.visible) fail(`${label} not visible`);
  if (!link.onTop) fail(`${label} covered by another element (cannot be tapped)`);
  if (link.left < -0.5 || link.right > viewportWidth + 0.5)
    fail(`${label} overflows the viewport (${px(link.left)}–${px(link.right)} of ${viewportWidth})`);
  if (link.target !== "_blank") fail(`${label} does not open in a new tab`);
  if (!link.rel.includes("noopener")) fail(`${label} is missing rel=noopener`);
}

function checkListing(report: ListingReport, expectedCards: number): string[] {
  const failures: string[] = [];
  const fail = (message: string) => failures.push(message);
  if (report.overflowX) fail("listing scrolls horizontally");
  if (report.cards.length !== expectedCards)
    fail(`listing shows ${report.cards.length} PDF cards, expected ${expectedCards} (page: ${report.page})`);
  report.cards.forEach((card, index) => {
    checkNewTabLink(`card #${index + 1}`, card, report.viewportWidth, fail);
    if (card.hasDownloadAttr) fail(`card #${index + 1} has a download attribute`);
    if (card.href.includes("?dl=")) fail(`card #${index + 1} links to the download URL`);
  });
  return failures;
}

function checkDetail(report: DetailReport): string[] {
  const failures: string[] = [];
  const fail = (message: string) => failures.push(message);
  if (report.overflowX) fail("detail page scrolls horizontally");
  const { read, download } = report;
  if (!read) fail('"Read online" button missing');
  if (!download) fail('"Download PDF" button missing');
  for (const [label, link] of [["Read online", read], ["Download PDF", download]] as const) {
    if (!link) continue;
    checkNewTabLink(`"${label}"`, link, report.viewportWidth, fail);
    if (link.height < MIN_TARGET_SIZE) fail(`"${label}" is ${px(link.height)}px tall, below ${MIN_TARGET_SIZE}px`);
  }
  if (read?.hasDownloadAttr) fail('"Read online" has a download attribute');
  if (read && download && read.href.split("?")[0] !== download.href.split("?")[0])
    fail("read and download buttons point at different files");
  // Each button was measured scrolled into view, so compare in document
  // coordinates.
  const onPage = (link: LinkState): Box => ({ ...link, top: link.pageTop, bottom: link.pageTop + link.height });
  if (read && download && intersects(onPage(read), onPage(download))) fail("buttons overlap");
  return failures;
}

// --- Browser behaviour (one phone session) ------------------------------------

async function checkCardOpensNewTab(cdp: Cdp, sessionId: string): Promise<string[]> {
  await setDevice(cdp, sessionId, PHONE);
  // Phone viewport, but mouse input (see tap()): touch emulation would swallow it.
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false }, sessionId);
  await navigate(cdp, sessionId, LISTING);
  const center = await evaluate<{ x: number; y: number; href: string } | null>(cdp, sessionId, `(async () => {
    const link = document.querySelector(${JSON.stringify(READ_LINK)});
    if (!link) return null;
    link.scrollIntoView({ block: "center" });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const rect = link.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, href: link.href };
  })()`);
  if (!center) return ["no PDF card on the listing to tap"];

  const opened = cdp.waitFor("Target.targetCreated", {
    predicate: (params) => (params.targetInfo as { type: string }).type === "page",
    timeoutMs: 15_000,
  });
  await tap(cdp, sessionId, center.x, center.y);
  const { targetInfo } = (await opened.catch(() => ({ targetInfo: null }))) as {
    targetInfo: { targetId: string; url: string; openerId?: string } | null;
  };
  if (!targetInfo) return ["tapping a card did not open a new tab"];

  // The new tab's URL can be empty at creation; read it once navigation starts.
  let url = targetInfo.url;
  for (let i = 0; i < 40 && !url.startsWith("https://"); i++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const { targetInfos } = await cdp.send<{ targetInfos: { targetId: string; url: string }[] }>("Target.getTargets");
    url = targetInfos.find((info) => info.targetId === targetInfo.targetId)?.url ?? url;
  }
  await cdp.send("Target.closeTarget", { targetId: targetInfo.targetId }).catch(() => {});
  const failures: string[] = [];
  if (url !== center.href) failures.push(`new tab opened ${url || "(no URL)"}, expected ${center.href}`);
  return failures;
}

async function checkDownloadButton(cdp: Cdp, sessionId: string, slug: string, downloadDir: string): Promise<string[]> {
  await setDevice(cdp, sessionId, PHONE);
  // Phone viewport, but mouse input (see tap()): touch emulation would swallow it.
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false }, sessionId);
  await navigate(cdp, sessionId, `/mk/books/${slug}`);
  await cdp.send("Browser.setDownloadBehavior", {
    behavior: "allowAndName", downloadPath: downloadDir, eventsEnabled: true,
  });
  const center = await evaluate<{ x: number; y: number } | null>(cdp, sessionId, `(async () => {
    const link = document.querySelector(${JSON.stringify(DOWNLOAD_LINK)});
    if (!link) return null;
    link.scrollIntoView({ block: "center" });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const rect = link.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  if (!center) return ['"Download PDF" button missing'];

  const began = cdp.waitFor("Browser.downloadWillBegin", { timeoutMs: 30_000 });
  const done = cdp.waitFor("Browser.downloadProgress", {
    predicate: (params) => params.state === "completed" || params.state === "canceled",
    timeoutMs: 180_000,
  });
  await tap(cdp, sessionId, center.x, center.y);

  const failures: string[] = [];
  const start = await began.catch(() => null);
  if (!start) return ['tapping "Download PDF" did not start a download'];
  if (start.suggestedFilename !== `${slug}.pdf`)
    failures.push(`downloaded file is named "${start.suggestedFilename}", expected "${slug}.pdf"`);
  const end = await done.catch(() => null);
  if (!end || end.state !== "completed") return [...failures, "download did not complete"];

  // allowAndName saves the file under its GUID.
  const saved = join(downloadDir, String(start.guid));
  if (!existsSync(saved)) return [...failures, `download finished but no file in ${downloadDir} (${readdirSync(downloadDir).join(", ")})`];
  const bytes = readFileSync(saved);
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") failures.push("downloaded file is not a PDF");
  console.log(`      downloaded ${slug}.pdf — ${(bytes.length / 1024 / 1024).toFixed(1)} MB`);
  return failures;
}

// A real input event (not element.click()), so Chrome treats it as a user
// gesture. A mouse click, not a synthetic touch: headless Chrome's synthetic
// touch (dispatchTouchEvent / synthesizeTapGesture) proved unreliable on these
// links, and both are plain <a> elements with no JS handlers — on a real phone
// the browser turns a tap into this same click.
async function tap(cdp: Cdp, sessionId: string, x: number, y: number) {
  for (const type of ["mousePressed", "mouseReleased"]) {
    await cdp.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }, sessionId);
  }
}

// --- Network: every book's PDF, both URLs ------------------------------------

async function checkPdfHeaders(url: string, expected: "inline" | "attachment", filename?: string): Promise<string[]> {
  const response = await fetch(url, { method: "HEAD" });
  const failures: string[] = [];
  const type = response.headers.get("content-type") ?? "";
  const disposition = response.headers.get("content-disposition") ?? "";
  if (response.status !== 200) failures.push(`HTTP ${response.status}`);
  if (!type.startsWith("application/pdf")) failures.push(`content-type "${type}"`);
  if (!disposition.toLowerCase().startsWith(expected)) failures.push(`content-disposition "${disposition}", expected ${expected}`);
  if (filename && !disposition.includes(`filename="${filename}"`)) failures.push(`filename not "${filename}" (${disposition})`);
  return failures;
}

// --- Main ------------------------------------------------------------------

async function main() {
  const profileDir = mkdtempSync(join(tmpdir(), "books-check-"));
  const downloadDir = mkdtempSync(join(tmpdir(), "books-download-"));
  const cdp = await Cdp.connect(await launchChrome(profileDir));
  let exitCode = 0;
  const report = (label: string, failures: string[], detail = "") => {
    if (failures.length === 0) {
      console.log(`PASS  ${label.padEnd(44)} ${detail}`);
    } else {
      exitCode = 1;
      console.log(`FAIL  ${label.padEnd(44)} ${detail}`);
      for (const failure of failures) console.log(`        - ${failure}`);
    }
  };

  try {
    await cdp.send("Target.setDiscoverTargets", { discover: true });
    const { targetId } = await cdp.send<{ targetId: string }>("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send<{ sessionId: string }>("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Log.enable", {}, sessionId);
    collectPageErrors(cdp, sessionId);
    if (SCREENSHOT_DIR) mkdirSync(SCREENSHOT_DIR, { recursive: true });

    // Discover the books from the site itself (desktop layout, all cards).
    await setDevice(cdp, sessionId, DEVICES[DEVICES.length - 1]);
    await navigate(cdp, sessionId, LISTING);
    const books = await evaluate<{ href: string }[]>(cdp, sessionId,
      `Array.from(document.querySelectorAll(${JSON.stringify(READ_LINK)}), (a) => ({ href: a.href }))`);
    const sitemap = await (await fetch(`${BASE_URL}/sitemap.xml`)).text();
    const slugs = [...sitemap.matchAll(/\/mk\/books\/([^<\s/]+)<\/loc>/g)].map((match) => match[1]);
    if (books.length === 0 || slugs.length === 0) throw new Error("No books found on the listing or in the sitemap.");
    const detailSlug = slugs[0];

    console.log(`Book PDFs — responsive check against ${BASE_URL}`);
    console.log(`${books.length} PDF cards on ${LISTING}; detail page /mk/books/${detailSlug}\n`);

    console.log("Layout per device (listing + detail page)");
    for (const device of DEVICES) {
      await setDevice(cdp, sessionId, device);

      await navigate(cdp, sessionId, LISTING);
      const listing = await measure(cdp, sessionId, { cards: READ_LINK });
      const listingErrors = pageErrors.map((error) => `listing browser error: ${error}`);
      await screenshot(cdp, sessionId, device, "listing");

      await navigate(cdp, sessionId, `/mk/books/${detailSlug}`);
      const detail = await measure(cdp, sessionId, { read: READ_LINK, download: DOWNLOAD_LINK });
      const detailErrors = pageErrors.map((error) => `detail browser error: ${error}`);
      await screenshot(cdp, sessionId, device, "detail");

      const detailReport: DetailReport = {
        viewportWidth: detail.viewportWidth,
        overflowX: detail.overflowX,
        read: detail.links.read[0] ?? null,
        download: detail.links.download[0] ?? null,
      };
      const failures = [
        ...checkListing({ viewportWidth: listing.viewportWidth, overflowX: listing.overflowX, page: listing.page, cards: listing.links.cards }, books.length),
        ...checkDetail(detailReport),
        ...listingErrors,
        ...detailErrors,
      ];
      const { read, download } = detailReport;
      const buttons = read && download
        ? `buttons ${px(read.width)}×${px(read.height)} + ${px(download.width)}×${px(download.height)}${Math.abs(read.pageTop - download.pageTop) < 1 ? " (one row)" : " (stacked)"}`
        : "";
      report(`${device.name} ${device.width}×${device.height}`, failures, buttons);
    }

    console.log(`\nBrowser behaviour on ${PHONE.name} ${PHONE.width}×${PHONE.height}`);
    report("click a book card → PDF opens in a new tab", await checkCardOpensNewTab(cdp, sessionId));
    report('click "Download PDF" → file is downloaded', await checkDownloadButton(cdp, sessionId, detailSlug, downloadDir));

    // Every book: take the two URLs its own detail page renders; the read URL
    // must be served inline, the download URL as an attachment named <slug>.pdf,
    // and the read URL must match a card on the listing.
    console.log(`\nPDF delivery for all ${slugs.length} books (read inline + download)`);
    const cardHrefs = new Set(books.map((book) => book.href));
    for (const slug of slugs) {
      const html = await (await fetch(`${BASE_URL}/mk/books/${slug}`)).text();
      const hrefs = [...html.matchAll(/href="(https:\/\/cdn\.sanity\.io\/files\/[^"]+\.pdf[^"]*)"/g)]
        .map((match) => match[1].replace(/&amp;/g, "&"));
      const readUrl = hrefs.find((href) => !href.includes("?dl="));
      const downloadUrl = hrefs.find((href) => href.includes("?dl="));
      const failures: string[] = [];
      if (!readUrl) failures.push("detail page has no read URL");
      else {
        if (!cardHrefs.has(readUrl)) failures.push("read URL does not match any listing card");
        failures.push(...(await checkPdfHeaders(readUrl, "inline")).map((f) => `read URL: ${f}`));
      }
      if (!downloadUrl) failures.push("detail page has no download URL");
      else failures.push(...(await checkPdfHeaders(downloadUrl, "attachment", `${slug}.pdf`)).map((f) => `download URL: ${f}`));
      report(slug, failures);
    }
    if (slugs.length !== books.length)
      report("book count", [`sitemap lists ${slugs.length} books, listing shows ${books.length} PDF cards`]);
  } finally {
    // Closes the whole browser, including any process Chrome handed off to.
    await cdp.send("Browser.close").catch(() => {});
    cdp.close();
    await new Promise((resolve) => setTimeout(resolve, 500));
    for (const dir of [profileDir, downloadDir]) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Chrome may still hold the profile briefly on Windows; it is in tmpdir.
      }
    }
  }
  console.log(exitCode === 0 ? "\nAll checks passed." : "\nSome checks FAILED.");
  process.exit(exitCode);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
