# Context (Base de connaissance)

Ce document sert de memoire evolutive pour le projet. Il est alimente au fil des changements fonctionnels et techniques, en s'appuyant sur Docs/.

## Objectif du projet
Application de tontine avec groupes, roles par groupe, invitations, et suivi des membres.

## Stack et architecture
- Next.js App Router
- Supabase Auth (SSR, cookies)
- Prisma + Postgres
- Tailwind + shadcn/ui
- API routes sous app/api/**/route.ts

## Authentification et profils
- Auth geree par Supabase (inscription, connexion, reset password).
- Le profil metier est stocke dans la table users (nom, prenom, email, telephone, photo_de_profil).
- Ne jamais utiliser user_metadata pour l'autorisation.

## Groupes et roles
- Le role est porte par MembreGroupe, pas par User.
- A la creation d'un groupe, l'utilisateur devient ADMIN et membre.
- Les membres voient la liste des membres du groupe.
- Admin peut modifier/supprimer un groupe via PATCH/DELETE /api/groups/:groupId.
- Suppression d'un groupe supprime ses membres (cascade) sans supprimer les users.
- Admin peut attribuer le role ADMIN/MEMBRE aux membres via PATCH /api/groups/:groupId/members/:memberId.
- Un groupe doit garder au moins un admin; auto-declassement interdit.
- Exclusion: statut_adhesion passe a INACTIF + date_depart.
- Reintegration: un membre exclu demande a revenir -> statut_adhesion EN_ATTENTE, validation admin requise.
- Les membres INACTIF ont un acces limite a la fiche du groupe.

## Invitations
- Invitation par code unique via invitations_groupe.
- Groupes.lien_invitation conserve le code courant.
- Join via POST /api/invitations/:code/join (upsert user + create membre).
- Si membre INACTIF: join met EN_ATTENTE et notifie les admins.

## Notifications in-app
- Table notifications_groupe: id_user, id_groupe (nullable), type_notification, message, dates.
- Notif envoyee a tous les membres lors d'une mise a jour ou suppression de groupe.
- Bloc "Notifications" affiche sur le dashboard (dernieres 5).
- Notification envoyee au membre lors d'un changement de role.

## UI admin groupe
- Page settings admin: /dashboard/groups/[groupId]/settings.
- Formulaire de mise a jour + suppression du groupe.

## API conventions
- NextResponse.json() avec { ok: true } ou { ok: false, error }.
- Validation Zod dans lib/validations.ts.
- Normalisation via normalizeEmail/normalizeName/normalizePhone.
- Mapper les erreurs Prisma vers des statuts explicites.

## Prisma et base de donnees
- prisma/schema.prisma est la source de verite.
- RLS active sur les tables publiques; policies a definir avant exposition directe.
- Utiliser des selects limites pour eviter le sur-fetch.

## Documentation source
- Docs/ est la reference fonctionnelle a mettre a jour a chaque changement metier.
- Fichiers clefs actuels:
  - 2026-05-11 suivi-authentification-serveur
  - 2026-05-12 api-users-me_patch-profil
  - 2026-05-13 api-groups_creation_et_liste
  - 2026-05-13 api-invitations_join_membres
  - 2026-05-25 api-groups_roles_membres
  - 2026-05-25 api-groups_cycles

## Mise a jour de ce fichier
- Ajouter une entree a chaque nouvelle fonctionnalite ou changement metier.
- Garder des points courts, factuels, et aligns sur Docs/.
