// Monthly production health check.
//
// Runs every check from docs/operations-runbook.md §3 that CAN be automated,
// and prints a Markdown report. The GitHub Actions workflow
// (.github/workflows/monthly-health-check.yml) pipes that report straight into
// an issue; running it locally prints the same report to the terminal.
//
// Run with:  npm run health-check
//   (add --strict to exit non-zero when any check fails, e.g. in other CI)
//
// DELIBERATELY DEPENDENCY-FREE. It imports nothing but Node built-ins, so it
// runs with no `npm ci` step and cannot be broken by a dependency change. That
// matters more than code reuse here: this script's whole job is to still work
// untouched in five years. For the same reason every service it queries is a
// free public endpoint with no API key and no account:
//
//   - RDAP (domain expiry)      — free IANA-backed protocol, replaces WHOIS
//   - TLS handshake             — Node's own `node:tls`
//   - Plain HTTPS GETs          — the live site
//   - `npm audit`               — reads package-lock.json, no install needed
//
// Nothing here can incur a charge.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { connect } from "node:tls";
import { execFileSync } from "node:child_process";

// --- Configuration -------------------------------------------------------

const SITE_URL = new URL("https://www.hristovoevangelie.org");
const TLS_HOST = SITE_URL.hostname;
const REGISTRABLE_DOMAIN = TLS_HOST.replace(/^www\./, "");

// Vercel URLs are scoped to an account slug: vercel.com/<slug>/church-website.
// Paste that slug here once and the two Vercel links below become exact deep
// links; left empty they fall back to the dashboard root, which always works.
const VERCEL_SLUG = "";
const VERCEL_PROJECT = "church-website";
const SANITY_PROJECT_ID = "9nwz9xmi";

const REQUEST_TIMEOUT_MS = 15_000;

// Thresholds, in days remaining.
//
// The domain and the certificate need different numbers because they fail
// differently. A domain is renewed by a human (or a card that must still be
// valid), so 90 days of warning is not excessive — §1 calls a lapsed domain the
// one failure with a deadline and no undo. The certificate is renewed
// automatically by Vercel roughly 30 days out, so anything under 30 means the
// automation did not run, and under 14 is genuinely urgent.
const DOMAIN_WARN_DAYS = 90;
const DOMAIN_FAIL_DAYS = 30;
const TLS_WARN_DAYS = 30;
const TLS_FAIL_DAYS = 14;

// The Bible alone generates well over a thousand sitemap entries, so a sudden
// collapse means pages stopped being generated, not that content was tidied.
const SITEMAP_WARN_URLS = 500;
const SITEMAP_FAIL_URLS = 100;

// The end-to-end content probe. This verse must stay free of characters HTML
// escapes (& < > " ') or the comparison against the rendered page breaks.
const PROBE = {
  file: join("src", "data", "bible", "mk", "john.json"),
  path: "/mk/bible/john/3",
  chapter: 3,
  verse: 16,
} as const;

// --- Result model --------------------------------------------------------

type Status = "ok" | "warn" | "fail";

const ICON: Record<Status, string> = {
  ok: "🟢",
  warn: "🟡",
  fail: "🔴",
};

type CheckResult = {
  readonly name: string;
  readonly status: Status;
  readonly detail: string;
};

const SEVERITY: Record<Status, number> = { ok: 0, warn: 1, fail: 2 };

function worstOf(results: readonly CheckResult[]): Status {
  return results.reduce<Status>(
    (worst, r) => (SEVERITY[r.status] > SEVERITY[worst] ? r.status : worst),
    "ok"
  );
}

function byThreshold(days: number, warnAt: number, failAt: number): Status {
  if (days < failAt) return "fail";
  if (days < warnAt) return "warn";
  return "ok";
}

function daysUntil(date: Date): number {
  return Math.floor((date.getTime() - Date.now()) / 86_400_000);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// --- Checks --------------------------------------------------------------

type RdapEvent = { readonly eventAction: string; readonly eventDate: string };

function isRdapEventArray(value: unknown): value is readonly RdapEvent[] {
  return (
    Array.isArray(value) &&
    value.every(
      (e) =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as RdapEvent).eventAction === "string" &&
        typeof (e as RdapEvent).eventDate === "string"
    )
  );
}

