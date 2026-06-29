/**
 * Analyse de mise en forme et mise en page du mémoire de référence.
 * Source : Docs/originalTAMELA.docx
 * Sortie : Docs/analyse-mise-en-forme-memoire-reference.docx
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  HeadingLevel,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "Docs", "analyse-mise-en-forme-memoire-reference.docx");
const FONT = "Times New Roman";

function twipsToCm(twips) {
  return (twips / 567).toFixed(2);
}

function pt(halfPt) {
  return halfPt / 2;
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: FONT, size: 28, bold: true })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 26, bold: true })],
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? 24,
        bold: opts.bold ?? false,
        italics: opts.italic ?? false,
      }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80 },
    bullet: { level: 0 },
    children: [new TextRun({ text, font: FONT, size: 24 })],
  });
}

function specTable(rows) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
  const borders = {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: rows.map(
      (row, i) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                shading: i === 0 ? { fill: "E8EEF7" } : undefined,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cell,
                        font: FONT,
                        size: 22,
                        bold: i === 0,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: "ANALYSE DE MISE EN FORME ET MISE EN PAGE",
        font: FONT,
        size: 32,
        bold: true,
      }),
    ],
  }),
  body(
    "Document d'analyse extrait du mémoire de référence (projet de fin d'études, Licence Génie informatique, IUYP). Ce guide recense l'ensemble des conventions typographiques, de pagination et de structuration observées dans le document source, afin de les reproduire fidèlement dans le mémoire E-Tontine.",
    { after: 200 },
  ),
  body(
    "Date d'analyse : juin 2026 — Source technique : extraction XML du fichier .docx (styles, sections, paragraphes, tableaux, en-têtes/pieds de page).",
    { italic: true, after: 300 },
  ),

  h1("1. Format de page et marges"),
  specTable([
    ["Paramètre", "Valeur observée"],
    ["Format papier", "A4 — 21,0 × 29,7 cm"],
    ["Orientation", "Portrait"],
    ["Marge supérieure", "2,50 cm"],
    ["Marge inférieure", "2,25 cm (section 1) puis 2,50 cm (corps)"],
    ["Marge gauche", "2,50 cm"],
    ["Marge droite", "2,50 cm"],
    ["Marge en-tête", "1,25 cm"],
    ["Marge pied de page", "1,25 cm"],
    ["Gouttière", "0 cm"],
  ]),
  spacer(),

  h1("2. Police et typographie générale"),
  body(
    "Police dominante du corps de texte : Times New Roman, 12 pt (24 demi-points dans le format Word). Cette police est utilisée sur l'ensemble du document : page de garde, pages préliminaires, corps du mémoire, légendes, tableaux et bibliographie.",
  ),
  body("Polices exceptionnelles :"),
  bullet("Algerian, 48 pt — dédicace (« A » et dédicataire, ex. « La famille TAMELA »), centrée."),
  bullet("Segoe UI Symbol / Emoji — symboles ponctuels uniquement."),
  body("Interligne du corps de texte : 1,5 ligne (valeur Word line=360, lineRule=auto, soit 18 pt pour une police 12 pt)."),
  body("Alignement du corps : justifié (both) avec retrait de première ligne."),
  bullet("Retrait première ligne standard : environ 1,25 cm (708 twips) dans les chapitres."),
  bullet("Retrait première ligne pages préliminaires (résumé) : environ 1,0 cm (567 twips) avec marge négative gauche compensée."),
  bullet("Retrait remerciements (intro) : environ 0,63 cm (357 twips)."),
  spacer(),

  h1("3. Numérotation des pages"),
  h2("3.1 Pages préliminaires (numérotation romaine)"),
  body(
    "Les sections préliminaires utilisent la numérotation en chiffres romains minuscules (i, ii, iii, iv, v, vi, vii, viii…). La première section comporte l'option « page de titre » (titlePg) : la page de garde n'affiche pas de numéro visible.",
  ),
  body("Ordre et numérotation observés dans la table des matières :"),
  specTable([
    ["Section", "Numéro de page (romain)"],
    ["Dédicace", "i"],
    ["Remerciements", "ii"],
    ["Résumé", "iii"],
    ["Abstract", "iv"],
    ["Liste des figures", "v"],
    ["Liste des tableaux", "vi"],
    ["Liste des abréviations", "vii"],
    ["Table des matières", "viii"],
  ]),
  h2("3.2 Corps du mémoire (numérotation arabe)"),
  body(
    "À partir de l'introduction générale, la numérotation repasse en chiffres arabes à partir de 1. Le changement de format intervient via une nouvelle section Word.",
  ),
  h2("3.3 Pied de page"),
  body(
    "Contenu du pied de page (sections corps) : « Rédigé par [NOM PRÉNOM]. » suivi du numéro de page (champ PAGE). Le numéro est inséré automatiquement via un champ Word { PAGE \\* MERGEFORMAT }.",
  ),
  spacer(),

  h1("4. En-tête de page"),
  body(
    "À partir du corps du mémoire, chaque page affiche en en-tête le titre complet du mémoire en majuscules, centré ou aligné selon la section :",
  ),
  body(
    "« CONCEPTION ET REALISATION D'UNE PLATEFORME WEB DE GESTION DES DONS DE SANG » (adapter pour E-Tontine : titre du mémoire en majuscules).",
    { italic: true },
  ),
  body(
    "L'en-tête utilise Times New Roman. Il est présent sur les pages paires et impaires (header1 et header2 liés aux sections).",
  ),
  spacer(),

  h1("5. Structure globale du document"),
  body("Le mémoire de référence suit l'architecture suivante :"),
  bullet("Page de garde"),
  bullet("Dédicace"),
  bullet("Remerciements"),
  bullet("Résumé (français)"),
  bullet("Abstract (anglais)"),
  bullet("Liste des figures"),
  bullet("Liste des tableaux"),
  bullet("Liste des abréviations"),
  bullet("Table des matières"),
  bullet("Introduction générale"),
  bullet("Chapitre I — Généralités et état de l'art"),
  bullet("Chapitre II — Méthodologie et conception"),
  bullet("Chapitre III — Implémentation et présentation des résultats"),
  bullet("Conclusion générale et perspectives"),
  bullet("Références bibliographiques"),
  body("Volume observé : environ 48 pages numérotées en arabe, 56 figures, 9 tableaux, 30 légendes de figures dans le corps."),
  spacer(),

  h1("6. Page de garde"),
  h2("6.1 Bloc institutionnel (haut de page)"),
  body("Style « Sans interligne » pour le bloc supérieur. Tout est centré."),
  bullet("REPUBLIQUE DU CAMEROUN / PAIX-TRAVAIL-PATRIE"),
  bullet("Ligne d'étoiles : *********"),
  bullet("UNIVERSITE PROTESTANTE D'AFRIQUE CENTRALE / *********"),
  bullet("Version anglaise en regard (REPUBLIC OF CAMEROON / PEACE-WORK-FATHERLAND) — disposition bilingue sur la même zone."),
  bullet("Espacement vertical (lignes vides) entre les blocs."),
  h2("6.2 Institut et coordonnées"),
  bullet("« INSTITUT UNIVERSITAIRE PROTESTANT DE YAOUNDE » — Times New Roman 14 pt, centré."),
  bullet("« B.P. 4011 Yaoundé -Cameroun » — Times New Roman 12 pt gras, centré."),
  h2("6.3 Titre du mémoire"),
  bullet("Titre complet du projet — Times New Roman, centré, en majuscules (taille héritée du style, généralement 12–14 pt sur la page de garde)."),
  bullet("Espacement généreux (plusieurs paragraphes vides) avant le bloc auteur."),
  h2("6.4 Bloc auteur et diplôme"),
  body("Interligne 1,5 (line=360) pour ce bloc. Tout centré :"),
  bullet("« Projet de fin d'étude » — 12 pt"),
  bullet("« Rédigé et soutenu par : » — 12 pt"),
  bullet("NOM PRÉNOM de l'étudiant — 12 pt"),
  bullet("« Matricule: XXIXXX » — 12 pt"),
  bullet("« En vue de l'obtention du diplôme de : » — 14 pt"),
  bullet("« LICENCE EN SCIENCE DE L'INGENIEUR » — 14 pt"),
  bullet("« Option : GENIE INFORMATIQUE » — 14 pt"),
  bullet("« SOUS L'ENCADREMENT DE : » — 14 pt"),
  bullet("Nom de l'encadreur — 12 pt"),
  bullet("« Année académique 20XX-20XX »"),
  spacer(),

  h1("7. Pages préliminaires — détail"),
  h2("7.1 Dédicace"),
  bullet("Titre « DÉDICACE » : style Titre 1 (Titre1), centré."),
  bullet("Corps : police Algerian 48 pt, centré, interligne 1,5."),
  bullet("Formule d'ouverture « A » seule sur une ligne, puis le dédicataire sur la ligne suivante."),
  h2("7.2 Remerciements"),
  bullet("Titre « REMERCIEMENTS » : style Titre 1, centré."),
  bullet("Paragraphe d'introduction : justifié, interligne 1,5, retrait première ligne ~0,63 cm."),
  bullet("« Je remercie : » — même format."),
  bullet("Liste des remerciements : style « Paragraphe de liste » (Paragraphedeliste) — retrait gauche 0,5 cm (284 twips), retrait négatif suspendu 0,5 cm (hanging 284 twips), puces implicites (tiret ou texte libre commençant par « M. », « Mon encadreur… »), justifié, 12 pt."),
  h2("7.3 Résumé"),
  bullet("Titre « RÉSUMÉ » : style Titre 1, centré."),
  bullet("Corps : un ou plusieurs paragraphes justifiés, 12 pt, interligne 1,5, retrait première ligne."),
  bullet("Ligne « Mots clés : » en fin de résumé — même format, liste de mots séparés par des virgules."),
  h2("7.4 Abstract"),
  bullet("Titre « ABSTRACT » : style Titre 1, centré."),
  bullet("Même mise en forme que le résumé, en anglais."),
  bullet("Ligne « Keywords: » en fin d'abstract."),
  h2("7.5 Listes automatiques"),
  bullet("« LISTE DES FIGURES » — Titre 1"),
  bullet("« LISTE DES TABLEAUX » — Titre 1"),
  bullet("« LISTE DES ABRÉVIATIONS » — Titre 1"),
  bullet("Entrées générées par Word (style Tabledesillustrations) : « Figure N : … » ou « Tableau N : … » avec numéro de page."),
  h2("7.6 Table des matières"),
  bullet("Titre « TABLE DE MATIERE » (sans S) : style Titre 1."),
  bullet("Table des matières automatique Word avec styles TM1 à TM9 (niveaux 1 à 9)."),
  spacer(),

  h1("8. Hiérarchie des titres dans le corps"),
  body(
    "Le mémoire de référence n'utilise pas la numérotation I., I.1 visible dans les titres du corps : les titres affichés sont en texte libre (majuscules ou casse titre), tandis que la numérotation hiérarchique (I-1, I-1-1, II-1-1-1…) n'apparaît que dans la table des matières.",
  ),
  specTable([
    ["Niveau Word", "Style", "Taille observée", "Gras", "Italique", "Alignement", "Exemple"],
    [
      "Titre 1",
      "Titre1",
      "20 pt (style) / 12 pt en pratique sur préliminaires",
      "Non",
      "Non",
      "Centré",
      "RÉSUMÉ, ABSTRACT, TABLE DE MATIERE",
    ],
    [
      "Titre 2",
      "Titre2",
      "18 pt",
      "Non",
      "Non",
      "Centré ou gauche",
      "GENERALITE ET ETAT DE L'ART…",
    ],
    ["Titre 3", "Titre3", "16 pt", "Non", "Non", "Gauche", "Introduction, Conclusion"],
    [
      "Titre 4",
      "Titre4",
      "16 pt",
      "Non",
      "Oui",
      "Centré ou gauche",
      "GENERALITE SUR LE DON DE SANG…",
    ],
    [
      "Titre 5",
      "Titre5",
      "14 pt",
      "Non",
      "Non",
      "Gauche",
      "Origine et organisation…, Limites, Notre solution",
    ],
    [
      "Titre 6",
      "Titre6",
      "14 pt",
      "Non",
      "Oui",
      "Gauche",
      "Blood Donor, Les composants sanguins",
    ],
    ["Titre 7", "Titre7", "14 pt", "Non", "Non", "Gauche", "Le don de sang total"],
    ["Titre 8–9", "Titre8/9", "Hérité", "—", "Italique (T8)", "Gauche", "Sous-niveaux rares"],
  ]),
  body("Espacement avant/après des styles de titres (valeurs Word) :"),
  specTable([
    ["Style", "Espace avant", "Espace après"],
    ["Titre 1", "18 pt (360 twips)", "4 pt (80 twips)"],
    ["Titre 2", "8 pt (160 twips)", "4 pt"],
    ["Titre 3", "8 pt", "4 pt"],
    ["Titre 4", "4 pt", "2 pt"],
    ["Titre 5", "4 pt", "2 pt"],
    ["Titre 6", "2 pt", "0 pt"],
  ]),
  spacer(),

  h1("9. Numérotation hiérarchique (table des matières)"),
  body("Convention observée dans le sommaire automatique :"),
  bullet("Chapitre : « CHAPITRE I : », « CHAPITRE II : », « CHAPITRE III : » (chiffres romains)."),
  bullet("Section niveau 1 : I-1, I-2, II-1, II-2, III-1…"),
  bullet("Section niveau 2 : I-1-1, I-1-2, I-2-1…"),
  bullet("Section niveau 3 : I-1-2-1, I-1-2-2…"),
  bullet("Sous-niveau alphabétique : a), b), c) pour les subdivisions fines (ex. types de don)."),
  body("Styles de table des matières :"),
  specTable([
    ["Style TM", "Niveau", "Taille", "Gras", "Caps", "Indentation"],
    ["TM1", "1", "10 pt", "Oui", "Oui", "0"],
    ["TM2", "2", "10 pt", "Non", "Non", "0,39 cm"],
    ["TM3", "3", "10 pt", "Non", "Non", "0,78 cm, italique"],
    ["TM4", "4", "9 pt", "Non", "Non", "1,16 cm"],
    ["TM5", "5", "9 pt", "Non", "Non", "1,55 cm"],
    ["TM6", "6", "9 pt", "Non", "Non", "1,5 cm"],
  ]),
  spacer(),

  h1("10. Introduction générale et conclusion générale"),
  h2("10.1 Introduction générale"),
  bullet("Titre « INTRODUCTION GENERALE » — texte simple 12 pt (pas de style Titre 1 dans le corps observé)."),
  bullet("Paragraphes de contexte : justifiés, 12 pt, interligne 1,5, retrait première ligne."),
  bullet("Une question de recherche peut apparaître en italique dans le corps du paragraphe."),
  bullet("Objectif général : paragraphe justifié standard."),
  bullet("Plan du mémoire : liste de trois lignes commençant par « Chapitre 1 : », « Chapitre 2 : », « Chapitre 3 : » — 12 pt, justifié, sans puces numérotées."),
  h2("10.2 Conclusion de chapitre"),
  bullet("Titre « Conclusion » — style Titre 3, 16 pt, gauche."),
  bullet("Un seul paragraphe de synthèse, justifié, 12 pt, commençant par « En conclusion, dans ce chapitre… »."),
  h2("10.3 Conclusion générale"),
  bullet("Titre « CONCLUSION GENERALE ET PERSPECTIVES » — niveau TM1 dans le sommaire."),
  bullet("Corps : paragraphes justifiés standard."),
  spacer(),

  h1("11. Figures et légendes"),
  h2("11.1 Placement des images"),
  bullet("Images centrées dans un paragraphe aligné au centre."),
  bullet("Aucun texte dans le paragraphe de l'image (paragraphe vide sauf l'image)."),
  bullet("Espacement vertical modéré avant et après l'image."),
  h2("11.2 Légendes de figures"),
  bullet("Style Word « Légende » (Légende) — Times New Roman 12 pt, italique."),
  bullet("Position : sous l'image."),
  bullet("Alignement : centré (la plupart des figures)."),
  bullet("Format : « Figure N : Description [référence]. »"),
  bullet("Exemple : « Figure 4 : Interface de l'application Blood Donor [13]. »"),
  bullet("La citation bibliographique [N] est intégrée dans la légende lorsque la source est externe."),
  bullet("Interligne 1,5 sur la légende."),
  h2("11.3 Liste des figures"),
  bullet("Entrées automatiques reprenant le même libellé + numéro de page."),
  spacer(),

  h1("12. Tableaux et légendes"),
  h2("12.1 Légendes de tableaux"),
  bullet("Format : « Tableau N : Titre descriptif » — style Légende, 12 pt italique."),
  bullet("Position : au-dessus du tableau (avant le tableau dans le flux du texte)."),
  bullet("Alignement : centré (cas d'utilisation) ou gauche (tableau comparatif chapitre I)."),
  h2("12.2 Tableau comparatif (état de l'art)"),
  bullet("Style de tableau : « Grille du tableau » (Grilledutableau)."),
  bullet("6 colonnes × 11 lignes environ."),
  bullet("En-tête ligne 1 : fond bleu clair (#D9E2F3) pour la colonne critères ; fond orange clair (#FBE4D5) pour les colonnes solutions."),
  bullet("Première colonne : critères d'évaluation."),
  bullet("Dernière colonne : « Notre plateforme » / « Notre solution »."),
  h2("12.3 Tableaux de cas d'utilisation"),
  bullet("Style : « Tableau simple 1 » (Tableausimple1)."),
  bullet("2 colonnes : libellé (Titre, Résumé, Acteurs, Précondition, Scénario nominal, Post condition, Exception) | contenu."),
  bullet("Légende centrée au-dessus."),
  h2("12.4 Tableaux techniques (environnement)"),
  bullet("Style : « Grille tableau 4 – Accentuation 1 »."),
  bullet("2 colonnes : Caractéristiques | Valeur (ou Nom du logiciel | Rôle)."),
  spacer(),

  h1("13. Section « Limites » (chapitre I)"),
  body("Structure observée :"),
  bullet("Titre de section « Limites » — style Titre 5, 14 pt, aligné à gauche."),
  bullet("Chaque limite est un mini-titre sur sa propre ligne (paragraphe normal, 12 pt, non gras) : ex. « Manque d'intégration nationale »."),
  bullet("Le développement de chaque limite suit immédiatement en paragraphe(s) justifié(s) standard."),
  bullet("Pas de puces, pas de numérotation dans le corps pour les sous-limites."),
  body("Limites recensées dans le mémoire de référence :"),
  bullet("Manque d'intégration nationale"),
  bullet("Faible accessibilité numérique"),
  bullet("Problèmes de maintenance et de performance technique"),
  bullet("Manque de sensibilisation et d'accompagnement du grand public"),
  bullet("Limitation fonctionnelle des plateformes"),
  spacer(),

  h1("14. Section « Notre solution »"),
  bullet("Titre — style Titre 5, 14 pt."),
  bullet("Trois paragraphes justifiés successifs, 12 pt, interligne 1,5, retrait première ligne."),
  bullet("Pas de renvoi explicite au chapitre suivant dans le dernier paragraphe."),
  spacer(),

  h1("15. Chapitre II — éléments de mise en forme"),
  bullet("Sous-section « Besoins fonctionnels » / « Besoins non fonctionnels » : listes à puces (puce ● U+2022 ou tiret ▪ dans les tableaux)."),
  bullet("Cas d'utilisation : pour chaque cas — Description (tableau), Activité (diagramme + légende), Diagramme de séquences (diagramme + légende)."),
  bullet("Titres de sous-analyse : « Analyse du cas d'utilisation « … » » — Titre 5."),
  bullet("Diagramme de classes, architecture MVC, architecture physique : figure centrée + légende."),
  spacer(),

  h1("16. Chapitre III — éléments de mise en forme"),
  bullet("Sous-sections : Diagramme de déploiement, Environnement de développement, Présentation des résultats."),
  bullet("Captures d'écran : image centrée + légende « Figure N : … » en dessous."),
  bullet("Sous-titres d'interfaces : Titre 6 italique 14 pt (ex. « Page de connexion », « Page d'accueil »)."),
  spacer(),

  h1("17. Bibliographie / Références"),
  bullet("Titre « REFERENCES » ou « RÉFÉRENCES » — niveau Titre 1 ou texte simple en fin de document."),
  bullet("Présentation : tableau 2 colonnes sans style de grille visible (22 lignes × 2 colonnes)."),
  bullet("Colonne 1 : numéro entre crochets [1], [2]…"),
  bullet("Colonne 2 : référence complète (auteur, titre, [En ligne], URL…)."),
  bullet("Format exemple : « Oms. [En ligne]. Available : https://… »"),
  bullet("Les références sont citées dans le texte et les légendes sous la forme [N]."),
  spacer(),

  h1("18. Listes à puces dans le corps"),
  bullet("Style « Paragraphe de liste » : retrait gauche 1,27 cm (720 twips) pour les listes générales."),
  bullet("Listes de remerciements : retrait suspendu 0,5 cm."),
  bullet("Plan du mémoire (intro générale) : pas de puce, lignes commençant par « Chapitre N : »."),
  spacer(),

  h1("19. Conventions rédactionnelles associées"),
  bullet("Chaque chapitre commence par une Introduction (Titre 3) et se termine par une Conclusion (Titre 3)."),
  bullet("Les titres de chapitre (Titre 2) sont en majuscules."),
  bullet("Les titres de grande section (Titre 4) sont en majuscules, souvent en italique."),
  bullet("Les noms d'applications étudiées (Titre 6) utilisent l'italique."),
  bullet("Le corps reste en Times New Roman 12 pt justifié partout."),
  bullet("Pas de couleur de texte dans le corps (noir par défaut)."),
  spacer(),

  h1("20. Synthèse — checklist pour le mémoire E-Tontine"),
  specTable([
    ["Élément", "Règle à appliquer"],
    ["Page", "A4, marges 2,5 cm (sauf bas page de garde 2,25 cm)"],
    ["Police corps", "Times New Roman 12 pt, interligne 1,5, justifié"],
    ["Retrait paragraphe", "~1,25 cm première ligne dans les chapitres"],
    ["Pagination", "Romains i–viii préliminaires, arabes dès l'intro générale"],
    ["Pied de page", "Rédigé par [Nom]. + numéro"],
    ["En-tête corps", "Titre du mémoire en majuscules"],
    ["Titres chapitre", "Titre 2, majuscules, 18 pt, centré"],
    ["Intro/Conclusion chapitre", "Titre 3, 16 pt"],
    ["Sections I.x", "Titre 4 italique 16 pt"],
    ["Sous-sections", "Titre 5, 14 pt"],
    ["Applications / outils", "Titre 6 italique 14 pt"],
    ["Figures", "Image centrée, légende dessous, italique 12 pt, format « Figure N : … »"],
    ["Tableaux", "Légende dessus, italique 12 pt, format « Tableau N : … »"],
    ["Tableau comparatif", "En-tête coloré bleu/orange, dernière colonne = notre solution"],
    ["Références", "Tableau [N] | référence, citations [N] dans texte et légendes"],
    ["Limites", "Titre 5 + mini-titres lignes séparées + paragraphes"],
    ["Notre solution", "Titre 5 + 3 paragraphes"],
  ]),
  spacer(),
  body(
    "— Fin du document d'analyse. Consulter le mémoire de référence original pour les exemples visuels. Régénérer ce fichier avec : node scripts/generate-analyse-mise-en-forme-reference.mjs",
    { italic: true, center: true },
  ),
];

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`Analyse générée : ${OUT}`);
