# 2026-05-30 — Suppression des règles de groupe

## Objectif

Retirer la fonctionnalité « règles du groupe » (`regles_groupe`), jamais exploitée dans l'application.

## Changements

### Schéma Prisma

- Suppression du modèle `ReglesGroupe`.
- Suppression de l'enum `TypeRegle`.
- Suppression de la relation `Groupes.regles`.

### Migration

- `20260530170000_remove_regles_groupe` : `DROP TABLE regles_groupe` + `DROP TYPE TypeRegle`.

### API

- `POST /api/groups` : le champ `regles` n'est plus accepté dans le body (schéma strict).
- La réponse 201 ne retourne plus de liste `regles`.

### Interface

- Suppression de l'onglet « Règles » dans la navigation du groupe.
- Suppression de la page `/dashboard/groups/[groupId]/regles`.

## Non impacté

- Pénalités de cycle (`mode_penalite`, etc.) — système distinct.
- Rubriques de cotisation.