// Domain expiry via RDAP — the structured JSON successor to WHOIS. rdap.org
// redirects to the registry that is authoritative for the TLD, so this keeps
// working if the domain is ever moved to another registrar.
async function checkDomain(): Promise<CheckResult> {
  const name = "Domain registration";
  try {
    const res = await fetch(`https://rdap.org/domain/${REGISTRABLE_DOMAIN}`, {
      headers: { accept: "application/rdap+json" },
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      return {
        name,
        status: "fail",
        detail: `RDAP lookup: HTTP ${res.status}`,
      };
    }
    const body: unknown = await res.json();
    const events =
      typeof body === "object" && body !== null
        ? (body as { events?: unknown }).events
        : undefined;
    if (!isRdapEventArray(events)) {
      return { name, status: "warn", detail: "RDAP returned no events" };
    }
    const expiry = events.find((e) => e.eventAction === "expiration");
    if (!expiry) {
      return { name, status: "warn", detail: "RDAP returned no expiry date" };
    }
    const date = new Date(expiry.eventDate);
    const days = daysUntil(date);
    return {
      name,
      status: byThreshold(days, DOMAIN_WARN_DAYS, DOMAIN_FAIL_DAYS),
      detail: `expires ${isoDate(date)} — **${days} days** remaining`,
    };
  } catch (error) {
    return { name, status: "fail", detail: `RDAP lookup: ${describe(error)}` };
  }
}

// Certificate expiry straight from the TLS handshake. Vercel renews Let's
// Encrypt certificates automatically; this exists to notice when it hasn't.
function checkCertificate(): Promise<CheckResult> {
  const name = "TLS certificate";
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: CheckResult): void => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    const socket = connect(
      { host: TLS_HOST, port: 443, servername: TLS_HOST },
      () => {
        const cert = socket.getPeerCertificate();
        if (!cert.valid_to) {
          finish({ name, status: "fail", detail: "no certificate returned" });
          return;
        }
        const date = new Date(cert.valid_to);
        const days = daysUntil(date);
        const issuer = cert.issuer?.O ?? "unknown issuer";
        finish({
          name,
          status: byThreshold(days, TLS_WARN_DAYS, TLS_FAIL_DAYS),
          detail: `valid to ${isoDate(date)} — **${days} days** remaining (${issuer})`,
        });
      }
    );

    socket.setTimeout(REQUEST_TIMEOUT_MS, () => {
      finish({ name, status: "fail", detail: "TLS connection timed out" });
    });
    socket.on("error", (error) => {
      finish({ name, status: "fail", detail: `TLS error: ${error.message}` });
    });
  });
}

async function fetchText(
  path: string
): Promise<{ readonly status: number; readonly body: string }> {
  const res = await fetch(new URL(path, SITE_URL), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: res.status, body: await res.text() };
}

async function checkPage(name: string, path: string): Promise<CheckResult> {
  try {
    const { status } = await fetchText(path);
    return status === 200
      ? { name, status: "ok", detail: `\`${path}\` → 200` }
      : { name, status: "fail", detail: `\`${path}\` → **${status}**` };
  } catch (error) {
    return { name, status: "fail", detail: `\`${path}\` — ${describe(error)}` };
  }
}

async function checkSitemap(): Promise<CheckResult> {
  const name = "sitemap.xml";
  try {
    const { status, body } = await fetchText("/sitemap.xml");
    if (status !== 200) {
      return { name, status: "fail", detail: `HTTP **${status}**` };
    }
    if (!body.includes("<urlset")) {
      return { name, status: "fail", detail: "served, but is not a sitemap" };
    }
    const count = (body.match(/<loc>/g) ?? []).length;
    return {
      name,
      status: byThreshold(count, SITEMAP_WARN_URLS, SITEMAP_FAIL_URLS),
      detail: `valid XML, **${count.toLocaleString("en-US")} URLs**`,
    };
  } catch (error) {
    return { name, status: "fail", detail: describe(error) };
  }
}

