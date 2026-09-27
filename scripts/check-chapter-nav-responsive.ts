// Responsive check for the fixed previous/next chapter arrows (ChapterNav).
//
// Opens real Bible chapter pages in headless Chrome at a list of device
// viewports — from a 320px phone to a 2560px desktop — and asserts, per device,
// that both arrows:
//
//   - are rendered, `position: fixed`, visible, and not covered by anything
//     (hit-tested at their centre)
//   - sit fully inside the viewport and below the sticky header
//   - stay in exactly the same place at the top, middle and end of a long
//     chapter (they follow the reader while scrolling)
//   - are at least 44×44 CSS px (comfortable touch target) and do not overlap
//   - leave the last verse readable once the reader reaches the chapter end
//   - never overlap the text column at all on 2xl screens (≥1536px), where
//     they sit in the side margins
//
// and that the page has no horizontal overflow. It also checks the canon
// edges: Genesis 1 renders only "next", Revelation 22 only "previous".
//
// Run against a running site (dev or production build):
//
//   npm run dev                      # in another terminal
//   npm run test:responsive          # BASE_URL defaults to http://localhost:3000
//
// Options (environment variables):
//   BASE_URL=http://localhost:3123   site to test
//   CHROME_PATH=...                  Chrome/Edge executable (auto-detected)
//   SCREENSHOT_DIR=./shots           save one screenshot per device
//
// DELIBERATELY DEPENDENCY-FREE: it drives Chrome through the DevTools protocol
// using only Node built-ins (global WebSocket, child_process), so it adds no
// package and is not part of `npm test` — it needs a browser and a server.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

// --- Configuration -------------------------------------------------------

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR;

// A long chapter (176 verses) so the scroll test is meaningful.
const LONG_CHAPTER = "/mk/bible/psalms/119";
const FIRST_CHAPTER = "/mk/bible/genesis/1";
const LAST_CHAPTER = "/en/bible/revelation/22";

// Tailwind's default `2xl` breakpoint, where the arrows move to the margins.
const SIDE_LAYOUT_MIN_WIDTH = 1536;
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
  { name: "Just below 2xl", width: 1535, height: 864, scale: 1, mobile: false },
  { name: "2xl edge", width: 1536, height: 864, scale: 1, mobile: false },
  { name: "Full HD", width: 1920, height: 1080, scale: 1, mobile: false },
  { name: "QHD", width: 2560, height: 1440, scale: 1, mobile: false },
];

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
// immediately, so its stderr cannot be relied on. Instead, pick a port and poll
// the DevTools HTTP endpoint until the browser answers.
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

type CdpMessage = { id?: number; method?: string; sessionId?: string; result?: unknown; error?: { message: string } };

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

  waitFor(method: string, sessionId: string, timeoutMs = 60_000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const listener = (message: CdpMessage) => {
        if (message.method === method && message.sessionId === sessionId) {
          clearTimeout(timer);
          this.listeners.delete(listener);
          resolve();
        }
      };
      this.listeners.add(listener);
    });
  }

  close() {
    this.socket.close();
  }
}

// --- In-page measurement ----------------------------------------------------

type Box = { top: number; left: number; right: number; bottom: number; width: number; height: number };
type ArrowState = Box & { position: string; visible: boolean; onTop: boolean };
type ScrollSnapshot = { prev: ArrowState | null; next: ArrowState | null };
type PageReport = {
  viewportWidth: number;
  viewportHeight: number;
  overflowX: boolean;
  headerBottom: number;
  text: Box;
  lastVerseAtEnd: Box;
  snapshots: Record<"top" | "middle" | "end", ScrollSnapshot>;
};

// Serialised with toString() and evaluated inside the page, so it may only use
// browser globals.
async function measurePage(): Promise<PageReport> {
  const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const root = document.documentElement;
  root.style.scrollBehavior = "auto";
  // Next.js dev-mode indicator (not present in production) — ignore it.
  document.querySelectorAll("nextjs-portal").forEach((node) => node.remove());

  const box = (rect: DOMRect): Box => ({
    top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height,
  });
  const arrow = (rel: string): ArrowState | null => {
    const link = document.querySelector<HTMLAnchorElement>(`a[rel="${rel}"]`);
    if (!link) return null;
    const rect = link.getBoundingClientRect();
    const style = getComputedStyle(link);
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      ...box(rect),
      position: style.position,
      visible: style.display !== "none" && style.visibility === "visible" && Number(style.opacity) > 0,
      onTop: hit !== null && link.contains(hit),
    };
  };

  await frame();
  const snapshots = {} as PageReport["snapshots"];
  const maxScroll = root.scrollHeight - innerHeight;
  for (const [label, y] of [["top", 0], ["middle", maxScroll / 2], ["end", maxScroll]] as const) {
    scrollTo(0, y);
    await frame();
    snapshots[label] = { prev: arrow("prev"), next: arrow("next") };
  }

  const list = document.querySelector("ol.bible-text")!;
  return {
    viewportWidth: root.clientWidth,
    viewportHeight: innerHeight,
    overflowX: root.scrollWidth > root.clientWidth,
    headerBottom: document.querySelector("header.sticky")!.getBoundingClientRect().bottom,
    text: box(list.getBoundingClientRect()),
    lastVerseAtEnd: box(list.lastElementChild!.getBoundingClientRect()),
    snapshots,
  };
}

