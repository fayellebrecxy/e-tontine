# Contributing

Thanks for contributing to this project.

## Prerequisites
- Node.js 20+
- Supabase CLI (for local development)

## Setup
1. Install dependencies: npm install
2. Configure environment variables: cp .env.template .env
3. Start Supabase locally: supabase start
4. Generate Prisma client: npx prisma generate
5. Run the app: npm run dev

## Development guidelines
- Keep API routes in app/api/**/route.ts.
- Validate inputs with Zod in lib/validations.ts.
- Use Prisma select to fetch only required fields.
- Update Docs/ when business logic changes.

## Before opening a PR
- Run npm run lint
- Run npm run build
- Include any relevant Docs/ updates
