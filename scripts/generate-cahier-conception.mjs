#!/usr/bin/env node
/**
 * Génère le cahier de conception E-Tontine (Word).
 * Diagrammes de séquence : Docs/diagramme de sequences/
 */
import fs from "fs";
import path from "path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOCS = path.join(ROOT, "Docs");
const SEQ_DIR = path.join(DOCS, "diagramme de sequences");
const OUT = path.join(DOCS, "cahier-conception-E-TONTINE.docx");
const DATE = "25 juin 2026";

const P = { after: 70 };
const H1 = { before: 200, after: 100 };
const H2 = { before: 140, after: 70 };
const H3 = { before: 100, after: 50 };

function exists(p) {
  return fs.existsSync(p);
}

function pngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function imgPara(filePath, maxW = 500, label) {
  if (!exists(filePath)) {
    return new Paragraph({
      spacing: P,
      children: [
        new TextRun({
          text: `[Diagramme manquant : ${path.basename(filePath)}]`,
          italics: true,
        }),
      ],
    });
  }
  const { w, h } = pngSize(filePath);
  const width = maxW;
  const height = Math.round((h / w) * width);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [
      new ImageRun({
        type: "png",
        data: fs.readFileSync(filePath),
        transformation: { width, height },
        altText: { title: label, description: label, name: label },
      }),
    ],
  });
}

