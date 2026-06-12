# 2026-06-10 - Reference API Frontend E-TONTINE

Ce document regroupe les routes `app/api/**/route.ts` utiles pour designer le frontend. Il resume les contrats visibles cote UI: authentification, roles, donnees d'entree, et formes de reponse.

## Conventions communes

- Authentification par Supabase SSR via cookies.
- La plupart des routes groupe exigent un membre `ACTIF`.
- Les actions sensibles sont reservees aux admins du groupe.
- Reponse standard attendue sur la plupart des routes: `{ ok: true, ... }` ou `{ ok: false, error }`.
- Exceptions a connaitre pour le frontend:
  - `GET /api/notifications` renvoie directement un tableau.
  - `PATCH /api/notifications/:notificationId` renvoie la notification mise a jour.
  - `GET /api/history-visibility` renvoie `{ ok: true, hiddenTargetIds: [...] }`.
  - `GET /api/health` renvoie `{ ok: true }`.

## 1. Utilitaires globaux

| Endpoint | Acces | Usage frontend | Entree | Reponse / notes |
|---|---|---|---|---|
| `GET /api/health` | public | Verifier que l'API repond | aucune | `{ ok: true }` |
| `GET /api/history-visibility?scope=...` | connecte | Recuperer les elements caches dans un scope donne | query `scope` | `{ ok: true, hiddenTargetIds: [...] }` |
| `POST /api/history-visibility` | connecte | Masquer un element d'historique | `{ scope, targetId }` | `{ ok: true }` |
| `DELETE /api/history-visibility` | connecte | Rendre visible un element, ou tout un scope si `clearScope=true` | `{ scope, targetId? , clearScope? }` | `{ ok: true }` |
| `GET /api/cron/reunion-reminders` | secret cron | Lancer les rappels de reunions planifiees | header `Authorization: Bearer <CRON_SECRET>` | `{ ok: true, ...result }` |

## 2. Profil utilisateur et notifications

| Endpoint | Acces | Usage frontend | Entree | Reponse / notes |
|---|---|---|---|---|
| `PATCH /api/users/me` | connecte | Modifier le profil courant | `{ nom?, prenom?, telephone?, photo_de_profil? }` | `200 { ok: true, user: ... }`, `400`, `401`, `404`, `409` |
| `GET /api/notifications` | connecte | Afficher la liste des notifications | aucune | tableau de notifications, max 30 |
| `DELETE /api/notifications` | connecte | Vider toutes les notifications du user | aucune | `{ success: true }` |
| `PATCH /api/notifications/:notificationId` | connecte | Marquer une notification comme lue | aucune | notification mise a jour |
| `DELETE /api/notifications/:notificationId` | connecte | Supprimer une notification precise | aucune | `{ success: true }` |

### Notes frontend

- Le bloc notifications du dashboard doit consommer `GET /api/notifications`.
- Le bouton "tout marquer comme lu" peut utiliser `PATCH /api/notifications/:notificationId` item par item si besoin, mais l'API actuelle ne propose pas de bulk read.
- Pour un centre de notifications, garder en tete que la reponse `GET` n'est pas enveloppee dans `{ ok: true }`.

## 3. Groupes

