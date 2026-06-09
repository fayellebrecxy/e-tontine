# Diagrammes UML actualises - E-Tontine

Date de mise a jour : 08 juin 2026

Ces diagrammes sont alignes sur l'application actuelle : Next.js, Supabase Auth, Prisma/PostgreSQL, groupes, cycles, cotisations, penalites, distributions, rubriques, reunions, epargne, notifications et rapports.

## 1. Cas d'utilisation global

```mermaid
flowchart LR
  Visiteur([Utilisateur non authentifie])
  Membre([Membre])
  Admin([Administrateur de groupe])
  Supabase[[Supabase Auth]]
  Systeme((E-Tontine))

  Visiteur --> UC1[S'inscrire]
  Visiteur --> UC2[Se connecter]
  Visiteur --> UC3[Reinitialiser mot de passe]
  Visiteur --> UC4[Ouvrir une invitation]

  Membre --> UC5[Consulter ses groupes]
  Membre --> UC6[Consulter cycles et cotisations]
  Membre --> UC7[Consulter rubriques]
  Membre --> UC8[Consulter reunions]
  Membre --> UC9[Signaler une absence]
  Membre --> UC10[Consulter epargne]
  Membre --> UC11[Signaler mouvement epargne]
  Membre --> UC12[Lire notifications]
  Membre --> UC13[Telecharger releve PDF]

  Admin --> UC14[Creer et configurer groupe]
  Admin --> UC15[Gerer invitations]
  Admin --> UC16[Gerer membres et roles]
  Admin --> UC17[Gerer cycles]
  Admin --> UC18[Enregistrer cotisations]
  Admin --> UC19[Verser le pot]
  Admin --> UC20[Gerer rubriques]
  Admin --> UC21[Gerer reunions et amendes]
  Admin --> UC22[Gerer epargne]
  Admin --> UC23[Consulter finances]
  Admin --> UC24[Exporter rapports]

  UC1 --> Supabase
  UC2 --> Supabase
  UC3 --> Supabase
  UC5 --> Systeme
  UC24 --> Systeme
```

## 2. Cas d'utilisation - Administrateur

```mermaid
flowchart TB
  Admin([Administrateur])
  G1[Creer groupe]
  G2[Modifier parametres]
  I1[Generer invitation]
  I2[Revoquer invitation]
  M1[Attribuer role]
  M2[Exclure membre]
  M3[Valider reintegration]
  C1[Creer cycle]
  C2[Modifier ordre de passage]
  C3[Enregistrer cotisation]
  C4[Appliquer ou collecter penalite]
  C5[Verser pot au beneficiaire]
  R1[Gerer rubriques]
  RE1[Planifier reunion]
  RE2[Enregistrer presences]
  RE3[Encaisser amendes]
  E1[Ouvrir compte epargne]
  E2[Enregistrer depot ou retrait]
  F1[Consulter journal financier]
  F2[Exporter rapport PDF/Excel]

  Admin --> G1 --> G2
  Admin --> I1 --> I2
  Admin --> M1
  Admin --> M2
  Admin --> M3
  Admin --> C1 --> C2 --> C3 --> C4 --> C5
  Admin --> R1
  Admin --> RE1 --> RE2 --> RE3
  Admin --> E1 --> E2
  Admin --> F1 --> F2
```

## 3. Cas d'utilisation - Membre

```mermaid
flowchart TB
  Membre([Membre])
  P1[Modifier profil]
  G1[Voir groupes]
  C1[Voir cycles participants]
  C2[Voir ordre de passage]
  C3[Voir cotisations et penalites]
  C4[Demander echange de tour]
  R1[Voir rubriques dues]
  R2[Payer rubrique via admin]
  RE1[Voir reunions]
  RE2[Signaler absence]
  E1[Voir compte epargne]
  E2[Signaler mouvement suspect]
  N1[Lire notifications]
  H1[Masquer historique affiche]
  PDF[Telecharger releve]

  Membre --> P1
  Membre --> G1
  Membre --> C1 --> C2
  Membre --> C3
  Membre --> C4
  Membre --> R1 --> R2
  Membre --> RE1 --> RE2
  Membre --> E1 --> E2
  Membre --> N1
  Membre --> H1
  Membre --> PDF
```

## 4. Activite - Authentification

