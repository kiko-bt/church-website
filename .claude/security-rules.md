# Security Rules

# Project: Црква Евангелие Христово - Битола

---

# SECURITY PRINCIPLES

Prioritize:

- validation
- sanitization
- least exposure
- server-side protection

---

# ENVIRONMENT VARIABLES

Use:

- .env.local

Never expose:

- API keys
- secrets
- tokens

---

# FORM SECURITY

Contact forms MUST:

- validate with Zod
- sanitize input
- use rate limiting
- reject malformed data

---

# API RULES

API routes MUST:

- validate input
- return safe errors
- avoid leaking internals

---

# DEPENDENCY RULES

Always:

- use stable package versions
- audit dependencies
- avoid unnecessary libraries

Commands:

- npm audit
- npm outdated

---

# SANITY SECURITY

Never expose:

- write tokens
- management tokens

Use:

- least privilege access

---

# FINAL RULE

Security is mandatory.

Never sacrifice security for speed.