let fig = 1;
function figCaption(text) {
  return new Paragraph({
    spacing: { before: 40, after: 50 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Figure ${fig++} : ${text}`, bold: true, size: 20 })],
  });
}

function figureBlock(caption, filePath, maxW = 500, label) {
  return [imgPara(filePath, maxW, label), figCaption(caption)];
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: H1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: H2, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: H3, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: P,
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 22, bold: opts.bold, italics: opts.italics })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 50 },
    children: [new TextRun({ text, size: 22 })],
  });
}

const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header ? { fill: "E5EEFF", type: "clear" } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20, bold: opts.header || opts.bold })],
      }),
    ],
  });
}

function table(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map((h) => cell(h, { header: true })) }),
      ...rows.map((row) => new TableRow({ children: row.map((c) => cell(c)) })),
    ],
  });
}

// ─── Modules et diagrammes de séquence ───────────────────────────────────────

const MODULES = [
  {
    num: 1,
    heading: "Authentification",
    file: "seq-authentification.png",
    caption: "Diagramme de séquence — Authentification",
    desc: "L'authentification repose sur Supabase Auth (inscription, connexion, réinitialisation de mot de passe) avec gestion SSR des cookies via @supabase/ssr. Les pages auth (app/auth/*) et les Server Actions (app/auth/actions.ts) orchestrent les échanges. Le profil métier (nom, prénom, téléphone) est stocké dans la table users et chargé via Prisma après établissement de la session ; l'autorisation ne s'appuie jamais sur user_metadata.",
    interactions:
      "L'utilisateur saisit ses identifiants sur la page de connexion. Les actions serveur appellent signInWithPassword côté Supabase. En cas de succès, le profil User est lu en base ; en cas d'échec, un message d'erreur est affiché. Le middleware Next.js protège les routes /dashboard et /account.",
    routes: "app/auth/login, app/auth/register, app/auth/reset-password, app/auth/actions.ts, app/api/users/me",
    services: "lib/supabase/server.ts, lib/supabase/middleware.ts, middleware.ts",
  },
  {
    num: 2,
    heading: "Groupes",
    file: "seq-groupes.png",
    caption: "Diagramme de séquence — Groupes",
    desc: "La création et la gestion des groupes passent par les API Routes REST sous app/api/groups. À la création, le créateur est automatiquement inscrit comme membre ADMIN du groupe (MembreGroupe). Les validations métier utilisent des schémas Zod partagés (lib/validations.ts).",
    interactions:
      "L'administrateur remplit le formulaire de création (dashboard/groups/new). L'API vérifie la session, valide les données et crée le groupe ainsi que l'adhésion ADMIN en transaction. Les branches alt couvrent la validation réussie ou le rejet avec message d'erreur.",
    routes: "app/api/groups/route.ts, app/dashboard/groups/new/page.tsx, app/dashboard/groups/[groupId]/settings",
    services: "lib/validations.ts, lib/prisma.ts",
  },
  {
    num: 3,
    heading: "Membres et invitations",
    file: "seq-membres.png",
    caption: "Diagramme de séquence — Membres",
    desc: "L'adhésion à un groupe s'effectue via un code d'invitation (InvitationGroupe) ou un lien permanent (lien_invitation sur Groupes). L'API POST /api/invitations/:code/join crée un MembreGroupe avec le rôle MEMBRE. Les administrateurs gèrent les rôles, exclusions (statut_adhesion INACTIF) et réintégrations (EN_ATTENTE).",
    interactions:
      "Le visiteur ouvre le lien d'invitation (app/(public)/invitations/[code]). L'API recherche l'invitation, vérifie qu'elle n'est pas révoquée, puis enregistre l'adhésion. Les notifications informent les administrateurs du nouveau membre.",
    routes: "app/api/invitations/[code]/join, app/api/groups/[groupId]/members, app/(public)/invitations/[code]",
    services: "lib/notifications.ts, lib/membre-statut.ts",
  },
  {
    num: 4,
    heading: "Cycles de tontine",
    file: "seq-cycles.png",
    caption: "Diagramme de séquence — Cycles",
    desc: "Les cycles (CycleTontine) organisent la tontine rotative : ordre des bénéficiaires, tours de gain, cotisations et pénalités. L'enregistrement des paiements passe par POST .../cycles/:id/payments ; les versements aux bénéficiaires utilisent les distributions (Versement).",
    interactions:
      "Le membre ou l'administrateur initie un paiement de cotisation. L'API vérifie le tour actif, l'appartenance active au cycle et l'existence d'une obligation en attente. La cotisation est persistée et le journal financier mis à jour atomiquement.",
    routes: "app/api/groups/[groupId]/cycles, .../payments, .../distributions, .../ordre",
    services: "lib/cycle-turns.ts, lib/cycle-payment-processor.ts, lib/cycle-penalties.ts, lib/financial-journal.ts",
  },
  {
    num: 5,
    heading: "Rubriques de cotisation",
    file: "seq-rubriques.png",
    caption: "Diagramme de séquence — Rubriques",
    desc: "Les rubriques (RubriqueCotisation) permettent des collectes ponctuelles ou récurrentes en dehors des cycles. Chaque rubrique possède une caisse dédiée (CaisseFinanciere) et des paiements (PaiementRubrique) suivis par membre.",
    interactions:
      "L'administrateur enregistre un paiement via les Server Actions (lib/actions/rubriques.ts). Le système vérifie que la rubrique est active et que le montant est valide, puis met à jour la caisse rubrique et le journal financier.",
    routes: "app/dashboard/groups/[groupId]/rubriques, lib/actions/rubriques.ts",
    services: "lib/rubrique-caisse.ts, lib/rubrique-dates.ts, lib/rubrique-reminders.ts",
  },
  {
    num: 6,
    heading: "Réunions",
    file: "seq-reunions.png",
    caption: "Diagramme de séquence — Réunions",
    desc: "Le module réunions planifie les assemblées (Reunion), enregistre les présences (PresenceReunion) et calcule les amendes d'absence. Les amendes alimentent une caisse AMENDES distincte.",
    interactions:
      "L'administrateur crée une réunion puis saisit les présences. Le fragment alt distingue membre présent (statut PRESENT) et absent (statut ABSENT avec amende). Les notifications rappellent les réunions à venir (cron reunion-reminders).",
    routes: "app/api/groups/[groupId]/reunions, .../presences, app/api/cron/reunion-reminders",
    services: "lib/reunion-reminders.ts, lib/notifications.ts",
  },
  {
    num: 7,
    heading: "Épargne individuelle",
    file: "seq-epargne.png",
    caption: "Diagramme de séquence — Épargne",
    desc: "Chaque membre actif peut disposer d'un CompteEpargne. Les opérations (dépôt, retrait) sont historisées dans MouvementEpargne avec soldes avant/après. Les signalements (SignalementEpargne) permettent un audit administrateur.",
    interactions:
      "L'administrateur saisit une opération sur le compte épargne d'un membre. L'API vérifie le compte actif et le solde suffisant pour un retrait, puis enregistre le mouvement et met à jour le solde en transaction.",
    routes: "app/api/groups/[groupId]/epargne/accounts, .../operations, .../signalements",
    services: "lib/epargne.ts",
  },
  {
    num: 8,
    heading: "Prêts internes",
    file: "seq-prets.png",
    caption: "Diagramme de séquence — Prêts",
    desc: "Les prêts internes (Pret) sont financés par la banque du groupe. L'éligibilité (lib/pret-eligibility.ts), les avalistes (AvalistePret) et les paramètres groupe (ParametresPretGroupe) encadrent chaque demande. L'approbation admin déclenche le décaissement.",
    interactions:
      "Le membre soumet une demande avec avalistes. L'API analyse l'éligibilité et la disponibilité de la banque. Si acceptée, le prêt est créé en statut EN_ATTENTE avec garanties réservées ; sinon un motif de refus est retourné.",
    routes: "app/api/groups/[groupId]/prets, app/dashboard/groups/[groupId]/prets",
    services: "lib/pret.ts, lib/pret-eligibility.ts, lib/pret-banque.ts, lib/pret-avalistes.ts",
  },
  {
    num: 9,
    heading: "Paiements Mobile Money",
    file: "seq-paiements.png",
    caption: "Diagramme de séquence — Paiements",
    desc: "Les paiements Mobile Money transitent par PaymentTransaction avec un cycle de vie PENDING → PROCESSING → SUCCESS ou FAILED. Le traitement est orchestré par lib/payment-process.ts et la finalisation atomique par lib/payment-finalize.ts.",
    interactions:
      "Le membre initie un paiement depuis l'interface checkout. Une transaction est créée en attente, puis confirmée ou refusée par l'opérateur. En cas de succès, les caisses et obligations (cotisation, rubrique) sont mises à jour de façon atomique.",
    routes: "app/api/groups/[groupId]/payments/initiate, .../confirm, .../status",
    services: "lib/payment-process.ts, lib/payment-finalize.ts, lib/payment-auth.ts, lib/payment-amounts.ts",
  },
  {
    num: 10,
    heading: "Finances et rapports",
    file: "seq-finances.png",
    caption: "Diagramme de séquence — Finances",
    desc: "Le module finances consolide les caisses (CaisseFinanciere), le journal (MouvementFinancier) et les exports PDF/Excel. Chaque opération financière enregistre les soldes avant et après pour garantir la traçabilité.",
    interactions:
      "L'administrateur consulte le journal et les soldes des caisses. Le fragment opt modélise l'export optionnel : génération d'un rapport PDF (@react-pdf/renderer) ou Excel (xlsx) via GET /api/groups/:id/rapport.",
    routes: "app/dashboard/groups/[groupId]/finances, app/api/groups/[groupId]/rapport",
    services: "lib/financial-journal.ts, lib/excel/rapport-groupe.ts",
  },
];

// ─── Document ────────────────────────────────────────────────────────────────

const children = [
  new Paragraph({ spacing: { before: 2200 } }),
  p("CAHIER DE CONCEPTION", { center: true, bold: true }),
  p("Application Web E-TONTINE", { center: true, bold: true }),
  p("Architecture technique et diagrammes de séquence", { center: true }),
  p(`Version 1.0 — ${DATE}`, { center: true }),
  new Paragraph({ children: [new PageBreak()] }),

  // I. Introduction
  h1("I. Introduction"),
  p(
    "Le présent cahier de conception décrit l'architecture technique du système E-Tontine et les interactions dynamiques entre ses composants lors de l'exécution des fonctionnalités métier. Il complète le cahier d'analyse en précisant comment les besoins fonctionnels identifiés sont traduits en choix d'implémentation : organisation de l'interface utilisateur, structuration du backend et modélisation des données.",
  ),
  p(
    "E-Tontine est une application web de gestion de tontines numériques. Elle permet à des groupes d'utilisateurs de gérer leurs cotisations rotatives, rubriques ponctuelles, réunions, épargne individuelle, prêts internes et paiements Mobile Money, avec un journal financier centralisé et des rapports exportables.",
  ),
  p("Ce document est structuré en trois parties principales :"),
  bullet("L'architecture du système, présentée sous forme textuelle (interface, backend, base de données)."),
  bullet("Les diagrammes de séquence détaillés par module métier, illustrant les flux d'exécution."),
  bullet("Une conclusion synthétisant les choix de conception retenus."),
  p(
    "L'implémentation repose sur une stack moderne : Next.js 15 (App Router), React 19, TypeScript, Prisma 6 sur PostgreSQL (Supabase), Supabase Auth pour l'authentification, et un déploiement serverless sur Vercel.",
  ),

  // II. Architecture
  h1("II. Architecture du système"),
  p(
    "E-Tontine adopte une architecture monolithique modulaire : une seule application Next.js regroupe la présentation, les contrôleurs et la logique métier, tout en séparant clairement les responsabilités par couches et par domaine fonctionnel. Cette section détaille l'organisation de l'interface utilisateur, du backend et de la persistance.",
  ),

  h2("II.1 Architecture de l'interface utilisateur (UX)"),
  p(
    "L'interface utilisateur est construite avec Next.js App Router et React 19. Elle s'organise en zones fonctionnelles distinctes, chacune avec son layout et ses conventions de navigation.",
  ),

  h3("II.1.1 Organisation des pages et navigation"),
  p("La structure des routes reflète le parcours utilisateur :"),
  bullet(
    "Zone publique (app/(public)/) : page d'accueil et page d'invitation (invitations/[code]) accessible sans authentification préalable pour rejoindre un groupe.",
  ),
  bullet(
    "Zone authentification (app/auth/) : inscription, connexion, réinitialisation et mise à jour du mot de passe. Layout dédié sans barre de navigation du tableau de bord.",
  ),
  bullet(
    "Tableau de bord (app/dashboard/) : liste des groupes de l'utilisateur, création de groupe, accès au profil. Protégé par le middleware d'authentification.",
  ),
  bullet(
    "Espace groupe (app/dashboard/groups/[groupId]/) : coquille GroupShell avec menu latéral donnant accès aux dix modules métier (cycles, rubriques, réunions, épargne, prêts, finances, membres, invitations, paramètres).",
  ),
  bullet("Compte utilisateur (app/account/) : modification du profil personnel (nom, prénom, téléphone, photo)."),

  h3("II.1.2 Composants et design system"),
  p("L'interface s'appuie sur un design system cohérent :"),
  bullet(
    "Composants UI : bibliothèque shadcn/ui (Radix UI) pour les formulaires, dialogues, tableaux, onglets et menus déroulants.",
  ),
  bullet("Styles : Tailwind CSS 3.4 avec tokens de couleur et animations (tailwindcss-animate)."),
  bullet("Icônes : lucide-react pour une iconographie uniforme."),
  bullet("Formulaires : react-hook-form couplé à Zod (@hookform/resolvers) pour la validation côté client."),
  bullet("Tableaux de données : @tanstack/react-table pour les listes paginées (finances, membres, historiques)."),
  bullet("Retours utilisateur : notifications toast (sonner, react-toastify) et états de chargement explicites."),
  bullet("Internationalisation : next-intl (français / anglais) via app/actions/locale.ts."),
  bullet("Thème : next-themes pour le mode clair/sombre."),

  h3("II.1.3 Rendu et performance"),
  p(
    "Next.js App Router distingue les Server Components (rendu côté serveur, accès direct à Prisma) des Client Components (interactivité, hooks React). Les pages de liste et de détail des modules groupe utilisent principalement des Server Components pour le chargement initial des données, tandis que les formulaires et actions interactives sont marqués « use client ». Le middleware (middleware.ts) intercepte chaque requête pour rafraîchir la session Supabase et rediriger les utilisateurs non authentifiés vers /auth/login.",
  ),

  h2("II.2 Architecture du backend"),
  p(
    "Le backend E-Tontine est intégré à l'application Next.js : il n'existe pas de serveur API séparé. Les points d'entrée sont les API Routes REST et les Server Actions, orchestrés par une couche de services métier dans lib/.",
  ),

  h3("II.2.1 Points d'entrée"),
  p("Deux mécanismes exposent la logique serveur :"),
  bullet(
    "API Routes (app/api/**/route.ts) : endpoints REST JSON pour les opérations CRUD et les flux transactionnels. Convention de réponse : { ok: true, ... } en succès, { ok: false, error: string } en erreur, avec codes HTTP explicites (401, 403, 404, 409).",
  ),
  bullet(
    "Server Actions (app/auth/actions.ts, lib/actions/*) : fonctions serveur invoquées directement depuis les composants React pour l'authentification et certaines opérations métier (rubriques, pénalités de cycle).",
  ),
  bullet(
    "Route cron (app/api/cron/reunion-reminders) : tâche planifiée pour l'envoi des rappels de réunion.",
  ),

  h3("II.2.2 Authentification et autorisation"),
  p("Le modèle de sécurité repose sur une séparation stricte entre identité et autorisation :"),
  bullet(
    "Identité : Supabase Auth gère l'inscription, la connexion et les sessions JWT stockées en cookies SSR (@supabase/ssr). Le client serveur createSupabaseServerClient() lit la session sur chaque requête.",
  ),
  bullet(
    "Profil métier : la table users (Prisma) stocke nom, prénom, email, téléphone. Elle est liée à l'identifiant Supabase (id_user). Les métadonnées Supabase (user_metadata) ne sont jamais utilisées pour l'autorisation.",
  ),
  bullet(
    "Autorisation par groupe : le rôle (ADMIN / MEMBRE) et le statut d'adhésion (ACTIF, INACTIF, EN_ATTENTE) sont portés par MembreGroupe. Chaque route API sensible vérifie l'appartenance au groupe et le rôle requis avant d'exécuter l'opération.",
  ),
  bullet(
    "Middleware : protection des routes /dashboard et /account ; redirection des utilisateurs connectés hors des pages auth.",
  ),

  h3("II.2.3 Services métier (lib/)"),
  p("La logique métier est centralisée dans lib/ et organisée par domaine :"),
  table(
    ["Domaine", "Fichiers principaux", "Responsabilité"],
    [
      ["Cycles", "cycle-turns.ts, cycle-payment-processor.ts, cycle-penalties.ts", "Tours, cotisations, pénalités, distributions"],
      ["Finances", "financial-journal.ts, prisma-transaction.ts", "Journal MouvementFinancier, transactions atomiques"],
      ["Rubriques", "rubrique-caisse.ts, actions/rubriques.ts", "Paiements rubrique, caisses dédiées"],
      ["Épargne", "epargne.ts", "Comptes, mouvements, signalements"],
      ["Prêts", "pret.ts, pret-eligibility.ts, pret-banque.ts", "Demandes, avalistes, décaissement"],
      ["Paiements MM", "payment-process.ts, payment-finalize.ts", "Initiation, finalisation Mobile Money"],
      ["Notifications", "notifications.ts, email/mailer.ts", "Notifications groupe et e-mails SMTP"],
      ["Validations", "validations.ts", "Schémas Zod partagés API et formulaires"],
    ],
  ),

  h3("II.2.4 Intégrité des opérations financières"),
  p(
    "Toute opération impactant un solde (cotisation, paiement rubrique, épargne, prêt, amende) est exécutée dans une transaction Prisma (prisma.$transaction). Le journal MouvementFinancier enregistre systématiquement le type d'opération, le montant, les soldes avant/après et l'auteur. Cette approche garantit la cohérence comptable et la traçabilité audit.",
  ),

  h3("II.2.5 Intégrations externes"),
  bullet("Supabase Auth : authentification et gestion des sessions."),
  bullet("PostgreSQL (Supabase) : persistance relationnelle via Prisma."),
  bullet("Opérateurs Mobile Money : initiation et confirmation des paiements (simulation ou API opérateur selon configuration)."),
  bullet("SMTP (Nodemailer) : envoi des e-mails de notification et rappels de réunion."),

  h2("II.3 Architecture de la base de données"),
  p(
    "La persistance repose sur PostgreSQL hébergé par Supabase, modélisé avec Prisma ORM 6. Le schéma (prisma/schema.prisma) constitue la source de vérité ; les migrations Prisma assurent l'évolution du schéma.",
  ),

  h3("II.3.1 Modèle relationnel central"),
  p("Les entités fondatrices structurent l'application :"),
  bullet(
    "users : profil plateforme (lié à Supabase Auth par id_user UUID). Un utilisateur peut appartenir à plusieurs groupes.",
  ),
  bullet(
    "groupes : entité racine d'une tontine (nom, devise XAF par défaut, lien d'invitation permanent).",
  ),
  bullet(
    "membres_groupe : table d'association User ↔ Groupes portant role (ADMIN/MEMBRE) et statut_adhesion (ACTIF/INACTIF/EN_ATTENTE). Contrainte d'unicité (id_user, id_groupe).",
  ),
  bullet(
    "invitations_groupe : codes d'invitation temporaires avec date de révocation optionnelle.",
  ),

  h3("II.3.2 Modules métier et tables associées"),
  table(
    ["Module", "Tables principales", "Relations clés"],
    [
      ["Cycles", "cycles_tontine, cycles_participants, cotisations, penalites, versements", "Cycle → Groupe ; Participant → MembreGroupe"],
      ["Rubriques", "rubriques_cotisation, paiement_rubrique, membres_rubrique", "Rubrique → Groupe ; Paiement → MembreGroupe"],
      ["Réunions", "reunions, presence_reunion, retrait_amende_reunion", "Présence → MembreGroupe ; Amende → Caisse"],
      ["Épargne", "comptes_epargne, mouvement_epargne, signalement_epargne", "Compte → MembreGroupe"],
      ["Prêts", "pret, avaliste_pret, parametres_pret_groupe, mouvement_pret", "Prêt → MembreGroupe emprunteur"],
      ["Paiements", "payment_transactions", "Transaction → Groupe, contexte cotisation/rubrique"],
      ["Finances", "caisses_financieres, mouvement_financier, retraits", "Caisse par type (CYCLE, RUBRIQUE, AMENDES, BANQUE_PRET…)"],
      ["Notifications", "notifications_groupe", "Notification → User destinataire"],
    ],
  ),

  h3("II.3.3 Principes de modélisation"),
  bullet(
    "Rôles par groupe : le rôle ADMIN n'est pas un attribut de User mais de MembreGroupe, permettant à un même utilisateur d'être admin d'un groupe et simple membre d'un autre.",
  ),
  bullet(
    "Caisses financières typées : chaque module alimente une ou plusieurs caisses (enum TypeCaisse) pour isoler les flux comptables.",
  ),
  bullet(
    "Journal centralisé : MouvementFinancier consolide toutes les écritures avec soldes avant/après, indépendamment du module source.",
  ),
  bullet(
    "Cascade et intégrité : les suppressions de groupe cascadent sur les membres et entités associées sans supprimer les comptes User.",
  ),
  bullet(
    "Types énumérés Prisma : statuts de prêt, modes de versement, types de rubrique, statuts de transaction paiement, etc., garantissent la cohérence des valeurs en base.",
  ),

  h3("II.3.4 Accès aux données"),
  p(
    "Le client Prisma est instancié une fois (lib/prisma.ts) et importé dans les routes API et Server Actions. Les requêtes utilisent select pour limiter les champs retournés. Les opérations multi-tables critiques passent par prisma.$transaction ou le helper lib/prisma-transaction.ts. Prisma Studio (npm run db:studio) permet l'inspection locale du schéma.",
  ),

  h2("II.4 Stack technologique"),
  p("Le tableau suivant synthétise les technologies du projet (package.json) :"),
  table(
    ["Couche", "Technologie", "Version", "Rôle"],
    [
      ["Frontend", "Next.js (App Router)", "15.3", "Pages, routing, SSR, API intégrée"],
      ["UI", "React + shadcn/ui + Tailwind", "19 / 3.4", "Composants, design system"],
      ["Langage", "TypeScript", "5.x", "Typage statique"],
      ["i18n", "next-intl", "4.x", "Interface FR/EN"],
      ["Auth", "Supabase Auth (@supabase/ssr)", "0.6", "Sessions cookies SSR"],
      ["ORM", "Prisma", "6.17", "Accès PostgreSQL typé"],
      ["Base", "PostgreSQL (Supabase)", "—", "Données métier relationnelles"],
      ["Validation", "Zod + react-hook-form", "3.x / 7.x", "Schémas entrées API et formulaires"],
      ["Exports", "@react-pdf/renderer, xlsx", "4.x / 0.18", "Rapports PDF et Excel"],
      ["Email", "Nodemailer", "8.x", "Notifications SMTP"],
      ["Hébergement", "Vercel", "—", "Déploiement serverless production"],
      ["Runtime", "Node.js", "≥ 20.12", "Exécution serveur"],
    ],
  ),

  new Paragraph({ children: [new PageBreak()] }),

  // III. Diagrammes de séquence
  h1("III. Diagrammes de séquence par module"),
  p(
    "Les diagrammes suivants modélisent les interactions dynamiques entre l'acteur, les composants d'interface, les services backend et la persistance pour chaque module métier. Ils utilisent la notation UML 2.x : lifelines, messages synchrones, retours en pointillés, fragments combined alt (branches exclusives) et opt (actions optionnelles). Les diagrammes sont alignés sur le code source de l'application.",
  ),
];

for (const mod of MODULES) {
  const imgPath = path.join(SEQ_DIR, mod.file);
  children.push(
    h2(`III.${mod.num} ${mod.heading}`),
    p(mod.desc),
    h3("Flux d'exécution"),
    p(mod.interactions),
    h3("Implémentation"),
    bullet(`Routes / pages : ${mod.routes}`),
    bullet(`Services : ${mod.services}`),
    ...figureBlock(mod.caption, imgPath, 500, mod.heading),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
  );
}

children.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1("IV. Conclusion"),
  p(
    "Ce cahier de conception a présenté l'architecture technique d'E-Tontine sous trois angles complémentaires : l'organisation de l'interface utilisateur autour du tableau de bord et de l'espace groupe, la structuration du backend autour des API Routes, Server Actions et services métier, et le modèle relationnel PostgreSQL modélisé par Prisma.",
  ),
  p(
    "Les dix diagrammes de séquence détaillent les flux d'exécution des modules Authentification, Groupes, Membres, Cycles, Rubriques, Réunions, Épargne, Prêts, Paiements Mobile Money et Finances. Ils constituent une référence pour l'implémentation, les tests d'intégration et la rédaction du chapitre conception du mémoire de soutenance.",
  ),
  p(
    "Les choix architecturaux retenus — monolithe modulaire Next.js, séparation Auth Supabase / données Prisma, autorisation par MembreGroupe, journal financier transactionnel — visent à concilier simplicité de déploiement, maintenabilité du code et intégrité des opérations financières d'une tontine numérique.",
  ),
);

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: "bullet",
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 180 } },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 120 } },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        run: { size: 22, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 140, after: 80 } },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    },
  ],
});

fs.writeFileSync(OUT, await Packer.toBuffer(doc));
console.log(`Cahier de conception généré : ${OUT}`);
console.log(`Diagrammes de séquence : ${SEQ_DIR}`);
