import pptxgen from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.join(__dirname, "..");
const DOCS_DIR = path.join(PROJECT_DIR, "Docs");
const OUT_PPTX = path.join(DOCS_DIR, "soutenance-e-tontine.pptx");

console.log("Generating high-fidelity, visual defense PowerPoint presentation...");

let pptx = new pptxgen();
pptx.defineLayout({ name: "CUSTOM_16x9", width: 13.33, height: 7.5 });
pptx.layout = "CUSTOM_16x9"; // Widescreen 13.33 x 7.5 inches

// Color constants
const COLOR_PRIMARY_GREEN = "006B2C";
const COLOR_SECONDARY_BLUE = "4059AA";
const COLOR_NAVY_BG = "00164E";
const COLOR_BG_LIGHT = "F4FCF0"; // Light mint
const COLOR_TEXT_DARK = "333333";
const COLOR_TEXT_MUTED = "777777";
const COLOR_WHITE = "FFFFFF";
const COLOR_GOLD = "D4AF37";

// Helper function to create content slides with header and footer
function createBaseSlide(title, sectionName, slideNumber) {
  let slide = pptx.addSlide();
  slide.background = { fill: COLOR_BG_LIGHT };
  
  // Add Header Bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 1.1,
    fill: { color: COLOR_PRIMARY_GREEN }
  });
  
  // Add Header Title
  slide.addText(title, {
    x: 0.6, y: 0.2, w: 8.5, h: 0.7,
    fontFace: "Poppins", fontSize: 24,
    color: COLOR_WHITE, bold: true, valign: "middle"
  });
  
  // Add Section Indicator
  slide.addText(sectionName.toUpperCase(), {
    x: 9.2, y: 0.25, w: 3.5, h: 0.6,
    fontFace: "Inter", fontSize: 11,
    color: "D0E1D4", bold: true, align: "right", valign: "middle"
  });
  
  // Add Footer thin line
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 6.9, w: 12.13, h: 0.02,
    fill: { color: "CCCCCC" }
  });
  
  // Add Footer Text
  slide.addText("FOUEDJIO YVANNA FAYELLE  |  Licence Génie Informatique (FTIC - UPAC)", {
    x: 0.6, y: 7.0, w: 8.0, h: 0.35,
    fontFace: "Inter", fontSize: 10,
    color: COLOR_TEXT_MUTED, valign: "middle"
  });
  
  // Add Slide Number
  slide.addText(`Slide ${slideNumber} / 15`, {
    x: 11.0, y: 7.0, w: 1.73, h: 0.35,
    fontFace: "Inter", fontSize: 10,
    color: COLOR_TEXT_MUTED, align: "right", valign: "middle"
  });
  
  return slide;
}

// Helper to create separator/transition slides
function createTransitionSlide(partTitle, mainTitle) {
  let slide = pptx.addSlide();
  slide.background = { fill: COLOR_NAVY_BG };
  
  // Top bar with university
  slide.addText("UNIVERSITÉ PROTESTANTE D'AFRIQUE CENTRALE", {
    x: 0.5, y: 0.8, w: 12.33, h: 0.4,
    fontFace: "Poppins", fontSize: 14, color: "A0B2D6", bold: true, align: "center"
  });
  
  // Outer rectangle as a stylish border
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.5, y: 1.8, w: 10.33, h: 3.8,
    fill: { color: "0B255E" },
    line: { color: COLOR_PRIMARY_GREEN, width: 2 }
  });
  
  // Part Number/Title
  slide.addText(partTitle.toUpperCase(), {
    x: 2.0, y: 2.3, w: 9.33, h: 0.5,
    fontFace: "Inter", fontSize: 16, color: COLOR_PRIMARY_GREEN, bold: true, align: "center"
  });
  
  // Main title
  slide.addText(mainTitle, {
    x: 2.0, y: 2.9, w: 9.33, h: 1.6,
    fontFace: "Poppins", fontSize: 32, color: COLOR_WHITE, bold: true, align: "center", valign: "middle"
  });
  
  // Footer text
  slide.addText("E-TONTINE  -  Soutenance de Licence", {
    x: 0.5, y: 6.6, w: 12.33, h: 0.4,
    fontFace: "Inter", fontSize: 11, color: "A0B2D6", align: "center"
  });
  
  return slide;
}