| Endpoint | Acces | Usage frontend | Entree | Reponse / notes |
|---|---|---|---|---|
| `GET /api/groups` | connecte | Lister les groupes de l'utilisateur | query optionnelle `include_inactive=1` | `{ ok: true, groups: [...] }` |
| `POST /api/groups` | connecte | Creer un groupe | `{ nom, description?, devise? }` | `201 { ok: true, groupe: ... }` |
| `GET /api/groups/:groupId` | membre du groupe | Charger la fiche du groupe | aucune | `{ ok: true, groupe, membership }` |
| `PATCH /api/groups/:groupId` | admin actif | Modifier le groupe | `{ nom?, description?, devise? }` | `{ ok: true, groupe }` |
| `DELETE /api/groups/:groupId` | admin actif | Supprimer le groupe | aucune | `{ ok: true }` |
| `GET /api/groups/:groupId/members` | membre actif | Lister les membres et leurs infos | aucune | `{ ok: true, members: [...] }` |
| `PATCH /api/groups/:groupId/members/:memberId` | admin actif | Changer le role ou reintegrer un membre | `{ role: "ADMIN" | "MEMBRE" }` ou body de statut | `{ ok: true, member }` |
| `DELETE /api/groups/:groupId/members/:memberId` | admin actif | Exclure un membre | aucune | `{ ok: true, member }` |
| `POST /api/groups/:groupId/rejoin` | membre exclu | Demander a revenir dans le groupe | aucune | `{ ok: true, pending: true }` |
| `GET /api/groups/:groupId/invitations` | admin actif | Recuperer le lien courant ou l'activer | aucune | `{ ok: true, invitation: ... }` |
| `POST /api/groups/:groupId/invitations` | admin actif | Generer un nouveau code d'invitation | aucune | `201 { ok: true, invitation: ... }` |
| `DELETE /api/groups/:groupId/invitations?invitationId=...` | admin actif | Revoquer une invitation non active | query `invitationId` | `{ ok: true }` |
| `POST /api/invitations/:code/join` | connecte | Rejoindre un groupe via code | profil optionnel si incomplet | `{ ok: true, groupe, membership }` ou `{ ok: true, pending: true }` |
| `GET /api/groups/:groupId/rapport?format=pdf|excel` | admin actif | Telecharger un rapport global | query `format` | fichier PDF ou XLSX telechargeable |
| `GET /api/groups/:groupId/membres/:membreId/releve-pdf` | membre concerne ou admin | Telecharger le releve individuel | aucune | fichier PDF telechargeable |

### Notes frontend

- La creation de groupe fait aussi de l'utilisateur l'admin initial.
- La page settings admin doit supporter modification et suppression du groupe.
- La page membres doit afficher les roles, statuts d'adhesion, et les actions admin: promotion, exclusion, reintegration.
- Le composant de partage d'invitation doit afficher le code et le lien complet renvoye par l'API.
- Le releve individuel et le rapport global sont des downloads, pas des JSON.

## 4. Cycles de tontine

| Endpoint | Acces | Usage frontend | Entree | Reponse / notes |
|---|---|---|---|---|
| `POST /api/groups/:groupId/cycles` | admin actif | Demarrer un cycle | `{ nom_cycle, duree_tour_de_gain, montant_cotisation, participants, penalty_active?, penalty_type?, penalty_value? }` | `201 { ok: true, cycle, participants }` |
| `GET /api/groups/:groupId/cycles` | membre actif | Lister les cycles du groupe | aucune | `{ ok: true, cycles: [...] }` |
| `GET /api/groups/:groupId/cycles/:cycleId` | membre actif et participant si non admin | Voir le detail d'un cycle | aucune | `{ ok: true, cycle, payments }` |
| `PATCH /api/groups/:groupId/cycles/:cycleId` | admin actif | Mettre a jour un cycle ou le clore | body partiel ou vide | `{ ok: true, cycle }` |
| `DELETE /api/groups/:groupId/cycles/:cycleId` | admin actif | Supprimer un cycle | aucune | `{ ok: true }` |
| `POST /api/groups/:groupId/cycles/:cycleId/payments` | admin actif | Enregistrer une cotisation | `{ id_membre_groupe, montant, date_paiement?, numero_tour? }` | `{ ok: true, payment }` |
| `PATCH /api/groups/:groupId/cycles/:cycleId/ordre` | admin actif | Reordonner les beneficiaires | `{ action: "monter" | "descendre" | "tirage" | "manuel", membreId?, nouvelOrdre? }` | `{ ok: true }` |
| `POST /api/groups/:groupId/cycles/:cycleId/distributions` | admin actif | Verser le pot du tour au beneficiaire | `{ numero_tour, montant_verse, mode_versement?, reference_externe?, date_versement? }` | `{ ok: true, versement, pot_tour }` |
| `GET /api/groups/:groupId/cycles/:cycleId/distributions` | membre actif | Voir l'historique des versements | aucune | `{ ok: true, versements: [...] }` |
| `GET /api/groups/:groupId/cycles/:cycleId/echanges` | membre actif | Voir les demandes d'echange | aucune | `{ ok: true, echanges: [...] }` |
| `POST /api/groups/:groupId/cycles/:cycleId/echanges` | membre actif | Proposer un echange de place | `{ id_cible, note? }` | `{ ok: true, demande }` |
| `PATCH /api/groups/:groupId/cycles/:cycleId/echanges/:echangeId` | membre actif / admin selon action | Repondre ou valider un echange | `{ action: ... }` | `{ ok: true, statut: ... }` |

