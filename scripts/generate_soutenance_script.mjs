import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DOCX = path.join(__dirname, "..", "Docs", "soutenance-script.docx");
const FONT = "Times New Roman";

console.log("Generating updated oral defense narration script...");

// Helpers for document structure
function body(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? 22,
        bold: opts.bold ?? false,
        italics: opts.italic ?? false,
        color: opts.color ?? "000000",
      }),
    ],
  });
}

function titlePara(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 32,
        bold: true,
        color: "006B2C",
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: "006B2C" })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: "4059AA" })],
  });
}

function callout(text, title = "CONSEIL DE PRÉSENTATION") {
  const border = { style: BorderStyle.SINGLE, size: 6, color: "4059AA" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F4FCF0" },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: `[${title}]`, font: FONT, size: 18, bold: true, color: "4059AA" })],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [new TextRun({ text, font: FONT, size: 18, italics: true, color: "333333" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

const slideData = [
  {
    num: 1,
    title: "Page de Garde (Titre et Présentation)",
    duration: "30 secondes",
    focus: "Titre du projet, logos de l'UPAC, et noms des encadreurs.",
    narration: "Monsieur le Président, honorables membres du jury, bonjour. C’est un honneur pour moi de me présenter devant vous aujourd’hui pour la soutenance de mon mémoire de licence en science de l'ingénieur, option Génie Informatique. Mon projet s'intitule : « Analyse et Implémentation d'une application web de gestion de tontines communautaires », sous le nom commercial E-Tontine. J'ai eu le privilège de mener ces travaux sous la direction académique du Dr. KUNGNE Willy, enseignant à l’UPAC, et sous l’encadrement professionnel de M. TAFOTSI Dimitri, directeur technique chez Worketyamo.",
    tip: "Commencez d'un ton calme, assuré et fort. Tenez-vous droite et regardez les membres du jury dans les yeux lors des salutations. Ne vous précipitez pas."
  },
  {
    num: 2,
    title: "Plan de la Présentation",
    duration: "30 secondes",
    focus: "Grille claire structurant la présentation en 6 étapes majeures.",
    narration: "Pour structurer mon propos de manière claire et concise, j'ai adopté le plan suivant. Tout d'abord, nous situerons le projet dans son contexte et sa problématique, ce qui nous amènera aux objectifs fixés et à l'étude de l'existant. Ensuite, nous aborderons la stack technologique et la modélisation UML. Nous passerons ensuite à l'architecture globale et au fonctionnement des modules métiers essentiels de l'application. Nous analyserons ensuite la démonstration visuelle à travers des captures d'écran réelles, avant de conclure en mettant en valeur le bilan de ce projet et ses perspectives d'évolution.",
    tip: "Présentez le plan de manière dynamique sans lire textuellement chaque sous-point. Montrez au jury que vous maîtrisez la trajectoire de votre exposé."
  },
  {
    num: 3,
    title: "Transition - Première Partie : Contexte, Problématique & Objectifs",
    duration: "15 secondes",
    focus: "Diapositive de transition épurée sur fond vert foncé.",
    narration: "Nous allons commencer notre exposé par la première partie, dédiée au contexte, à la problématique locale de notre étude ainsi qu'aux objectifs assignés à notre projet de fin d'études.",
    tip: "Passez rapidement sur cette slide de transition, elle sert de repère visuel pour le jury."
  },
  {
    num: 4,
    title: "Contexte & Limites des Tontines Traditionnelles",
    duration: "1 minute 15 secondes",
    focus: "Texte à gauche (principes et limites), et photo contextuelle des femmes en tontine au Cameroun à droite.",
    narration: "Situons tout d'abord le projet. Au Cameroun, les tontines (appelées localement Djangui ou Njangi) sont des structures de finance informelle incontournables. Comme l'illustre l'image à droite, elles constituent un pilier majeur de solidarité sociale, d'épargne collective et de micro-crédit. Malgré leur importance socio-économique, leur gestion reste majoritairement traditionnelle : tenue manuelle de registres papier et manipulation d'espèces. Cette gestion souffre de graves limites : la vulnérabilité physique des registres (perte ou dégradation), les risques d'erreurs comptables créant de l'opacité et de la suspicion, l'insécurité liée à la détention d'espèces, et l'exclusion des membres de la diaspora en raison de la contrainte de présence physique. La problématique est donc : Comment moderniser et sécuriser ces flux grâce au numérique tout en préservant le lien social et la confiance communautaire ?",
    tip: "Insistez bien sur le terme local 'Djangui/Njangi' et sur la vulnérabilité de la gestion manuelle. Pointez l'image à droite pour ancrer votre discours dans le contexte local."
  },
  {
    num: 5,
    title: "Objectifs du Projet E-Tontine",
    duration: "45 secondes",
    focus: "Objectif général et spécifiques à gauche, et schéma cible 'avec.png' à droite.",
    narration: "Pour répondre à cette problématique, notre objectif général est de concevoir et implémenter la plateforme E-Tontine : une solution web centralisée, transparente et hautement sécurisée pour automatiser la gestion d'une association d'épargne collective. Spécifiquement, nos travaux visent à : premièrement, digitaliser les cycles rotatifs de cotisations ; deuxièmement, garantir une traçabilité totale via un journal financier immuable ; troisièmement, intégrer un module d'épargne individuelle et de prêt interne avec un système d'avalistes pour mitiger le risque de crédit ; quatrièmement, simuler des paiements Mobile Money Orange et MTN ; et enfin, automatiser la gestion administrative comme les présences et les amendes de réunion. Le schéma de droite montre la transition vers ce modèle connecté et dématérialisé.",
    tip: "Articulez bien les cinq objectifs spécifiques, car chacun correspond à un module fonctionnel que vous allez présenter par la suite."
  },
  {
    num: 6,
    title: "Étude de l'Existant & Limites (Tableau)",
    duration: "45 secondes",
    focus: "Tableau comparatif des solutions existantes (Cirkkle, Njangi App, Djangui 3.0, Kika, E-Tontine).",
    narration: "Dans le cadre de l'étude de l'existant, nous avons comparé plusieurs solutions numériques. Cirkkle propose des transferts mobiles mais prélève des commissions élevées et n'offre pas de gouvernance associative complète. Njangi App se limite à la planification sans automatisation comptable. Djangui 3.0 manque de traçabilité et d'une interface responsive. Kika ne gère pas l'épargne et les prêts avec avalistes. Face à cela, E-Tontine se démarque par le cloisonnement des groupes, la gestion de 4 caisses budgétaires distinctes, l'octroi de crédits sécurisés par avalistes, et une simulation locale de transactions Mobile Money sans frais.",
    tip: "C'est une diapositive très synthétique. Passez en revue les limites principales rapidement pour montrer comment E-Tontine comble les lacunes du marché."
  },
  {
    num: 7,
    title: "Transition - Deuxième Partie : Conception & Architecture Technique",
    duration: "15 secondes",
    focus: "Diapositive de transition sur fond bleu secondaire.",
    narration: "Cette transition nous amène à la deuxième partie de notre présentation, où nous allons détailler la stack technologique retenue et la modélisation de notre système d'information.",
    tip: "Cette slide donne un rythme structuré à votre présentation."
  },
  {
    num: 8,
    title: "Stack Technologique & Justifications",
    duration: "1 minute",
    focus: "Grille de 6 cartes avec logos (Next.js, React, Prisma, PostgreSQL, Supabase, Tailwind).",
    narration: "Pour répondre aux exigences de performance, de sécurité et d'adaptabilité, nous avons sélectionné la stack technique affichée. Next.js 15 a été choisi comme framework full-stack unifié en TypeScript car il intègre nativement le routage et les Server Components, ce qui améliore la sécurité. React 19 gère notre interface utilisateur fluide. Pour l'accès aux données, Prisma ORM apporte le typage TypeScript de nos tables et prévient les injections SQL par des requêtes paramétrées. Concernant l'hébergement, Supabase nous fournit une base PostgreSQL managée et une gestion robuste des sessions. Nous l'avons préféré à Firebase car les données financières d'une tontine nécessitent des transactions complexes et des contraintes relationnelles fortes, inadaptées au modèle NoSQL. Enfin, Tailwind CSS assure un design responsive léger.",
    tip: "La comparaison PostgreSQL (Supabase) vs NoSQL (Firebase) est un excellent argument pour séduire un jury d'ingénieurs en montrant votre compréhension des paradigmes de bases de données."
  },
  {
    num: 9,
    title: "Modélisation : Diagramme de Cas d'Utilisation Global",
    duration: "1 minute",
    focus: "Diagramme de cas d'utilisation global à gauche, légende UML et rôles à droite.",
    narration: "Pour modéliser les fonctionnalités, nous avons utilisé UML. Le diagramme de cas d'utilisation global met en scène deux acteurs internes : le Membre du groupe et l'Administrateur du groupe, en interaction avec un acteur externe qui est l'API de Paiement Mobile Money. On remarque la frontière logique de notre application : le Membre interagit principalement avec les cas liés aux opérations financières personnelles et à la vie du groupe (épargne, cycle, réunion), tandis que l'Administrateur supervise la modération des membres, le paramétrage des cycles et la validation des transactions de caisse.",
    tip: "Pointez le diagramme à l'écran. Mentionnez l'interaction claire avec l'API externe pour illustrer l'intégration des flux de paiement mobile."
  },
  {
    num: 10,
    title: "Architecture Générale du Système",
    duration: "1 minute",
    focus: "Schéma d'architecture 3-tiers à gauche, légende des couches à droite.",
    narration: "Afin de garantir la maintenabilité et la robustesse de la plateforme, nous avons adopté une architecture trois tiers. La couche Présentation est exécutée côté client dans le navigateur web via des composants React réactifs. La couche Application réside sur le serveur Next.js 15 hébergé sur Vercel. Elle traite la logique métier à travers des API Routes et des Server Actions sécurisées par notre middleware d'authentification. Enfin, la couche de Données s'appuie sur une base de données relationnelle PostgreSQL hébergée sur Supabase, le dialogue entre le serveur et la base étant assuré de manière transparente par Prisma ORM.",
    tip: "Expliquez au jury comment les requêtes circulent du client vers le serveur puis vers la base de données, en passant par le middleware pour vérifier la session."
  },
  {
    num: 11,
    title: "Fonctionnement : Cycle de Cotisation Rotative",
    duration: "1 minute",
    focus: "Diagramme de séquence créer-cycle à gauche, explication du flux à droite.",
    narration: "Entrons dans la logique métier clé d'E-Tontine : les cycles de cotisations rotatives. L'administrateur crée le cycle en configurant le montant unitaire et les participants. Le système génère automatiquement un ordre de passage pour les distributions. À chaque échéance, les participants effectuent leur cotisation. Le système collecte et accumule ces fonds dans une caisse cloisonnée. Dès que la totalité du pot est réunie, la distribution est validée et le pot est versé au bénéficiaire désigné de la période. Le diagramme de séquence système affiché à l'écran illustre le flux technique des requêtes entre l'interface utilisateur, le serveur Next.js et la base de données PostgreSQL via Prisma lors de ce processus.",
    tip: "Expliquez que le système gère les cas d'échange de tours entre les membres, ce qui apporte une grande souplesse par rapport aux tontines physiques."
  },
  {
    num: 12,
    title: "Transition - Troisième Partie : Démonstration Visuelle & Résultats",
    duration: "15 secondes",
    focus: "Diapositive de transition sur fond bleu marine.",
    narration: "Nous allons maintenant aborder notre troisième et dernière partie, consacrée à la démonstration visuelle de l'application, au bilan technique de sa mise en œuvre, ainsi qu'aux perspectives d'évolution.",
    tip: "Cette transition permet de relancer l'attention du jury pour la démonstration."
  },
  {
    num: 13,
    title: "Démonstration Visuelle : Écrans réels",
    duration: "1 minute 15 secondes",
    focus: "Grille 2x2 de captures d'écran de l'application (Accueil, Tableau de bord, Finances, Membres).",
    narration: "Voici un aperçu concret des interfaces de notre application. En haut à gauche, la page d'accueil présente la plateforme. En haut à droite, nous observons le tableau de bord général d'un groupe, affichant la synthèse des contributions, le tour en cours et les informations sur les réunions. En bas à gauche, l'interface de gestion comptable présente notre journal de caisse et la ventilation des quatre comptes financiers du groupe. Enfin, en bas à droite, le panneau de gestion des membres permet de suivre les statuts et d'assigner des rôles spécifiques. On note également l'indicateur visuel de régularité (code couleur Vert, Orange, Rouge) calculé automatiquement en fonction des cotisations et amendes impayées, permettant une surveillance rapide par le groupe.",
    tip: "Pointez les captures d'écran une par une à l'aide d'un pointeur ou de la main, en expliquant brièvement l'intérêt du journal comptable unique."
  },
  {
    num: 14,
    title: "Bilan, Limites & Perspectives",
    duration: "1 minute",
    focus: "Double carte distinguant le bilan et les limites à gauche, et les perspectives à droite.",
    narration: "En bilan de ce travail, nous disposons d'une plateforme web robuste, testée et déployée sur Vercel. Cependant, nous restons conscients de ses limites actuelles : la principale étant la simulation des paiements mobiles Orange et MTN, due aux restrictions d'accès aux clés d'API de production en phase académique. Nos perspectives de développement consistent donc à : Premièrement, intégrer un agrégateur de paiement local certifié comme Monetbil ou Campay pour traiter de vrais transferts. Deuxièmement, concevoir une application mobile native avec React Native. Et troisièmement, implémenter un algorithme de credit scoring pour évaluer la fiabilité des membres sur la base de leur historique financier.",
    tip: "Présentez les limites avec honnêteté. Les jurys apprécient l'esprit critique d'un ingénieur qui sait reconnaître les limites de son prototype et proposer des solutions réalistes."
  },
  {
    num: 15,
    title: "Conclusion & Remerciements",
    duration: "45 secondes",
    focus: "Diapositive finale de remerciements et appel aux questions sur fond bleu marine.",
    narration: "En conclusion, E-Tontine modernise avec succès la finance informelle camerounaise en alliant la rigueur des architectures Web modernes et la souplesse des usages mobiles. Cette plateforme offre une solution concrète, traçable et sécurisée aux millions de tontiniers locaux. Honorables membres du jury, je tiens à vous remercier pour votre aimable attention. Je suis maintenant disposée à écouter vos avis, remarques et à répondre à l'ensemble de vos questions.",
    tip: "Inclinez-vous légèrement en signe de politesse et restez silencieuse, souriante et prête à noter les remarques des jurés sur un bloc-notes."
  }
];

const children = [
  titlePara("GUIDE DE NARRATION & SCRIPT DE SOUTENANCE (ACTUALISÉ)"),
  body("Ce document contient le script oral complet et actualisé de la soutenance de licence en ingénierie informatique de FOUEDJIO YVANNA FAYELLE, option Génie Informatique, Université Protestante d'Afrique Centrale (UPAC).", { italic: true, center: true, after: 200 }),
  
  h1("1. Consignes Générales de Présentation"),
  body("• Temps imparti : 10 minutes maximum. Le script ci-dessous est calibré pour durer précisément entre 8 et 10 minutes à un rythme de parole posé (environ 120-130 mots par minute)."),
  body("• Attitude physique : Tenez-vous droite, souriez, et balayez le jury du regard. Ne fixez pas vos notes en permanence. Utilisez les gestes pour pointer les diapositives et les diagrammes à l'écran."),
  body("• Préparation : Préparez un bloc-notes et un stylo pour noter immédiatement les questions et remarques du jury sans les interrompre."),
  body("• Matériel : Testez la télécommande de présentation (si disponible) et le projecteur 10 minutes avant votre passage pour vous assurer du bon rendu des couleurs (fond vert d'E-Tontine)."),

  h1("2. Tableau Synthétique des Diapositives"),
];

// Table of slides summary
const tableHeader = ["N°", "Titre de la Diapositive", "Durée", "Focalisation Visuelle"];
const tableRows = [
  new TableRow({
    children: tableHeader.map(text => new TableCell({
      shading: { fill: "E2F0D9" },
      children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: 20, bold: true })] })]
    }))
  }),
  ...slideData.map(slide => new TableRow({
    children: [
      slide.num.toString(),
      slide.title,
      slide.duration,
      slide.focus
    ].map(text => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: 18 })] })]
    }))
  }))
];