// Helper to add bullet list
function addBulletList(slide, items, opts) {
  let textObjects = items.map(item => {
    if (typeof item === "string") {
      return { text: item, options: { bullet: true, indentLevel: 0 } };
    }
    return item;
  });
  
  slide.addText(textObjects, {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    fontFace: "Inter", fontSize: opts.fontSize || 13,
    color: COLOR_TEXT_DARK, lineSpacing: 22, valign: "top"
  });
}


// -------------------------------------------------------------
// SLIDE 1: PAGE DE GARDE
// -------------------------------------------------------------
let slide1 = pptx.addSlide();
slide1.background = { fill: COLOR_NAVY_BG };

// Top Bar with University Name
slide1.addText("UNIVERSITÉ PROTESTANTE D'AFRIQUE CENTRALE (UPAC)", {
  x: 0.5, y: 0.4, w: 12.33, h: 0.4,
  fontFace: "Poppins", fontSize: 15, color: COLOR_WHITE, bold: true, align: "center"
});
slide1.addText("FACULTÉ DES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION (FTIC)", {
  x: 0.5, y: 0.75, w: 12.33, h: 0.3,
  fontFace: "Inter", fontSize: 12, color: "A0B2D6", align: "center"
});

// Title Box (Middle Card)
slide1.addShape(pptx.ShapeType.roundRect, {
  x: 1.0, y: 1.3, w: 11.33, h: 2.8,
  fill: { color: "0B255E" },
  line: { color: COLOR_PRIMARY_GREEN, width: 2 }
});

slide1.addText("MEMOIRE DE FIN DE CYCLE  -  LICENCE EN SCIENCE DE L'INGÉNIEUR", {
  x: 1.2, y: 1.5, w: 10.93, h: 0.3,
  fontFace: "Inter", fontSize: 12, color: COLOR_PRIMARY_GREEN, bold: true, align: "center"
});

slide1.addText("ANALYSE ET IMPLEMENTATION D'UNE APPLICATION WEB DE GESTION DE TONTINES COMMUNAUTAIRES", {
  x: 1.2, y: 1.9, w: 10.93, h: 1.2,
  fontFace: "Poppins", fontSize: 22, color: COLOR_WHITE, bold: true, align: "center"
});

slide1.addText("APPLICATION : E-TONTINE", {
  x: 1.2, y: 3.1, w: 10.93, h: 0.4,
  fontFace: "Poppins", fontSize: 20, color: COLOR_GOLD, bold: true, align: "center"
});

slide1.addText("Option : Génie Informatique", {
  x: 1.2, y: 3.6, w: 10.93, h: 0.3,
  fontFace: "Inter", fontSize: 12, color: "E8EEF7", italic: true, align: "center"
});

// Embed E-Tontine brand logo in cover
const brandLogo = path.join(PROJECT_DIR, "public", "images", "brand", "logo.png");
if (fs.existsSync(brandLogo)) {
  slide1.addImage({
    path: brandLogo,
    x: 6.16, y: 4.3, w: 1.0, h: 1.0
  });
}

// Left Column: Student info
slide1.addText([
  { text: "Rédigé et présenté par :\n", options: { fontSize: 11, color: "A0B2D6" } },
  { text: "FOUEDJIO YVANNA FAYELLE\n", options: { fontSize: 13, bold: true, color: COLOR_WHITE } },
  { text: "Matricule : 23I032", options: { fontSize: 11, color: "A0B2D6" } }
], {
  x: 1.5, y: 5.4, w: 4.5, h: 1.2, fontFace: "Inter", valign: "top"
});

// Right Column: Supervisors info
slide1.addText([
  { text: "Encadreur Académique :\n", options: { fontSize: 11, color: "A0B2D6" } },
  { text: "Dr. KUNGNE WILLY\n", options: { fontSize: 12, bold: true, color: COLOR_WHITE } },
  { text: "Encadreur Professionnel :\n", options: { fontSize: 11, color: "A0B2D6", break: true } },
  { text: "M. TAFOTSI DIMITRI", options: { fontSize: 12, bold: true, color: COLOR_WHITE } }
], {
  x: 7.5, y: 5.4, w: 4.5, h: 1.5, fontFace: "Inter", valign: "top"
});

// Bottom Bar with Academic Year
slide1.addText("Année Académique : 2025-2026", {
  x: 0.5, y: 6.9, w: 12.33, h: 0.3,
  fontFace: "Inter", fontSize: 11, color: "A0B2D6", align: "center"
});


// -------------------------------------------------------------
// SLIDE 2: PLAN DE LA PRÉSENTATION (Structured cards like reference Slide 2)
// -------------------------------------------------------------
let slide2 = pptx.addSlide();
slide2.background = { fill: COLOR_BG_LIGHT };

