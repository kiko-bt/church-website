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

### Monthly — 5 minutes, mostly automated

**You do not run this list by hand.** On the 1st of each month
[`monthly-health-check.yml`](../.github/workflows/monthly-health-check.yml) runs
[`scripts/health-check.ts`](../scripts/health-check.ts) and opens a GitHub issue
with the automated results already filled in. Open the issue, tick the five
manual boxes, close it.

**Verified working end to end on 2026-07-28** by manual dispatch: eight checks
green, issue created, report also written to the Actions run summary. Manually
re-running in the same month creates a second issue — expected, since the title
is keyed to the month. Close the spares.

To run the same checks yourself at any time:

```bash
npm run health-check
```

**Automated — arrive already done**

| Check | Green | Amber | Red |
|---|---|---|---|
| Domain expiry (RDAP) | > 90 days | 30–90 days | **< 30 days** |
| TLS certificate | > 30 days | 14–30 days | **< 14 days** |
| `/mk` and `/en` reachable | 200 | — | anything else |
| **Bible text live matches the repository** | matches | — | **mismatch** |
| `sitemap.xml` | > 500 URLs | 100–500 | < 100 or invalid |
| `robots.txt` | points at sitemap | no `Sitemap:` line | not served |
| `npm audit` | no critical | — | any critical |

The domain and certificate thresholds differ on purpose. A domain is renewed by
a person and a working card, so 90 days of warning is not excessive — §1 calls a
lapsed domain the one failure with a deadline and no undo. A certificate is
renewed by Vercel automatically about 30 days out, so under 30 days means the
automation did not run.

**The Bible-text check is the one to care about.** It reads John 3:16 from the
committed Macedonian JSON and asserts that exact string appears in the HTML the
live site serves. It therefore proves the whole chain — commit → `prebuild` →
static generation → deploy → reader. A mismatch means text in git never reached
production, which is precisely the failure the content owner cannot see and would
never think to report.

`npm audit` deliberately only turns red on **critical**. Checked 2026-07-28,
every one of the 28 `high` advisories was transitive build/CLI tooling
(`@sanity/cli` → `@oclif/core` → `ejs`, `eslint` → `minimatch`) that never runs
in a visitor's request path on a static site. Flagging those monthly would make
the colour meaningless. The counts are still printed; §5.4 is where they get
acted on.

**Manual — the five with no free API**