async function checkRobots(): Promise<CheckResult> {
  const name = "robots.txt";
  try {
    const { status, body } = await fetchText("/robots.txt");
    if (status !== 200) {
      return { name, status: "fail", detail: `HTTP **${status}**` };
    }
    return body.toLowerCase().includes("sitemap:")
      ? { name, status: "ok", detail: "served, and points at the sitemap" }
      : { name, status: "warn", detail: "served, but no `Sitemap:` line" };
  } catch (error) {
    return { name, status: "fail", detail: describe(error) };
  }
}

type Verse = { readonly number: number; readonly text: string };
type Chapter = { readonly number: number; readonly verses: readonly Verse[] };

// Narrow the book file by hand rather than importing bible.schema.ts: that
// would pull Zod in and force an `npm ci` on every run. The dataset's shape is
// already guarded on every push by .github/workflows/bible-guard.yml, so this
// only needs to read one verse, not re-validate the corpus.
function readProbeVerse(): string | null {
  const raw: unknown = JSON.parse(
    readFileSync(join(process.cwd(), PROBE.file), "utf8")
  );
  if (typeof raw !== "object" || raw === null) return null;
  const chapters = (raw as { chapters?: unknown }).chapters;
  if (!Array.isArray(chapters)) return null;
  for (const chapter of chapters as readonly Chapter[]) {
    if (chapter?.number !== PROBE.chapter) continue;
    if (!Array.isArray(chapter.verses)) return null;
    for (const verse of chapter.verses) {
      if (verse?.number === PROBE.verse && typeof verse.text === "string") {
        return verse.text;
      }
    }
  }
  return null;
}

// The most valuable check here: it proves the WHOLE pipeline — committed JSON →
// prebuild → static generation → deploy → HTML actually served to a reader. A
// mismatch means the text in git never reached production, which is exactly the
// failure the content owner cannot see and would not think to report.
async function checkLiveBibleText(): Promise<CheckResult> {
  const name = "Bible text on the live site";
  let expected: string | null;
  try {
    expected = readProbeVerse();
  } catch (error) {
    return {
      name,
      status: "warn",
      detail: `cannot read probe: ${describe(error)}`,
    };
  }
  if (expected === null) {
    return { name, status: "warn", detail: "probe verse not found in repo" };
  }
  try {
    const { status, body } = await fetchText(PROBE.path);
    if (status !== 200) {
      return { name, status: "fail", detail: `${PROBE.path} → **${status}**` };
    }
    return body.includes(expected)
      ? { name, status: "ok", detail: "John 3:16 (MK) matches the repository" }
      : {
          name,
          status: "fail",
          detail:
            "**live page does not match the committed text** — a deploy is " +
            "missing or failed",
        };
  } catch (error) {
    return { name, status: "fail", detail: describe(error) };
  }
}

type AuditCounts = {
  readonly critical?: number;
  readonly high?: number;
  readonly moderate?: number;
  readonly low?: number;
};