```mermaid
flowchart TD
  A([Debut]) --> B{Utilisateur possede un compte ?}
  B -- Non --> C[Saisir nom, prenom, telephone, email, mot de passe]
  C --> D[Valider donnees]
  D --> E[Creer compte Supabase]
  E --> F[Creer profil users via Prisma]
  B -- Oui --> G[Saisir email et mot de passe]
  G --> H[Verification Supabase Auth]
  H --> I{Identifiants valides ?}
  I -- Non --> J[Afficher erreur]
  J --> G
  I -- Oui --> K[Creer session serveur]
  F --> K
  K --> L[Rediriger vers dashboard]
  L --> M([Fin])
```

## 5. Activite - Gestion d'un cycle

```mermaid
flowchart TD
  A([Debut]) --> B[Admin cree un cycle]
  B --> C[Choisit membres actifs participants]
  C --> D[Definit montant, duree, penalites]
  D --> E[Definit ou tire ordre beneficiaires]
  E --> F[Cycle publie aux membres]
  F --> G{Tour actif}
  G --> H[Admin enregistre cotisations]
  H --> I{Retard ou penalite ?}
  I -- Oui --> J[Calculer et enregistrer penalite]
  I -- Non --> K[Mettre a jour solde cycle]
  J --> K
  K --> L{Pot complet ou decision admin ?}
  L -- Non --> G
  L -- Oui --> M[Verser pot au beneficiaire]
  M --> N{Tous les tours servis ?}
  N -- Non --> G
  N -- Oui --> O[Cycle termine ou relance]
  O --> P([Fin])
```

## 6. Sequence - S'authentifier

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant UI as Interface Next.js
  participant Auth as Supabase Auth
  participant DB as PostgreSQL via Prisma

  U->>UI: Saisit email et mot de passe
  UI->>Auth: signInWithPassword()
  alt Identifiants invalides
    Auth-->>UI: Erreur
    UI-->>U: Message d'erreur
  else Identifiants valides
    Auth-->>UI: Session + user.id
    UI->>DB: Charger profil users
    DB-->>UI: Profil utilisateur
    UI-->>U: Redirection dashboard
  end
```

## 7. Sequence - Rejoindre un groupe par invitation

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant Page as Page invitation
  participant API as POST /api/invitations/:code/join
  participant Auth as Supabase Auth
  participant DB as Prisma/PostgreSQL
  participant N as Notifications

  U->>Page: Ouvre le lien d'invitation
  Page->>API: Envoyer profil + code
  API->>Auth: getUser()
  Auth-->>API: user.id
  API->>DB: Chercher invitation ou groupe.lien_invitation
  API->>DB: Upsert users
  API->>DB: Chercher membership existant
  alt Deja actif
    API-->>Page: deja membre
  else Ancien membre inactif
    API->>DB: statut_adhesion = EN_ATTENTE
    API->>N: Notifier admins
    API-->>Page: demande en attente
  else Nouveau membre
    API->>DB: Creer MembreGroupe role MEMBRE
    API->>N: Notifier membre et admins
    API-->>Page: Adhesion confirmee
  end
```

## 8. Sequence - Enregistrer une cotisation

```mermaid
sequenceDiagram
  actor A as Administrateur
  participant UI as Page cycle
  participant API as POST /cycles/:cycleId/payments
  participant DB as Prisma/PostgreSQL
  participant J as Journal financier
  participant N as Notifications

  A->>UI: Saisit membre, montant, date
  UI->>API: Enregistrer cotisation
  API->>DB: Verifier admin actif du groupe
  API->>DB: Verifier cycle, participant et tour actif
  API->>DB: Calculer reste a payer
  alt Paiement en retard
    API->>DB: Calculer penalite selon mode
    API->>DB: Creer/mettre a jour Cotisation + Penalite
    API->>J: Entree caisse cycle + caisse penalites
  else Paiement normal
    API->>DB: Creer Cotisation
    API->>J: Entree caisse cycle
  end
  API->>DB: Recalculer statut visuel membre
  API->>N: Notifier le membre
  API-->>UI: Cotisation enregistree
```

## 9. Sequence - Verser le pot au beneficiaire

