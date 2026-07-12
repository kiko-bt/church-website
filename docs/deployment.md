# Production Deployment Runbook

Everything needed to deploy **church-website** to production and reproduce that
deployment months later. Written so another engineer can follow it top to bottom.

> **STATUS: LIVE IN PRODUCTION.** The site is deployed and the full
> publish → live pipeline is working. This runbook is both the reproduction
> guide and the record of the actual configuration.

**As deployed (production reality):**

- **Primary domain:** **`https://www.hristovoevangelie.org`** — the canonical host.
  The apex `hristovoevangelie.org` **308-redirects to `www`**, so every
  production URL (site URL, canonical tags, the webhook target) uses **`www`**.
- **Host:** Vercel (GitHub-connected), production branch `feature/project-foundation`.
- **CMS:** Sanity (project `9nwz9xmi`, dataset `production`, **public**). Studio is
  the separate `studio-church-ehb` app; it writes to Sanity's hosted Content Lake.
- **DNS registrar:** Porkbun.
- **Repo:** `github.com/kiko-bt/church-website`.

> Companion: **[cms-architecture.md](./cms-architecture.md)** explains *why* the
> publish → live pipeline works. This doc is the *how* of standing it up.
>
> **The single most important operational fact:** published content only reaches
> the live site because the **Sanity webhook** calls `/api/revalidate`. If that
> webhook is missing or misconfigured, published changes **never appear** (the
> Data Cache is invalidated only on demand — never by time). See §5 and §9.

---

## 0. What you are wiring together

```
GitHub repo ──push──▶ Vercel (build + host) ──serves──▶ www.hristovoevangelie.org
                          ▲                                   ▲
                          │ env vars                          │ DNS (Porkbun) + TLS (Vercel)
                          │
Sanity Studio ──Publish──▶ Sanity webhook ──HTTPS POST──▶ /api/revalidate ──▶ cache invalidation
```

Do the steps in order. DNS and the webhook both depend on the site already being
deployed with a known URL.

---

## 1. Prerequisites (one-time)

- Vercel account with the GitHub repo imported (**done**).
- Sanity account + project `9nwz9xmi`, dataset `production` set to **public**
  (Sanity → Project → Datasets → `production` → visibility **Public**). The read
  client uses public CDN reads with no token, so a private dataset would render
  an empty site.
- Access to the Porkbun DNS panel for `hristovoevangelie.org`.
- A generated **revalidate secret** (see §4).

---

## 2. GitHub → Vercel deployment

Vercel auto-detects Next.js — no `vercel.json` is required.

1. **Vercel → Project → Settings → General**
   - Framework preset: **Next.js**
   - Build command: `next build` (default) · Output: `.next` (default)
   - Install command: `npm install` (default) · Node.js: **22.x**
   - Root directory: **`./`** — the repo root **is** the Next.js app. (The Studio
     lives in the *separate* `studio-church-ehb` repo and is **not** deployed
     from here.)
2. **Production branch:** Settings → Git. **As deployed, this is
   `feature/project-foundation`** — production currently builds from that branch,
   so every push to it triggers a production deploy; other branches get preview
   deployments. *Recommended follow-up:* once the initial build stabilizes, merge
   `feature/project-foundation` into `main` and switch Vercel's production branch
   to **`main`** (the conventional long-term default). Whichever branch is chosen,
   the steps below apply to it.
3. Set environment variables (§3) **before** the first production deploy, or the
   build will bake in fallback values (e.g. a wrong site URL).
4. Push to the production branch (or click **Redeploy**). Confirm the build log
   ends green and the deployment opens on its `*.vercel.app` URL before touching DNS.

**Merge flow to production:** work on a feature branch → open a PR → Vercel posts
a **Preview** deployment on the PR → merge into the production branch → Vercel
ships **Production**.

---

## 3. Environment variables

Set these in **Vercel → Settings → Environment Variables**. The annotated source
of truth is [`.env.example`](../.env.example); this table is the production view.