// Title
slide2.addText("PLAN DE LA PRÉSENTATION", {
  x: 0.5, y: 0.4, w: 12.33, h: 0.6,
  fontFace: "Poppins", fontSize: 26, color: COLOR_PRIMARY_GREEN, bold: true, align: "center"
});

// Plan sections data
const planSections = [
  { num: "01", title: "Contexte & Problématique", desc: "La finance informelle et ses limites physiques." },
  { num: "02", title: "Objectifs & Étude de l'Existant", desc: "Buts du projet et analyse comparative." },
  { num: "03", title: "Technologies & Conception", desc: "Outils de la stack et modélisation UML." },
  { num: "04", title: "Architecture & Fonctionnement", desc: "Modèle 3-tiers, cycles et flux financiers." },
  { num: "05", title: "Démonstration & Validation", desc: "Visuels réels et simulation de transactions." },
  { num: "06", title: "Bilan & Perspectives", desc: "Résultats obtenus et évolutions futures." }
];

// Draw cards in 3 rows, 2 columns
const cardW = 5.2;
const cardH = 1.3;
const cardX1 = 1.0;
const cardX2 = 7.1;
const cardY_starts = [1.5, 3.1, 4.7];

planSections.forEach((sec, idx) => {
  const isCol1 = idx < 3;
  const colX = isCol1 ? cardX1 : cardX2;
  const rowY = cardY_starts[idx % 3];
  
  // Background Card
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: colX, y: rowY, w: cardW, h: cardH,
    fill: { color: COLOR_WHITE },
    line: { color: "DDDDDD", width: 1 }
  });
  
  // Number Block (Green Rectangle)
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: colX + 0.25, y: rowY + 0.3, w: 0.7, h: 0.7,
    fill: { color: COLOR_PRIMARY_GREEN }
  });
  
  // Number text
  slide2.addText(sec.num, {
    x: colX + 0.25, y: rowY + 0.3, w: 0.7, h: 0.7,
    fontFace: "Poppins", fontSize: 16, color: COLOR_WHITE, bold: true, align: "center", valign: "middle"
  });
  
  // Section Title and Desc
  slide2.addText([
    { text: sec.title + "\n", options: { fontSize: 14, bold: true, color: COLOR_NAVY_BG } },
    { text: sec.desc, options: { fontSize: 10, color: COLOR_TEXT_MUTED } }
  ], {
    x: colX + 1.1, y: rowY + 0.2, w: 3.9, h: 0.9,
    fontFace: "Inter", valign: "middle"
  });
});

// Footer
slide2.addText("E-TONTINE  |  Licence Génie Informatique", {
  x: 1.0, y: 7.0, w: 11.33, h: 0.3,
  fontFace: "Inter", fontSize: 10, color: COLOR_TEXT_MUTED, align: "center"
});


// -------------------------------------------------------------
// SLIDE 3: TRANSITION - PART I
// -------------------------------------------------------------
createTransitionSlide("Première Partie", "CONTEXTE, PROBLÉMATIQUE & OBJECTIFS");


// -------------------------------------------------------------
// SLIDE 4: CONTEXTE ET PROBLÉMATIQUE (Visual with contextual image)
// -------------------------------------------------------------
let slide4 = createBaseSlide("Contexte & Problématique locale", "Introduction", 4);

// Left Column: Text (very concise)
slide4.addShape(pptx.ShapeType.roundRect, {
  x: 0.6, y: 1.4, w: 6.2, h: 5.2,
  fill: { color: COLOR_WHITE },
  line: { color: "E2E8F0", width: 1 }
});

slide4.addText("Le Contexte des Tontines au Cameroun", {
  x: 0.9, y: 1.6, w: 5.6, h: 0.4,
  fontFace: "Poppins", fontSize: 18, color: COLOR_PRIMARY_GREEN, bold: true
});

addBulletList(slide4, [
  { text: "Les Tontines (Djangui / Njangi) :\n", options: { bold: true } },
  { text: "Piliers de l'économie informelle camerounaise pour l'épargne collective.\n", options: { fontSize: 12, color: COLOR_TEXT_MUTED } },
  
  { text: "Limites de la gestion physique traditionnelle :\n", options: { bold: true, color: "CC0000" } },
  { text: "• Registres papier vulnérables (pertes, dégradations).\n" +
          "• Manipulation d'espèces (risques de vols et détournements).\n" +
          "• Opacité comptable provoquant des conflits relationnels.\n" +
          "• Obligation de présence physique excluant la diaspora.\n", options: { fontSize: 12, color: COLOR_TEXT_DARK } }
], { x: 0.9, y: 2.1, w: 5.6, h: 2.8 });

