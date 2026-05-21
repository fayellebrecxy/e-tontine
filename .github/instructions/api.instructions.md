---
description: "API route conventions for app/api/**/route.ts"
applyTo: "app/api/**/route.ts"
---

- Require Supabase auth for protected routes and return 401 when unauthenticated.
- Validate request bodies with Zod schemas from lib/validations.ts.
- Use normalizeEmail/normalizeName/normalizePhone before persistence.
- Return JSON responses with { ok: true } on success or { ok: false, error } on failure.
- Map Prisma errors to explicit HTTP status codes (400/401/403/404/409/500).
- Use Prisma select to limit fields and avoid over-fetching.