| Variable | Scope | Public? | Environments to set | Why it exists / how it's used |
|---|---|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Vercel + local | **Public** | Production, Preview | Enables the Sanity read client (`src/lib/sanity/client.ts`). Unset ⇒ site renders fallbacks only. Value: `9nwz9xmi`. |
| `NEXT_PUBLIC_SANITY_DATASET` | Vercel + local | **Public** | Production, Preview | Sanity dataset name. Value: `production`. |
| `NEXT_PUBLIC_SITE_URL` | Vercel + local | **Public** | Production (`https://www.hristovoevangelie.org`), Preview, local (`http://localhost:3000`) | Base URL for canonical, hreflang, Open Graph, `robots.ts`, `sitemap.ts` (`src/constants/site.ts`, `src/lib/seo/metadata.ts`). **Must be the `www` host** (the canonical one). Wrong value ⇒ SEO points at the wrong host — a real incident we hit: it was accidentally left as `http://localhost:3000` and every canonical tag pointed at localhost until corrected + redeployed (see §9). |
| `SANITY_REVALIDATE_SECRET` | Vercel + Sanity | **SECRET** | Production (Preview optional) | Shared secret guarding `/api/revalidate` (`route.ts`). Must be **identical** to the Sanity webhook header (§4–5). |
| `RESEND_TO_EMAIL` | Vercel + local | secret-ish | Production | Public contact address shown on the site (`ContactInfo`) unless `churchSettings.email` is set in the CMS. Set to the church's real inbox. |
| `SANITY_API_TOKEN` | — | **SECRET** | *none (reserved)* | Unused by the read client (public CDN reads). Only if drafts / a private dataset are added later — use a **read-only** token then. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | — | **SECRET** | *none yet* | For the **planned** contact-form server action (Resend). Leave unset until built. |

Rules of thumb:
- `NEXT_PUBLIC_*` are inlined into the browser bundle **at build time** — they are
  not secret, and changing one requires a **redeploy** to take effect.
- Everything else is server-only. Never prefix a secret with `NEXT_PUBLIC_`.
- **Preview** deployments: set the public Sanity + site vars if you want previews
  to render live content. Keep the revalidate secret out of Preview unless you
  are testing the webhook against a preview URL.

---

## 4. Generate the revalidate secret

A 32–64 char random string you create once. It is **not** issued by Sanity — it
is a password shared between the Sanity webhook and `/api/revalidate`.

```bash
openssl rand -hex 32          # 64 hex chars — recommended
# or: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Store it in your password manager. Use the **same** value in two places:
1. Vercel env var `SANITY_REVALIDATE_SECRET` (§3).
2. The Sanity webhook's `x-sanity-revalidate-secret` header (§5).

If you rotate it later, update **both** at the same time (see §9 Troubleshooting).

> **Never commit the real secret.** `.env.example` must hold only a placeholder.
> A secret that ever lands in git history (even in a since-deleted commit) is
> considered **burned** — generate a new one and use it only in Vercel + the
> webhook. Removing it from a file does **not** remove it from history. (This
> happened once during setup; the exposed value was rotated out and never used.)

---

## 5. Sanity webhook (publish → revalidate)

Create in **Sanity → Project → API → Webhooks → Create webhook**:

**This webhook is what makes content updates work.** Without it, publishing in
Sanity changes nothing on the live site — the Next.js Data Cache is invalidated
only by `revalidateTag()`, which only this webhook triggers.

Create in **Sanity → Project → API → Webhooks → Create webhook**:

| Field | Value |
|---|---|
| **Name** | `Vercel revalidate (production)` |
| **URL** | `https://www.hristovoevangelie.org/api/revalidate` |
| **Dataset** | `production` |
| **Trigger on** | Create, Update, **Delete** (delete revalidates lists too) |
| **Filter** (GROQ) | `_type in ["sermon","book","galleryAlbum","churchSettings","homeContent"]` |
| **Projection** (GROQ) | `{ _type }` — the route only needs the type |
| **HTTP method** | `POST` |
| **HTTP headers** | `x-sanity-revalidate-secret` = *your §4 secret* |
| **API version** | `v2021-03-25` (or newer) |
| **Enable drafts** | **Off** — only published changes should revalidate |

Notes:
- **Use the `www` URL directly** — `https://www.hristovoevangelie.org/...`, **not**
  the apex `hristovoevangelie.org/...`. The apex 308-redirects to `www`, and a
  webhook sender that follows the redirect can **drop the custom
  `x-sanity-revalidate-secret` header**, which then fails auth with **401**.
  Hitting `www` directly avoids the redirect entirely.
- The **projection `{ _type }`** keeps the payload minimal; the route Zod-requires
  only `_type`. Sending the whole document also works but is unnecessary.