children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
  },
  rows: tableRows
}));

children.push(body("", { after: 200 }));
children.push(h1("3. Script Détaillé Diapositive par Diapositive"));

slideData.forEach(slide => {
  children.push(h2(`Diapositive ${slide.num} : ${slide.title}`));
  children.push(body(`Durée estimée : ${slide.duration}  |  Focalisation : ${slide.focus}`, { italic: true, color: "777777" }));
  children.push(body(slide.narration, { after: 120 }));
  children.push(callout(slide.tip));
  children.push(body("", { after: 160 }));
});

// Q&A advice section
children.push(h1("4. Guide de préparation aux Questions du Jury (FAQ)"));
children.push(body("Voici les réponses courtes et percutantes à préparer pour les questions les plus probables du jury :", { bold: true }));

const faqData = [
  ["Pourquoi une application web Next.js et pas une application mobile native (Android/iOS) ?", "Une application web responsive avec Next.js permet de couvrir à la fois les utilisateurs sur ordinateur et sur smartphone avec une seule base de code, réduisant les coûts et le temps de développement. Les tontiniers peuvent s'y connecter instantanément via un simple navigateur mobile sans devoir installer une application lourde sur des téléphones parfois limités en stockage."],
  ["Les paiements Orange Money et MTN MoMo sont-ils réels ?", "Dans le prototype actuel, les paiements sont simulés via une couche logicielle (payment-simulation.ts) qui reproduit fidèlement le comportement asynchrone des API de Mobile Money (délai de traitement, statuts succès/échec). Pour passer en production réelle au Cameroun, il suffira de configurer les clés d'API et de brancher un agrégateur de paiement agréé comme Monetbil ou Campay, l'architecture d'E-Tontine étant déjà conçue pour cela."],
  ["Comment assurez-vous l'isolation des données entre les groupes de tontine ?", "Chaque requête vers notre base de données filtre systématiquement les lignes par l'identifiant unique du groupe (groupId) et vérifie en amont (via notre middleware et nos helpers Prisma) que l'utilisateur connecté est bien membre actif du groupe concerné. Si ce n'est pas le cas, le serveur renvoie immédiatement une erreur 403 Forbidden."],
  ["Pourquoi avoir utilisé Prisma ORM si Supabase propose déjà des API directes ?", "Supabase fournit la base de données PostgreSQL, mais Prisma ORM nous apporte un typage statique TypeScript rigoureux au niveau du serveur Next.js, facilitant la détection des bugs dès la compilation. De plus, Prisma permet de modéliser facilement des relations complexes et de gérer des transactions SQL robustes et sécurisées, ce qui est indispensable pour garantir l'intégrité de notre journal financier."],
  ["Que se passe-t-il si deux membres paient leur cotisation exactement au même moment ?", "Nous utilisons les transactions de Prisma. Lors d'un versement, la vérification du solde, l'enregistrement du paiement et la mise à jour de la caisse sont exécutés comme une opération atomique indivisible en base de données. Si une écriture échoue, la transaction entière est annulée (rollback), ce qui garantit qu'aucun solde ou caisse ne se retrouve dans un état incohérent."]
];

faqData.forEach(([q, a]) => {
  children.push(body(`Q: ${q}`, { bold: true, color: "006B2C" }));
  children.push(body(a, { after: 120 }));
});

// Write Word file
const doc = new Document({
  sections: [{ properties: {}, children }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT_DOCX, buffer);
console.log(`Narration script document updated successfully at: ${OUT_DOCX}`);