### Notes frontend

- La page cycle doit separer les vues `admin` et `membre`.
- Le bloc "tresorerie" doit consommer la distribution response `pot_tour`.
- Les echanges de place doivent verrouiller les tours deja distribues.
- Les penalites de retard sont calculees cote serveur; le frontend ne doit pas les reconstruire.

## 5. Reunions et amendes

| Endpoint | Acces | Usage frontend | Entree | Reponse / notes |
|---|---|---|---|---|
| `GET /api/groups/:groupId/reunions` | membre actif | Lister les reunions du groupe | aucune | `{ ok: true, reunions: [...] }` |
| `POST /api/groups/:groupId/reunions` | admin actif | Programmer une reunion | `{ titre, description?, date_reunion, lieu?, type_reunion?, montant_amende? }` | `201 { ok: true, reunion }` |
| `GET /api/groups/:groupId/reunions/:reunionId` | membre actif | Voir le detail d'une reunion | aucune | `{ ok: true, reunion }` |
| `PATCH /api/groups/:groupId/reunions/:reunionId` | admin actif | Modifier, annuler ou cloturer la reunion | body partiel | `{ ok: true, reunion }` |
| `DELETE /api/groups/:groupId/reunions/:reunionId` | admin actif | Supprimer une reunion sans historique | aucune | `{ ok: true }` |
| `POST /api/groups/:groupId/reunions/:reunionId/presences` | admin actif | Enregistrer toutes les presences | `{ presences: [{ id_membre_groupe, statut_presence, note_absence? }] }` | `{ ok: true }` |
| `PATCH /api/groups/:groupId/reunions/:reunionId/presences` | membre actif | Signaler son absence a l'avance | `{ note_absence }` | `{ ok: true }` |
| `PATCH /api/groups/:groupId/reunions/:reunionId/amendes/:presenceId` | admin actif | Marquer une amende comme payee | aucune | `{ ok: true }` |
| `GET /api/groups/:groupId/amendes-reunions` | admin actif | Voir le solde et l'historique de la caisse amendes | aucune | `{ ok: true, solde, totalCollecte, totalRetire, presencesPaieees, retraits }` |
| `POST /api/groups/:groupId/amendes-reunions/retraits` | admin actif | Retirer de la caisse amendes | `{ montant, motif }` | `201 { ok: true, retrait, nouveauSolde }` |

### Notes frontend

- La page reunions doit montrer la liste, le detail, et la saisie des presences.
- Les presences sont un workflow important: reunion planifiee -> reunion terminee -> amendes payees.
- Les membres simples ne doivent voir que leurs propres presences sur le detail d'une reunion.
- La caisse amendes sert a alimenter un petit tableau de bord financier dans l'interface admin.

## 6. Epargne

