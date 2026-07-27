# Operations Runbook

**Audience:** the developer/maintainer, not the content owner. (The preacher's
documents are [bible-editing-guide.md](./bible-editing-guide.md) and the Studio
itself.)

This is the handbook for owning this site over years rather than weeks: who must
control which accounts, what to do when something breaks, what to check on a
schedule, and what will eventually need upgrading.

**Status at handover (2026-07-27):** live in production, fully documented,
all checks green.

---

## 1. Account ownership — read this first

**This is the highest risk to the site's survival, and it is not a technical
one.** Every failure below is recoverable in minutes *if* the right person can
log in. None of them are recoverable if they cannot.

The site depends on five external accounts:

| # | Service | Holds | If access is lost |
|---|---|---|---|
| 1 | **Porkbun** (registrar) | `hristovoevangelie.org` | **Fatal.** Domain lapses, someone else can register it. The site becomes unreachable at its real address |
| 2 | **Vercel** | Hosting, build, env vars | Site keeps serving, but nothing can be deployed or changed again |
| 3 | **Sanity** | All CMS content + assets | Content cannot be edited; recoverable only from an export |
| 4 | **GitHub** | Code + Bible text | Recoverable from any clone (§2.7) |
| 5 | **Resend** | Contact-form email | Contact form stops sending |

### Required actions before handover is complete

- [ ] **Porkbun** — transfer the domain to the church's account, or at minimum
      add the preacher as a contact and put **auto-renew on a card that will not
      expire**. A lapsed domain is the one failure with a deadline attached and
      no undo.
- [ ] **Vercel** — transfer the project to an account the church controls, or add
      the preacher as a team member with admin rights.
- [ ] **Sanity** — add the preacher as **project administrator**
      (sanity.io → Project → Members).
- [ ] **GitHub** — add the preacher as a collaborator/owner, **and make sure a
      full clone exists on a machine he controls**.
- [ ] **Resend** — account in the church's name, on the church's billing.
- [ ] **Password manager** — one shared vault holding all five logins plus
      `SANITY_REVALIDATE_SECRET` and `RESEND_API_KEY`. Confirm he can open it.
- [ ] **Billing review** — every card on every service. Note renewal dates.

> Do not treat this list as paperwork. Everything else in this runbook assumes
> somebody can still log in.

---

## 2. Disaster recovery checklist

Scenarios ordered by likelihood. Each is *symptom → diagnose → fix*.

### 2.1 "The site shows old content after publishing" — the most common issue

