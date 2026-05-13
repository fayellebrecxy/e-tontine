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

### API Groups
- `POST /api/groups`: crée un `Groupes` + un `MembreGroupe` (role `ADMIN`) pour l’utilisateur authentifié.
- `GET /api/groups`: retourne la liste des groupes de l’utilisateur via ses `MembreGroupe`.
- Générer un `lien_invitation` unique côté serveur (gérer collision `P2002` par retry).

### API Invitations
- `POST /api/groups/:groupId/invitations`: **ADMIN uniquement**, génère un nouveau code/lien d’invitation et met à jour `Groupes.lien_invitation`.
- `POST /api/invitations/:code/join`: utilisateur authentifié rejoint le groupe lié au code; crée/complète `User` Prisma si nécessaire; crée `MembreGroupe` (role `MEMBRE`).
- `GET /api/groups/:groupId/members`: accessible aux membres du groupe; liste `User` + `MembreGroupe` (rôle/statuts).

## Base de données (Prisma)
- Client Prisma central dans `lib/prisma.ts`.
- Éviter les requêtes non nécessaires (sélectionner uniquement les champs utiles via `select`).

### Invitations (schéma)
- Modèle `InvitationGroupe` (table `invitations_groupe`) avec `code` unique et relation vers `Groupes`.
- `Groupes.lien_invitation` reste le "code courant" pour partage rapide.

### Connexion Supabase (Prisma)
- En général:
  - `DATABASE_URL`: connexion pooler/pgbouncer (souvent port `6543`)
  - `DIRECT_URL`: connexion directe (souvent port `5432`) pour migrations.
- Si tu vois: "Can't reach database server ... pooler.supabase.com:5432", c'est souvent un mismatch pooler/port.

### Supabase & multi-schema
- En Supabase, certaines contraintes référencent `auth.*` (ex: `public.users` → `auth.users`).
- Le datasource Prisma doit donc déclarer `schemas = ["public", "auth"]` et les modèles/enums doivent être annotés en `@@schema("public")`.
- Les migrations Prisma doivent utiliser une URL **directe** joignable (`DIRECT_URL`). Si `DIRECT_URL` est inaccessible (P1001), corriger la connectivité/allowlist avant `prisma migrate dev`.

### Résolution P1001 (host direct IPv6)
- Si `DIRECT_URL` pointe vers `db.<project>.supabase.co` et que ton environnement n’a pas d’IPv6, tu peux avoir `P1001`.
- Stratégies recommandées:
  - Utiliser une DB de dev locale (Supabase local) ou une machine avec IPv6.
  - Pour appliquer une modification **ciblée** sans `prisma migrate dev` (drift), préférer une migration SQL dans `supabase/migrations/` + exécution via:
    - `npx prisma db execute --file supabase/migrations/<...>.sql --schema prisma/schema.prisma`
  - Pour forcer l’URL utilisée par Prisma CLI sans toucher `DATABASE_URL`, définir `PRISMA_CLI_DATABASE_URL`.

## Documentation (Docs)
- À chaque ajout/modification de logique métier, créer un fichier dans `Docs/` (préfixé par la date) décrivant:
  - contrat API / règles métier
  - impact sur le schéma Prisma
  - mise à jour attendue des diagrammes UML (mermaid ou description)