// Highlight problem statement
slide4.addShape(pptx.ShapeType.rect, {
  x: 0.9, y: 5.0, w: 5.6, h: 1.3,
  fill: { color: "FFF2CC" },
  line: { color: "F1C232", width: 1 }
});
slide4.addText("Question de recherche : Comment numériser ces flux tout en gardant la confiance et la gouvernance communautaire ?", {
  x: 1.0, y: 5.1, w: 5.4, h: 1.1,
  fontFace: "Inter", fontSize: 12, color: COLOR_TEXT_DARK, italic: true, valign: "middle"
});

// Right Column: Beautiful Cameroonian Tontine Image
const tontineImg = path.join(PROJECT_DIR, "public", "image de tontines", "tontine_femmes_670.jpg");
if (fs.existsSync(tontineImg)) {
  slide4.addImage({
    path: tontineImg,
    x: 7.1, y: 1.4, w: 5.6, h: 5.2
  });
  // Border decoration for image
  slide4.addShape(pptx.ShapeType.rect, {
    x: 7.1, y: 1.4, w: 5.6, h: 5.2,
    fill: { color: "000000", transparency: 100 },
    line: { color: COLOR_PRIMARY_GREEN, width: 2 }
  });
} else {
  slide4.addShape(pptx.ShapeType.rect, {
    x: 7.1, y: 1.4, w: 5.6, h: 5.2, fill: { color: "E2E8F0" }
  });
  slide4.addText("[Image contextuelle manquante]", { x: 7.5, y: 3.5, w: 4.8, h: 1.0, align: "center" });
}


// -------------------------------------------------------------
// SLIDE 5: OBJECTIFS DU PROJET (With 'AVEC' digitalization target image)
// -------------------------------------------------------------
let slide5 = createBaseSlide("Objectifs du Projet E-Tontine", "Introduction", 5);

// Left Column: Goals
slide5.addShape(pptx.ShapeType.roundRect, {
  x: 0.6, y: 1.4, w: 6.2, h: 5.2,
  fill: { color: COLOR_WHITE },
  line: { color: "E2E8F0", width: 1 }
});

slide5.addText("Objectif Général & Spécifiques", {
  x: 0.9, y: 1.6, w: 5.6, h: 0.4,
  fontFace: "Poppins", fontSize: 18, color: COLOR_PRIMARY_GREEN, bold: true
});

addBulletList(slide5, [
  { text: "Objectif Général :\n", options: { bold: true } },
  { text: "Concevoir une plateforme web centralisée et transparente pour automatiser l'activité complète des associations tontinières.\n\n", options: { fontSize: 12, color: COLOR_TEXT_DARK } },
  
  { text: "Objectifs Spécifiques :\n", options: { bold: true, color: COLOR_SECONDARY_BLUE } },
  { text: "• Automatiser les cycles rotatifs et ordre de passage.\n" +
          "• Sécuriser l'épargne et les prêts internes (via avalistes).\n" +
          "• Fournir un journal financier immuable et transparent.\n" +
          "• Simuler les transactions MTN MoMo & Orange Money.\n" +
          "• Gérer la présence aux réunions et le calcul des pénalités.", options: { fontSize: 12, color: COLOR_TEXT_DARK } }
], { x: 0.9, y: 2.1, w: 5.6, h: 4.2 });

// Right Column: Target 'avec' diagram showing digitized process
const avecImg = path.join(PROJECT_DIR, "public", "images", "avec.png");
if (fs.existsSync(avecImg)) {
  slide5.addImage({
    path: avecImg,
    x: 7.1, y: 1.4, w: 5.6, h: 5.2
  });
  // Border
  slide5.addShape(pptx.ShapeType.rect, {
    x: 7.1, y: 1.4, w: 5.6, h: 5.2,
    fill: { color: "000000", transparency: 100 },
    line: { color: COLOR_SECONDARY_BLUE, width: 2 }
  });
} else {
  slide5.addShape(pptx.ShapeType.rect, {
    x: 7.1, y: 1.4, w: 5.6, h: 5.2, fill: { color: "E2E8F0" }
  });
  slide5.addText("[Schéma cible 'avec.png' manquant]", { x: 7.5, y: 3.5, w: 4.8, h: 1.0, align: "center" });
}