Almost always the revalidation webhook. Full decision tree in
**[deployment.md §9](./deployment.md#9-troubleshooting)**.

1. Sanity → API → Webhooks → **Recent deliveries**.
2. No entry ⇒ the webhook is missing or its filter excludes the type.
3. `401` ⇒ secret mismatch, or the webhook URL used the apex instead of `www`.
4. `200 revalidated: true` ⇒ it worked; reload — the change lands on the *next*
   request.

**Time to fix:** minutes. **Data loss:** none.

### 2.2 A bad deployment

**Vercel → Deployments → last known-good → ⋯ → Promote to Production.**
Traffic moves immediately. Then revert the offending commit in git so the next
deploy is clean. See [deployment.md §8](./deployment.md#8-rollback-procedure).

**Time to fix:** under 2 minutes. **Data loss:** none.

### 2.3 A bad content edit

Studio → document → **History** → restore → **Publish**. No developer needed —
teach the preacher this one. See [backup-restore.md §4](./backup-restore.md).

### 2.4 Content deleted or the dataset damaged

Restore from your most recent export:
[backup-restore.md §3](./backup-restore.md). This is the scenario that quarterly
exports exist for. **Without an export, this is unrecoverable** — Sanity's
History covers single documents over a limited retention window, not a dataset.

### 2.5 The build suddenly fails and nothing deploys

**First, the reassurance: the live site stays up.** Vercel continues serving the
last successful deployment. A failed build blocks *changes*, it does not take the
site down. This turns most emergencies into ordinary work.

Diagnose in this order:

| Check | Meaning |
|---|---|
| Does `npm run build` fail locally too? | Yes ⇒ a code/data problem. No ⇒ an environment/platform problem |
| Does the log name a Bible file and verse? | A bad Bible edit — `prebuild` caught it. Fix the verse, or `git revert` |
| Does it mention the Node version? | Platform drift — see §5.1 |
| Did it start without any commit? | Vercel changed its build image or dropped a Node version |

### 2.6 Domain expired or DNS broken

Porkbun → renew/restore. Then verify the two records in
[backup-restore.md §7](./backup-restore.md). Vercel re-issues TLS automatically
once DNS resolves. **An expired domain has a hard deadline** — after the
redemption window the name can be bought by anyone.

### 2.7 GitHub repository lost

Any existing clone is a complete copy, history included:

```bash
git remote set-url origin <new-remote>
git push -u origin --all
```

This is why the preacher should hold a clone.

### 2.8 A secret leaked (committed, pasted, screenshotted)

Treat as **burned** — removing it from a file does not remove it from git
history.

1. Generate a replacement.
2. Update Vercel **and** the consumer (Sanity webhook header, or Resend).
3. **Redeploy** — env vars are read at build time.
4. Revoke the old key at the provider.

### 2.9 Contact form stops sending

By design the form fails gracefully — the visitor sees a generic error, the page
never crashes. Check, in order: `RESEND_API_KEY` valid, `RESEND_FROM_EMAIL` still
on a Resend-verified domain (**domain verification can lapse**), Resend account
in good standing. Then redeploy.

**If exactly one person reports failure while the form works for you**, consider
the rate limiter (`contact.ratelimit.ts`): 5 submissions per IP per 10 minutes,
after which that caller gets the generic error. Server logs show
`[contact] Submission blocked by rate limit`. This is intended behaviour, and it
resets on its own — an office or church hall behind a single shared NAT address
is the one realistic false-positive case. Raise `MAX_SUBMISSIONS` if it ever
bites a real user.

### 2.10 Total rebuild from nothing

Worst case, in order: clone the repo → restore secrets from the password manager
→ import the newest Sanity export → create a Vercel project and set env vars
([deployment.md §3](./deployment.md#3-environment-variables)) → point DNS
([§6b](./deployment.md#6b-configure-dns-in-porkbun)) → recreate the Sanity
webhook ([§5](./deployment.md#5-sanity-webhook-publish--revalidate)) → run the
smoke test ([§7](./deployment.md#7-production-verification-smoke-test)).

Realistically half a day, and only if you hold the accounts and a backup.

---

## 3. Maintenance schedule

Deliberately light. This site is static, has no database, no user accounts, and
no runtime server logic beyond one webhook route and the contact action. It does
not need monthly patching to stay safe.

### Monthly — 5 minutes

- [ ] Load the site. Check `/mk` and `/en`, one sermon, one Bible chapter.
- [ ] Submit the contact form once; confirm it arrives.
- [ ] Confirm the preacher has published something recently and it appeared. (If
      he hasn't published in months, test one yourself — a silently broken
      webhook is only discovered by publishing.)

### Quarterly — 30 minutes

- [ ] **Sanity export**, stored off-machine, last 3 retained
      ([backup-restore.md §2](./backup-restore.md)).
- [ ] `npm outdated` in both repos — read it, don't act reflexively (§5.4).
- [ ] Check Vercel and Sanity usage against free-tier limits.
- [ ] Confirm billing cards on all five accounts are still valid.

### Annually — 2–3 hours

- [ ] Restore a backup into a scratch dataset to prove backups work.
- [ ] Review and apply framework upgrades (§5).
- [ ] Rotate `SANITY_REVALIDATE_SECRET` and `RESEND_API_KEY`.
- [ ] Re-run the full smoke test
      ([deployment.md §7](./deployment.md#7-production-verification-smoke-test)).
- [ ] Confirm domain auto-renew and its expiry date.
- [ ] Re-read §1 — has anyone left, changed email, or lost access?

### Event-driven

| Trigger | Action |
|---|---|
| Schema field added | Deploy the Studio **and** the website ([deployment.md §13](./deployment.md#13-deploying-the-studio-schema-changes)) |
| Bible text edited | Nothing — `prebuild` re-derives the search index automatically |
| Book display name changed | `npm run bible:build`, then commit (the build fails until the index is refreshed) |
| Env var changed | **Redeploy** — build-time inlined |
| Before any bulk content change | Export first |

---

## 4. Monitoring

Four dashboards, all free, none requiring code changes to maintain. Two are
built into the site (Vercel), one is Sanity's own, one is external and set up by
hand (Better Stack).

| What you want to know | Where to look |
|---|---|
| Is anyone visiting? Which pages? | Vercel → **Analytics** (§4.1) |
| Is the site fast for real visitors? | Vercel → **Speed Insights** (§4.2) |
| Am I near Sanity's free limits? | sanity.io/manage → **Usage** (§4.3) |
| **Is the site up at all?** | Better Stack (§4.4) — *not yet configured* |

> The first three tell you about a site that is working. Only the fourth tells
> you it has stopped. That gap is why §4.4 matters most.

### 4.1 Vercel Web Analytics

**Purpose.** Traffic: page views, unique visitors, most-read pages, referrers,
countries, device types. For this site the useful question is *which content the
congregation actually reads* — sermons vs Bible chapters vs books.

**Dashboard.** Vercel → the `church-website` project → **Analytics** tab. Must be
enabled once in the dashboard; the code is already in place.

**Metrics worth watching**

| Metric | Why it matters here |
|---|---|
| Top pages | Tells the preacher what people come for |
| Visitors vs page views | A rising ratio means people read more than one page |
| Referrers | Whether Facebook/YouTube links actually bring people |
| Countries | Diaspora reach — likely justifies the English translation |

**Expected usage.** Hobby plans include a capped number of events per month
(historically ~2,500 — **check the current figure in the dashboard**, it
changes). A church site with hundreds of visitors a month sits far below the cap.
If it is ever exceeded, collection simply stops until the next month; nothing
breaks and the site is unaffected.

**Privacy.** Cookieless, no personal identification, no advertising use. This is
why no consent banner is required and why the Privacy Policy can state plainly
that the site sets no tracking cookies.

### 4.2 Vercel Speed Insights

**Purpose.** Core Web Vitals measured on **real visitors' devices** — as opposed
to Lighthouse, which is one synthetic run from one machine. A phone on mobile
data in Bitola is the honest test, and only this shows it.

**Dashboard.** Vercel → project → **Speed Insights** tab. Also enable once.

**Core Web Vitals, in plain terms**

| Vital | Measures | Good | Needs work | Poor |
|---|---|---|---|---|
| **LCP** — Largest Contentful Paint | How long until the main content appears | ≤ 2.5 s | 2.5–4 s | > 4 s |
| **INP** — Interaction to Next Paint | How quickly the page responds to a tap | ≤ 200 ms | 200–500 ms | > 500 ms |
| **CLS** — Cumulative Layout Shift | How much the page jumps while loading | ≤ 0.1 | 0.1–0.25 | > 0.25 |

**Recorded baseline** — Lighthouse against production, 2026-07-27:

```
Performance 94   Accessibility 100   Best Practices 100   SEO 100
FCP 1.0 s   LCP 3.0 s   TBT 50 ms   CLS 0
```

LCP was the one weak figure; a `fetchPriority="high"` fix on the homepage hero
shipped after that run. **Speed Insights is how you confirm it worked** — expect
real-user LCP to improve over the following days. If it does not, the hero image
is the place to look.

**Monitoring workflow.** Glance monthly (it is already in the §3 monthly check).
Act only on a *sustained* regression — a single bad day is usually one visitor on
a poor connection. Real causes to suspect, in order: a large new image, a new
client component, or a third-party embed.

### 4.3 Sanity project dashboard

**Where.** [sanity.io/manage](https://sanity.io/manage) → project `9nwz9xmi` →
**Usage**.

**What is metered:** API requests (CDN and non-CDN), bandwidth, document count,
asset storage, and number of datasets. Free-plan allowances change, so read them
in the dashboard rather than trusting a number written here.

**The important thing to understand — visitor traffic does not consume Sanity
quota.** Every page is statically generated, every accessor is wrapped in
`unstable_cache`, and the read client uses `useCdn: true`. A visitor is served
static HTML from Vercel's edge; **Sanity is never contacted**. Sanity usage is
therefore roughly:

```
(builds × queries) + (publishes × queries)
```

It scales with how often the preacher publishes — **not** with how popular the
site becomes. A thousand new readers cost nothing in Sanity quota.

**Current scale for reference:** 13 documents, 10 assets, 7.4 MB total (measured
during the backup export, 2026-07-27). This is a rounding error against the free
plan. Realistically the only way to approach a limit is uploading a very large
number of high-resolution photos or PDFs.

Sanity emails when a project nears a limit — make sure that address is one
someone still reads (§1).

### 4.4 Better Stack — uptime monitoring (manual setup, no code)

**Not configured yet. This is the one monitoring gap, and deliberately so:
uptime monitoring is external by nature and needs no code, so it must not be
wired into the repository.**

**Why it is recommended.** Nothing else in this stack can tell you the site is
*down*. Analytics showing zero visitors looks identical to a quiet Tuesday. The
realistic failure modes for this project are exactly the ones uptime monitoring
catches first:

- the domain lapsed (§1 — the top-ranked risk in this whole document)
- DNS was changed or broke
- a Vercel incident or account/billing problem
- TLS certificate failure

An email saying *"hristovoevangelie.org is down"* is how you find out in minutes
rather than when a congregant mentions it weeks later.

**What to monitor**

| URL | Why |
|---|---|
| `https://www.hristovoevangelie.org/mk` | The canonical homepage — the real user entry point |
| `https://www.hristovoevangelie.org/en` | Confirms the English half renders |
| `https://www.hristovoevangelie.org/sitemap.xml` | Cheap proof the app is building pages, not just serving a cached shell |

Monitoring the apex (`hristovoevangelie.org`) is optional — it 308-redirects to
`www`; if you add it, allow redirects in the monitor settings.

**Suggested settings**

| Setting | Value | Reasoning |
|---|---|---|
| Check interval | **3–5 minutes** | Free-plan friendly; this is not a service where seconds matter |
| Request method | `GET` | |
| Expected status | `200` | |
| Alert after | 2 consecutive failures | Avoids waking you for one dropped packet |
| Notify | Email | Free, no app to install, no phone dependency |
| Recipient | **You (the maintainer) and the preacher** | Under no circumstances the preacher alone — he cannot fix it |

**Setup (about 10 minutes, once)**

1. Create a free account at [betterstack.com](https://betterstack.com) →
   **Uptime**.
2. **Create monitor** → paste the first URL above.
3. Set interval, expected status `200`, and "alert after 2 failures".
4. Add both email recipients under notifications.
5. Repeat for the other URLs.
6. **Verify the alert path works** — pause a monitor or point one at a
   deliberately wrong URL, confirm the email arrives, then restore it. An
   untested alert is not a monitor.
7. Optional: enable the free status page if the church ever wants a public one.

**Free plan.** Better Stack's free tier historically covers ~10 monitors at
3-minute intervals with email alerts — comfortably more than the three needed.
Confirm the current terms at signup.

**No code changes are needed for any of this, now or later.** The preacher — or
a future maintainer — can set it up, change recipients, or drop it entirely
without touching the repository.

---

## 5. Future upgrade recommendations

### 5.1 Node.js 22 end-of-life — ~April 2027 ⚠️ the only dated item

Node 22 leaves LTS maintenance around **April 2027**. Vercel drops end-of-life
Node versions some time after. Pinned in three places:

| Where | Value |
|---|---|
| `package.json` → `engines.node` | `22.x` |
| `.nvmrc` | `22` |
| `.github/workflows/bible-guard.yml` | `node-version: "22"` |

**Symptom:** builds start failing with a Node version error, with no code change.
**Fix:** bump all three to the current LTS, run `npm run typecheck && npm test &&
npm run build`, deploy. Realistically under an hour.
**Meanwhile the live site keeps serving.** Not an emergency.

**Recommendation:** do this proactively in **early 2027**, at a calm moment,
rather than reactively when a correction won't publish.

### 5.2 GitHub Actions deprecations

`bible-guard.yml` uses `actions/checkout@v4` and `actions/setup-node@v4`. GitHub
deprecates major action versions periodically — first warnings, later hard
failures.

**Impact if ignored: low.** The workflow is a safety net; a failing workflow does
not block Vercel from deploying. Bump the `@v4` pins when GitHub warns.

### 5.3 Next.js 15 → 16

Already visible: `next lint` prints *"deprecated and will be removed in Next.js
16"*. When upgrading, migrate to the ESLint CLI:

```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

**Recommendation:** do not chase Next majors. This site uses a deliberately
conservative subset — App Router, Server Components, `generateStaticParams`,
`unstable_cache`. Upgrade when there is a reason (security, a Node requirement,
Vercel support), not on release day. Note `unstable_cache` is explicitly unstable
API and is the most likely thing to require attention in a future major.

### 5.4 Dependency policy — what to ignore

Long-lived low-traffic sites are damaged more often by careless upgrades than by
old dependencies. Guidance:

| Situation | Action |
|---|---|
| `npm audit` flags transitive deps inside Sanity's tree | **Ignore.** They resolve when Sanity updates |
| `npm audit fix --force` proposes a fix | **Never run it here.** It currently proposes *downgrading* `sanity` 6.x → 5.14.1, which would break the Studio |
| A direct dependency has a real advisory reachable from the site | Patch it |
| A minor/patch bump with no reason behind it | Skip. Batch these annually |

The attack surface is genuinely small: no database, no auth, no user input except
a Zod-validated contact form, no secrets in the client bundle.

### 5.5 Sanity version drift between the two repos

| Repo | `sanity` |
|---|---|
| `church-website` (owns the schemas) | **6.2.0** |
| `studio-church-ehb` (imports them) | **6.6.0** |

**Impact: cosmetic today.** `sanity` is imported only under `sanity/` — never
from `src/` — so the website's build and runtime are unaffected. The website
talks to Sanity through `@sanity/client`, a separate package. The drift shows up
only if you run `tsc` inside the Studio repo, which has no typecheck script.

**Recommendation:** align them (`church-website` → 6.6.0) the next time you touch
Sanity code, not as a standalone task. Re-run `npm run typecheck` afterwards —
the schema files are type-checked against this package.

### 5.6 Vercel production branch

Production currently builds from **`feature/project-foundation`**, not `main`.
This works, but is surprising to anyone inheriting the project — and the
preacher's Bible workflow commits to `main`.

**Recommendation — worth doing before handover:** merge into `main` and switch
Vercel's production branch to `main` (Settings → Git). Then the branch the
content owner commits to is the branch that deploys, and the CI guard
(`on: push: branches: [main]`) guards the branch that actually ships.

### 5.7 Studio auto-updates

`studio-church-ehb/sanity.cli.ts` sets `autoUpdates: true`, so the hosted Studio
pulls newer Sanity runtimes without a redeploy. This keeps it patched, but means
it can change without you.

**The website is insulated:** the read client pins `apiVersion: "2024-01-01"`,
and every content accessor falls back to `siteConfig`/`messages` when Sanity is
unreachable. If the Studio ever breaks, the public site — and the entire Bible
module — is unaffected.

---

## 6. What is genuinely durable here

Worth remembering when weighing future changes:

- **The Bible module has no external dependencies.** Text is JSON in git,
  rendered as static HTML, searched client-side by Fuse.js. No database, no CMS,
  no search service. If Sanity, Resend, and the CMS all disappeared, every Bible
  page would still build and serve.
- **A failed build never takes the site down.** Vercel keeps serving the last
  good deployment.
- **Bad data cannot deploy.** `prebuild` validates all 31,102 verses per locale
  and fails the build on a malformed edit.
- **Content and code are independent.** The preacher publishes without a deploy;
  developers deploy without touching content.

The realistic long-term failure mode for this project is **not** a software
defect. It is an unpaid domain renewal or a password nobody has. Solve §1
properly and the rest of this document is routine.
