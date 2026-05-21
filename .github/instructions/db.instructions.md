---
description: "Database and Prisma conventions"
applyTo: "prisma/schema.prisma"
---

- Keep schema changes consistent with existing naming and mappings.
- Use @@map and @@schema when new tables are added.
- Prefer UUID ids with gen_random_uuid() for new tables.
- Update Docs/ with a dated note when schema or business rules change.
