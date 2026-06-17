import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../Docs/cahier-des-charges-E-TONTINE.docx");

const DATE = "17 juin 2026";

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } });
}
function h3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 22, bold: opts.bold })],
  });
}
function bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}
function bullet2(text) {
  return new Paragraph({
    text,
    bullet: { level: 1 },
    spacing: { after: 60 },
  });
}

function table(headers, rows) {
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
          shading: { fill: "E5EEFF" },
        }),
    ),
  });
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
            }),
        ),
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [headerRow, ...dataRows],
  });
}

const children = [
  // Page de garde
  new Paragraph({ spacing: { before: 2000 } }),
  p("CAHIER DES CHARGES", { center: true, bold: true }),
  p("Application Web E-TONTINE", { center: true, bold: true }),
  p("Gestion numérique des tontines communautaires", { center: true }),
  p(`Version 1.0 — ${DATE}`, { center: true }),
  new Paragraph({ pageBreakBefore: true }),

  // I. INTRODUCTION
  h1("I. Introduction"),
  h2("1.1 Contexte"),
  p(
    "La tontine est un mécanisme d'épargne collective profondément ancré dans les pratiques financières informelles au Cameroun et en Afrique subsaharienne. Des millions de personnes — associations de quartier, groupes de femmes, tontines professionnelles, coopératives ou diaspora — cotisent régulièrement pour constituer un pot commun, puis reçoivent à tour de rôle la somme collectée ou s'entraident en cas de besoin.",
  ),
  p(
    "Dans sa forme traditionnelle, la gestion de ces groupes repose sur des registres papier, des carnets personnels, des calculs manuels et des échanges informels (WhatsApp, appels téléphoniques, réunions physiques). Ce mode de fonctionnement, bien qu'efficace sur le plan social, expose les groupes à des erreurs de calcul, des oublis de paiement, des conflits entre membres, des pertes de transparence et parfois des détournements de fonds.",
  ),
  p(
    "Face à une faible inclusion bancaire et à l'inadaptation des outils généralistes (Excel, messageries instantanées), il devient nécessaire de proposer une solution numérique dédiée, simple et accessible depuis un navigateur web, capable de digitaliser l'ensemble du cycle de vie d'une tontine tout en respectant la flexibilité des règles locales de chaque association.",
  ),
  p(
    "E-Tontine est une application web conçue pour répondre à ce besoin. Elle centralise la gestion des membres, des cycles de cotisation, des pénalités, des distributions du pot, des rubriques financières, des réunions, de l'épargne individuelle, des prêts internes et des rapports, dans un environnement transparent, traçable et sécurisé.",
  ),

  h2("1.2 Problématique"),
  p(
    "Comment concevoir et développer une application web permettant aux groupes de tontine de gérer leurs membres, cycles, cotisations, pénalités, distributions, réunions, rubriques, épargne, prêts internes et historiques financiers, tout en garantissant la transparence, la traçabilité et un accès adapté aux rôles de chaque utilisateur ?",
  ),

  h2("1.3 Objectifs du projet"),
  h3("Objectif général"),
  p(
    "Développer une application web de gestion de tontines communautaires permettant aux administrateurs et aux membres de suivre les activités financières et organisationnelles d'un groupe de manière fiable, centralisée et transparente.",
  ),
  h3("Objectifs spécifiques"),
  bullet("Permettre l'inscription, la connexion, la déconnexion, la réinitialisation du mot de passe et la mise à jour du profil utilisateur."),
  bullet("Permettre la création et la configuration de groupes de tontine (nom, description, devise)."),
  bullet("Intégrer les membres par lien d'invitation unique."),
  bullet("Gérer les rôles ADMIN et MEMBRE au sein de chaque groupe."),
  bullet("Gérer l'exclusion, la demande de réintégration et la validation par l'administrateur."),
  bullet("Créer et piloter des cycles de tontine avec participants, ordre de passage, durée des tours et montant de cotisation."),
  bullet("Enregistrer les cotisations et appliquer les pénalités de retard (mode fixe, pourcentage ou progressif)."),
  bullet("Gérer les demandes d'échange de tour entre participants."),
  bullet("Enregistrer les versements du pot aux bénéficiaires et suivre la trésorerie du cycle."),
  bullet("Créer des rubriques de cotisation, suivre les paiements et les retraits."),
  bullet("Planifier les réunions, enregistrer les présences, gérer les excuses et appliquer les amendes."),
  bullet("Ouvrir et administrer des comptes d'épargne individuels par membre."),
  bullet("Permettre les demandes de prêts internes avec avalistes, analyse administrative et décaissement depuis la banque du groupe."),
  bullet("Centraliser les mouvements financiers dans un journal et des caisses dédiées."),
  bullet("Envoyer des notifications internes aux membres concernés."),
  bullet("Générer des relevés PDF individuels et des rapports groupe PDF/Excel."),

  h2("1.4 Portée du projet"),
  p(
    "Le présent cahier des charges couvre la conception, le développement et le déploiement de l'application E-Tontine en version web responsive. Sont inclus : l'authentification, la gestion multi-groupes, les modules métier (cycles, rubriques, réunions, épargne, prêts, finances, notifications, rapports) et le déploiement sur infrastructure cloud.",
  ),
  p(
    "Hors périmètre : l'intégration directe aux API Mobile Money (Orange Money, MTN MoMo), la certification bancaire ou microfinancière, les applications mobiles natives (iOS/Android) et la gestion comptable légale externalisée.",
  ),

  h2("1.5 Public cible"),
  bullet("Administrateurs de tontines et présidents d'associations."),
  bullet("Trésoriers et secrétaires de groupes communautaires."),
  bullet("Membres cotisants souhaitant suivre leur situation en temps réel."),
  bullet("Coopératives d'épargne, associations de quartier et groupes professionnels au Cameroun et en Afrique subsaharienne."),

  // II. DÉFINITIONS
  new Paragraph({ pageBreakBefore: true }),
  h1("II. Définitions des concepts"),
  table(
    ["Terme", "Définition"],
    [
      ["Tontine", "Mécanisme d'épargne collective où les membres cotisent régulièrement et reçoivent à tour de rôle la somme collectée (tontine rotative)."],
      ["Groupe", "Espace numérique regroupant les membres d'une tontine ou association, avec ses propres règles, devise et modules activés."],
      ["Membre", "Utilisateur inscrit appartenant à un groupe avec un rôle (ADMIN ou MEMBRE) et un statut d'adhésion (ACTIF, INACTIF, EN_ATTENTE)."],
      ["Cycle", "Période structurée de cotisation avec date de début/fin, durée de tour, montant de cotisation, participants et ordre des bénéficiaires."],
      ["Tour de gain", "Période au cours de laquelle tous les membres cotisent et un bénéficiaire désigné reçoit le pot collecté."],
      ["Cotisation", "Versement périodique d'un membre pour un tour donné d'un cycle."],
      ["Pénalité", "Sanction financière appliquée en cas de retard de paiement d'une cotisation (montant fixe, pourcentage ou progressif)."],
      ["Distribution / Versement", "Sortie d'argent du pot commun vers le bénéficiaire d'un tour (virement, espèces, Mobile Money, chèque)."],
      ["Rubrique", "Catégorie de cotisation complémentaire (ponctuelle ou récurrente) pour des projets, événements ou fonds spécifiques."],
      ["Réunion", "Rencontre planifiée du groupe avec suivi des présences, absences et amendes éventuelles."],
      ["Statut visuel", "Indicateur de discipline financière d'un membre : VERT (à jour) ou ROUGE (retard ou pénalité en attente)."],
      ["Compte épargne", "Compte individuel d'un membre au sein du groupe, alimenté par des dépôts et utilisé pour les prêts internes."],
      ["Banque du groupe", "Agrégation des soldes d'épargne des membres, servant de réserve pour les prêts internes."],
      ["Prêt interne", "Crédit accordé par l'administrateur à un membre, prélevé sur la banque du groupe, avec intérêts et avalistes."],
      ["Avaliste", "Membre garant qui s'engage à couvrir le remboursement en cas de défaut de l'emprunteur."],
      ["Notification", "Message in-app informant un utilisateur d'un événement (paiement, versement, réunion, prêt, etc.)."],
      ["Journal financier", "Historique centralisé de toutes les entrées et sorties d'argent du groupe."],
    ],
  ),

  // III. ACTEURS
  new Paragraph({ pageBreakBefore: true }),
  h1("III. Acteurs (Bénéficiaires et utilisateurs)"),
  h2("3.1 Bénéficiaires du projet"),
  bullet("Les groupes de tontine et associations communautaires cherchant à professionnaliser leur gestion."),
  bullet("Les membres cotisants gagnant en transparence et en confiance dans les opérations du groupe."),
  bullet("Les administrateurs et trésoriers disposant d'outils de pilotage et de reporting fiables."),
  bullet("Les emprunteurs membres accédant à un microcrédit interne encadré par le groupe."),
  bullet("La société camerounaise, via la pérennisation d'un mécanisme d'épargne solidaire mieux structuré."),

  h2("3.2 Utilisateurs du système"),
  h3("Utilisateur non authentifié (Visiteur)"),
  bullet("Consulte la page d'accueil publique."),
  bullet("Crée un compte utilisateur."),
  bullet("Se connecte à l'application."),
  bullet("Demande une réinitialisation de mot de passe."),
  bullet("Ouvre un lien d'invitation pour rejoindre un groupe."),

  h3("Membre de groupe"),
  bullet("Consulte ses groupes et le tableau de bord personnel."),
  bullet("Consulte les cycles auxquels il participe, son ordre de passage, ses cotisations et pénalités."),
  bullet("Consulte les rubriques qui le concernent et les réunions planifiées."),
  bullet("Signale une absence avant une réunion."),
  bullet("Consulte son compte d'épargne et peut signaler un mouvement suspect."),
  bullet("Soumet une demande de prêt, propose ou accepte d'être avaliste."),
  bullet("Demande un échange de tour avec un autre participant."),
  bullet("Télécharge son relevé PDF individuel."),
  bullet("Lit et gère ses notifications."),

  h3("Administrateur de groupe"),
  bullet("Crée, modifie et supprime un groupe."),
  bullet("Génère, consulte, révoque et partage les invitations."),
  bullet("Gère les membres, les rôles, les exclusions et les réintégrations."),
  bullet("Crée, modifie, relance et clôture les cycles de tontine."),
  bullet("Définit l'ordre de passage et valide les échanges de tour."),
  bullet("Enregistre les cotisations, pénalités et versements du pot."),
  bullet("Gère les rubriques, paiements et retraits associés."),
  bullet("Planifie les réunions, enregistre les présences et encaisse les amendes."),
  bullet("Ouvre et administre les comptes d'épargne (dépôts, retraits, clôture)."),
  bullet("Analyse, approuve, refuse, décaisse et suit les prêts internes."),
  bullet("Configure les paramètres de prêt du groupe."),
  bullet("Consulte le journal financier et exporte les rapports PDF/Excel."),

  h3("Système (acteur technique)"),
  bullet("Calcule automatiquement les statuts visuels des membres."),
  bullet("Envoie les notifications lors des événements métier."),
  bullet("Applique les règles d'éligibilité aux prêts."),
  bullet("Journalise les mouvements financiers dans les caisses dédiées."),

  // IV. BESOINS FONCTIONNELS
  new Paragraph({ pageBreakBefore: true }),
  h1("IV. Besoins Fonctionnels"),
  h2("4.1 Module Authentification et profil"),
  bullet("BF-01 : Création de compte avec nom, prénom, téléphone, email et mot de passe."),
  bullet("BF-02 : Connexion par email et mot de passe via Supabase Auth."),
  bullet("BF-03 : Gestion des sessions serveur (cookies SSR)."),
  bullet("BF-04 : Réinitialisation et mise à jour du mot de passe."),
  bullet("BF-05 : Modification du profil (nom, prénom, téléphone, photo de profil)."),
  bullet("BF-06 : Déconnexion sécurisée."),

  h2("4.2 Module Groupes, membres et invitations"),
  bullet("BF-07 : Création d'un groupe avec nom, description et devise (défaut : XAF/FCFA)."),
  bullet("BF-08 : Attribution automatique du rôle ADMIN au créateur."),
  bullet("BF-09 : Génération d'un code/lien d'invitation unique."),
  bullet("BF-10 : Adhésion par lien d'invitation (nouveau ou membre existant)."),
  bullet("BF-11 : Liste des membres avec rôle, statut d'adhésion et statut visuel."),
  bullet("BF-12 : Changement de rôle par un administrateur (protection du dernier admin)."),
  bullet("BF-13 : Exclusion d'un membre (statut INACTIF + date de départ)."),
  bullet("BF-14 : Demande et validation de réintégration (statut EN_ATTENTE)."),
  bullet("BF-15 : Modification et suppression d'un groupe par l'administrateur."),

  h2("4.3 Module Cycles de tontine"),
  bullet("BF-16 : Création d'un cycle (nom, dates, durée de tour, montant, participants)."),
  bullet("BF-17 : Définition manuelle ou par tirage au sort de l'ordre des bénéficiaires."),
  bullet("BF-18 : Consultation de l'ordre de passage par tous les membres actifs."),
  bullet("BF-19 : Modification de l'ordre par l'administrateur."),
  bullet("BF-20 : Demande d'échange de tour entre membres avec validation administrative."),
  bullet("BF-21 : Enregistrement des cotisations par tour actif."),
  bullet("BF-22 : Calcul du reste à payer par membre et par tour."),
  bullet("BF-23 : Application automatique ou manuelle des pénalités de retard."),
  bullet("BF-24 : Collecte des pénalités et retrait depuis la caisse des pénalités."),
  bullet("BF-25 : Versement du pot au bénéficiaire du tour (modes : virement, espèces, Mobile Money, chèque)."),
  bullet("BF-26 : Suivi de la trésorerie du cycle (collecte, pénalités, distributions, solde)."),
  bullet("BF-27 : Relance ou clôture d'un cycle."),

  h2("4.4 Module Rubriques de cotisation"),
  bullet("BF-28 : Création de rubriques (montant fixe, fréquence, durée, membres concernés)."),
  bullet("BF-29 : Paiement d'une rubrique par membre ou par l'administrateur."),
  bullet("BF-30 : Retrait depuis une rubrique avec validation administrative."),
  bullet("BF-31 : Relance d'une rubrique expirée et notifications d'échéance."),

  h2("4.5 Module Réunions et amendes"),
  bullet("BF-32 : Création, modification, annulation et suppression de réunion."),
  bullet("BF-33 : Définition du type, lieu, date, ordre du jour et montant d'amende."),
  bullet("BF-34 : Signalement d'absence par le membre avant la réunion."),
  bullet("BF-35 : Enregistrement des présences (présent, absent, excusé, en retard)."),
  bullet("BF-36 : Clôture de la réunion et encaissement des amendes."),
  bullet("BF-37 : Retrait depuis la caisse des amendes et consultation du compte rendu."),

  h2("4.6 Module Épargne"),
  bullet("BF-38 : Ouverture d'un compte d'épargne par membre (numéro unique)."),
  bullet("BF-39 : Dépôt et retrait sur un compte actif par l'administrateur."),
  bullet("BF-40 : Consultation des mouvements d'épargne par le membre."),
  bullet("BF-41 : Signalement d'un mouvement suspect par un membre."),
  bullet("BF-42 : Audit des comptes et mouvements (vue administrateur)."),
  bullet("BF-43 : Blocage ou clôture d'un compte épargne."),

  h2("4.7 Module Prêts internes"),
  bullet("BF-44 : Configuration des paramètres de prêt (ancienneté minimale, plafond % banque, modèle de contrat avaliste)."),
  bullet("BF-45 : Vérification automatique de l'éligibilité (ancienneté, solde épargne, prêt en cours, statut membre)."),
  bullet("BF-46 : Soumission d'une demande de prêt par un membre (montant, durée, motif, avalistes)."),
  bullet("BF-47 : Workflow avalistes : proposition, soumission de contrat, acceptation ou refus."),
  bullet("BF-48 : Analyse administrative : approbation, refus ou annulation avec motif."),
  bullet("BF-49 : Décaissement du prêt depuis la banque du groupe avec répartition proportionnelle."),
  bullet("BF-50 : Suivi du remboursement (capital, intérêts, retards, garanties)."),
  bullet("BF-51 : Redistribution des intérêts collectés aux épargnants."),

  h2("4.8 Module Suivi financier et rapports"),
  bullet("BF-52 : Création automatique de caisses financières (générale, cycle, rubriques, pénalités, amendes, intérêts prêts)."),
  bullet("BF-53 : Journalisation de chaque entrée, sortie ou correction financière."),
  bullet("BF-54 : Consultation des soldes et mouvements financiers."),
  bullet("BF-55 : Export d'un rapport groupe en PDF et Excel."),
  bullet("BF-56 : Génération d'un relevé PDF individuel par membre."),
  bullet("BF-57 : Masquage d'historiques côté utilisateur sans suppression des données."),

  h2("4.9 Module Notifications"),
  bullet("BF-58 : Notification de création/modification de cycle, paiement, pénalité, versement du pot."),
  bullet("BF-59 : Notification d'invitation, demande de réintégration et changement de rôle."),
  bullet("BF-60 : Notification de réunion, présence, absence, amende et rappel de rubrique."),
  bullet("BF-61 : Notification liée à l'épargne et aux prêts (demande, approbation, décaissement, retard)."),
  bullet("BF-62 : Lecture, suppression unitaire et suppression globale des notifications."),

  // V. BESOINS NON-FONCTIONNELS
  new Paragraph({ pageBreakBefore: true }),
  h1("V. Besoins Non-Fonctionnels et Exigences"),
  h2("5.1 Sécurité"),
  bullet("BNF-01 : Les mots de passe sont gérés par Supabase Auth et ne sont pas stockés en clair dans la base métier."),
  bullet("BNF-02 : Les routes sensibles vérifient l'utilisateur connecté et son appartenance au groupe."),
  bullet("BNF-03 : Les actions d'administration exigent un membre actif avec rôle ADMIN."),
  bullet("BNF-04 : Les données d'un groupe ne sont accessibles qu'aux membres autorisés."),
  bullet("BNF-05 : L'autorisation ne repose jamais sur user_metadata Supabase (modifiable par l'utilisateur)."),
  bullet("BNF-06 : Les variables sensibles (clés API, URLs base de données) sont stockées dans des fichiers d'environnement."),

  h2("5.2 Performance"),
  bullet("BNF-07 : Les opérations courantes (tableau de bord, enregistrement de paiement, liste des membres) doivent répondre en moins de 3 secondes."),
  bullet("BNF-08 : Les requêtes Prisma utilisent des sélections ciblées (select) pour limiter le sur-fetching."),
  bullet("BNF-09 : Les exports PDF/Excel sont générés à la demande, pas en temps réel continu."),

  h2("5.3 Accessibilité et ergonomie"),
  bullet("BNF-10 : Interface responsive (ordinateur, tablette, smartphone)."),
  bullet("BNF-11 : Interface en français (support anglais prévu via i18n)."),
  bullet("BNF-12 : Navigation séparée entre vue publique, authentification, tableau de bord et modules internes."),
  bullet("BNF-13 : Feedback visuel par statut (vert/rouge) pour la discipline des membres."),
  bullet("BNF-14 : Montants affichés en FCFA/XAF avec formatage localisé."),

  h2("5.4 Maintenabilité"),
  bullet("BNF-15 : Architecture Next.js App Router avec composants React, API Routes et Server Actions."),
  bullet("BNF-16 : Validation des entrées avec Zod (lib/validations.ts)."),
  bullet("BNF-17 : Séparation des services métier (lib/pret.ts, lib/epargne.ts, lib/notifications.ts, etc.)."),
  bullet("BNF-18 : Schéma relationnel centralisé dans prisma/schema.prisma."),
  bullet("BNF-19 : Documentation fonctionnelle maintenue dans le dossier Docs/."),

  h2("5.5 Disponibilité et déploiement"),
  bullet("BNF-20 : Application déployable sur Vercel (hébergement cloud)."),
  bullet("BNF-21 : Base de données PostgreSQL hébergée sur Supabase."),
  bullet("BNF-22 : Authentification gérée par Supabase Auth."),
  bullet("BNF-23 : Objectif de disponibilité : 99 % en production (hors maintenance planifiée)."),

  h2("5.6 Exigences techniques"),
  table(
    ["Exigence", "Spécification"],
    [
      ["Framework frontend/backend", "Next.js 15+ (App Router)"],
      ["Langage", "TypeScript"],
      ["Base de données", "PostgreSQL via Prisma ORM"],
      ["Authentification", "Supabase Auth (SSR, cookies)"],
      ["UI", "Tailwind CSS + shadcn/ui"],
      ["Validation", "Zod"],
      ["Génération PDF", "React-PDF"],
      ["Export Excel", "Bibliothèque XLSX"],
      ["Email", "Nodemailer (SMTP Gmail)"],
      ["Devise par défaut", "XAF (FCFA)"],
      ["Node.js", "Version ≥ 20.12.0"],
    ],
  ),

  // VI. ARCHITECTURE
  new Paragraph({ pageBreakBefore: true }),
  h1("VI. Architecture Visée"),
  h2("6.1 Architecture applicative"),
  p(
    "L'application suit une architecture web moderne en trois couches, adaptée au déploiement serverless sur Vercel :",
  ),
  bullet("Couche présentation : pages et composants React (App Router), interface responsive avec Tailwind CSS et shadcn/ui."),
  bullet("Couche applicative : API Routes Next.js (app/api/**/route.ts), Server Actions et services métier (lib/*.ts)."),
  bullet("Couche données : Prisma Client vers PostgreSQL (Supabase), avec schéma relationnel centralisé."),
  bullet("Couche authentification : Supabase Auth (inscription, connexion, reset password) avec sessions SSR par cookies."),

  h2("6.2 Modules applicatifs"),
  table(
    ["Module", "Routes / Pages principales", "Services métier"],
    [
      ["Authentification", "/auth/login, /auth/register", "lib/supabase/server.ts"],
      ["Groupes", "/dashboard/groups", "app/api/groups/"],
      ["Cycles", "/dashboard/groups/[id]/cycles", "lib/cycle-distributions.ts"],
      ["Rubriques", "/dashboard/groups/[id]/rubriques", "lib/rubrique-reminders.ts"],
      ["Réunions", "/dashboard/groups/[id]/reunions", "—"],
      ["Épargne", "/dashboard/groups/[id]/epargne", "lib/epargne.ts"],
      ["Prêts", "/dashboard/groups/[id]/prets", "lib/pret.ts, lib/pret-banque.ts"],
      ["Finances", "/dashboard/groups/[id]/finances", "lib/pdf/"],
      ["Notifications", "/dashboard", "lib/notifications.ts"],
    ],
  ),

  h2("6.3 Modèle de données"),
  p(
    "Le modèle logique de données (MLD) comprend les entités principales : User, Groupes, MembreGroupe, CycleTontine, Cotisations, Penalites, Versement, RubriqueCotisation, Reunion, CompteEpargne, Pret, AvalistePret, NotificationGroupe, CaisseFinanciere, MouvementFinancier. Le schéma Prisma est la source de vérité.",
  ),

  h2("6.4 Architecture de déploiement"),
  bullet("Développement local : Next.js dev server + Supabase local (Docker) + Prisma migrate."),
  bullet("Production : Vercel (application) + Supabase Cloud (Auth + PostgreSQL)."),
  bullet("CI/CD : GitHub Actions (lint, build, tests)."),
  bullet("Variables d'environnement : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, DIRECT_URL."),

  h2("6.5 Ressources"),
  h3("6.5.1 Ressources matérielles"),
  table(
    ["Ressource", "Spécification minimale", "Usage"],
    [
      ["Poste développeur", "PC 8 Go RAM, SSD, connexion Internet", "Développement et tests"],
      ["Serveur cloud (Vercel)", "Plan Hobby/Pro", "Hébergement application"],
      ["Base de données (Supabase)", "Plan Free/Pro PostgreSQL", "Stockage et Auth"],
      ["Poste utilisateur final", "Smartphone ou PC avec navigateur moderne", "Utilisation quotidienne"],
    ],
  ),

  h3("6.5.2 Ressources logicielles"),
  table(
    ["Logiciel", "Version", "Rôle"],
    [
      ["Node.js", "≥ 20.12", "Runtime JavaScript"],
      ["Next.js", "15+", "Framework web"],
      ["Prisma", "6+", "ORM et migrations"],
      ["Supabase CLI", "Dernière", "Auth et BDD locale"],
      ["Docker", "Dernière", "Supabase local"],
      ["Git / GitHub", "—", "Versionnement et CI"],
      ["VS Code / Cursor", "—", "IDE de développement"],
    ],
  ),

  h3("6.5.3 Ressources humaines"),
  table(
    ["Rôle", "Responsabilités"],
    [
      ["Chef de projet / Product Owner", "Pilotage, priorisation, validation fonctionnelle"],
      ["Développeur Full-Stack", "Next.js, Prisma, API, composants UI"],
      ["Designer UI/UX", "Maquettes, design system, ergonomie"],
      ["Testeur / QA", "Tests fonctionnels, recette utilisateur"],
      ["Administrateur système", "Déploiement Vercel, configuration Supabase"],
      ["Utilisateurs pilotes", "Retours terrain (tontines camerounaises)"],
    ],
  ),

  // VII. PLANIFICATION
  new Paragraph({ pageBreakBefore: true }),
  h1("VII. Planification"),
  h2("7.1 Phases du projet"),
  table(
    ["Phase", "Durée estimée", "Livrables"],
    [
      ["Phase 1 — Analyse et conception", "4 semaines", "Cahier des charges, MLD, diagrammes UML, maquettes UI"],
      ["Phase 2 — Socle technique", "3 semaines", "Auth, groupes, invitations, profils, notifications"],
      ["Phase 3 — Cycles et cotisations", "4 semaines", "Cycles, cotisations, pénalités, distributions, statuts visuels"],
      ["Phase 4 — Rubriques et réunions", "3 semaines", "Rubriques, réunions, amendes, caisses dédiées"],
      ["Phase 5 — Épargne et finances", "3 semaines", "Comptes épargne, journal financier, rapports PDF/Excel"],
      ["Phase 6 — Prêts internes", "4 semaines", "Demandes, avalistes, banque groupe, décaissement, remboursements"],
      ["Phase 7 — Tests et déploiement", "3 semaines", "Tests, corrections, déploiement Vercel, documentation"],
      ["Phase 8 — Pilote et itérations", "4 semaines", "Tests terrain, retours utilisateurs, améliorations"],
    ],
  ),
  p("Durée totale estimée : 28 semaines (7 mois)."),

  h2("7.2 Jalons principaux"),
  bullet("J1 : Validation du cahier des charges et du MLD."),
  bullet("J2 : MVP fonctionnel (groupes + cycles + cotisations)."),
  bullet("J3 : Version complète sans prêts (rubriques, réunions, épargne, rapports)."),
  bullet("J4 : Version intégrant le module prêts internes."),
  bullet("J5 : Mise en production et lancement pilote."),
  bullet("J6 : Rapport final et transfert de compétences."),

  h2("7.3 Risques et mesures d'atténuation"),
  table(
    ["Risque", "Impact", "Mesure"],
    [
      ["Faible adoption numérique", "Élevé", "Interface simple, formation, support en français"],
      ["Perte de confiance (données)", "Élevé", "Transparence, relevés PDF, signalements"],
      ["Indisponibilité cloud", "Moyen", "Hébergeur fiable (Vercel/Supabase), sauvegardes"],
      ["Complexité des règles locales", "Moyen", "Paramétrage flexible (pénalités, rubriques, prêts)"],
      ["Sécurité des accès", "Élevé", "Auth Supabase, contrôle par rôle et groupe"],
    ],
  ),

  // VIII. BUDGET
  new Paragraph({ pageBreakBefore: true }),
  h1("VIII. Budget"),
  p(
    "Le budget ci-dessous est une estimation pour le développement et le déploiement de la version 1.0 d'E-Tontine. Les montants sont indicatifs et exprimés en FCFA (XAF).",
  ),
  table(
    ["Poste", "Détail", "Coût estimé (FCFA)"],
    [
      ["Développement", "Développeur full-stack (7 mois)", "3 500 000"],
      ["Design UI/UX", "Maquettes et design system", "500 000"],
      ["Infrastructure cloud", "Vercel Pro + Supabase Pro (12 mois)", "600 000"],
      ["Nom de domaine", "e-tontine.cm ou équivalent (1 an)", "15 000"],
      ["Tests et recette", "Testeur + utilisateurs pilotes", "300 000"],
      ["Documentation", "Rédaction, diagrammes, guides", "200 000"],
      ["Contingence (10 %)", "Imprévus techniques", "515 000"],
      ["TOTAL ESTIMÉ", "", "5 630 000"],
    ],
  ),
  p(
    "Note : Les coûts d'infrastructure peuvent être réduits en phase initiale avec les plans gratuits Vercel Hobby et Supabase Free. Le budget ne inclut pas les frais de certification bancaire, juridique avancée ou marketing commercial.",
  ),

  // IX. (Livrables)
  h1("IX. Livrables"),
  bullet("Application web E-Tontine déployée et accessible en production."),
  bullet("Code source versionné sur GitHub avec CI/CD."),
  bullet("Schéma Prisma et migrations de base de données."),
  bullet("Documentation technique dans Docs/ (API, MLD, diagrammes UML)."),
  bullet("Cahier des charges et manuel utilisateur."),
  bullet("Jeux de tests et rapport de recette."),
  bullet("Relevés et rapports PDF/Excel fonctionnels."),

  // X. CLAUSES JURIDIQUES
  new Paragraph({ pageBreakBefore: true }),
  h1("X. Clauses Juridiques"),
  h2("10.1 Propriété intellectuelle"),
  p(
    "Le code source, la documentation, les maquettes graphiques et l'identité visuelle de l'application E-Tontine sont la propriété des auteurs et porteurs du projet, sauf mention contraire dans un contrat de cession ou de licence.",
  ),

  h2("10.2 Protection des données personnelles"),
  p(
    "L'application collecte des données personnelles (nom, prénom, email, téléphone, photo de profil) et des données financières communautaires. Le responsable du traitement doit respecter la réglementation camerounaise en matière de protection des données personnelles et informer les utilisateurs via une politique de confidentialité.",
  ),
  bullet("Finalité : gestion des tontines et activités associées."),
  bullet("Durée de conservation : tant que le compte utilisateur est actif, puis suppression sur demande."),
  bullet("Droits des utilisateurs : accès, rectification, suppression de leur profil."),
  bullet("Sécurité : hébergement sécurisé, mots de passe gérés par Supabase Auth, accès restreint par groupe."),

  h2("10.3 Responsabilité et limitation"),
  p(
    "E-Tontine est un outil de gestion et de traçabilité. Il ne constitue pas un établissement de crédit, une banque ni une institution de microfinance agréée. Les prêts internes relèvent de la responsabilité du groupe et de ses administrateurs. L'éditeur de l'application ne saurait être tenu responsable des litiges financiers entre membres, des défauts de paiement ou des pertes liées à une mauvaise gouvernance du groupe.",
  ),

  h2("10.4 Conditions d'utilisation"),
  bullet("L'utilisateur doit fournir des informations exactes lors de l'inscription."),
  bullet("L'administrateur de groupe est responsable de la justesse des enregistrements financiers."),
  bullet("Toute utilisation frauduleuse ou abusive du système peut entraîner la suspension du compte."),
  bullet("L'éditeur se réserve le droit de modifier les conditions d'utilisation avec notification aux utilisateurs."),

  h2("10.5 Confidentialité"),
  p(
    "Les données financières d'un groupe ne sont accessibles qu'aux membres autorisés de ce groupe. Aucune donnée ne doit être vendue à des tiers. Les exports PDF/Excel sont sous la responsabilité de l'administrateur qui les génère.",
  ),

  // CONCLUSION
  new Paragraph({ pageBreakBefore: true }),
  h1("Conclusion"),
  p(
    "Le présent cahier des charges définit les fondations du projet E-Tontine : une application web destinée à digitaliser la gestion des tontines communautaires au Cameroun et en Afrique subsaharienne, en répondant aux problèmes concrets de transparence, de traçabilité et de confiance qui fragilisent aujourd'hui les pratiques informelles.",
  ),
  p(
    "En couvrant l'ensemble du cycle de vie d'une tontine — de l'adhésion des membres à la distribution du pot, en passant par l'épargne individuelle et les prêts internes encadrés — E-Tontine se positionne comme une solution moderne de gestion communautaire, à la croisée de la solidarité traditionnelle et de la rigueur d'un outil fintech.",
  ),
  p(
    "La réussite du projet reposera sur la simplicité d'utilisation, la fiabilité technique, l'adaptation aux réalités terrain (Mobile Money, FCFA, réunions physiques) et la validation par des groupes pilotes camerounais. Ce document servira de référence pour le développement, les tests, le déploiement et l'évaluation finale de l'application.",
  ),
  new Paragraph({ spacing: { before: 400 } }),
  p(`Document établi le ${DATE}.`),
  p("Projet : E-Tontine — La tontine en toute confiance."),
];

const doc = new Document({
  sections: [{ properties: {}, children }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`Document généré : ${OUT}`);