- The **filter** means Studio-only document types never call the route. Even
  without it the route safely no-ops on unknown types (`revalidated: false`).
- Point the URL at the **custom domain**, not the `*.vercel.app` URL, so it keeps
  working across deployments.
- **The Studio does not need to be on GitHub** for this to work. The webhook is a
  property of the Sanity *project* (hosted by Sanity), not of the Studio's source
  code. Committing `studio-church-ehb` is good hygiene (backup / versioning /
  hosting the Studio later) but is unrelated to content reaching the site.

---

## 6. Custom domain, DNS (Porkbun) & HTTPS

### 6a. Add the domain in Vercel
**Vercel → Settings → Domains → Add** → add **both** `hristovoevangelie.org` and
`www.hristovoevangelie.org`. **As deployed, `www` is the primary (canonical)
domain and the apex redirects to it** (`hristovoevangelie.org` → 308 →
`www.hristovoevangelie.org`). In Vercel, set `www` as the primary and the apex to
**Redirect to** `www`. `NEXT_PUBLIC_SITE_URL` and the webhook URL must match the
primary — i.e. **`www`** (§3, §5). Vercel then shows the exact DNS records to
create — **always trust the values Vercel displays**; the ones below are its
current standard values.

> If you ever prefer the apex as canonical instead, that's fine — but then flip
> **all three** together: Vercel primary, `NEXT_PUBLIC_SITE_URL`, and the webhook
> URL. They must never disagree, or you get redirecting canonicals / dropped
> webhook headers.

### 6b. Configure DNS in Porkbun
Porkbun → **Details / DNS** for `hristovoevangelie.org`. Create:

| Type | Host | Answer / Value | Notes |
|---|---|---|---|
| `A` | *(blank / `@`)* | `76.76.21.21` | Apex → Vercel. Use the IP Vercel shows. |
| `CNAME` | `www` | `cname.vercel-dns.com` | `www` → Vercel. |

- Remove any conflicting parked/registrar-default `A`/`AAAA`/`ALIAS`/`CNAME`
  records on `@` and `www` (Porkbun adds parking records by default).
- Leave `MX`/`TXT` (email, verification) untouched.
- Porkbun's default TTL (600s) is fine.
- Keep **Porkbun as the DNS host** (do not switch nameservers to Vercel) — this
  keeps DNS management with the registrar, which Vercel supports via the records
  above.

### 6c. HTTPS
TLS is **automatic** — Vercel provisions and renews a Let's Encrypt certificate
once DNS resolves. No action beyond DNS. HTTP is auto-redirected to HTTPS, and
the app additionally sends **HSTS** (`next.config.ts`) to force HTTPS on repeat
visits. Verification can take minutes to a couple of hours for propagation.

### 6d. Sanity CORS (only if you deploy the Studio to a URL)
The **website** needs no CORS entry (server-side CDN reads). The **Studio** does,
when hosted (e.g. `sanity deploy` → `*.sanity.studio`, or a Vercel-hosted Studio):
Sanity → **API → CORS origins → Add** the Studio origin(s) with credentials
allowed, plus `http://localhost:3333` for local Studio dev.

---

## 7. Production verification (smoke test)

Run after the first deploy + DNS + webhook are live. This proves the whole
pipeline, not just that the site loads.

**A. Site is up and correct**
1. `https://www.hristovoevangelie.org` → redirects to `/mk`, renders, HTTPS padlock.
   Also check the apex `https://hristovoevangelie.org` → 308 → `www`.
2. Visit `/en` — locale switch works; check a sermon, book, and gallery page.
3. `https://www.hristovoevangelie.org/robots.txt` — lists the sitemap URL on the
   production host (not localhost / not `your-domain.com`).
4. `https://www.hristovoevangelie.org/sitemap.xml` — contains production `www`
   URLs with `mk`/`en` alternates.
5. **Canonical check (this caught a real bug — do not skip):** view source on any
   page and confirm `<link rel="canonical">` and `og:url` use
   `https://www.hristovoevangelie.org` — **not** `http://localhost:3000`.
   ```bash
   curl -s https://www.hristovoevangelie.org/mk | grep -o '<link rel="canonical"[^>]*>'
   # → href="https://www.hristovoevangelie.org/mk"
   ```
   If it shows localhost, `NEXT_PUBLIC_SITE_URL` is wrong in Vercel — fix + redeploy (§9).