// -------------------------------------------------------------
// SLIDE 6: ETUDE DE L'EXISTANT & LIMITES (Table)
// -------------------------------------------------------------
let slide6 = createBaseSlide("Étude de l'Existant & Limites", "Introduction", 6);

let existantRows = [
  [
    { text: "Solution", options: { bold: true, fill: "006B2C", color: COLOR_WHITE } },
    { text: "Caractéristiques Fonctionnelles", options: { bold: true, fill: "006B2C", color: COLOR_WHITE } },
    { text: "Insuffisances & Limites identifiées", options: { bold: true, fill: "006B2C", color: COLOR_WHITE } }
  ],
  [
    { text: "Cirkkle", options: { bold: true } },
    { text: "Tontines en ligne, paiements mobiles intégrés.", options: {} },
    { text: "Commissions financières élevées, absence de gouvernance associative complète.", options: {} }
  ],
  [
    { text: "Njangi App", options: { bold: true } },
    { text: "Planification, suivi de calendrier de réunions.", options: {} },
    { text: "Pas d'automatisation comptable ni de gestion des pénalités.", options: {} }
  ],
  [
    { text: "Djangui 3.0", options: { bold: true } },
    { text: "Paiements, tchat de groupe, suivi basique.", options: {} },
    { text: "Interface non responsive, manque d'audit comptable par caisse.", options: {} }
  ],
  [
    { text: "E-Tontine", options: { bold: true, fill: "E2F0D9", color: COLOR_PRIMARY_GREEN } },
    { text: "Cloisonnement complet, 4 caisses dédiées, Épargne & Emprunt avec avalistes, Simulation Mobile Money locale.", options: { fill: "E2F0D9" } },
    { text: "Solution proposée répondant spécifiquement aux limites identifiées.", options: { fill: "E2F0D9", italic: true } }
  ]
];

slide6.addTable(existantRows, {
  x: 0.6, y: 1.6, w: 12.13, h: 4.8,
  fontFace: "Inter", fontSize: 12,
  align: "left", valign: "middle",
  border: { type: "solid", color: "CCCCCC", pt: 1 }
});


// -------------------------------------------------------------
// SLIDE 7: TRANSITION - PART II
// -------------------------------------------------------------
createTransitionSlide("Deuxième Partie", "CONCEPTION & ARCHITECTURE TECHNIQUE");


// -------------------------------------------------------------
// SLIDE 8: STACK TECHNOLOGIQUE (Grid of logos like reference Slide 13)
// -------------------------------------------------------------
let slide8 = createBaseSlide("Stack Technologique & Justifications", "Conception", 8);

const logosDir = path.join(DOCS_DIR, "logos");
const techStack = [
  { name: "Next.js 15", logo: "nextjs.png", desc: "Framework full-stack, SSR/ISR performant." },
  { name: "React 19", logo: "react.jpg", desc: "Interface réactive et composants UI fluides." },
  { name: "Prisma ORM", logo: "prisma.png", desc: "Sécurité SQL (requêtes paramétrées) et typage." },
  { name: "PostgreSQL", logo: "postgresql.png", desc: "Base relationnelle assurant les contraintes ACID." },
  { name: "Supabase", logo: "supabase.png", desc: "Gestion sécurisée des sessions et hébergement DB." },
  { name: "Tailwind CSS", logo: "tailwindcss.png", desc: "Mise en page moderne, adaptative et légère." }
];

// 3 columns, 2 rows
const logoW = 3.6;
const logoH = 2.3;
const logoX_starts = [0.8, 4.8, 8.8];
const logoY_starts = [1.6, 4.2];

techStack.forEach((tech, idx) => {
  const colIdx = idx % 3;
  const rowIdx = Math.floor(idx / 3);
  
  const cardX = logoX_starts[colIdx];
  const cardY = logoY_starts[rowIdx];
  
  // Card Shape
  slide8.addShape(pptx.ShapeType.roundRect, {
    x: cardX, y: cardY, w: logoW, h: logoH,
    fill: { color: COLOR_WHITE },
    line: { color: "DDDDDD", width: 1 }
  });
  
  // Logo image
  const logoPath = path.join(logosDir, tech.logo);
  if (fs.existsSync(logoPath)) {
    slide8.addImage({
      path: logoPath,
      x: cardX + 0.2, y: cardY + 0.3, w: 0.9, h: 0.9
    });
  } else {
    // Placeholder circle
    slide8.addShape(pptx.ShapeType.oval, {
      x: cardX + 0.2, y: cardY + 0.3, w: 0.9, h: 0.9, fill: { color: "E2E8F0" }
    });
  }
  
  // Title
  slide8.addText(tech.name, {
    x: cardX + 1.2, y: cardY + 0.3, w: 2.2, h: 0.3,
    fontFace: "Poppins", fontSize: 14, color: COLOR_PRIMARY_GREEN, bold: true
  });
  
  // Desc
  slide8.addText(tech.desc, {
    x: cardX + 1.2, y: cardY + 0.7, w: 2.2, h: 1.3,
    fontFace: "Inter", fontSize: 11, color: COLOR_TEXT_DARK, valign: "top"
  });
});


