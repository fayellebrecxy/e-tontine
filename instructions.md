# Instructions (codebase)

## Priorité
- Le schéma Prisma dans `prisma/schema.prisma` est la source de vérité pour les données.
- Les documents dans `Docs/` servent surtout à comprendre les besoins fonctionnels; ils doivent être mis à jour quand la logique change.

## Auth & sécurité (Supabase)
- Côté serveur, utiliser `createSupabaseServerClient()` (SSR) pour récupérer l’utilisateur via cookies (`supabase.auth.getUser()`).
- Ne pas baser l’autorisation sur `user_metadata` (modifiable par l’utilisateur).
- Les opérations sensibles doivent répondre `401` si non authentifié.

## API (Next.js App Router)
- Les routes API vivent sous `app/api/**/route.ts`.
- Utiliser `NextResponse.json()` avec des payloads simples:
  - succès: `{ ok: true, ... }`
  - erreur: `{ ok: false, error: string }`
- Validation des payloads via Zod dans `lib/validations.ts`.
- Normalisation des champs via helpers (`normalizeEmail`, `normalizeName`, `normalizePhone`).
- Pour les erreurs Prisma (ex: unicité), mapper vers des statuts HTTP explicites (ex: `409`).

## Base de données (Prisma)
- Client Prisma central dans `lib/prisma.ts`.
- Éviter les requêtes non nécessaires (sélectionner uniquement les champs utiles via `select`).

## Documentation (Docs)
- À chaque ajout/modification de logique métier, créer un fichier dans `Docs/` (préfixé par la date) décrivant:
  - contrat API / règles métier
  - impact sur le schéma Prisma
  - mise à jour attendue des diagrammes UML (mermaid ou description)
