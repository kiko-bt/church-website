# Production Deployment Runbook

Everything needed to deploy **church-website** to production and reproduce that
deployment months later. Written so another engineer can follow it top to bottom.

- **Production domain:** `hristovoevangelie.org`
- **Host:** Vercel (GitHub-connected)
- **CMS:** Sanity (project `9nwz9xmi`, dataset `production`, public)
- **DNS registrar:** Porkbun
- **Repo:** `github.com/kiko-bt/church-website`

> Companion: **[cms-architecture.md](./cms-architecture.md)** explains *why* the
> publish → live pipeline works. This doc is the *how* of standing it up.

---

## 0. What you are wiring together

```
GitHub repo ──push──▶ Vercel (build + host) ──serves──▶ hristovoevangelie.org
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
2. **Production branch:** Settings → Git → set to **`main`**. Every push to `main`
   triggers a production deploy; other branches get preview deployments.
3. Set environment variables (§3) **before** the first production deploy, or the
   build will bake in fallback values (e.g. a wrong site URL).
4. Push to `main` (or click **Redeploy**). Confirm the build log ends green and
   the deployment opens on its `*.vercel.app` URL before touching DNS.

**Merge flow to production:** work on a feature branch → open a PR → Vercel posts
a **Preview** deployment on the PR → merge to `main` → Vercel ships **Production**.

---

## 3. Environment variables

Set these in **Vercel → Settings → Environment Variables**. The annotated source
of truth is [`.env.example`](../.env.example); this table is the production view.

| Variable | Scope | Public? | Environments to set | Why it exists / how it's used |
|---|---|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Vercel + local | **Public** | Production, Preview | Enables the Sanity read client (`src/lib/sanity/client.ts`). Unset ⇒ site renders fallbacks only. Value: `9nwz9xmi`. |
| `NEXT_PUBLIC_SANITY_DATASET` | Vercel + local | **Public** | Production, Preview | Sanity dataset name. Value: `production`. |
| `NEXT_PUBLIC_SITE_URL` | Vercel + local | **Public** | Production (`https://hristovoevangelie.org`), Preview, local (`http://localhost:3000`) | Base URL for canonical, hreflang, Open Graph, `robots.ts`, `sitemap.ts` (`src/constants/site.ts`, `src/lib/seo/metadata.ts`). Wrong value ⇒ SEO points at the wrong host. |
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

---

## 5. Sanity webhook (publish → revalidate)

Create in **Sanity → Project → API → Webhooks → Create webhook**:

| Field | Value |
|---|---|
| **Name** | `Vercel revalidate (production)` |
| **URL** | `https://hristovoevangelie.org/api/revalidate` |
| **Dataset** | `production` |
| **Trigger on** | Create, Update, **Delete** (delete revalidates lists too) |
| **Filter** (GROQ) | `_type in ["sermon","book","galleryAlbum","churchSettings","homeContent"]` |
| **Projection** (GROQ) | `{ _type }` — the route only needs the type |
| **HTTP method** | `POST` |
| **HTTP headers** | `x-sanity-revalidate-secret` = *your §4 secret* |
| **API version** | `v2021-03-25` (or newer) |
| **Enable drafts** | **Off** — only published changes should revalidate |

Notes:
- The **projection `{ _type }`** keeps the payload minimal; the route Zod-requires
  only `_type`. Sending the whole document also works but is unnecessary.
- The **filter** means Studio-only document types never call the route. Even
  without it the route safely no-ops on unknown types (`revalidated: false`).
- Point the URL at the **custom domain**, not the `*.vercel.app` URL, so it keeps
  working across deployments.

---

## 6. Custom domain, DNS (Porkbun) & HTTPS

### 6a. Add the domain in Vercel
**Vercel → Settings → Domains → Add** → `hristovoevangelie.org`. Add **both** the
apex and `www` (Vercel will offer to redirect `www` → apex, or vice-versa —
pick the apex as canonical to match `NEXT_PUBLIC_SITE_URL`). Vercel then shows
the exact DNS records to create — **always trust the values Vercel displays**;
the ones below are its current standard values.

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
1. `https://hristovoevangelie.org` → redirects to `/mk`, renders, HTTPS padlock.
2. Visit `/en` — locale switch works; check a sermon, book, and gallery page.
3. `https://hristovoevangelie.org/robots.txt` — lists the sitemap URL on the
   production host (not localhost / not `your-domain.com`).
4. `https://hristovoevangelie.org/sitemap.xml` — contains production URLs with
   `mk`/`en` alternates.
5. View source on any page → `<link rel="canonical">` and `og:url` use
   `https://hristovoevangelie.org` (confirms `NEXT_PUBLIC_SITE_URL`).

**B. Security headers**
```bash
curl -sI https://hristovoevangelie.org | grep -iE 'strict-transport|x-content-type|referrer-policy|x-frame'
```
Expect `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `X-Frame-Options: DENY`.

**C. Webhook auth (negative test — no secret ⇒ 401)**
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://hristovoevangelie.org/api/revalidate \
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

| Symptom | Likely cause | Fix |
|---|---|---|
| Publish doesn't update the live site | Webhook not firing / wrong URL | Sanity → Webhooks → check recent deliveries. URL must be the custom domain + `/api/revalidate`. |
| Webhook delivery shows **401** | Secret mismatch | The webhook header `x-sanity-revalidate-secret` must equal the Vercel `SANITY_REVALIDATE_SECRET` **exactly**. Re-set both; redeploy after changing the Vercel value. |
| Webhook shows **400 Invalid payload** | Body missing `_type` | Set the webhook **projection** to `{ _type }` (or send the full document). |
| Webhook **200** but `revalidated: false` | `_type` not mapped | Expected for unmapped types. For a real content type, add it to `SANITY_TAGS` + `TYPE_TO_TAG` (`route.ts`). |
| Site renders but **no CMS content** | Dataset private, or Sanity env vars unset in Vercel | Make dataset **public**; confirm `NEXT_PUBLIC_SANITY_*` set in the deployed environment; redeploy. |
| Canonical/OG show `localhost` or `your-domain.com` | `NEXT_PUBLIC_SITE_URL` unset at build | Set it in Vercel Production and **redeploy** (build-time inlined). |
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

Work top to bottom. Each maps to a section above.

- [ ] Sanity dataset `production` is **Public** (§1)
- [ ] Vercel project: framework Next.js, prod branch `main`, root `./` (§2)
- [ ] Generated `SANITY_REVALIDATE_SECRET` stored in password manager (§4)
- [ ] Vercel env vars set for **Production**: `NEXT_PUBLIC_SANITY_PROJECT_ID`,
      `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SITE_URL=https://hristovoevangelie.org`,
      `SANITY_REVALIDATE_SECRET`, `RESEND_TO_EMAIL` (§3)
- [ ] First production deploy is green on the `*.vercel.app` URL (§2)
- [ ] Sanity webhook created → custom-domain URL, header secret, `{ _type }`
      projection, on create/update/delete (§5)
- [ ] Domain added in Vercel (apex + `www`) (§6a)
- [ ] Porkbun DNS: `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`;
      parking records removed (§6b)
- [ ] HTTPS padlock live on `https://hristovoevangelie.org` (§6c)
- [ ] Sanity CORS added **iff** the Studio is hosted (§6d)
- [ ] Smoke test A–D pass, incl. **publish → live** (§7)
- [ ] Rollback path confirmed (know where the button is) (§8)

When every box is checked, the pipeline is live: the preacher edits in Sanity,
clicks Publish, and visitors see the update with no developer involvement.