// -------------------------------------------------------------
// SLIDE 9: CONCEPTION : CAS D'UTILISATION (Large diagram)
// -------------------------------------------------------------
let slide9 = createBaseSlide("Conception : Cas d'Utilisation Globaux", "Conception", 9);

const ucPath = path.join(DOCS_DIR, "uc-global-e-tontine.png");
if (fs.existsSync(ucPath)) {
  slide9.addImage({
    path: ucPath,
    x: 0.8, y: 1.4, w: 9.2, h: 5.2
  });
  // Border
  slide9.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.4, w: 9.2, h: 5.2,
    fill: { color: "000000", transparency: 100 },
    line: { color: COLOR_PRIMARY_GREEN, width: 2 }
  });
} else {
  slide9.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.4, w: 9.2, h: 5.2, fill: { color: "E2E8F0" } });
  slide9.addText("[Diagramme UC Global Manquant]", { x: 2.0, y: 3.5, w: 6.8, h: 1.0, align: "center" });
}

// Side Legends Card
slide9.addShape(pptx.ShapeType.roundRect, {
  x: 10.2, y: 1.4, w: 2.5, h: 5.2,
  fill: { color: COLOR_WHITE },
  line: { color: "DDDDDD", width: 1 }
});
slide9.addText("Légende UML", {
  x: 10.3, y: 1.6, w: 2.3, h: 0.3,
  fontFace: "Poppins", fontSize: 13, bold: true, color: COLOR_SECONDARY_BLUE
});
addBulletList(slide9, [
  "Acteur Membre : Cotise, épargne, emprunte.",
  "Acteur Admin : Configure, valide, exclut.",
  "Système Externe : API de Paiement Mobile Money."
], { x: 10.3, y: 2.1, w: 2.3, h: 4.2, fontSize: 11 });


// -------------------------------------------------------------
// SLIDE 10: ARCHITECTURE DU SYSTEME (Large diagram)
// -------------------------------------------------------------
let slide10 = createBaseSlide("Architecture Générale du Système", "Conception", 10);

const archPath = path.join(DOCS_DIR, "architecture-systeme.png");
if (fs.existsSync(archPath)) {
  slide10.addImage({
    path: archPath,
    x: 0.8, y: 1.4, w: 9.2, h: 5.2
  });
  slide10.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.4, w: 9.2, h: 5.2,
    fill: { color: "000000", transparency: 100 },
    line: { color: COLOR_PRIMARY_GREEN, width: 2 }
  });
} else {
  slide10.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.4, w: 9.2, h: 5.2, fill: { color: "E2E8F0" } });
  slide10.addText("[Diagramme d'Architecture Manquant]", { x: 2.0, y: 3.5, w: 6.8, h: 1.0, align: "center" });
}

// Side Legends Card
slide10.addShape(pptx.ShapeType.roundRect, {
  x: 10.2, y: 1.4, w: 2.5, h: 5.2,
  fill: { color: COLOR_WHITE },
  line: { color: "DDDDDD", width: 1 }
});
slide10.addText("Couches 3-Tiers", {
  x: 10.3, y: 1.6, w: 2.3, h: 0.3,
  fontFace: "Poppins", fontSize: 13, bold: true, color: COLOR_SECONDARY_BLUE
});
addBulletList(slide10, [
  "Client : Interface React 19 web responsive.",
  "Serveur : Next.js 15 (Routes API & Server Actions).",
  "Base : PostgreSQL (Supabase) via Prisma ORM."
], { x: 10.3, y: 2.1, w: 2.3, h: 4.2, fontSize: 11 });


// -------------------------------------------------------------
// SLIDE 11: CYCLE DE TONTINE (Sequence diagram)
// -------------------------------------------------------------
let slide11 = createBaseSlide("Fonctionnement : Cycle de Cotisation", "Fonctionnement", 11);

