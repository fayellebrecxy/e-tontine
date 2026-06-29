#!/usr/bin/env node
/**
 * Génère le cahier d'implémentation E-Tontine (Word).
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
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
const CAPTURES = path.join(DOCS, "captures-application");
const DIAG = path.join(DOCS, "cahier-implementation-diagrammes");
const OUT = path.join(DOCS, "cahier-implementation-E-TONTINE.docx");
const DATE = "26 juin 2026";

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

function imgPara(filePath, maxW = 480, label) {
  if (!exists(filePath)) {
    return new Paragraph({
      spacing: P,
      children: [
        new TextRun({
          text: `[Capture manquante : ${path.basename(filePath)}]`,
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

function figureBlock(caption, filePath, maxW = 480, label) {
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

// ─── Préparation des assets ──────────────────────────────────────────────────

execSync(`python3 "${path.join(ROOT, "scripts/generate_deployment_diagram.py")}"`, { stdio: "inherit" });

const REQUIRED_CAPTURES = [
  "capture-accueil.png",
  "capture-connexion.png",
  "capture-inscription.png",
  "capture-dashboard.png",
  "capture-mes-groupes.png",
  "capture-detail-groupe.png",
  "capture-cycles.png",
  "capture-membres.png",
  "capture-invitations.png",
  "capture-rubriques.png",
  "capture-reunions.png",
  "capture-epargne.png",
  "capture-prets.png",
  "capture-finances.png",
  "capture-caisses.png",
  "capture-paiements.png",
];
const capturesMissing = REQUIRED_CAPTURES.some((f) => !exists(path.join(CAPTURES, f)));
if (process.env.FORCE_SCREENSHOT_CAPTURE === "1" || capturesMissing) {
  execSync(`node "${path.join(ROOT, "scripts/capture_implementation_screenshots.mjs")}"`, {
    stdio: "inherit",
  });
} else {
  console.log("Captures existantes réutilisées (FORCE_SCREENSHOT_CAPTURE=1 pour régénérer).");
}

const DEPLOY_PNG = path.join(DIAG, "diagramme-deploiement-e-tontine.png");

const SCREENSHOTS = [
  {
    heading: "Page d'accueil",
    file: "capture-accueil.png",
    caption: "Page d'accueil — hero et sections de présentation",
    desc: "La landing page présente la valeur de la plateforme (hero), le fonctionnement de la tontine numérique et un aperçu des fonctionnalités avant l'inscription ou la connexion.",
  },
  {
    heading: "Connexion",
    file: "capture-connexion.png",
    caption: "Écran de connexion",
    desc: "L'utilisateur s'authentifie avec son adresse e-mail et son mot de passe via Supabase Auth. Un lien permet la réinitialisation du mot de passe.",
  },
  {
    heading: "Inscription",
    file: "capture-inscription.png",
    caption: "Écran d'inscription",
    desc: "Le formulaire d'inscription collecte les informations du profil (nom, prénom, e-mail, téléphone) et crée le compte Supabase ainsi que l'enregistrement dans la table users.",
  },
  {
    heading: "Tableau de bord",
    file: "capture-dashboard.png",
    caption: "Tableau de bord global",
    desc: "Après connexion, l'utilisateur accède à son tableau de bord : résumé des groupes, notifications et accès rapide aux modules.",
  },
  {
    heading: "Mes groupes",
    file: "capture-mes-groupes.png",
    caption: "Liste des groupes",
    desc: "L'utilisateur visualise l'ensemble de ses tontines (groupes) avec leur statut, le nombre de membres et les actions de création ou de rejoindre un groupe.",
  },
  {
    heading: "Détail du groupe",
    file: "capture-detail-groupe.png",
    caption: "Vue d'ensemble d'un groupe avec le menu de navigation",
    desc: "La page de détail affiche les indicateurs clés du groupe (membres à jour, cycles) et le menu latéral donnant accès aux modules : membres, cycles, réunions, épargne, finances, etc.",
  },
  {
    heading: "Cycles de tontine",
    file: "capture-cycles.png",
    caption: "Détail d'un cycle — paiement des cotisations et pénalités",
    desc: "La vue détail d'un cycle affiche l'ordre de passage, les montants dus (cotisations et pénalités) et permet le paiement via Mobile Money en tranches.",
  },
  {
    heading: "Gestion des membres",
    file: "capture-membres.png",
    caption: "Gestion des membres",
    desc: "L'administrateur consulte la liste des membres, attribue les rôles (ADMIN/MEMBRE), gère les exclusions et les réintégrations.",
  },
  {
    heading: "Invitations",
    file: "capture-invitations.png",
    caption: "Invitations au groupe",
    desc: "Les administrateurs génèrent des codes d'invitation ou partagent le lien permanent pour permettre l'adhésion de nouveaux membres.",
  },
  {
    heading: "Réunions",
    file: "capture-reunions.png",
    caption: "Gestion des réunions",
    desc: "Le module réunions permet de planifier les assemblées, enregistrer les présences et appliquer les amendes d'absence.",
  },
  {
    heading: "Épargne",
    file: "capture-epargne.png",
    caption: "Module épargne individuelle",
    desc: "Chaque membre actif dispose d'un compte épargne. L'administrateur enregistre les dépôts et retraits avec historique des mouvements.",
  },
  {
    heading: "Journal financier",
    file: "capture-finances.png",
    caption: "Journal financier",
    desc: "Le journal financier centralise toutes les écritures comptables du groupe avec soldes avant/après et filtres par période.",
  },
  {
    heading: "Caisses et rapports",
    file: "capture-caisses.png",
    caption: "Caisses et rapports",
    desc: "Les caisses typées (cycle, rubrique, amendes, banque prêts) affichent leurs soldes. L'administrateur peut exporter des rapports PDF ou Excel.",
  },
  {
    heading: "Rubriques",
    file: "capture-rubriques.png",
    caption: "Rubriques de cotisation",
    desc: "Les rubriques ponctuelles ou récurrentes permettent des collectes en dehors des cycles, avec suivi des paiements par membre.",
  },
  {
    heading: "Prêts internes",
    file: "capture-prets.png",
    caption: "Prêts internes",
    desc: "Le module prêts gère les demandes, avalistes, approbations administrateur et remboursements depuis la banque du groupe.",
  },
  {
    heading: "Paiements Mobile Money",
    file: "capture-paiements.png",
    caption: "Modale de paiement Mobile Money (opérateur et numéro)",
    desc: "Lors d'un paiement, une carte modale s'ouvre pour choisir l'opérateur (Orange Money ou MTN MoMo), saisir le numéro à débiter et valider la transaction.",
  },
];

// ─── Document ────────────────────────────────────────────────────────────────

const children = [
  new Paragraph({ spacing: { before: 2200 } }),
  p("CAHIER D'IMPLÉMENTATION", { center: true, bold: true }),
  p("Application Web E-TONTINE", { center: true, bold: true }),
  p("Déploiement, environnement de développement et résultats", { center: true }),
  p(`Version 1.0 — ${DATE}`, { center: true }),
  new Paragraph({ children: [new PageBreak()] }),

  // I. Introduction
  h1("I. Introduction"),
  p(
    "Le présent cahier d'implémentation documente la mise en œuvre concrète du système E-Tontine : l'architecture de déploiement en production, l'environnement de développement utilisé pour construire l'application, et les interfaces réalisées pour chaque module fonctionnel.",
  ),
  p(
    "Ce document complète le cahier d'analyse (besoins et cas d'utilisation) et le cahier de conception (architecture technique et diagrammes de séquence). Il atteste que les fonctionnalités prévues ont été développées, testées et déployées sur une infrastructure cloud adaptée au contexte camerounais (devise XAF, Mobile Money, interface bilingue FR/EN).",
  ),
  p("Le cahier est structuré en cinq sections :"),
  bullet("Le diagramme de déploiement du système en production."),
  bullet("L'environnement de développement (matériel et logiciel)."),
  bullet("La présentation des résultats avec captures d'écran des fonctionnalités implémentées."),
  bullet("Une conclusion sur l'état d'avancement du projet."),

  // II. Diagramme de déploiement
  h1("II. Diagramme de déploiement"),
  p(
    "L'application E-Tontine est déployée selon une architecture cloud serverless. Le client web (navigateur) communique en HTTPS avec l'application Next.js hébergée sur Vercel. Celle-ci s'appuie sur Supabase pour l'authentification (Auth) et la persistance des données métier (PostgreSQL via Prisma). Les paiements Mobile Money et les notifications e-mail transitent par des services externes.",
  ),
  p("Les composants du déploiement sont les suivants :"),
  bullet("Client : navigateur web moderne (Chrome, Firefox, Safari, Edge) sur PC ou smartphone."),
  bullet("Application : Next.js 15 déployée sur Vercel (build automatique depuis GitHub, CDN global)."),
  bullet("Authentification : Supabase Auth (sessions JWT en cookies SSR, inscription et connexion)."),
  bullet("Base de données : PostgreSQL managé par Supabase (migrations Prisma, connexion via DATABASE_URL)."),
  bullet("Intégrations : opérateurs Mobile Money pour les paiements ; serveur SMTP (Gmail/Nodemailer) pour les e-mails."),
  bullet("CI/CD : GitHub Actions exécute le lint et le build à chaque push ou pull request."),
  bullet("Alternative Docker : un Dockerfile multi-stage permet un déploiement conteneurisé (Node.js 20 Alpine) avec healthcheck sur /api/health."),
  ...figureBlock(
    "Diagramme de déploiement — E-Tontine",
    DEPLOY_PNG,
    500,
    "Déploiement",
  ),

  new Paragraph({ children: [new PageBreak()] }),

  // III. Environnement de développement
  h1("III. Environnement de développement"),
  p(
    "Le développement d'E-Tontine a été réalisé sur un poste de travail standard, avec des outils open source et des services cloud en mode gratuit ou pro pour les phases de test et de production.",
  ),

  h2("III.1 Environnement matériel"),
  p("Le tableau ci-dessous décrit les ressources matérielles utilisées ou requises :"),
  table(
    ["Élément", "Spécification", "Usage"],
    [
      ["Poste développeur", "Processeur 4 cœurs minimum, 8 Go RAM (16 Go recommandé), SSD 256 Go+", "Développement, compilation Next.js, Prisma Studio"],
      ["Connexion réseau", "Bande passante stable (≥ 10 Mbit/s)", "Téléchargement des dépendances npm, accès Supabase Cloud"],
      ["Serveur Vercel", "Infrastructure serverless (plan Hobby/Pro)", "Hébergement production et previews par branche"],
      ["Supabase Cloud", "Instance PostgreSQL managée", "Base de données et authentification"],
      ["Poste utilisateur final", "Smartphone ou PC avec navigateur récent", "Utilisation quotidienne de l'application"],
    ],
  ),

  h2("III.2 Environnement logiciel"),
  p("L'environnement logiciel de développement comprend :"),
  table(
    ["Logiciel", "Version", "Rôle"],
    [
      ["Système d'exploitation", "Linux / Windows / macOS", "Poste de développement"],
      ["Node.js", "≥ 20.12.0", "Runtime JavaScript (moteur Next.js et scripts)"],
      ["npm", "≥ 10", "Gestion des dépendances (package-lock.json)"],
      ["Next.js", "15.3", "Framework web App Router"],
      ["React", "19", "Bibliothèque UI"],
      ["TypeScript", "5.x", "Typage statique du code source"],
      ["Prisma", "6.17", "ORM, migrations et Prisma Studio"],
      ["Supabase CLI", "Dernière stable", "Auth et PostgreSQL local (Docker)"],
      ["Docker", "Dernière stable", "Conteneurisation Supabase locale et build production"],
      ["Git", "2.x", "Contrôle de version"],
      ["Éditeur", "VS Code / Cursor", "IDE avec extensions ESLint, Prisma, Tailwind"],
      ["Navigateur", "Google Chrome / Firefox", "Tests manuels et débogage (DevTools)"],
      ["GitHub Actions", "—", "Intégration continue (lint, build)"],
    ],
  ),

  h3("III.2.1 Configuration locale"),
  p("La mise en route du projet en local suit les étapes suivantes :"),
  bullet("Cloner le dépôt Git et exécuter npm install."),
  bullet("Copier .env.template vers .env et renseigner les clés Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, DIRECT_URL)."),
  bullet("Démarrer Supabase en local : npm run supabase:start (nécessite Docker)."),
  bullet("Appliquer les migrations : npx prisma migrate dev."),
  bullet("Lancer le serveur de développement : npm run dev (http://localhost:3000)."),

  h3("III.2.2 Déploiement production"),
  p("Le déploiement sur Vercel est configuré via vercel.json :"),
  bullet("Commande d'installation : npm ci."),
  bullet("Commande de build : npm run vercel-build (prisma generate && next build)."),
  bullet("Variables d'environnement configurées dans le tableau de bord Vercel."),
  bullet("Endpoint de santé : GET /api/health pour le monitoring."),

  new Paragraph({ children: [new PageBreak()] }),

  // IV. Présentation des résultats
  h1("IV. Présentation des résultats"),
  p(
    "Cette section présente les interfaces réalisées pour les principaux modules de l'application E-Tontine. Les captures d'écran illustrent le parcours utilisateur depuis l'accueil jusqu'aux modules métier (cycles, membres, réunions, épargne, finances, rubriques, prêts et paiements Mobile Money).",
  ),
];

for (let i = 0; i < SCREENSHOTS.length; i++) {
  const s = SCREENSHOTS[i];
  const imgPath = path.join(CAPTURES, s.file);
  children.push(
    h2(`IV.${i + 1} ${s.heading}`),
    p(s.desc),
    ...figureBlock(s.caption, imgPath, 500, s.caption),
  );
}

children.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1("V. Conclusion"),
  p(
    "Le cahier d'implémentation atteste que le système E-Tontine a été développé et déployé selon l'architecture prévue : application Next.js sur Vercel, authentification Supabase, persistance PostgreSQL via Prisma, et intégrations Mobile Money et e-mail.",
  ),
  p(
    "L'environnement de développement (Node.js 20, Prisma, Supabase CLI, Docker) a permis une itération rapide avec migrations versionnées et tests locaux. L'intégration continue via GitHub Actions garantit la qualité du code avant chaque déploiement.",
  ),
  p(
    "Les seize captures d'écran présentées couvrent l'ensemble des modules fonctionnels implémentés : authentification, gestion des groupes et membres, cycles de tontine, rubriques, réunions, épargne, prêts, paiements Mobile Money et consolidation financière. L'application est opérationnelle et prête pour des tests utilisateurs en conditions réelles avec des groupes pilotes.",
  ),
  p(
    "Les perspectives d'évolution incluent l'optimisation des performances sur mobile, l'intégration native avec les API opérateurs Mobile Money camerounais (MTN, Orange) et l'extension des rapports analytiques pour les administrateurs de groupe.",
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
console.log(`Cahier d'implémentation généré : ${OUT}`);
