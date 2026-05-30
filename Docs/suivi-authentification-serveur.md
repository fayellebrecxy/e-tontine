# Suivi de conception - Authentification serveur

Date: 2026-05-11

## Décisions validées

- L'application utilise Supabase Auth pour l'inscription, la connexion, la session serveur, la confirmation email et la réinitialisation du mot de passe.
- Le mot de passe n'est pas stocké dans la base métier Prisma. Supabase Auth en garde la responsabilité.
- La table `users` représente le profil global de l'utilisateur connecté: nom, prénom, email, téléphone et photo.
- Le rôle n'est pas global. Il dépend du groupe.
- La relation entre utilisateur et groupe est portée par `MembreGroupe`, comme une application de messagerie: un utilisateur se connecte puis voit la liste de ses groupes.
- Le créateur d'un groupe devra devenir à la fois `ADMIN` et membre du groupe lors de la création du groupe.
- Le trésorier n'est pas un rôle distinct pour l'instant. L'enregistrement des cotisations reste une tâche administrateur.
- Le statut visuel vert/orange/rouge appartient à l'adhésion dans un groupe, pas au profil global.
- Après connexion, l'utilisateur est redirigé vers `/dashboard`.

## Changements du schéma Prisma

- Suppression de `mot_de_passe` du modèle `User`.
- Suppression du rôle, du statut d'adhésion et du statut visuel du modèle `User`.
- Ajout du modèle `MembreGroupe`.
- Ajout de l'enum `RoleGroupe` avec `ADMIN` et `MEMBRE`.
- Mise à jour de `StatutVisuel` avec `VERT`, `ORANGE` et `ROUGE`.
- Les cotisations et pénalités sont rattachées à `MembreGroupe` plutôt qu'à `User`.
- Les identifiants métier sont typés en UUID côté Postgres.
- `users.id_user` référence `auth.users.id` dans Supabase.

## Migration Supabase

- Migration créée: `supabase/migrations/20260511155947_create_auth_server_schema.sql`.
- Migration appliquée sur Supabase via MCP sous le nom `create_auth_server_schema`.
- Tables créées: `users`, `groupes`, `membres_groupe`, `cycles_tontine`, `cotisations`, `penalites`.
- RLS activé sur toutes les tables publiques métier.
- Aucune policy RLS métier n'a encore été ajoutée. C'est acceptable tant que l'accès aux tables passe par le serveur Prisma, mais il faudra définir les policies avant d'exposer ces tables directement côté client via l'API Supabase.

## Flux d'inscription

1. L'utilisateur saisit nom, prénom, téléphone, email et mot de passe.
2. Le serveur valide les données.
3. Le serveur vérifie l'unicité du téléphone côté Prisma.
4. Supabase Auth crée le compte avec l'email et le mot de passe.
5. Le profil métier est créé ou mis à jour dans Prisma avec `id_user = auth.users.id`.
6. Si la confirmation email est active, l'utilisateur est invité à vérifier son email.

## Flux de connexion

1. L'utilisateur saisit email et mot de passe.
2. Supabase Auth vérifie les identifiants côté serveur.
3. Les cookies de session SSR sont mis à jour.
4. L'utilisateur est redirigé vers `/dashboard`.

## Flux email et mot de passe

- La route `/auth/callback` échange le code Supabase contre une session serveur.
- La page `/auth/reset-password` envoie un lien de réinitialisation.
- La page `/auth/update-password` permet de définir un nouveau mot de passe après ouverture du lien.

## Points à reporter dans les documents UML

- Remplacer la relation many-to-many implicite `User - Groupe` par l'association `MembreGroupe`.
- Déplacer `role`, `statutAdhesion`, `dateAdhesion`, `dateDepart` et `statutVisuel` vers `MembreGroupe`.
- Remplacer le statut visuel en ligne/hors ligne par vert/orange/rouge.
- Indiquer que `motDePasse` est géré par Supabase Auth et ne fait pas partie du modèle métier applicatif.
- Rattacher `Cotisation` et `Penalite` à `MembreGroupe`.