const cyclePath = path.join(DOCS_DIR, "creer-cycle.png");
if (fs.existsSync(cyclePath)) {
  slide11.addImage({
    path: cyclePath,
    x: 0.8, y: 1.4, w: 9.2, h: 5.2
  });
  slide11.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.4, w: 9.2, h: 5.2,
    fill: { color: "000000", transparency: 100 },
    line: { color: COLOR_PRIMARY_GREEN, width: 2 }
  });
} else {
  slide11.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.4, w: 9.2, h: 5.2, fill: { color: "E2E8F0" } });
  slide11.addText("[Diagramme de Séquence Manquant]", { x: 2.0, y: 3.5, w: 6.8, h: 1.0, align: "center" });
}

// Side Legends Card
slide11.addShape(pptx.ShapeType.roundRect, {
  x: 10.2, y: 1.4, w: 2.5, h: 5.2,
  fill: { color: COLOR_WHITE },
  line: { color: "DDDDDD", width: 1 }
});
slide11.addText("Séquence Système", {
  x: 10.3, y: 1.6, w: 2.3, h: 0.3,
  fontFace: "Poppins", fontSize: 13, bold: true, color: COLOR_SECONDARY_BLUE
});
addBulletList(slide11, [
  "Flux : Configurer cycle → Verser cotisations → Calcul du pot rotatif → Versement.",
  "Comptabilité : Journalisation immuable dans les caisses."
], { x: 10.3, y: 2.1, w: 2.3, h: 4.2, fontSize: 11 });


// -------------------------------------------------------------
// SLIDE 12: TRANSITION - PART III
// -------------------------------------------------------------
createTransitionSlide("Troisième Partie", "DÉMONSTRATION VISUELLE & RÉSULTATS");


// -------------------------------------------------------------
// SLIDE 13: DEMONSTRATION VISUELLE (Grid of 4 screenshots)
// -------------------------------------------------------------
let slide13 = createBaseSlide("Démonstration Visuelle : Écrans réels", "Fonctionnement", 13);

const captureDir = path.join(DOCS_DIR, "captures-application");
const captures = [
  { file: "capture-accueil.png", name: "Page d'Accueil" },
  { file: "capture-dashboard.png", name: "Tableau de Bord du Groupe" },
  { file: "capture-finances.png", name: "Journal de Caisse & Caisses" },
  { file: "capture-membres.png", name: "Suivi & Rôles des Membres" }
];

// 2x2 grid
const imgW = 5.2;
const imgH = 2.2;
const imgX_starts = [1.0, 7.0];
const imgY_starts = [1.6, 4.3];

captures.forEach((cap, idx) => {
  const colIdx = idx % 2;
  const rowIdx = Math.floor(idx / 2);
  const cardX = imgX_starts[colIdx];
  const cardY = imgY_starts[rowIdx];
  
  // Card boundary
  slide13.addShape(pptx.ShapeType.rect, {
    x: cardX, y: cardY, w: imgW, h: imgH,
    fill: { color: COLOR_WHITE },
    line: { color: "CCCCCC", width: 1 }
  });
  
  const capPath = path.join(captureDir, cap.file);
  if (fs.existsSync(capPath)) {
    slide13.addImage({
      path: capPath,
      x: cardX + 0.05, y: cardY + 0.05, w: imgW - 0.1, h: imgH - 0.4
    });
  } else {
    slide13.addShape(pptx.ShapeType.rect, {
      x: cardX + 0.05, y: cardY + 0.05, w: imgW - 0.1, h: imgH - 0.4, fill: { color: "E2E8F0" }
    });
  }
  
  // Title at bottom of each card
  slide13.addText(cap.name, {
    x: cardX, y: cardY + imgH - 0.35, w: imgW, h: 0.3,
    fontFace: "Poppins", fontSize: 11, bold: true, color: COLOR_NAVY_BG, align: "center"
  });
});


// -------------------------------------------------------------
// SLIDE 14: BILAN, LIMITES & PERSPECTIVES (Two column text card layout)
// -------------------------------------------------------------
let slide14 = createBaseSlide("Bilan, Limites & Perspectives", "Bilan", 14);

