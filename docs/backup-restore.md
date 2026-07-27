# Backup & Restore

What to back up, how often, and the exact procedure to restore each part of the
system. Every command here has been run against the live project.

> **The one-sentence version:** the code and the entire Bible text live in git and
> are safe; **the only data that exists in exactly one place is the Sanity
> content** (sermons, books, PDFs, photos, church settings). Back that up.

---

## 1. What is at risk, and what is not

| Asset | Lives in | Backed up by | Real risk |
|---|---|---|---|
| Application code | GitHub | git history + every clone | **Low** — distributed by nature |
| **Bible text** (`src/data/bible/`) | GitHub | git history + every clone | **Low** — plain JSON, versioned per commit |
| CMS schemas | GitHub (`sanity/`) | git | **Low** |
| **Sanity content** — sermons, books, gallery, settings, homepage copy | Sanity Content Lake **only** | *Nothing, unless you export* | **HIGH** |
| **Uploaded assets** — PDFs, images | Sanity CDN **only** | *Nothing, unless you export* | **HIGH** |
| Environment variables / secrets | Vercel + your password manager | Password manager | **Medium** — unrecoverable if lost |
| DNS records | Porkbun | *Nothing* | **Medium** — reconstructable from `docs/deployment.md` §6b |

Everything marked HIGH is covered by one command (§2).

> **Sanity's built-in History is not a backup.** Per-document History is a
> convenience for undoing a bad edit (see §4), with a plan-dependent retention
> window. It will not save you from a deleted dataset or a lost account.

---

## 2. Backing up Sanity (the important one)

Run from the Studio repo, which has the Sanity CLI and is already authenticated:

```bash
cd studio-church-ehb
npx sanity dataset export production ../backups/sanity-$(date +%Y-%m-%d).tar.gz
```

The export includes **documents and all assets** (PDFs and images) in one
gzipped tarball. Drafts are included unless you pass `--no-drafts`.

**Measured on this project (2026-07-27):**

| Metric | Value |
|---|---|
| Documents | 14 |
| Assets | 10 |
| Archive size | **7.4 MB** |
| Time | **under 6 seconds** |

At this size there is no reason to skip a backup. It fits in email, cloud
storage, or a USB stick.

**Where to keep it.** Not only on the laptop that made it. Any two of: cloud
drive, external disk, a private git repo. Keep at least the **last three**
exports — a corruption you don't notice for a week is survivable only if you
still hold an older copy.

**Do not commit exports to this repo.** They contain the full content set and
would bloat history permanently.

---

## 3. Restoring Sanity

```bash
cd studio-church-ehb
npx sanity dataset import ../backups/sanity-2026-07-27.tar.gz production --replace
```

| Flag | Meaning | When |
|---|---|---|
| `--replace` | Overwrite documents with the same `_id` | Restoring after data loss or a bad bulk change |
| `--missing` | Only add documents that don't exist | Merging in content without touching current documents |
| *(neither)* | Fails on any `_id` collision | Importing into an empty dataset |

**Order of operations after a restore:**

1. Import, as above.
2. Open the Studio and spot-check: Church Settings populated, a sermon, a book
   with its PDF, a gallery album with images.
3. Publish any one document (or wait for the next publish) so the webhook fires
   and revalidates the site — an import does **not** automatically refresh the
   live site's cache.
4. If the site still shows old content, redeploy from Vercel.

> **Test this before you need it.** Create a scratch dataset
> (`npx sanity dataset create restore-test`), import a backup into it, and
> confirm the documents arrive. An untested backup is a hope, not a plan.

---

## 4. Restoring a single bad edit (the common case)

You almost never need a full restore. For one document the preacher got wrong:

**Sanity Studio → open the document → History → select an earlier version →
Restore → Publish.** The webhook revalidates automatically; no deploy, no
developer.

This is the first thing to try, and the right thing to teach the content owner.

---

## 5. Restoring code and the Bible text

Everything is in git, so recovery is ordinary version control.

**A wrong Bible edit that was already pushed:**

```bash
git revert <sha>        # safest — keeps history honest
git push
```

Vercel redeploys automatically, and `prebuild` re-derives the search index from
the restored text.

**A single file back to a known-good state:**

```bash
git checkout <sha> -- src/data/bible/mk/john.json
npm run bible:validate   # confirm the dataset is still valid
git commit -am "Restore John to <sha>"
```

**Total loss of the local machine:** clone from GitHub, `npm install`, copy the
secrets back from your password manager into `.env.local`. Nothing else is
needed — the repo is self-contained.

**Total loss of GitHub:** any existing clone (yours, the preacher's) is a
complete copy including history. `git remote set-url origin <new-remote>` and
push. This is the strongest reason to make sure the preacher has a clone.

---

## 6. Secrets

These exist **only** in Vercel and your password manager. They are not in git,
by design, and cannot be recovered from the codebase.

| Secret | If lost |
|---|---|
| `SANITY_REVALIDATE_SECRET` | Generate a new one (`openssl rand -hex 32`), set it in Vercel **and** the Sanity webhook header, redeploy |
| `RESEND_API_KEY` | Create a new key in Resend, set in Vercel, redeploy |
| Sanity / Vercel / GitHub / Porkbun / Resend logins | Account recovery flows — **see `docs/operations-runbook.md` §1 on ownership** |

Store all of them in one password manager entry set the preacher can also
reach. A secret only you can access is a single point of failure with a human in
it.

---

## 7. DNS

Porkbun holds two records for this site. They are documented in
`docs/deployment.md` §6b and reproduced here so a restore needs only one file:

| Type | Host | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Always prefer the values Vercel currently displays under **Settings → Domains**
over these, in case Vercel changes its endpoints.

---

## 8. Recommended routine

| Frequency | Action |
|---|---|
| **Quarterly** | `sanity dataset export`, store off-machine, keep the last 3 |
| **Before any risky change** | Export first — bulk edits, imports, schema removals |
| **After adding a lot of content** | Export, so a month of the preacher's work is never the only copy |
| **Annually** | Restore a backup into a scratch dataset to prove it still works |

The full cadence, with everything else that needs periodic attention, is in
**[operations-runbook.md](./operations-runbook.md) §3**.