| Endpoint | Acces | Usage frontend | Entree | Reponse / notes |
|---|---|---|---|---|
| `POST /api/groups/:groupId/epargne/accounts` | admin actif | Ouvrir un ou plusieurs comptes epargne | `{ action: "CREATE_ONE", memberId }` ou `{ action: "CREATE_ALL" }` | `{ ok: true, created, account? }` |
| `PATCH /api/groups/:groupId/epargne/accounts/:accountId` | admin actif | Ouvrir ou cloturer un compte epargne | `{ action: "CLOTURER" | "REOUVRIR" }` | `{ ok: true, status }` |
| `DELETE /api/groups/:groupId/epargne/accounts/:accountId` | admin actif | Supprimer un compte vide sans historique | aucune | `{ ok: true }` |
| `POST /api/groups/:groupId/epargne/accounts/:accountId/operations` | admin actif | Enregistrer un depot ou un retrait | `{ type: "DEPOT" | "RETRAIT", montant, motif }` | `{ ok: true, movement }` |
| `POST /api/groups/:groupId/epargne/mouvements/:movementId/signalements` | membre actif | Signaler un mouvement epargne | `{ motif }` | `{ ok: true }` |

### Notes frontend

- Les ecrans epargne doivent afficher le statut du compte, le solde, et l'historique des operations.
- L'admin est le seul a pouvoir ouvrir, clore, supprimer et operer sur les comptes.
- Les signalements de mouvements sont reserves aux membres actifs.

## 7. Synthese par page frontend

| Page / zone UI | APIs principales |
|---|---|
| Dashboard principal | `GET /api/groups`, `GET /api/notifications` |
| Edition du profil | `PATCH /api/users/me` |
| Creation / partage de groupe | `POST /api/groups`, `GET|POST|DELETE /api/groups/:groupId/invitations` |
| Page detail groupe | `GET /api/groups/:groupId`, `GET /api/groups/:groupId/members` |
| Parametres admin du groupe | `PATCH /api/groups/:groupId`, `DELETE /api/groups/:groupId` |
| Gestion membres | `PATCH /api/groups/:groupId/members/:memberId`, `DELETE /api/groups/:groupId/members/:memberId`, `POST /api/groups/:groupId/rejoin` |
| Page cycles | `GET|POST /api/groups/:groupId/cycles`, `GET|PATCH|DELETE /api/groups/:groupId/cycles/:cycleId`, `POST /payments`, `GET|POST /distributions`, `PATCH /ordre`, `GET|POST /echanges` |
| Page reunions | `GET|POST /api/groups/:groupId/reunions`, `GET|PATCH|DELETE /api/groups/:groupId/reunions/:reunionId`, `POST|PATCH /presences`, `PATCH /amendes/:presenceId` |
| Page epargne | `POST /api/groups/:groupId/epargne/accounts`, `PATCH|DELETE /api/groups/:groupId/epargne/accounts/:accountId`, `POST /operations`, `POST /signalements` |
| Exports PDF / Excel | `GET /api/groups/:groupId/rapport`, `GET /api/groups/:groupId/membres/:membreId/releve-pdf` |

## 8. Points d'attention pour le frontend

- Les routes groupe utilisent souvent `200` pour une action reussie, meme quand elles modifient des donnees importantes.
- Plusieurs actions peuvent renvoyer `409` pour signaler un conflit metier et pas seulement une erreur technique.
- Les fichiers PDF/XLSX doivent etre telecharges via navigation ou fetch binaire, pas affiches comme JSON.
- Les pages admin doivent anticiper les droits: admin actif, membre actif, membre exclu, membre en attente.
- Les libelles visibles cote UI doivent reprendre les etats metier: `ACTIF`, `INACTIF`, `EN_ATTENTE`, `PLANIFIEE`, `TERMINEE`, `ANNULEE`.

## 9. Sources de reference

- `app/api/**/route.ts`
- `Docs/2026-05-12_api-users-me_patch-profil.md`
- `Docs/2026-05-13_api-groups_creation_et_liste.md`
- `Docs/2026-05-13_api-invitations_join_membres.md`
- `Docs/2026-05-25_api-groups_roles_membres.md`
- `Docs/2026-05-25_api-groups_cycles.md`
- `Docs/2026-05-29_api-groups_versements.md`
- `Docs/2026-05-30_suppression_regles_groupe.md`
