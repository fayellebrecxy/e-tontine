#!/usr/bin/env node
/**
 * Génère le cahier d'analyse E-Tontine — aligné sur les diagrammes du dossier Docs.
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
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOCS = path.join(ROOT, "Docs");
const OUT = path.join(DOCS, "cahier-analyse-E-TONTINE.docx");
const DATE = "25 juin 2026";

const P = { after: 70 };
const H1 = { before: 200, after: 100 };
const H2 = { before: 140, after: 70 };

function exists(p) {
  return fs.existsSync(p);
}

function pngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function imgPara(filePath, maxW = 470, label) {
  if (!exists(filePath)) {
    return new Paragraph({
      spacing: P,
      children: [new TextRun({ text: `[Diagramme manquant : ${path.basename(filePath)}]`, italics: true })],
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

function figureBlock(caption, filePath, maxW = 470, label) {
  return [imgPara(filePath, maxW, label), figCaption(caption)];
}

let fig = 1;
function figCaption(text) {
  return new Paragraph({
    spacing: { before: 40, after: 50 },
    children: [new TextRun({ text: `Figure ${fig++} : ${text}`, bold: true, size: 20 })],
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: H1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: H2, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 50 }, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: P,
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, bold: opts.bold, size: 22 })],
  });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 50 }, children: [new TextRun({ text, size: 22 })] });
}

const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width ?? 4500, type: WidthType.DXA },
    shading: opts.header ? { fill: "E8F0FA", type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.header, size: 20 })] })],
  });
}

function ficheTable(data) {
  const rows = [
    ["Titre", data.title],
    ["Résumé", data.summary],
    ["Acteurs", data.actors],
    ["Préconditions", data.pre],
    ["Scénario nominal", data.scenario],
    ["Postconditions", data.post],
    ["Exceptions", data.exception],
  ];
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2000, 7026],
    rows: rows.map(([k, v], i) =>
      new TableRow({ children: [cell(k, { width: 2000, header: i === 0 }), cell(v, { width: 7026 })] }),
    ),
  });
}

function mappingTable(rows) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2200, 6826],
    rows: rows.map(([k, v], i) =>
      new TableRow({ children: [cell(k, { width: 2200, header: i === 0 }), cell(v, { width: 6826 })] }),
    ),
  });
}

const MODULES = [
  {
    num: 1,
    id: "UC-A01",
    title: "Authentification",
    heading: "Module Authentification",
    uc: path.join(DOCS, "diagramme uses case module", "uc-authentification.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-authentification.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite s'authentifier.png"),
    fiche: {
      title: "S'authentifier et gérer le profil",
      summary: "Permettre à toute personne d'accéder à E-Tontine via inscription, connexion, réinitialisation du mot de passe et mise à jour du profil.",
      actors: "Utilisateur",
      pre: "Pour la connexion : disposer d'un compte. Pour l'inscription : email, mot de passe, nom, prénom et téléphone valides et uniques.",
      scenario:
        "• L'utilisateur ouvre la page d'inscription ou de connexion ;\n• Il saisit ses informations ;\n• Le système authentifie via Supabase Auth et charge le profil Prisma ;\n• L'utilisateur accède au tableau de bord ou modifie son profil.",
      post: "Session active et profil utilisateur disponible pour les modules protégés.",
      exception: "Identifiants incorrects, email ou téléphone déjà utilisé, lien de réinitialisation expiré.",
    },
  },
  {
    num: 2,
    id: "UC-G01",
    title: "Groupes",
    heading: "Module Groupes",
    uc: path.join(DOCS, "diagramme uses case module", "uc-groupes.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-groupes.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite gerer un groupe.png"),
    fiche: {
      title: "Gérer un groupe de tontine",
      summary: "Créer, configurer, supprimer un groupe et produire un rapport global.",
      actors: "Administrateur",
      pre: "L'utilisateur est authentifié. Pour la modification ou suppression : rôle ADMIN sur le groupe.",
      scenario:
        "• L'administrateur crée un groupe (nom, description, devise) ;\n• Le système enregistre le groupe et nomme le créateur ADMIN ;\n• L'administrateur configure les paramètres ou exporte un rapport ;\n• Il peut supprimer le groupe si les règles métier le permettent.",
      post: "Le groupe est visible dans le tableau de bord des membres autorisés.",
      exception: "Données invalides, droits insuffisants, groupe avec opérations non clôturées.",
    },
  },
  {
    num: 3,
    id: "UC-M01",
    title: "Membres",
    heading: "Module Membres",
    uc: path.join(DOCS, "diagramme uses case module", "uc-membres.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-membres.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite gerer memebres et invitation.png"),
    fiche: {
      title: "Gérer les membres et invitations",
      summary: "Intégrer des participants, gérer rôles, exclusions et réintégrations.",
      actors: "Utilisateur, Membre, Administrateur",
      pre: "Le groupe existe. Code d'invitation valide pour rejoindre. Administrateur ACTIF pour les actions de gestion.",
      scenario:
        "• L'utilisateur rejoint le groupe via un lien d'invitation ;\n• Le membre consulte la liste ou demande une réintégration ;\n• L'administrateur génère des invitations, promeut, exclut ou valide une réintégration ;\n• Le système met à jour rôle (ADMIN/MEMBRE) et statut d'adhésion.",
      post: "Liste des membres et droits à jour.",
      exception: "Invitation révoquée, membre déjà présent, réintégration non validée.",
    },
  },
  {
    num: 4,
    id: "UC-C01",
    title: "Cycles",
    heading: "Module Cycles",
    uc: path.join(DOCS, "diagramme uses case module", "uc-cycles.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-cycles.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite gerer cycle.png"),
    fiche: {
      title: "Gérer un cycle de tontine",
      summary: "Piloter un cycle rotatif : cotisations, pénalités, versements du pot et échanges de tour.",
      actors: "Membre, Administrateur",
      pre: "Groupe avec au moins deux membres ACTIFS. Cycle ouvert ou en cours de création.",
      scenario:
        "• L'administrateur crée un cycle (montant, tours, participants, ordre) ;\n• Les membres paient leurs cotisations ; l'administrateur peut enregistrer des paiements ;\n• Le système calcule échéances et pénalités ;\n• L'administrateur verse le pot au bénéficiaire du tour ; les échanges de place sont validés.",
      post: "Cycle avancé avec traçabilité des cotisations et distributions.",
      exception: "Tour incomplet, montant incohérent, échange refusé.",
    },
  },
  {
    num: 5,
    id: "UC-R01",
    title: "Rubriques",
    heading: "Module Rubriques",
    uc: path.join(DOCS, "diagramme uses case module", "uc-rubriques.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-rubriques.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite gerer rubrique.png"),
    fiche: {
      title: "Gérer les rubriques de cotisation",
      summary: "Créer des cotisations complémentaires et suivre paiements, retraits et versements au pot commun.",
      actors: "Membre, Administrateur",
      pre: "Membres cibles ACTIFS. Rubrique ouverte pour les paiements.",
      scenario:
        "• L'administrateur crée une rubrique (montant, fréquence, membres) ;\n• Le membre règle sa rubrique ;\n• Le système met à jour la caisse rubrique et le statut visuel ;\n• L'administrateur peut effectuer un retrait ou verser au pot commun.",
      post: "Soldes rubrique et historique des paiements cohérents.",
      exception: "Rubrique clôturée, montant insuffisant, solde indisponible.",
    },
  },
  {
    num: 6,
    id: "UC-RE01",
    title: "Réunions",
    heading: "Module Réunions",
    uc: path.join(DOCS, "diagramme uses case module", "uc-reunions.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-reunions.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite gerer reunions.png"),
    fiche: {
      title: "Gérer les réunions",
      summary: "Planifier les réunions, enregistrer présences et amendes, gérer la caisse dédiée.",
      actors: "Membre, Administrateur",
      pre: "Groupe avec membres ACTIFS.",
      scenario:
        "• L'administrateur planifie une réunion (date, lieu, amende) ;\n• Le membre consulte, signale une absence ou paie une amende ;\n• L'administrateur saisit les présences ;\n• Le système calcule les amendes et met à jour la caisse amendes.",
      post: "Réunion tenue avec feuille de présence à jour.",
      exception: "Double saisie, réunion annulée, amende déjà réglée.",
    },
  },
  {
    num: 7,
    id: "UC-E01",
    title: "Épargne",
    heading: "Module Épargne",
    uc: path.join(DOCS, "diagramme uses case module", "uc-epargne.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-epargne.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite gerer epargne.png"),
    fiche: {
      title: "Gérer l'épargne individuelle",
      summary: "Ouvrir des comptes épargne, enregistrer dépôts/retraits et auditer les mouvements.",
      actors: "Membre, Administrateur",
      pre: "Membre ACTIF. Compte épargne ouvert ou en cours d'ouverture.",
      scenario:
        "• L'administrateur ouvre un compte épargne ;\n• Le membre ou l'administrateur enregistre dépôts et retraits ;\n• Le membre consulte son solde ;\n• En cas de litige, le membre signale un mouvement pour audit admin.",
      post: "Solde et historique des mouvements à jour.",
      exception: "Compte bloqué, solde insuffisant, montant invalide.",
    },
  },
  {
    num: 8,
    id: "UC-P01",
    title: "Prêts",
    heading: "Module Prêts",
    uc: path.join(DOCS, "diagramme uses case module", "uc-prets.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-prets.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite gerer prets.png"),
    fiche: {
      title: "Gérer les prêts internes",
      summary: "Demander un prêt, mobiliser des avalistes (membres), approuver, décaisser et rembourser.",
      actors: "Membre, Administrateur",
      pre: "Paramètres prêt définis. Emprunteur éligible. Banque du groupe suffisante.",
      scenario:
        "• Le membre soumet une demande et propose des avalistes ;\n• D'autres membres acceptent la garantie ;\n• L'administrateur approuve ou refuse, puis décaisse ;\n• Le membre rembourse capital et intérêts selon l'échéancier.",
      post: "Prêt au statut EN_COURS, SOLDE ou DEFAUT selon le remboursement.",
      exception: "Non-éligibilité, garantie refusée, plafond ou banque insuffisante.",
    },
  },
  {
    num: 9,
    id: "UC-PA01",
    title: "Paiements",
    heading: "Module Paiements",
    uc: path.join(DOCS, "diagramme uses case module", "uc-paiements.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-paiements.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite effectuer un paiement mobile money.png"),
    fiche: {
      title: "Effectuer un paiement Mobile Money",
      summary: "Initier et suivre un paiement lié à une cotisation, rubrique, amende, épargne ou autre contexte métier.",
      actors: "Membre, Administrateur",
      pre: "Utilisateur autorisé sur le contexte. Montant et bénéficiaire valides.",
      scenario:
        "• Le membre ou l'administrateur initie un paiement Mobile Money ;\n• Le système crée une transaction en attente ;\n• L'opérateur confirme ou rejette l'opération ;\n• Le système finalise : mise à jour métier, caisses et journal financier.",
      post: "Transaction SUCCESS et soldes cohérents.",
      exception: "Paiement expiré, fonds insuffisants, opérateur indisponible.",
    },
  },
  {
    num: 10,
    id: "UC-F01",
    title: "Finances",
    heading: "Module Finances",
    uc: path.join(DOCS, "diagramme uses case module", "uc-finances.png"),
    ssd: path.join(DOCS, "diagramme de sequence systeme", "ssd-finances.png"),
    act: path.join(DOCS, "diagramme-d'activite", "activite consulter finance.png"),
    fiche: {
      title: "Consulter les finances et rapports",
      summary: "Consulter caisses, journal financier et télécharger relevés PDF ou exports.",
      actors: "Membre, Administrateur",
      pre: "Membre ACTIF du groupe.",
      scenario:
        "• L'utilisateur ouvre le module Finances ;\n• Le système affiche caisses typées et journal paginé ;\n• L'utilisateur consulte soldes et mouvements ;\n• Il peut télécharger un relevé PDF ou un export selon ses droits.",
      post: "Affichage conforme à l'état des caisses et mouvements.",
      exception: "Accès refusé, membre exclu ou données masquées.",
    },
  },
];

const GLOBAL_UC_ROWS = [
  ["Acteur", "Cas d'utilisation"],
  [
    "Administrateur",
    "Créer un groupe ; Gérer les membres ; Gérer les cycles ; Gérer rubriques ; Gérer réunions ; Gérer l'épargne ; Gérer les prêts ; Générer rapports",
  ],
  [
    "Membre",
    "Payer cotisation ; Payer rubrique ; Consulter cycle ; Demander échange ; Déposer épargne ; Demander prêt ; Consulter finances ; Accepter garantie",
  ],
  ["Utilisateur", "S'inscrire ; Se connecter ; Rejoindre un groupe"],
  ["Cas transversal", "S'authentifier — inclus par les seize cas métier nécessitant une session active"],
];

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1800 },
    children: [new TextRun({ text: "CAHIER D'ANALYSE", bold: true, size: 36 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "Projet E-TONTINE", bold: true, size: 28 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: "Application web de gestion de tontines communautaires", size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [new TextRun({ text: `Version 1.0 — ${DATE}`, size: 22 })],
  }),
  new Paragraph({ children: [new PageBreak()] }),

  // I. Contexte
  h1("I. Contexte du projet"),
  p(
    "Au Cameroun et en Afrique subsaharienne, la tontine reste un pilier de l'épargne collective informelle : associations de quartier, groupes de femmes, coopératives professionnelles ou diasporas cotisent régulièrement pour constituer un pot commun, se prêter mutuellement ou financer des projets communs.",
  ),
  p(
    "Cette pratique repose encore largement sur des registres papier, des carnets personnels, des calculs manuels et des échanges informels (réunions physiques, appels, messageries). Les conséquences sont concrètes : erreurs de calcul, oublis de paiement, retards non suivis, conflits entre membres, opacité sur l'utilisation des fonds et risque de détournement.",
  ),
  p(
    "Les outils généralistes (tableurs, applications de chat) ne couvrent pas le cycle complet d'une tontine : gestion des tours rotatifs, pénalités, rubriques parallèles, réunions avec amendes, épargne individuelle, prêts internes avec avalistes, journal financier multi-caisses et paiements Mobile Money.",
  ),
  p(
    "E-Tontine répond à ce vide en proposant une application web centralisée, traçable et sécurisée, adaptée aux réalités locales (devise FCFA, Mobile Money Orange/MTN) tout en respectant la flexibilité des règles propres à chaque groupe.",
  ),
  p("Problématique : comment concevoir une application web permettant aux groupes de tontine de gérer membres, cycles, cotisations, rubriques, réunions, épargne, prêts et finances, tout en garantissant transparence, traçabilité et contrôle d'accès par rôle ?", { bold: false }),
  p("Objectif général : offrir une plateforme fiable où administrateurs et membres pilotent les activités financières et organisationnelles d'un groupe en temps réel.", { bold: false }),

  // II. Besoins
  h1("II. Rappel des besoins"),
  h2("II.1 Besoins fonctionnels"),
  bullet("Authentification : inscription, connexion, déconnexion, réinitialisation et profil utilisateur."),
  bullet("Groupes : création, configuration, suppression et rapports globaux."),
  bullet("Membres : invitations, rôles ADMIN/MEMBRE, exclusion et réintégration."),
  bullet("Cycles : participants, ordre de passage, cotisations, pénalités, versements et échanges."),
  bullet("Rubriques : cotisations complémentaires, paiements et retraits."),
  bullet("Réunions : planification, présences, amendes et caisse dédiée."),
  bullet("Épargne : comptes individuels, dépôts, retraits, signalements et audit."),
  bullet("Prêts : demande, avalistes, approbation, décaissement et remboursement."),
  bullet("Paiements : initiation et suivi Mobile Money multi-contextes."),
  bullet("Finances : journal centralisé, caisses typées, notifications et exports PDF/Excel."),

  h2("II.2 Besoins non fonctionnels"),
  bullet("Sécurité : authentification Supabase, sessions serveur, contrôle d'accès par membership et rôle."),
  bullet("Intégrité : transactions atomiques Prisma, journal avec soldes avant/après."),
  bullet("Performance : indexation PostgreSQL, pagination des listes financières."),
  bullet("Disponibilité : déploiement cloud (Vercel), endpoint de santé, Node.js ≥ 20."),
  bullet("Utilisabilité : interface responsive FR/EN, statuts visuels VERT/ORANGE/ROUGE."),
  bullet("Traçabilité : notifications métier, rapports exportables, audit épargne."),

  // III. Acteurs
  h1("III. Acteurs du système"),
  p("Le modèle d'acteurs retenu pour E-Tontine comporte trois rôles principaux :"),
  p("Utilisateur : personne accédant à l'application sans être encore membre d'un groupe (inscription, connexion, ouverture d'une invitation).", { bold: false }),
  p("Membre : utilisateur authentifié adhérant à un groupe (rôle MEMBRE ou ADMIN) ; participe aux cycles, paie ses obligations, consulte épargne et prêts.", { bold: false }),
  p("Administrateur : membre disposant du rôle ADMIN ; pilote le groupe (membres, cycles, rubriques, réunions, épargne, prêts, rapports). Généralisation UML : Administrateur → Membre.", { bold: false }),
  p("Les rôles métier temporaires (emprunteur, avaliste) sont couverts par l'acteur Membre ; les acteurs externes (opérateur Mobile Money) interviennent dans les séquences de paiement sans figurer sur le diagramme global.", { bold: false }),

  // IV. UC global
  h1("IV. Diagramme de cas d'utilisation global"),
  p("Le diagramme suivant synthétise les cas d'utilisation du système E-Tontine, les acteurs et la relation transversale « S'authentifier »."),
  ...figureBlock("Diagramme de cas d'utilisation global — Système E-Tontine", path.join(DOCS, "uc-global-e-tontine.png"), 500, "UC global"),
  h2("IV.1 Inventaire des cas et acteurs"),
  mappingTable(GLOBAL_UC_ROWS),
  p("Relations principales : associations acteur–cas ; seize cas incluent « S'authentifier » ; « Générer rapports » étend « Consulter finances ».", { bold: false }),

  // V. Contexte
  h1("V. Diagramme de contexte"),
  p("Le diagramme de contexte situe E-Tontine parmi les acteurs humains et les systèmes externes (Supabase Auth, PostgreSQL, opérateurs Mobile Money, service d'email)."),
  ...figureBlock("Diagramme de contexte du système E-Tontine", path.join(DOCS, "diagramme-contexte-e-tontine.png"), 500, "Contexte"),

  // VI. Packages
  h1("VI. Diagramme de packages"),
  p("Le découpage en packages reflète l'architecture modulaire de l'application : présentation (Next.js), métier (lib, API), persistance (Prisma) et intégrations externes."),
  ...figureBlock("Diagramme de packages E-Tontine", path.join(DOCS, "diagramme-packages-e-tontine.png"), 500, "Packages"),

  // VII. Modules
  h1("VII. Analyse des modules"),
  p("Chaque module métier est analysé par une fiche descriptive, un diagramme de cas d'utilisation, un diagramme de séquence système et un diagramme d'activité."),
];

for (const mod of MODULES) {
  children.push(
    h2(`VII.${mod.num} ${mod.heading}`),
    p(`Identifiant : ${mod.id}`, { bold: false }),
    h3("Fiche descriptive"),
    ficheTable(mod.fiche),
    h3("Diagramme de cas d'utilisation"),
    ...figureBlock(`Cas d'utilisation — ${mod.title}`, mod.uc, 480, `UC ${mod.title}`),
    h3("Diagramme de séquence système"),
    ...figureBlock(`Séquence système — ${mod.title}`, mod.ssd, 480, `SSD ${mod.title}`),
    h3("Diagramme d'activité"),
    ...figureBlock(`Activité — ${mod.title}`, mod.act, 460, `Activité ${mod.title}`),
  );
}

children.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1("VIII. Diagramme de classes"),
  p("Le diagramme de classes modélise les entités du domaine E-Tontine et leurs associations, en cohérence avec le schéma Prisma."),
  ...figureBlock("Diagramme de classes du système E-Tontine", path.join(DOCS, "diagrame-de-classe-e-tontine.png"), 500, "Classes"),
  h2("VIII.1 Principales entités"),
  bullet("User : compte plateforme lié à Supabase Auth."),
  bullet("Groupes / MembreGroupe : espace tontine et adhésions (rôle, statut)."),
  bullet("CycleTontine, Cotisations, Penalites, Versement : cycle rotatif et flux financiers."),
  bullet("RubriqueCotisation, PaiementRubrique : cotisations complémentaires."),
  bullet("Reunion, PresenceReunion : réunions et présences."),
  bullet("CompteEpargne, MouvementEpargne : épargne individuelle."),
  bullet("Pret, AvalistePret, RemboursementPret : prêts internes."),
  bullet("CaisseFinanciere, MouvementFinancier, PaymentTransaction : trésorerie et paiements."),

  h1("Conclusion"),
  p(
    "Ce cahier d'analyse présente le contexte et la problématique d'E-Tontine, les besoins fonctionnels et non fonctionnels, les acteurs, les vues globales (cas d'utilisation, contexte, packages), l'analyse détaillée des dix modules métier et le modèle de classes. Il constitue la base analytique alignée sur l'application développée et sur l'ensemble des diagrammes UML du projet.",
  ),
);

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 26, bold: true, font: "Arial" },
        paragraph: { spacing: H1, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: H2, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 22, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 100, after: 50 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: "bullet", text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
        },
      },
      children,
    },
  ],
});

fs.writeFileSync(OUT, await Packer.toBuffer(doc));
console.log(`Cahier d'analyse généré : ${OUT}`);