| What | Where |
|---|---|
| Analytics — traffic sane vs §4.0? | [vercel.com/dashboard](https://vercel.com/dashboard) → project → **Analytics** |
| Speed Insights — vitals still green? | [vercel.com/dashboard](https://vercel.com/dashboard) → project → **Speed Insights** |
| Sanity usage | [sanity.io/manage/project/9nwz9xmi](https://www.sanity.io/manage/project/9nwz9xmi) → **Usage** |
| Contact form — submit one, confirm it arrives | [/mk/contact](https://www.hristovoevangelie.org/mk/contact) |
| Bible search — type a word, confirm results | [/mk/bible](https://www.hristovoevangelie.org/mk/bible) |

Also monthly, and not automatable:

- [ ] Confirm the preacher has published something recently and it appeared. (If
      he hasn't published in months, publish something yourself — a silently
      broken webhook is only discovered by publishing.)
- [ ] **Once, after the first full month:** replace the assumed figures in §4.0
      with the measured ones. Everything downstream of that table is reasoning
      about free-tier headroom, and it should reason from real numbers.

**Calendar reminder.** Import
[`church-website-health-check.ics`](./church-website-health-check.ics) — a
10-minute recurring event on the 1st. Import it once; it needs no account and
nothing can switch it off.

Use **Google Calendar** (Settings → *Import & export* → select the file) rather
than Outlook. Windows 11's "Outlook (new)" prompts for a Microsoft 365
subscription when it opens a calendar file. Creating the event by hand works
equally well — the file is a convenience, not a requirement; what matters is
that a reminder exists outside GitHub.

That last point is not redundant with the workflow. **On public repositories
GitHub automatically disables scheduled workflows after 60 days without
repository activity** — plausible for a site that is deliberately quiet. GitHub
emails the owner first and re-enabling is one click in the Actions tab, but a
calendar entry is immune to it. If a month passes with no issue, that is the
first thing to check.

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
| How much traffic should I expect, and does it fit the free tiers? | §4.0 |
| Is anyone visiting? Which pages? | Vercel → **Analytics** (§4.1) |
| Is the site fast for real visitors? | Vercel → **Speed Insights** (§4.2) |
| Am I near Sanity's free limits? | sanity.io/manage → **Usage** (§4.3) |
| **Is the site up at all?** | Better Stack (§4.4) — *not yet configured* |

> The first three tell you about a site that is working. Only the fourth tells
> you it has stopped. That gap is why §4.4 matters most.

### 4.0 Expected traffic profile — the baseline every limit below is judged against

The figures here are **planning assumptions, not measurements** — the site had no
analytics before this document was written. Their purpose is to turn *"the free
tiers are sufficient"* from an opinion into a claim that can be checked.
**Replace them with real numbers from Vercel → Analytics after the first full
month** (it is already part of the §3 monthly check).

| | Conservative | Expected | Upper bound |
|---|---|---|---|
| Daily visits | 50 | 130 | 500 |
| Monthly visits | 1,000 | 4,000 | 10,000 |
| Pages per visit | 3 | 4 | 5 |
| **Monthly page views** | 3,000 | 16,000 | 50,000 |
| Sanity publishes per month | 2 | 5 | 10 |
| Git pushes (Bible text edits) per month | 2 | 5 | 10 |

Pages per visit is deliberately higher than a brochure site would assume: the
Bible reader invites chapter-to-chapter navigation, so one reading session is
several page views.

Note that a Sanity publish does **not** trigger a deployment — it fires the
revalidation webhook ([cms-architecture.md](./cms-architecture.md)). Only git
pushes cause builds.

**Headroom against the free tiers**

| Resource | Hobby allowance | Expected | Upper bound | Verdict |
|---|---|---|---|---|
| Web Analytics events | 50,000 / month | ~16,000 (32%) | ~50,000 (100%) | Fits, except at the very top of the range |
| **Speed Insights events** | **10,000 / month** | **~18,000 (180%)** | **~45,000 (450%)** | **⚠️ the one allowance this site outgrows** |
| Fast Data Transfer | 100 GB / month | ~3 GB (3%) | ~10 GB (10%) | Never close |
| Deployments | 100 / day | ~5 / month | ~10 / month | Irrelevant |
| Sanity API requests | traffic-independent | — | — | Irrelevant — see §4.3 |

**Why the two Vercel numbers differ so sharply.** They count different things:

- A **Web Analytics event** is one page view — roughly `visits × pages per visit`.
- A **Speed Insights event** is one Web Vital data point, and Vercel collects
  **3–6 per visit**. They are gathered only on *hard* navigations, which in a
  Next.js app means the first page of a session — so it is roughly
  `visits × 4.5`, regardless of how many pages are then read.

That is why 16,000 page views produce ~16,000 Analytics events but ~18,000 Speed
Insights events, against a cap five times smaller.

**What exceeding it actually does: nothing harmful.** On Hobby, Speed Insights
pauses recording once 10,000 events are reached and resumes the next day.
Existing data stays visible, **the website itself is unaffected, and Hobby cannot
be billed**. The only consequence is a dashboard showing a partial month.

If that becomes annoying, the fix is one prop rather than a paid plan:

```tsx
// src/app/[locale]/layout.tsx
<SpeedInsights sampleRate={0.25} />
```

A 25% sample keeps roughly 11,000 events even at the upper bound — still far more
than enough to spot a Core Web Vitals regression on a site this size. Do this
only once real usage shows it is needed, not pre-emptively.

**Shared-account caveat.** Web Analytics events are pooled **across every project
in the Vercel account**, not per project. If the account also hosts other sites,
they share the same 50,000 — worth weighing in §1 when deciding whose account
should own this project. Speed Insights has a separate but equally relevant
restriction: on Hobby it can be enabled for **one project only**, so if the
account hosts other sites, this one has to be the chosen project.

**Measured page weight** — production, 2026-07-28, compressed over the wire:

| Asset | Size | Notes |
|---|---|---|
| Homepage HTML | 14 KB | |
| Bible chapter HTML | 16 KB | e.g. `/mk/bible/john/3` |
| Gallery HTML | 13 KB | |
| First-load JS | 185 KB across 12 files | Cached for the rest of the session and later visits |
| **Bible search index** | **~1.5 MB (MK), ~1.4 MB (EN)** | By far the largest download on the site |

The search index is the only heavy asset, and it is deliberately behind a dynamic
`import()` in `BibleSearch.tsx` — **it downloads only when a visitor focuses the
search box**, then stays in the browser cache. Even pessimistically, if every
visitor at the upper bound searched, that is 10,000 × 1.5 MB ≈ 15 GB — still
comfortably inside the 100 GB allowance.

This is the figure to remember if the Bible text ever grows substantially: the
index grows with it, and it is the only measurement here with a realistic path to
mattering.

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

**Cost and limits** — verified 2026-07-28 against
[vercel.com/docs/analytics](https://vercel.com/docs/analytics) and
[analytics/limits-and-pricing](https://vercel.com/docs/analytics/limits-and-pricing).
Re-read those before acting on a number here; Vercel changes them:

| | Hobby | Pro |
|---|---|---|
| Included events / month | **50,000** | none included; **$0.03 per 1,000** |
| Reporting window | 1 month | 12 months |
| Custom events | **Not available** | Included |
| Can you be charged? | **No** | Yes, per event |

**On Hobby you cannot be billed for this.** Hobby teams cannot purchase extra
events: on exceeding 50,000 there is a 3-day grace period, then collection pauses
and resumes about 7 days later. The **website itself is never affected** — only
the statistics pause.

*(Vercel's own docs are slightly inconsistent about the resumption: one passage
says collection restarts after 7 days, another says at the next billing cycle.
Either way it is a pause, never a charge, so the distinction does not matter
operationally.)*

Against the traffic profile in §4.0 that is roughly **32% of the allowance at the
expected level**, reaching 100% only at the top of the plausible range. Note the
allowance is pooled across every project in the account (§4.0).

**Privacy.** Cookieless, no personal identification, no advertising use. This is
why no consent banner is required and why the Privacy Policy can state plainly
that the site sets no tracking cookies.

The mechanism, per Vercel's documentation, is worth knowing if anyone ever
challenges that claim: a visitor is identified by a **hash derived from the
incoming request, not a cookie**, and that hash **resets every day**. A visitor
therefore cannot be tracked from one day to the next, or across different
websites. Only anonymized data is stored.

**Bot traffic is excluded.** Vercel inspects the User-Agent and does not count
automated traffic. Search-engine crawlers and uptime monitors (§4.4) therefore
consume no events, which makes the §4.0 headroom estimates conservative rather
than optimistic — a useful direction for the error to run in.

### 4.2 Vercel Speed Insights

**Purpose.** Core Web Vitals measured on **real visitors' devices** — as opposed
to Lighthouse, which is one synthetic run from one machine. A phone on mobile
data in Bitola is the honest test, and only this shows it.

**Dashboard.** Vercel → project → **Speed Insights** tab. Also enable once.

**Cost and limits — read before enabling.** Verified 2026-07-28 against
[speed-insights/limits-and-pricing](https://vercel.com/docs/speed-insights/limits-and-pricing)
and [speed-insights/metrics](https://vercel.com/docs/speed-insights/metrics):

| | Hobby | Pro |
|---|---|---|
| Cost | **Free, 1 project only** | **$10.00 per project per month** base fee |
| Included events / month | First 10,000 (hard cap) | No cap — **$0.65 per 10,000 events** on demand |
| Reporting window | **7 days** | 30 days |
| Can you be charged? | **No** | **Yes** — base fee immediately on enabling (prorated), plus per-event |

⚠️ **Speed Insights is the one feature in this stack that costs money on a paid
plan.** On Pro the $10/project/month base fee is charged the moment it is
enabled, **and events are billed on top of it** at $0.65 per 10,000 — the base
fee does not include an event allowance. On Hobby it is free and cannot bill you.
**Confirm the plan before enabling** (Vercel → Settings → Billing).

On Hobby, exceeding 10,000 events pauses recording until the next day; existing
data stays viewable. The 7-day reporting window means Hobby shows recent trends,
not long-term history — fine for spotting a regression, not for year-over-year
comparison.

⚠️ **This is the one allowance the site is expected to exceed.** A Speed Insights
event is a Web Vital data point, and Vercel collects 3–6 per visit, so the
expected ~4,000 monthly visits produce roughly 18,000 events against a 10,000
cap — see §4.0 for the arithmetic. Nothing breaks and nothing bills; recording
simply pauses and resumes daily. The fix, if the partial-month view becomes
annoying, is `<SpeedInsights sampleRate={0.25} />` — not a paid plan.

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

Node 22 leaves LTS maintenance around **April 2027**. As of 2026-07-28 Vercel
still lists **24.x (default), 22.x and 20.x** as available, so 22.x is fully
supported — it is simply no longer the newest.

**`package.json` is the authority.** Vercel's documentation is explicit that
`engines.node` **overrides the Node.js Version chosen in Project Settings**. The
dashboard dropdown is only the fallback for a project that does not declare one.
This project declares `22.x`, so that is what builds, whatever the dropdown says.

| Where | Value | Authority |
|---|---|---|
| `package.json` → `engines.node` | `22.x` | **Wins over everything below** |
| `.nvmrc` | `22` | Local development only |
| `.github/workflows/bible-guard.yml` | `node-version: "22"` | CI only |
| `.github/workflows/monthly-health-check.yml` | `node-version: "22"` | CI only |
| Vercel → Settings → Build & Deployment → Node.js Version | — | Ignored while `engines.node` is set |

**The yellow marker Vercel shows beside 22.x is advisory, not an error.** It
means the project is not on the current default. Nothing is failing, and it can
be left alone.

Every build also logs, harmlessly:

> *Due to `"engines": { "node": "22.x" }` in your `package.json` file, the
> Node.js Version defined in your Project Settings ("24.x") will not apply,
> Node.js Version "22.x" will be used instead.*

That is Vercel confirming the override is working as intended. To silence it, set
**Settings → Build & Deployment → Node.js Version** to **22.x** so the two agree.
Purely cosmetic — 22.x builds either way.

**Not everything in a build log is a problem.** Lines beginning `> name@version
script` or `> node …` are npm echoing the command it is about to run, and appear
in every Node project. They are worth keeping: when a build does fail, they are
what shows which step it failed in. Only `Error:`, `Command failed`, or a
non-zero exit indicate an actual fault.

**Symptom of a real problem:** builds start failing with a Node version error,
with no code change.
**Fix:** bump `engines.node` first — that alone changes what deploys — then the
two workflows and `.nvmrc` to match. Run `npm run typecheck && npm test && npm
run build`, then deploy. Realistically under an hour.
**Meanwhile the live site keeps serving.** Not an emergency.

**Recommendation:** do this proactively in **early 2027**, at a calm moment,
rather than reactively when a correction will not publish.

Moving to Node 24 early is defensible — it would buy roughly another year of
runway, which is worth something on a site meant to run untended. It is still a
stack change under CLAUDE.md, so do it deliberately: `engines.node` and the three
supporting pins together, full check suite, verified deploy. Not by flipping the
dashboard, which would change nothing at all while `engines.node` is set.

#### The type-stripping flag — removed 2026-07-28 ⚠️ this was a latent build failure

The four `node` scripts in `package.json` used to pass
`--experimental-strip-types` and `--disable-warning=ExperimentalWarning`. Both
have been removed. **This mattered more than it looks.**

Node's own timeline: type stripping became the default in **22.18.0**, stable in
**24.12.0 / 25.2.0**, and `--experimental-strip-types` **no longer exists in Node
26** — only `--no-strip-types` remains, to switch it off. Node rejects unknown
command-line flags, so on Node 26 every one of those scripts would have died with
`bad option`. One of them is `prebuild`, so **the failure mode was "nothing can
deploy, ever"**, triggered by the routine Node upgrade this very section
schedules for early 2027.

Verified on Node 22.22 before removing them: the scripts run identically with no
flags, and no `ExperimentalWarning` is emitted — both flags were already dead
weight. `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` is kept because it still
suppresses a real warning (`package.json` declares no `"type"`, so Node reparses
these files as ESM). The alternative — adding `"type": "module"` — was rejected
as a broader change than the noise justifies.

**Consequence:** these scripts now require **Node ≥ 22.18**. `engines.node` stays
`"22.x"` rather than a tighter range, because Vercel resolves `22.x` to the
latest 22 release (far past 22.18) while it maps open ranges like `>=22.18.0`
to the newest major available — the opposite of what is wanted.

Re-verified after the change: `bible:build`, `bible:validate`, `health-check`,
90/90 tests, and a full `next build` — 2,556 static pages, exit 0.

### 5.2 GitHub Actions deprecations — actioned 2026-07-28

Both workflows now pin `actions/checkout@v7` and `actions/setup-node@v7`, which
run on Node 24.

**What prompted it.** The first manual run of the health check emitted:

> *Node.js 20 is deprecated. The following actions target Node.js 20 but are
> being forced to run on Node.js 24: actions/checkout@v4, actions/setup-node@v4*

Per GitHub's changelog, runners defaulted to Node 24 on **16 June 2026**, and
Node 20 is **removed entirely in autumn 2026** — at which point `@v4` workflows
stop working rather than warning. The `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION`
escape hatch also expires then, so bumping the pins was the only durable fix.

**Do not confuse the two Node versions in these files.** They are unrelated:

| Setting | What it controls | Value |
|---|---|---|
| `actions/*@v7` | The Node the *action itself* runs on | 24, chosen by GitHub |
| `node-version: "22"` | The Node that runs *this project's* code | 22, matching `engines.node` |

Only the second is a project decision, and it stays at 22 — see §5.1.

**Impact if a workflow ever does fail: low.** These are safety nets; a red
workflow does not block Vercel from deploying. Bump the pins when GitHub warns.

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

### 5.6 Branch naming — resolved 2026-07-28

**Done.** The repository now has a single branch, `main`, and it is the default.
Recorded here because the history explains several decisions elsewhere.

**What was wrong.** Until 2026-07-28 no `main` branch existed. The only branch
was `feature/project-foundation`, which was also the default, and a stale local
`master` held nothing but `Initial commit from Create Next App`. Three
consequences followed, and the second was the one that mattered:

1. Production built from `feature/project-foundation` — workable, but surprising
   to anyone inheriting the project.
2. **The Bible integrity guard had never run once.**
   `.github/workflows/bible-guard.yml` triggers on `push`/`pull_request` to
   `main`. With no `main`, nothing matched, so the guard meant to stop a broken
   verse was inert. The `prebuild` validation still failed the Vercel build, so
   bad data could not actually ship — but the earlier, cheaper net was absent.
3. The documentation told the content owner to commit to `main`
   ([bible-editing-guide.md](./bible-editing-guide.md), §2 of
   [bible-module.md](./bible-module.md)), which he could not do.

**How it was fixed — renamed, not merged.** GitHub **Settings → Branches →
rename**. A rename preserves history, moves the default branch in one step, and
sets up redirects for old links. Creating a separate `main` and merging would
have left two branches and the same confusion.

**Remaining follow-up**

- [ ] **Vercel production branch → `main`.** Project **Settings → Environments →
      **Production** → **Branch Tracking** → change the branch → **Save**.
      (Not under Settings → Git; Vercel moved this into Environments. Verified
      against Vercel's docs 2026-07-28.) Then redeploy once and confirm the site
      still serves.
- [ ] Confirm `bible-guard.yml` now runs — push anything and check the Actions
      tab. This is the first time it will ever have executed.
- [ ] Confirm **Monthly health check** appears under Actions. Scheduled and
      manually dispatched workflows only run from the **default** branch, so the
      rename is what switched it on.

Note that Vercel does **not** follow a Git branch rename automatically. Its
branch order of preference (`main`, then `master`, then the repository default)
applies only when a project is first created, so an existing project keeps
pointing at the old name until it is changed by hand.

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