6. **404**: visit `https://www.hristovoevangelie.org/mk/sermons/does-not-exist` —
   returns HTTP **404** and renders the localized 404 page (site header/footer,
   correct language, "back to home" link), not a bare error.
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" \
     https://www.hristovoevangelie.org/mk/sermons/does-not-exist   # → 404
   ```
7. **Images**: on a page with a CMS image (a gallery album or book cover),
   confirm the `<img>`/`next/image` source resolves from `cdn.sanity.io` and the
   image renders (validates `next.config.ts` `remotePatterns`).

**B. Security headers**
```bash
curl -sI https://www.hristovoevangelie.org | grep -iE 'strict-transport|x-content-type|referrer-policy|x-frame'
```
Expect `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `X-Frame-Options: DENY`.

**C. Webhook auth (negative test — no secret ⇒ 401)**
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://www.hristovoevangelie.org/api/revalidate \
  -H 'content-type: application/json' -d '{"_type":"sermon"}'
# → 401
```
(In production `?secret=` is ignored, so you cannot smoke-test auth from a
browser URL — that is by design.)

**D. Full publish → live (the real test)**
1. In Sanity Studio, edit a **Sermon** (e.g. tweak the title) → **Publish**.
2. Sanity → API → Webhooks → your webhook → **recent deliveries**: the POST shows
   **200** with `{ "revalidated": true, "tag": "sermon" }`.
3. Reload the sermon page on production — the change appears on the next request.
   No redeploy. ✅ Pipeline confirmed.

If D fails, go to §9.

---

## 8. Rollback procedure

Fast, no code changes:
1. **Vercel → Deployments** → find the last known-good production deployment.
2. **⋯ → Promote to Production** (a.k.a. *Rollback* / *Instant Rollback*). Traffic
   moves to that build immediately — Vercel keeps prior builds ready to serve.
3. If the bad change is in the repo, also revert it in git so the next deploy is
   clean: `git revert <sha> && git push origin main`.

**Content rollback** (a bad *publish*, not a bad deploy): in Sanity Studio open the
document → **History** → restore an earlier version → Publish. The webhook
revalidates automatically — no deploy involved. Env-var changes require a
**redeploy** to take effect (they are build-time inlined for `NEXT_PUBLIC_*`).

---

## 9. Troubleshooting

### ⭐ "I published in Sanity but the live site doesn't change" (the #1 issue)

This is expected behavior when the revalidation pipeline is not fully wired —
the Data Cache is invalidated **only** on demand, never by time, so without a
working webhook the site stays frozen at the last build/fetch until a redeploy.
Diagnose in order:

1. **Does the webhook exist and fire?** Sanity → Project → API → Webhooks → your
   webhook → **Recent deliveries** (or **Attempts**). No entry after a publish ⇒
   the webhook doesn't exist or its **filter** excludes that `_type` (§5).
2. **What status did the delivery return?**
   - **401** → secret mismatch, or the URL used the apex and the redirect dropped
     the header. Fix: webhook header `x-sanity-revalidate-secret` must equal the
     Vercel `SANITY_REVALIDATE_SECRET` **exactly**, and the webhook URL must be
     the **`www`** host directly (`https://www.hristovoevangelie.org/api/revalidate`).
     After changing the Vercel value, **redeploy**.
   - **400** → body missing `_type`; set the **projection** to `{ _type }` (§5).
   - **200 `revalidated: false`** → the `_type` isn't mapped (a Studio-only type).
     Expected; for a real content type add it to `SANITY_TAGS` + `TYPE_TO_TAG`.
   - **200 `revalidated: true`** → the pipeline worked. Reload the page (the change
     lands on the **next** request, not necessarily the one in flight).
3. **Is `SANITY_REVALIDATE_SECRET` set in Vercel Production?** If it's unset there,
   the route rejects every call with 401 regardless of the header. Set it +
   redeploy.
4. **Editing but not publishing?** Only **Publish** fires the webhook (drafts are
   excluded by design). A saved draft never reaches the site.

