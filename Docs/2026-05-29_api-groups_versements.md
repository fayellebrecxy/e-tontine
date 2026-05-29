# API — Versements aux bénéficiaires (Distributions)

**Date** : 2026-05-29  
**Fonctionnalité** : Enregistrement et suivi des versements du pot aux bénéficiaires des tours de cycle.

---

## Contexte

Les cotisations (entrées d'argent) existaient déjà. Cette fonctionnalité ajoute les **sorties d'argent** : le versement du pot collecté au bénéficiaire de chaque tour.

---

## Modèle de données

### Nouvelle table : `versements`

```prisma
model Versement {
  id_versement      String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id_cycle          String         @db.Uuid
  id_beneficiaire   String         @db.Uuid
  numero_tour       Int
  montant_verse     Decimal        @db.Decimal(15, 2)
  date_versement    DateTime       @default(now())
  mode_versement    ModeVersement?
  reference_externe String?
  id_admin_valideur String         @db.Uuid
  ...
}
```

### Nouvel enum : `ModeVersement`

```
VIREMENT | ESPECES | MOBILE_MONEY | CHEQUE
```

---

## Routes API

### `POST /api/groups/:groupId/cycles/:cycleId/distributions`

Enregistre un versement au bénéficiaire d'un tour. **Admin uniquement.**

**Body JSON :**
```json
{
  "numero_tour": 3,
  "montant_verse": 150000,
  "mode_versement": "MOBILE_MONEY",
  "reference_externe": "TXN-123456789",
  "date_versement": "2026-05-29"
}
```

**Validations :**
- `numero_tour` : entier positif, entre 1 et le nombre de participants
- `montant_verse` : nombre positif
- `mode_versement` : optionnel, parmi `VIREMENT | ESPECES | MOBILE_MONEY | CHEQUE`
- `reference_externe` : optionnel, max 256 caractères
- `date_versement` : optionnel, date ISO (défaut : maintenant)

**Règles métier :**
- Un seul versement par tour (unicité vérifiée)
- Le bénéficiaire est déterminé automatiquement par l'ordre des participants
- Notifications envoyées au bénéficiaire et à tous les membres actifs

**Réponse 201 :**
```json
{
  "ok": true,
  "versement": { "id_versement": "...", "numero_tour": 3, "montant_verse": 150000, ... },
  "pot_tour": { "potCollecte": 148000, "totalPenalites": 2000, "potTotal": 150000, "nombreCotisations": 5 }
}
```

---

### `GET /api/groups/:groupId/cycles/:cycleId/distributions`

Récupère l'historique des versements d'un cycle. **Membres actifs du groupe.**

**Réponse 200 :**
```json
{
  "ok": true,
  "versements": [
    {
      "id_versement": "...",
      "numero_tour": 1,
      "montant_verse": "150000",
      "date_versement": "2026-05-15T10:00:00Z",
      "mode_versement": "VIREMENT",
      "reference_externe": null,
      "beneficiaire": { "user": { "nom": "Dupont", "prenom": "Alice" } },
      "valideur": { "user": { "nom": "Admin", "prenom": "Jean" } }
    }
  ]
}
```

---

## Logique métier (`lib/cycle-distributions.ts`)

| Fonction | Description |
|---|---|
| `calculerPotTour(cycleId, numeroTour)` | Calcule le pot collecté (cotisations + pénalités) pour un tour |
| `getBeneficiaireTour(cycleId, numeroTour)` | Retourne le bénéficiaire selon l'ordre des participants |
| `versementExistePourTour(cycleId, numeroTour)` | Vérifie si un versement existe déjà pour ce tour |
| `getVersementsCycle(cycleId)` | Historique complet des versements d'un cycle |
| `getTresorerieCycle(cycleId)` | Calcule collecté / distribué / solde disponible |

---

## Composants UI

### `DistributionForm` (`components/groups/distribution-form.tsx`)
- Formulaire admin pour verser le pot d'un tour
- Sélection du tour (tours déjà soldés désactivés)
- Montant pré-rempli avec le pot réel collecté
- Champs : mode de versement, référence externe, date

### `DistributionHistory` (`components/groups/distribution-history.tsx`)
- Tableau récapitulatif de tous les tours (soldés / en attente)
- Résumé trésorerie : total distribué, tours soldés, progression
- Visible uniquement pour les admins

---

## Intégration page cycle

La page `/dashboard/groups/[groupId]/cycles/[cycleId]` affiche désormais (admin uniquement) :

1. **Bloc trésorerie** : total collecté, total distribué, solde disponible
2. **Formulaire de distribution** : verser le pot au bénéficiaire
3. **Historique des versements** : tableau tour par tour avec statuts

---

## Notifications

- **Bénéficiaire** : reçoit une notification personnalisée avec le montant et le tour
- **Tous les membres actifs** : notifiés que le tour a été soldé

---

## Migration SQL

Fichier : `supabase/migrations/20260529185000_add_versements_table.sql`

- Crée l'enum `ModeVersement`
- Crée la table `versements` avec clés étrangères vers `cycles_tontine` et `membres_groupe`
- Ajoute les index sur `id_cycle` et `id_beneficiaire`
