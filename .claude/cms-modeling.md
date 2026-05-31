
---

# `.claude/cms-modeling.md`

```md
# CMS Modeling Rules
# Project: Црква Христово Евангелие - Битола

---

# PURPOSE

This document defines the official CMS architecture and modeling rules.

CMS:
- Sanity CMS
- preacher-friendly
- low maintenance
- minimal complexity

---

# OFFICIAL CMS RESPONSIBILITY

Sanity manages:
- sermons
- books
- PDFs
- gallery images
- church settings
- social links
- metadata

Sanity DOES NOT manage:
- Bible verse data
- Bible chapters
- searchable verse content

---

# CRITICAL BIBLE RULE

Bible verse data lives in:
- local JSON files
- committed in the repository

NOT inside Sanity.

---

# BIBLE STORAGE ARCHITECTURE

```txt
src/data/bible/
├── bible-hierarchical.json
└── bible-search-index.json