// Left Column Card
slide14.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 1.5, w: 5.5, h: 5.0,
  fill: { color: COLOR_WHITE },
  line: { color: "E2E8F0", width: 1 }
});
slide14.addText("Bilan Technique & Limites", {
  x: 1.1, y: 1.7, w: 4.9, h: 0.4,
  fontFace: "Poppins", fontSize: 18, color: COLOR_PRIMARY_GREEN, bold: true
});
addBulletList(slide14, [
  { text: "Bilan : ", options: { bold: true } },
  { text: "Plateforme web réactive complète, déployée en ligne sur Vercel.\n", options: { fontSize: 12 } },
  { text: "Comptabilité : ", options: { bold: true } },
  { text: "Gestion cloisonnée avec traçabilité intégrale dans le journal.\n", options: { fontSize: 12 } },
  { text: "Limite technique : ", options: { bold: true, color: "CC0000" } },
  { text: "Simulation des API Orange Money / MTN MoMo à des fins académiques.", options: { fontSize: 12 } }
], { x: 1.1, y: 2.2, w: 4.9, h: 4.0 });

// Right Column Card
slide14.addShape(pptx.ShapeType.roundRect, {
  x: 7.0, y: 1.5, w: 5.5, h: 5.0,
  fill: { color: COLOR_WHITE },
  line: { color: "E2E8F0", width: 1 }
});
slide14.addText("Perspectives d'Évolution", {
  x: 7.3, y: 1.7, w: 4.9, h: 0.4,
  fontFace: "Poppins", fontSize: 18, color: COLOR_SECONDARY_BLUE, bold: true
});
addBulletList(slide14, [
  { text: "Intégration financière réelle : ", options: { bold: true } },
  { text: "Connexion à des agrégateurs de paiement locaux (ex: Campay, Monetbil).\n", options: { fontSize: 12 } },
  { text: "Portage mobile natif : ", options: { bold: true } },
  { text: "Développement d'une application hybride (React Native) avec notifications push.\n", options: { fontSize: 12 } },
  { text: "Moteur de credit scoring : ", options: { bold: true } },
  { text: "Analyse automatisée de l'historique d'épargne pour l'octroi de prêts sans garantie.", options: { fontSize: 12 } }
], { x: 7.3, y: 2.2, w: 4.9, h: 4.0 });


// -------------------------------------------------------------
// SLIDE 15: CONCLUSION & REMERCIEMENTS
// -------------------------------------------------------------
let slide15 = pptx.addSlide();
slide15.background = { fill: COLOR_NAVY_BG };

slide15.addText("INSTITUT UNIVERSITAIRE PROTESTANT DE YAOUNDE (UPAC)", {
  x: 0.5, y: 0.5, w: 12.33, h: 0.4,
  fontFace: "Poppins", fontSize: 14, color: "A0B2D6", bold: true, align: "center"
});

slide15.addText("CONCLUSION", {
  x: 0.5, y: 1.5, w: 12.33, h: 0.5,
  fontFace: "Poppins", fontSize: 28, color: COLOR_PRIMARY_GREEN, bold: true, align: "center"
});

slide15.addText("E-Tontine modernise la finance informelle au Cameroun en alliant la rigueur d'un système d'information relationnel et la flexibilité d'une interface mobile, assurant traçabilité et sécurité aux associations.", {
  x: 2.0, y: 2.3, w: 9.33, h: 1.2,
  fontFace: "Inter", fontSize: 16, color: COLOR_WHITE, italic: true, align: "center", lineSpacing: 28
});

// Thank you box
slide15.addShape(pptx.ShapeType.roundRect, {
  x: 2.0, y: 3.8, w: 9.33, h: 2.2,
  fill: { color: "0B255E" },
  line: { color: COLOR_PRIMARY_GREEN, width: 2 }
});

slide15.addText("MERCI POUR VOTRE AIMABLE ATTENTION !", {
  x: 2.2, y: 4.2, w: 8.93, h: 0.6,
  fontFace: "Poppins", fontSize: 24, color: COLOR_WHITE, bold: true, align: "center"
});

slide15.addText("La parole est désormais aux membres du jury pour vos questions et suggestions.", {
  x: 2.2, y: 4.9, w: 8.93, h: 0.6,
  fontFace: "Inter", fontSize: 14, color: "A0B2D6", align: "center"
});

slide15.addText("FOUEDJIO YVANNA FAYELLE - LICENCE GÉNIE INFORMATIQUE - 2025-2026", {
  x: 0.5, y: 6.8, w: 12.33, h: 0.4,
  fontFace: "Inter", fontSize: 11, color: COLOR_TEXT_MUTED, align: "center"
});


// Save the presentation
pptx.writeFile({ fileName: OUT_PPTX })
  .then(fileName => {
    console.log(`Presentation updated successfully at: ${fileName}`);
  })
  .catch(err => {
    console.error("Error creating PPTX:", err);
  });