```mermaid
sequenceDiagram
  actor A as Administrateur
  participant UI as Formulaire distribution
  participant API as POST /cycles/:cycleId/distributions
  participant DB as Prisma/PostgreSQL
  participant J as Journal financier
  participant N as Notifications

  A->>UI: Selectionne tour et mode de versement
  UI->>API: Demande de versement du pot
  API->>DB: Verifier admin actif
  API->>DB: Identifier beneficiaire du tour
  API->>DB: Calculer pot collecte et penalites
  API->>DB: Verifier absence de versement deja existant
  API->>DB: Creer Versement
  API->>J: Sortie caisse cycle
  API->>N: Notifier beneficiaire et membres actifs
  API-->>UI: Versement valide
```

## 10. Sequence - Gerer une reunion et les amendes

```mermaid
sequenceDiagram
  actor A as Administrateur
  actor M as Membre
  participant API as API Reunions
  participant DB as Prisma/PostgreSQL
  participant J as Journal financier
  participant N as Notifications

  A->>API: Creer reunion avec date et amende
  API->>DB: Creer Reunion
  API->>N: Notifier membres actifs
  M->>API: Signaler absence avant la reunion
  API->>DB: Upsert PresenceReunion = DEMANDE_EXCUSE
  API->>N: Notifier admins
  A->>API: Enregistrer presences apres reunion
  API->>DB: Upsert presences et cloturer reunion
  alt Absent ou en retard avec amende
    A->>API: Marquer amende payee
    API->>DB: amende_payee = true
    API->>J: Entree caisse amendes reunion
  end
  API->>N: Notifier les membres concernes
```

## 11. Sequence - Operation d'epargne

```mermaid
sequenceDiagram
  actor A as Administrateur
  actor M as Membre
  participant UI as Module epargne
  participant API as API Epargne
  participant DB as Prisma/PostgreSQL
  participant N as Notifications

  A->>UI: Ouvre ou consulte un compte epargne
  UI->>API: Depot ou retrait
  API->>DB: Verifier admin actif et compte actif
  API->>DB: Calculer solde avant/apres
  alt Solde insuffisant pour retrait
    API-->>UI: Erreur
  else Operation valide
    API->>DB: Creer MouvementEpargne
    API->>DB: Mettre a jour CompteEpargne.solde_actuel
    API->>N: Notifier membre
    API-->>UI: Operation enregistree
  end
  M->>API: Signaler mouvement suspect
  API->>DB: Creer SignalementEpargne
```

## 12. Diagramme de classes simplifie

```mermaid
classDiagram
  class User {
    uuid id_user
    string nom
    string prenom
    string email
    string telephone
  }

  class Groupes {
    uuid id_groupe
    string nom
    string devise
    string lien_invitation
  }

  class MembreGroupe {
    uuid id_membre_groupe
    RoleGroupe role
    StatutAdhesion statut_adhesion
    StatutVisuel statut_visuel
  }

  class InvitationGroupe {
    uuid id_invitation
    string code
    datetime date_revocation
  }

  class CycleTontine {
    uuid id_cycle
    string nom_cycle
    decimal montant_cotisation
    int duree_tour_de_gain
    ModePenalite mode_penalite
  }

  class CycleParticipant {
    uuid id_cycle_participant
    int ordre
  }

  class Cotisations {
    uuid id_cotisation
    decimal montant
    int numero_tour
    bool penalite_appliquee
  }

  class Penalite {
    uuid id_penalite
    decimal montant_final
    string motif
  }

  class Versement {
    uuid id_versement
    int numero_tour
    decimal montant_verse
  }

  class RubriqueCotisation {
    uuid id_rubrique
    string nom
    decimal montant_fixe
    TypeRubriqueCotisation type_rubrique
  }

  class PaiementRubrique {
    uuid id_paiement
    decimal montant_paye
  }

  class Reunion {
    uuid id_reunion
    string titre
    StatutReunion statut
    decimal montant_amende
  }

  class PresenceReunion {
    uuid id_presence
    StatutPresence statut_presence
    bool amende_payee
  }

  class CompteEpargne {
    uuid id_compte
    string numero_compte
    decimal solde_actuel
    StatutCompteEpargne statut
  }

  class MouvementFinancier {
    uuid id_mouvement
    TypeMouvementFinancier type_mouvement
    SourceMouvementFinancier source
    decimal montant
    decimal solde_avant
    decimal solde_apres
  }

  class NotificationGroupe {
    uuid id_notification
    string type_notification
    string message
  }

  User "1" --> "0..*" MembreGroupe
  Groupes "1" --> "0..*" MembreGroupe
  Groupes "1" --> "0..*" InvitationGroupe
  Groupes "1" --> "0..*" CycleTontine
  CycleTontine "1" --> "1..*" CycleParticipant
  MembreGroupe "1" --> "0..*" CycleParticipant
  CycleTontine "1" --> "0..*" Cotisations
  MembreGroupe "1" --> "0..*" Cotisations
  Cotisations "1" --> "0..*" Penalite
  CycleTontine "1" --> "0..*" Versement
  MembreGroupe "1" --> "0..*" Versement : beneficiaire
  Groupes "1" --> "0..*" RubriqueCotisation
  RubriqueCotisation "1" --> "0..*" PaiementRubrique
  MembreGroupe "1" --> "0..*" PaiementRubrique
  Groupes "1" --> "0..*" Reunion
  Reunion "1" --> "0..*" PresenceReunion
  MembreGroupe "1" --> "0..*" PresenceReunion
  MembreGroupe "1" --> "0..1" CompteEpargne
  Groupes "1" --> "0..*" MouvementFinancier
  User "1" --> "0..*" NotificationGroupe
```

