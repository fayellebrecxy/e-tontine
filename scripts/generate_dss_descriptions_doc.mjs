#!/usr/bin/env node
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
  PageBreak,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DSS_DIR = path.join(ROOT, "Docs", "dss");
const OUT = path.join(DSS_DIR, "descriptions_diagrammes_dss.docx");

const FONT = "Times New Roman";
const P_SPACING = { before: 80, after: 120, line: 360 }; // 1.5 line spacing
const H1_SPACING = { before: 240, after: 120 };
const H2_SPACING = { before: 180, after: 80 };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: H1_SPACING,
    children: [new TextRun({ text, bold: true, size: 28, font: FONT })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: P_SPACING,
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italic: opts.italic,
        size: 24, // 12pt
        font: FONT,
      }),
    ],
  });
}

function boldPrefixPara(prefix, text) {
  return new Paragraph({
    spacing: P_SPACING,
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({ text: prefix + " : ", bold: true, size: 24, font: FONT }),
      new TextRun({ text: text, size: 24, font: FONT }),
    ],
  });
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1000, after: 240 },
    children: [
      new TextRun({
        text: "DESCRIPTIONS DES DIAGRAMMES DE SÉQUENCE DÉTAILLÉS",
        bold: true,
        size: 30,
        font: FONT,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 1000 },
    children: [
      new TextRun({
        text: "Modélisation de la dynamique interne du système E-Tontine (Dossier DST)",
        italic: true,
        size: 22,
        font: FONT,
      }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] }),

  heading1("Description des diagrammes de séquence détaillés (DST)"),
  p(
    "Les diagrammes de séquence détaillés (DSD) du dossier DST exposent la conception interne de l'application (boîte blanche). Ils montrent comment la requête de l'acteur traverse les différentes couches logicielles (Interface Client, Contrôleurs Next.js, Services métier et tables de persistance de la base de données) pour accomplir l'opération métier."
  ),

  boldPrefixPara(
    "DSD — Se connecter (dsd-se-connecter.png)",
    "Ce diagramme détaille la logique d'authentification. L'utilisateur interagit avec le formulaire LoginForm pour saisir ses identifiants. Le ContrôleurConnexion intercepte la requête de connexion et appelle le ServiceAuthentification. Ce dernier effectue une recherche de l'utilisateur dans la table de persistance Utilisateurs. En cas de session valide, le profil et le mot de passe sont validés, un jeton d'accès (JWT) est retourné, et l'utilisateur est redirigé vers le tableau de bord. En cas d'identifiants invalides, une erreur d'authentification est renvoyée, le contrôleur retourne un statut 401 (Unauthorized) et le formulaire affiche un message d'erreur à l'écran."
  ),

  boldPrefixPara(
    "DSD — Créer cycle (dsd-creer-cycle.png)",
    "Ce diagramme détaille le processus de création d'un cycle de cotisations. L'administrateur saisit les paramètres (montant, tours) et valide le formulaire CreateCycleForm. Le ContrôleurCycles reçoit la requête et appelle le ServiceCycles pour vérifier le rôle d'administrateur du membre. Si l'accès est autorisé, le ServiceCycles commande l'enregistrement du cycle et de l'ordre de passage dans la base de données Cycles, puis confirme le succès au contrôleur qui renvoie un statut 201 (Created) pour afficher le nouveau cycle. Si l'administrateur n'est pas autorisé, le contrôleur retourne directement un statut 403 (Forbidden) et le formulaire affiche un message de droits insuffisants à l'écran."
  ),

  boldPrefixPara(
    "DSD — Planifier réunion (dsd-planifier-reunion.png)",
    "Ce diagramme détaille la planification technique d'une réunion. L'administrateur saisit les détails et valide le composant CreateReunionSheet. Le ContrôleurRéunions transmet la demande au ServiceRéunions pour valider la date de la réunion. Si la date est valide, le ServiceRéunions enregistre la réunion dans la table de persistance Réunions, et renvoie une confirmation de succès. Le contrôleur retourne alors un statut 201 (Created) et l'interface affiche la réunion planifiée. Si la date est invalide ou passée, le contrôleur retourne un statut 400 (Bad Request) et l'interface affiche un message d'erreur correspondant."
  ),

  boldPrefixPara(
    "DSD — Ouvrir compte épargne (dsd-ouvrir-compte-epargne.png)",
    "Ce diagramme illustre le processus d'ouverture de compte d'épargne. Le membre clique sur le bouton de création dans le composant CreateAccountActions. Le ContrôleurÉpargne intercepte la demande et sollicite le ServiceÉpargne pour valider la session et vérifier l'existence d'un compte dans la table ComptesÉpargne. Si aucun compte n'est trouvé, le ServiceÉpargne procède à la création du compte épargne, qui est enregistré en base de données. Le contrôleur renvoie alors un statut 201 (Created) et l'interface affiche le nouveau compte épargne. Si un compte existe déjà, une erreur de doublon est renvoyée, le contrôleur retourne un statut 409 (Conflict) et l'interface signale au membre que son compte est déjà actif."
  ),

  boldPrefixPara(
    "DSD — Demander prêt (dsd-demander-pret.png)",
    "Ce diagramme détaille la cinématique d'une demande de prêt. Le membre remplit le formulaire DemandePretForm en saisissant le montant, le motif et en sélectionnant les garants. Le ContrôleurPrêts reçoit la demande et appelle le ServicePrêts pour la valider. Le ServicePrêts interroge la table de persistance Prêts pour vérifier les conditions d'éligibilité. Si les conditions sont remplies, le prêt au statut en attente ainsi que les garanties des avalistes sont enregistrés en base de données. Le contrôleur retourne ensuite un statut 201 (Created) et le formulaire affiche le prêt en attente d'approbation. Si les fonds sont insuffisants ou le membre inéligible, une erreur d'éligibilité est retournée, le contrôleur répond avec un statut 400 (Bad Request) et l'interface affiche le motif du refus."
  ),
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 24 }, // 12pt
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 2.54cm margins (1 inch)
        },
      },
      children,
    },
  ],
});

try {
  fs.mkdirSync(DSS_DIR, { recursive: true });
  fs.writeFileSync(OUT, await Packer.toBuffer(doc));
  console.log(`Document généré avec succès : ${OUT}`);
} catch (err) {
  console.error("Erreur lors de la génération du document :", err);
  process.exit(1);
}