// `--package-lock-only` audits the lockfile directly, so no node_modules and no
// install are required. npm exits non-zero when it finds anything, but still
// writes the JSON report to stdout — so the report is read from the error too.
//
// On Windows npm is a `.cmd` shim, and since Node 20 those cannot be spawned
// without a shell (the CVE-2024-27980 fix). `shell: true` is safe here only
// because every argument below is a hard-coded literal — never interpolate
// anything into this call.
//
// ONLY `critical` turns this row red, and that is deliberate. Checked
// 2026-07-28, all 28 `high` advisories were transitive dependencies of build
// and CLI tooling — @sanity/cli → @oclif/core → ejs, eslint → minimatch,
// @module-federation → adm-zip. None of it runs in the request path of a
// statically generated site, so none of it is reachable by a visitor. Escalating
// on `high` would paint this row yellow every single month and train the reader
// to ignore the colour, which is worse than not colouring it at all. The counts
// stay printed either way, and §5.4 of the runbook is where they get acted on.
function checkNpmAudit(): CheckResult {
  const name = "npm audit";
  const onWindows = process.platform === "win32";
  const npm = onWindows ? "npm.cmd" : "npm";
  let stdout: string;
  try {
    stdout = execFileSync(npm, ["audit", "--package-lock-only", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      shell: onWindows,
    });
  } catch (error) {
    const captured = (error as { stdout?: string }).stdout;
    if (typeof captured !== "string" || captured.length === 0) {
      return {
        name,
        status: "warn",
        detail: `could not run: ${describe(error)}`,
      };
    }
    stdout = captured;
  }
  try {
    const parsed: unknown = JSON.parse(stdout);
    const counts =
      typeof parsed === "object" && parsed !== null
        ? ((parsed as { metadata?: { vulnerabilities?: AuditCounts } }).metadata
            ?.vulnerabilities ?? {})
        : {};
    const critical = counts.critical ?? 0;
    const high = counts.high ?? 0;
    const moderate = counts.moderate ?? 0;
    const low = counts.low ?? 0;
    const summary = `${critical} critical, ${high} high, ${moderate} moderate, ${low} low`;
    return {
      name,
      status: critical > 0 ? "fail" : "ok",
      detail: summary,
    };
  } catch (error) {
    return {
      name,
      status: "warn",
      detail: `unreadable report: ${describe(error)}`,
    };
  }
}

// --- Report --------------------------------------------------------------

function vercelLink(tab: string): string {
  return VERCEL_SLUG === ""
    ? "https://vercel.com/dashboard"
    : `https://vercel.com/${VERCEL_SLUG}/${VERCEL_PROJECT}/${tab}`;
}

function renderReport(results: readonly CheckResult[]): string {
  const overall = worstOf(results);
  const verdict = {
    ok: "🟢 **All automated checks passed.**",
    warn: "🟡 **Something needs a look** — see the yellow rows below.",
    fail: "🔴 **Action needed** — see the red rows below.",
  }[overall];

  const rows = results
    .map((r) => `| ${ICON[r.status]} | ${r.name} | ${r.detail} |`)
    .join("\n");

  const runAt = new Date().toISOString().replace("T", " ").slice(0, 16);

  return `${verdict}

_Checked ${runAt} UTC · [operations runbook](../blob/main/docs/operations-runbook.md)_

## Automated — already done

| | Check | Result |
|---|---|---|
${rows}

## Manual — about 5 minutes

These have no free API, so they still need eyes. Each link goes straight to the
dashboard.

- [ ] **Vercel Analytics** — traffic sane? compare against runbook §4.0 → ${vercelLink("analytics")}
- [ ] **Speed Insights** — Core Web Vitals still green? → ${vercelLink("speed-insights")}
- [ ] **Sanity usage** — documents, assets, bandwidth → https://www.sanity.io/manage/project/${SANITY_PROJECT_ID}
- [ ] **Better Stack** — uptime monitors still enabled (runbook §4.4) → https://betterstack.com/
- [ ] **Contact form** — submit it once, confirm the email arrives → ${SITE_URL.origin}/mk/contact
- [ ] **Bible search** — type a word, confirm results → ${SITE_URL.origin}/mk/bible
- [ ] **Billing cards valid** on all five accounts (runbook §1) — the one item
      no automation will ever cover

## If something is red

Nothing here is fixed by the content owner. Red rows go to the maintainer.
Recovery steps for each failure are in
[operations runbook §2](../blob/main/docs/operations-runbook.md).

Close this issue once the manual boxes are ticked.
`;
}

// --- Entry point ---------------------------------------------------------

async function main(): Promise<void> {
  const results: readonly CheckResult[] = [
    await checkDomain(),
    await checkCertificate(),
    await checkPage("Homepage (MK)", "/mk"),
    await checkPage("Homepage (EN)", "/en"),
    await checkLiveBibleText(),
    await checkSitemap(),
    await checkRobots(),
    checkNpmAudit(),
  ];

  process.stdout.write(renderReport(results));

  if (process.argv.includes("--strict") && worstOf(results) === "fail") {
    process.exitCode = 1;
  }
}

await main();