## 13. MCD simplifie

```mermaid
erDiagram
  USERS ||--o{ MEMBRES_GROUPE : possede
  GROUPES ||--o{ MEMBRES_GROUPE : contient
  GROUPES ||--o{ INVITATIONS_GROUPE : genere
  GROUPES ||--o{ CYCLES_TONTINE : organise
  CYCLES_TONTINE ||--o{ CYCLES_PARTICIPANTS : contient
  MEMBRES_GROUPE ||--o{ CYCLES_PARTICIPANTS : participe
  CYCLES_TONTINE ||--o{ COTISATIONS : recoit
  MEMBRES_GROUPE ||--o{ COTISATIONS : paie
  COTISATIONS ||--o{ PENALITES : genere
  CYCLES_TONTINE ||--o{ VERSEMENTS : distribue
  MEMBRES_GROUPE ||--o{ VERSEMENTS : beneficie
  GROUPES ||--o{ RUBRIQUES_COTISATION : definit
  RUBRIQUES_COTISATION ||--o{ PAIEMENTS_RUBRIQUE : encaisse
  MEMBRES_GROUPE ||--o{ PAIEMENTS_RUBRIQUE : paie
  GROUPES ||--o{ REUNIONS : planifie
  REUNIONS ||--o{ PRESENCES_REUNION : suit
  MEMBRES_GROUPE ||--o{ PRESENCES_REUNION : participe
  MEMBRES_GROUPE ||--o| COMPTES_EPARGNE : detient
  COMPTES_EPARGNE ||--o{ MOUVEMENTS_EPARGNE : historise
  GROUPES ||--o{ CAISSES_FINANCIERES : possede
  CAISSES_FINANCIERES ||--o{ MOUVEMENTS_FINANCIERS : journalise
  USERS ||--o{ NOTIFICATIONS_GROUPE : recoit
```

## 14. Architecture applicative

```mermaid
flowchart TB
  Browser[Navigateur web]
  UI[Pages et composants React]
  Actions[Server Actions]
  API[API Routes Next.js]
  Services[Services metier]
  Prisma[Prisma Client]
  DB[(Supabase PostgreSQL)]
  Auth[Supabase Auth]
  PDF[Generation PDF]
  XLSX[Generation Excel]

  Browser --> UI
  UI --> Actions
  UI --> API
  Actions --> Services
  API --> Services
  Actions --> Auth
  API --> Auth
  Services --> Prisma
  Prisma --> DB
  Services --> PDF
  Services --> XLSX
```

## 15. Diagramme de deploiement

```mermaid
flowchart LR
  Dev[Developpeur / VS Code]
  Git[GitHub]
  Vercel[Vercel - Application Next.js]
  SupabaseAuth[Supabase Auth]
  SupabaseDB[(Supabase PostgreSQL)]
  User[Utilisateur web]
  Email[SMTP Gmail / Nodemailer]

  Dev --> Git
  Git --> Vercel
  User --> Vercel
  Vercel --> SupabaseAuth
  Vercel --> SupabaseDB
  Vercel --> Email
```