async function openPage(cdp: Cdp, sessionId: string, device: Device, path: string): Promise<PageReport> {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: device.width, height: device.height, deviceScaleFactor: device.scale, mobile: device.mobile,
  }, sessionId);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: device.mobile }, sessionId);
  const loaded = cdp.waitFor("Page.loadEventFired", sessionId);
  await cdp.send("Page.navigate", { url: BASE_URL + path }, sessionId);
  await loaded;
  const { result, exceptionDetails } = await cdp.send<{ result: { value: PageReport }; exceptionDetails?: { text: string } }>(
    "Runtime.evaluate",
    { expression: `(${measurePage.toString()})()`, awaitPromise: true, returnByValue: true },
    sessionId,
  );
  if (exceptionDetails) throw new Error(`In-page error on ${path}: ${exceptionDetails.text}`);
  return result.value;
}

// --- Assertions --------------------------------------------------------------

const intersects = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const px = (n: number) => Math.round(n);

function checkLongChapter(device: Device, report: PageReport): string[] {
  const failures: string[] = [];
  const fail = (message: string) => failures.push(message);

  if (report.overflowX) fail("page scrolls horizontally");

  for (const rel of ["prev", "next"] as const) {
    const top = report.snapshots.top[rel];
    if (!top) {
      fail(`${rel} arrow missing`);
      continue;
    }
    for (const [label, snapshot] of Object.entries(report.snapshots)) {
      const state = snapshot[rel]!;
      if (state.position !== "fixed") fail(`${rel} is position:${state.position} at ${label}`);
      if (!state.visible) fail(`${rel} not visible at ${label}`);
      if (!state.onTop) fail(`${rel} covered by another element at ${label}`);
      if (state.left < 0 || state.right > report.viewportWidth || state.bottom > report.viewportHeight)
        fail(`${rel} outside viewport at ${label} (${px(state.left)},${px(state.top)})`);
      if (state.top < report.headerBottom) fail(`${rel} under the sticky header at ${label}`);
      if (Math.abs(state.top - top.top) > 1 || Math.abs(state.left - top.left) > 1)
        fail(`${rel} moved while scrolling (${label})`);
    }
    if (top.width < MIN_TARGET_SIZE || top.height < MIN_TARGET_SIZE)
      fail(`${rel} is ${px(top.width)}×${px(top.height)}, below ${MIN_TARGET_SIZE}×${MIN_TARGET_SIZE}`);
    if (intersects(report.snapshots.end[rel]!, report.lastVerseAtEnd))
      fail(`${rel} covers the last verse at the end of the chapter`);
    if (device.width >= SIDE_LAYOUT_MIN_WIDTH && intersects({ ...top, top: -1e6, bottom: 1e6 }, report.text))
      fail(`${rel} overlaps the text column on a 2xl screen`);
  }

  const { prev, next } = report.snapshots.top;
  if (prev && next && intersects(prev, next)) fail("arrows overlap each other");
  return failures;
}

function checkEdges(first: PageReport, last: PageReport): string[] {
  const failures: string[] = [];
  if (first.snapshots.top.prev) failures.push("Genesis 1 renders a previous arrow");
  if (!first.snapshots.top.next?.onTop) failures.push("Genesis 1 next arrow missing or covered");
  if (last.snapshots.top.next) failures.push("Revelation 22 renders a next arrow");
  if (!last.snapshots.top.prev?.onTop) failures.push("Revelation 22 previous arrow missing or covered");
  return failures;
}

// --- Main ------------------------------------------------------------------

async function main() {
  const profileDir = mkdtempSync(join(tmpdir(), "chapter-nav-check-"));
  const cdp = await Cdp.connect(await launchChrome(profileDir));
  let exitCode = 0;
  try {
    const { targetId } = await cdp.send<{ targetId: string }>("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send<{ sessionId: string }>("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    if (SCREENSHOT_DIR) mkdirSync(SCREENSHOT_DIR, { recursive: true });

    console.log(`Chapter arrows — responsive check against ${BASE_URL}\n`);
    for (const device of DEVICES) {
      const report = await openPage(cdp, sessionId, device, LONG_CHAPTER);
      const failures = checkLongChapter(device, report);

      if (SCREENSHOT_DIR) {
        // Mid-chapter, where a reader spends most of their time.
        await cdp.send("Runtime.evaluate", {
          expression: "scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2)",
        }, sessionId);
        const { data } = await cdp.send<{ data: string }>("Page.captureScreenshot", { format: "png" }, sessionId);
        const file = `${device.width}x${device.height}-${device.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
        writeFileSync(join(SCREENSHOT_DIR, file), Buffer.from(data, "base64"));
      }

      // Canon edges on one phone, one tablet and one wide screen.
      if ([390, 768, 1920].includes(device.width)) {
        const first = await openPage(cdp, sessionId, device, FIRST_CHAPTER);
        const last = await openPage(cdp, sessionId, device, LAST_CHAPTER);
        failures.push(...checkEdges(first, last));
      }

      const arrows = report.snapshots.middle;
      const where = arrows.prev && arrows.next
        ? `prev (${px(arrows.prev.left)},${px(arrows.prev.top)}) next (${px(arrows.next.left)},${px(arrows.next.top)})`
        : "arrows missing";
      const label = `${device.name} ${device.width}×${device.height}`.padEnd(42);
      if (failures.length === 0) {
        console.log(`PASS  ${label} ${where}`);
      } else {
        exitCode = 1;
        console.log(`FAIL  ${label} ${where}`);
        for (const failure of failures) console.log(`        - ${failure}`);
      }
    }
  } finally {
    // Closes the whole browser, including any process Chrome handed off to.
    await cdp.send("Browser.close").catch(() => {});
    cdp.close();
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      rmSync(profileDir, { recursive: true, force: true });
    } catch {
      // Chrome may still hold the profile briefly on Windows; it is in tmpdir.
    }
  }
  console.log(exitCode === 0 ? `\nAll ${DEVICES.length} devices passed.` : "\nSome devices FAILED.");
  process.exit(exitCode);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
