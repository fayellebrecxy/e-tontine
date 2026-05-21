# Copilot Instructions

## Project context
- Stack: Next.js App Router, Supabase Auth (SSR), Prisma + Postgres, Tailwind + shadcn/ui.
- Prisma schema in prisma/schema.prisma is the source of truth for data models.
- Docs in Docs/ describe functional requirements and must be updated when business logic changes.

## General guidance
- Prefer server-side access via createSupabaseServerClient() and supabase.auth.getUser() using cookies.
- Do not authorize based on user_metadata; use database-backed roles/relations.
- Use NextResponse.json() with { ok: true } / { ok: false, error } payloads.
- Validate inputs with Zod in lib/validations.ts and normalize data with helpers.
- Limit Prisma selects to only the fields needed.
- Use transactions when a flow updates multiple related tables.

## Code style
- Use TypeScript and keep functions small and single-purpose.
- Favor explicit error handling and user-friendly messages.
- Keep API routes in app/api/**/route.ts.

## Testing and quality
- Run npm run lint and npm run build before PRs when possible.
- If database schema changes, regenerate Prisma client.
## a faire 

toujours lire le fichier .github/context.md pour te souvenir de ce qui a ete fait precedement 

toujours me poser des questions afin que nos objectifs soient synchroniser

toujours verifier que ce que tu implemente fonctionne

sers toi dans les fichiers : Docs/cahier de charge E-TONTINEv2 (1).docx   Docs/Guide_API_NextJS_E-TONTINE.docx  