### Other issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Canonical/OG/sitemap show **`http://localhost:3000`** | `NEXT_PUBLIC_SITE_URL` set to localhost (or unset) at build time — **we hit exactly this in production** | Set it to `https://www.hristovoevangelie.org` in Vercel **Production** and **redeploy** (it's build-time inlined, so a redeploy is mandatory). Verify with the §7-A5 canonical check. |
| Canonical shows the **apex** but the site serves **`www`** (or vice-versa) | `NEXT_PUBLIC_SITE_URL` / Vercel primary / webhook URL disagree | Make all three the same host — `www` as deployed (§6a). |
| Site renders but **no CMS content** | Dataset private, or `NEXT_PUBLIC_SANITY_*` unset in Vercel | Make dataset **public**; confirm the Sanity env vars in the deployed environment; redeploy. |
| Domain shows "Invalid Configuration" in Vercel | DNS not propagated / parking records present | Re-check Porkbun `A @` and `CNAME www` against Vercel's values; delete conflicting parked records; wait for propagation. |
| A content page is dynamic (`ƒ`) in build output | Uncached read / request-time API added | Restore `unstable_cache` + `generateStaticParams`; only `/api/revalidate` may be `ƒ`. |
| Images from Sanity 404 in `next/image` | Host not allow-listed | `cdn.sanity.io` must stay in `next.config.ts` `remotePatterns`. |

---

## 10. Security considerations (recap)

- **Secrets only in env vars**, never in the repo. `.env.local` is gitignored;
  only `.env.example` (no real secrets) is committed.
- **HTTPS everywhere** — Vercel TLS + auto HTTP→HTTPS redirect + HSTS.
- **Webhook secret validated** on every POST; production accepts it **only** via
  the header (query param ignored → no access-log leak).
- **No write/management tokens** anywhere in the site. Reads are public CDN reads.
- **Published perspective only** — drafts never reach production.
- **Least privilege, future-ready:** if a private dataset or drafts are needed
  later, add a **read-only** `SANITY_API_TOKEN` (server-only). If the contact form
  ships, `RESEND_API_KEY` stays server-only behind the Zod-validated action.
- **Input validation:** `/api/revalidate` Zod-parses its body and returns generic
  errors (no internals leaked).

---

## 11. Deployment checklist

Work top to bottom. Each maps to a section above. **All boxes below are complete
as of go-live** — keep the list for re-deployments and audits.

- [x] Sanity dataset `production` is **Public** (§1)
- [x] Vercel project: framework Next.js, root `./` (§2)
- [x] Generated `SANITY_REVALIDATE_SECRET` stored in password manager (§4)
- [x] Vercel env vars set for **Production**: `NEXT_PUBLIC_SANITY_PROJECT_ID`,
      `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SITE_URL=https://www.hristovoevangelie.org`,
      `SANITY_REVALIDATE_SECRET`, `RESEND_TO_EMAIL` (§3)
- [x] Production deploy is green (§2)
- [x] Sanity webhook created → **`www`** URL, header secret, `{ _type }`
      projection, on create/update/delete (§5)
- [x] Domain added in Vercel; **`www` primary, apex → `www` redirect** (§6a)
- [x] Porkbun DNS: `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`;
      parking records removed (§6b)
- [x] HTTPS padlock live on `https://www.hristovoevangelie.org` (§6c)
- [ ] Sanity CORS added **iff** the Studio is hosted (§6d) — *N/A while the Studio
      runs locally only*
- [x] Smoke test A–D pass, incl. **publish → live** (§7)
- [x] Rollback path confirmed (know where the button is) (§8)

The pipeline is live: the preacher edits in Sanity, clicks Publish, and visitors
see the update with no developer involvement.

---

## 12. Routine operations (for future maintainers)

- **Everyday content** (new sermon/book/album, typo fix, new church name/address/
  social link) → the preacher edits in **Sanity Studio** and clicks **Publish**.
  The webhook revalidates automatically. **No deploy, no developer.**
- **New translated UI label** → add the key to **both** `messages/mk.json` and
  `messages/en.json`, then merge to the production branch (triggers a deploy).
- **Code / design change** → PR → Vercel preview → merge to the production branch
  → Vercel ships production.
- **Changing an env var** → edit in Vercel → **Redeploy** (env vars are read at
  build time; a change without a redeploy has no effect).
- **The Studio (`studio-church-ehb`)** → runs locally against the same Sanity
  project. It does **not** need to be deployed or committed for content updates
  to work. Commit it to its own repo when convenient, for backup/versioning.
