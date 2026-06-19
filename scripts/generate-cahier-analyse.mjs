#!/usr/bin/env node
/**
 * Génère le cahier d'analyse E-Tontine
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
  ShadingType,
} from "docx";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOCS = path.join(ROOT, "Docs");
const DIAG = path.join(DOCS, "cahier-analyse-diagrammes");
const OUT = path.join(DOCS, "cahier-analyse-E-TONTINE.docx");

fs.mkdirSync(DIAG, { recursive: true });

const C = {
  white: "#ffffff",
  actBg: "#B8D4E8",
  stroke: "#000000",
  ucStroke: "#2563eb",
  decision: "#E53935",
};

function svgToPng(name) {
  const svg = path.join(DIAG, `${name}.svg`);
  const png = path.join(DIAG, `${name}.png`);
  execSync(`convert -background white -density 200 "${svg}" "${png}"`, { stdio: "pipe" });
  return png;
}

function writeSvg(name, w, h, body, bg = C.white) {
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <marker id="arr" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
    <polygon points="0 0, 10 4, 0 8" fill="${C.stroke}"/>
  </marker>
</defs>
<rect width="100%" height="100%" fill="${bg}"/>
${body}
</svg>`;
  fs.writeFileSync(path.join(DIAG, `${name}.svg`), content, "utf8");
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function txt(x, y, lines, opts = {}) {
  const size = opts.size || 11;
  const anchor = opts.anchor || "middle";
  const weight = opts.bold ? ' font-weight="bold"' : "";
  const tspans = (Array.isArray(lines) ? lines : [lines])
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : size + 2}">${esc(l)}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-size="${size}" fill="#000"${weight}>${tspans}</text>`;
}

function wrap(text, max = 24) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const n = cur ? `${cur} ${w}` : w;
    if (n.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = n;
  }
  if (cur) lines.push(cur);
  return lines;
}

function arrow(x1, y1, x2, y2, label) {
  let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.stroke}" stroke-width="1.2" marker-end="url(#arr)"/>`;
  if (label) s += txt((x1 + x2) / 2 + 10, (y1 + y2) / 2 - 4, label, { size: 10, anchor: "start" });
  return s;
}

// ─── Cas d'utilisation — style première version (simple, lisible) ─────────
function actor(x, y, label) {
  return `
<g transform="translate(${x},${y})">
  <circle cx="0" cy="0" r="12" fill="none" stroke="#333" stroke-width="1.5"/>
  <line x1="0" y1="12" x2="0" y2="38" stroke="#333" stroke-width="1.5"/>
  <line x1="-16" y1="22" x2="16" y2="22" stroke="#333" stroke-width="1.5"/>
  <line x1="0" y1="38" x2="-14" y2="58" stroke="#333" stroke-width="1.5"/>
  <line x1="0" y1="38" x2="14" y2="58" stroke="#333" stroke-width="1.5"/>
  ${txt(0, 78, label.split("\n"), { size: 10 })}
</g>`;
}

function ucOval(cx, cy, rx, ry, label) {
  const lines = label.split("\n");
  return `
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f7fbff" stroke="${C.ucStroke}" stroke-width="1.5"/>
${txt(cx, cy - ((lines.length - 1) * 6) + 4, lines, { size: 10 })}`;
}

function ucLink(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#555" stroke-width="1"/>`;
}

function ucBoundary(x, y, w, h, title) {
  return `
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#333" stroke-width="1.5" rx="4"/>
${txt(x + w / 2, y + 22, title, { size: 13, bold: true })}`;
}

function genSimpleUseCase(name, opts) {
  const { title, actorLabel, actorY, boundary, cases } = opts;
  const w = boundary.w + 140;
  const h = boundary.h + 60;
  let body = ucBoundary(boundary.x, boundary.y, boundary.w, boundary.h, title);
  body += actor(50, actorY, actorLabel);
  cases.forEach((c) => {
    body += ucOval(c.cx, c.cy, c.rx, c.ry, c.label);
    body += ucLink(88, actorY + 30, c.cx - c.rx, c.cy);
  });
  writeSvg(name, w, h, body);
}

function genGlobalAdmin() {
  const bx = 180,
    by = 40,
    bw = 580,
    bh = 440;
  const cases = [
    [240, 80, 100, 22, "Créer un groupe"],
    [460, 80, 110, 22, "Gérer les membres"],
    [240, 150, 100, 22, "Gérer les cycles"],
    [460, 150, 110, 22, "Gérer les rubriques"],
    [240, 220, 100, 22, "Gérer les réunions"],
    [460, 220, 110, 22, "Gérer l'épargne"],
    [240, 290, 100, 22, "Gérer les prêts"],
    [460, 290, 130, 28, "Effectuer les\npaiements sortants"],
    [240, 360, 100, 22, "Consulter finances"],
    [460, 360, 110, 22, "Générer rapports"],
  ];
  let body = ucBoundary(bx, by, bw, bh, "Système E-Tontine");
  body += actor(60, 180, "Administrateur\nde groupe");
  cases.forEach(([x, y, rx, ry, lbl]) => {
    body += ucOval(x, y, rx, ry, lbl);
    body += ucLink(88, 230, x - rx, y);
  });
  writeSvg("uc-global-admin", 820, 520, body);
}

function genGlobalMembre() {
  const bx = 180,
    by = 40,
    bw = 580,
    bh = 400;
  const cases = [
    [250, 80, 110, 22, "S'inscrire / Se connecter"],
    [490, 80, 110, 22, "Rejoindre un groupe"],
    [250, 150, 110, 22, "Payer une cotisation"],
    [490, 150, 110, 22, "Payer une rubrique"],
    [250, 220, 110, 22, "Consulter son cycle"],
    [490, 220, 110, 22, "Demander un échange"],
    [250, 290, 110, 22, "Déposer épargne"],
    [490, 290, 110, 22, "Demander un prêt"],
    [370, 360, 120, 22, "Consulter notifications"],
  ];
  let body = ucBoundary(bx, by, bw, bh, "Système E-Tontine");
  body += actor(60, 160, "Membre /\nVisiteur");
  cases.forEach(([x, y, rx, ry, lbl]) => {
    body += ucOval(x, y, rx, ry, lbl);
    body += ucLink(88, 210, x - rx, y);
  });
  writeSvg("uc-global-membre", 820, 480, body);
}

// ─── Diagrammes d'activité — style TAMELA (vertical, centré, espacé) ────
function actBox(x, y, w, h, label) {
  const lines = wrap(label, 30);
  const lh = 14;
  const bh = Math.max(h, lines.length * lh + 18);
  return { svg: `<rect x="${x}" y="${y}" width="${w}" height="${bh}" rx="14" ry="14" fill="#fff" stroke="${C.stroke}" stroke-width="1.3"/>${txt(x + w / 2, y + bh / 2 - ((lines.length - 1) * lh) / 2 + 4, lines, { size: 10 })}`, h: bh };
}

function actDiamond(cx, cy, r, label) {
  return `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" fill="${C.decision}" stroke="${C.stroke}" stroke-width="1.2"/>${txt(cx, cy + 4, wrap(label, 16), { size: 9 })}`;
}

function actBar(x, y, w) {
  return `<rect x="${x}" y="${y}" width="${w}" height="5" fill="${C.stroke}"/>`;
}

function actStart(cx, y) {
  return `<circle cx="${cx}" cy="${y}" r="7" fill="${C.stroke}"/>`;
}

function actEnd(cx, y) {
  return `<circle cx="${cx}" cy="${y}" r="7" fill="none" stroke="${C.stroke}" stroke-width="1.5"/><circle cx="${cx}" cy="${y}" r="4" fill="${C.stroke}"/>`;
}

/** Auth — modèle TAMELA figure 11/13 */
function genActAuth(name, title) {
  const W = 500,
    cx = 250,
    bw = 320,
    bx = cx - bw / 2;
  const actionTop = 72;
  const actionH = 52;
  const decY = 188;
  const errX = 20,
    errW = 150;
  let p = "";
  p += actStart(cx, 24);
  p += arrow(cx, 31, cx, 48, title);
  p += actBox(bx, actionTop, bw, actionH, "Saisir le login et le mot de passe").svg;
  p += arrow(cx, actionTop + actionH, cx, decY - 48);
  p += actDiamond(cx, decY, 48, "Mot de passe correct ?");
  p += arrow(cx - 48, decY, errX + errW, decY, "NON");
  p += actBox(errX, decY - 20, errW, 40, "Afficher le message d'erreur").svg;
  p += arrow(errX + errW / 2, decY + 20, bx, actionTop + actionH / 2);
  p += arrow(cx, decY + 48, cx, 268, "OUI");
  p += actBox(bx, 268, bw, 44, "Accéder à la page d'accueil").svg;
  p += arrow(cx, 312, cx, 338);
  p += actEnd(cx, 338);
  writeSvg(name, W, 370, p, C.actBg);
  return 370;
}

/** CRUD — modèle TAMELA figures 15/17 (fork 3 branches, formulaire, décision) */
function genActCrud(name, title, entity, branches, finalLabel) {
  const W = 640,
    cx = 320,
    bw = 380,
    bx = cx - bw / 2;
  const forkY = 168,
    branchY = 192,
    joinY = 248,
    formY = 268,
    decY = 378,
    finalY = 468;
  const xs = [90, 320, 550];
  let p = "";
  p += actStart(cx, 24);
  p += arrow(cx, 31, cx, 48, title);
  p += actBox(bx, 48, bw, 44, `Cliquer sur le bouton Gérer les ${entity}`).svg;
  p += arrow(cx, 92, cx, 108);
  p += actBox(bx, 108, bw, 52, `Afficher la liste des ${entity} avec les boutons ajouter, modifier, supprimer`).svg;
  p += arrow(cx, 160, cx, forkY);
  p += actBar(bx, forkY, bw);
  branches.forEach((lbl, i) => {
    p += arrow(cx, forkY + 5, xs[i], branchY);
    p += actBox(xs[i] - 78, branchY, 156, 40, lbl).svg;
    p += arrow(xs[i], branchY + 40, xs[i], joinY);
  });
  p += actBar(bx, joinY, bw);
  p += arrow(cx, joinY + 5, cx, formY);
  p += actBox(bx, formY, bw, 44, "Saisir et valider le formulaire").svg;
  p += arrow(cx, formY + 44, cx, decY - 48);
  p += actDiamond(cx, decY, 48, "Données valides ?");
  p += arrow(cx - 48, decY, 30, decY, "NON");
  p += actBox(30, decY - 20, 150, 40, "Afficher le message d'erreur").svg;
  p += arrow(105, decY + 20, bx, formY + 22);
  p += arrow(cx, decY + 48, cx, finalY, "OUI");
  p += actBox(bx, finalY, bw, 48, finalLabel).svg;
  p += arrow(cx, finalY + 48, cx, finalY + 70);
  p += actEnd(cx, finalY + 70);
  writeSvg(name, W, finalY + 100, p, C.actBg);
  return finalY + 100;
}

/** Fork + action finale — modèle TAMELA figure 19/21 */
function genActForkFinish(name, title, clickLabel, listLabel, branches, finishLabel) {
  const W = 620,
    cx = 310,
    bw = 360,
    bx = cx - bw / 2;
  const forkY = 148,
    branchY = 172,
    joinY = 248,
    finishY = 278;
  const xs = branches.map((_, i) => 110 + i * (400 / Math.max(branches.length - 1, 1)));
  let p = "";
  p += actStart(cx, 24);
  p += arrow(cx, 31, cx, 48, title);
  p += actBox(bx, 48, bw, 44, clickLabel).svg;
  p += arrow(cx, 92, cx, 108);
  p += actBox(bx, 108, bw, 52, listLabel).svg;
  p += arrow(cx, 160, cx, forkY);
  p += actBar(bx, forkY, bw);
  branches.forEach((lbl, i) => {
    const x = branches.length === 3 ? [100, 310, 520][i] : xs[i];
    p += arrow(cx, forkY + 5, x, branchY);
    p += actBox(x - 78, branchY, 156, 40, lbl).svg;
    p += arrow(x, branchY + 40, x, joinY);
  });
  p += actBar(bx, joinY, bw);
  p += arrow(cx, joinY + 5, cx, finishY);
  p += actBox(bx, finishY, bw, 44, finishLabel).svg;
  p += arrow(cx, finishY + 44, cx, finishY + 68);
  p += actEnd(cx, finishY + 68);
  writeSvg(name, W, finishY + 100, p, C.actBg);
  return finishY + 100;
}

/** Décision simple (paiement, prêt, épargne) */
function genActDecision(name, title, steps, question, yesLabel, noLabel) {
  const W = 520,
    cx = 260,
    bw = 340,
    bx = cx - bw / 2;
  let y = 24,
    p = "";
  p += actStart(cx, y);
  y += 14;
  p += arrow(cx, y, cx, y + 16, title);
  y += 16;
  for (const s of steps) {
    const b = actBox(bx, y, bw, 44, s);
    p += b.svg;
    p += arrow(cx, y + b.h, cx, y + b.h + 18);
    y += b.h + 18;
  }
  const decY = y + 48;
  p += actDiamond(cx, decY, 48, question);
  p += arrow(cx - 48, decY, 40, decY, "NON");
  p += actBox(40, decY - 20, 140, 40, noLabel).svg;
  const yesY = decY + 88;
  p += arrow(cx, decY + 48, cx, yesY, "OUI");
  p += actBox(bx, yesY, bw, 44, yesLabel).svg;
  p += arrow(cx, yesY + 44, cx, yesY + 68);
  p += actEnd(cx, yesY + 68);
  writeSvg(name, W, yesY + 100, p, C.actBg);
  return yesY + 100;
}

// ─── Diagramme de classes — épuré, sans croisements ─────────────────────
function cls(x, y, w, name, attrs) {
  const hh = 26;
  const ah = attrs.length * 15 + 12;
  const h = hh + ah;
  const attrSvg = attrs.map((a, i) => `<text x="${x + 8}" y="${y + hh + 16 + i * 15}" font-family="Arial" font-size="10">+ ${esc(a)}</text>`).join("");
  return {
    svg: `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="${C.stroke}" stroke-width="1.2"/>
<line x1="${x}" y1="${y + hh}" x2="${x + w}" y2="${y + hh}" stroke="${C.stroke}"/>
<text x="${x + w / 2}" y="${y + 17}" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold">${esc(name)}</text>${attrSvg}`,
    x,
    y,
    w,
    h,
    cx: x + w / 2,
    cy: y + h / 2,
    top: y,
    bottom: y + h,
    left: x,
    right: x + w,
  };
}

function rel(a, b, c1, c2) {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  let x1, y1, x2, y2;
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx >= 0) {
      x1 = a.right;
      y1 = a.cy;
      x2 = b.left;
      y2 = b.cy;
    } else {
      x1 = a.left;
      y1 = a.cy;
      x2 = b.right;
      y2 = b.cy;
    }
  } else if (dy >= 0) {
    x1 = a.cx;
    y1 = a.bottom;
    x2 = b.cx;
    y2 = b.top;
  } else {
    x1 = a.cx;
    y1 = a.top;
    x2 = b.cx;
    y2 = b.bottom;
  }
  return `
<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.stroke}" stroke-width="1.2"/>
<text x="${x1 + (x2 - x1) * 0.12}" y="${y1 + (y2 - y1) * 0.12 - 4}" font-family="Arial" font-size="10" font-weight="bold">${esc(c1)}</text>
<text x="${x2 - (x2 - x1) * 0.12}" y="${y2 - (y2 - y1) * 0.12 - 4}" font-family="Arial" font-size="10" font-weight="bold">${esc(c2)}</text>`;
}

function genClassDiagram() {
  // 3 colonnes : identité | groupe | cycle/finance — lignes verticales ou horizontales uniquement
  const boxes = {
    user: cls(30, 40, 115, "User", ["id_user", "nom, prenom", "email"]),
    membre: cls(175, 40, 140, "MembreGroupe", ["role", "statut_adhesion", "statut_visuel"]),
    groupe: cls(360, 40, 125, "Groupes", ["id_groupe", "nom", "devise"]),
    cycle: cls(530, 40, 130, "CycleTontine", ["montant_cotisation", "duree_tour"]),
    cot: cls(530, 165, 130, "Cotisations", ["montant", "numero_tour", "date_echeance"]),
    rub: cls(280, 165, 145, "RubriqueCotisation", ["nom", "montant_fixe", "type_rubrique"]),
    reunion: cls(445, 165, 115, "Reunion", ["titre", "date_reunion", "montant_amende"]),
    epargne: cls(175, 165, 135, "CompteEpargne", ["numero_compte", "solde_actuel", "statut"]),
    caisse: cls(360, 290, 140, "CaisseFinanciere", ["type_caisse", "solde_actuel"]),
    mv: cls(530, 290, 145, "MouvementFinancier", ["type_mouvement", "montant", "solde_apres"]),
  };

  let body = Object.values(boxes)
    .map((b) => b.svg)
    .join("\n");
  body += rel(boxes.user, boxes.membre, "1", "0..*");
  body += rel(boxes.membre, boxes.groupe, "0..*", "1");
  body += rel(boxes.groupe, boxes.cycle, "1", "0..*");
  body += rel(boxes.cycle, boxes.cot, "1", "0..*");
  body += rel(boxes.membre, boxes.epargne, "1", "0..1");
  body += rel(boxes.groupe, boxes.rub, "1", "0..*");
  body += rel(boxes.groupe, boxes.reunion, "1", "0..*");
  body += rel(boxes.groupe, boxes.caisse, "1", "1..*");
  body += rel(boxes.caisse, boxes.mv, "1", "0..*");

  writeSvg("class-diagram", 720, 410, body);
}

// ─── Génération des diagrammes d'activité (modèles TAMELA) ───────────────
const activityHeights = {
  "act-auth": genActAuth("act-auth", "Authentification"),
  "act-groupe": genActCrud("act-groupe", "Gérer un groupe", "groupes", ["Ajouter un groupe", "Modifier un groupe", "Supprimer un groupe"], "Effectuer l'opération et retourner à l'accueil"),
  "act-membres": genActCrud("act-membres", "Gérer les membres", "membres", ["Inviter un membre", "Promouvoir un membre", "Exclure un membre"], "Mettre à jour la liste et notifier le membre"),
  "act-cycles": genActForkFinish("act-cycles", "Gérer un cycle", "Cliquer sur le bouton Gérer les cycles", "Afficher la liste des cycles avec les options créer, cotiser, verser", ["Créer un cycle", "Enregistrer cotisation", "Verser le pot"], "Mettre à jour le cycle et notifier les membres"),
  "act-rubriques": genActForkFinish("act-rubriques", "Gérer les rubriques", "Cliquer sur le bouton Gérer les rubriques", "Afficher les rubriques avec les options créer, payer, retirer", ["Créer une rubrique", "Enregistrer paiement", "Effectuer retrait"], "Mettre à jour la caisse rubrique"),
  "act-reunions": genActForkFinish("act-reunions", "Gérer les réunions", "Cliquer sur le bouton Gérer les réunions", "Afficher la liste des réunions planifiées", ["Planifier réunion", "Saisir présences", "Appliquer amende"], "Clôturer la réunion et mettre à jour la caisse amendes"),
  "act-epargne": genActDecision("act-epargne", "Gérer l'épargne", ["Accéder au module Épargne", "Choisir dépôt, retrait ou signalement"], "Opération valide ?", "Mettre à jour le solde et l'historique", "Afficher message d'erreur"),
  "act-prets": genActDecision("act-prets", "Gérer les prêts", ["Soumettre ou consulter une demande de prêt", "Analyser éligibilité et avalistes"], "Demande valide ?", "Mettre à jour le statut du prêt et notifier", "Afficher message d'erreur"),
  "act-paiements": genActDecision("act-paiements", "Effectuer un paiement", ["Initier le paiement Mobile Money", "Attendre la confirmation de l'opérateur"], "Paiement réussi ?", "Finaliser la transaction et mettre à jour les caisses", "Afficher message d'échec"),
  "act-finances": genActForkFinish("act-finances", "Consulter les finances", "Cliquer sur Finances ou Rapports", "Afficher les caisses et le journal des mouvements", ["Consulter en ligne", "Exporter PDF", "Exporter Excel"], "Afficher ou télécharger le document"),
};

// ─── Cas d'utilisation ───────────────────────────────────────────────────
const useCases = [
  {
    id: "UC-A01",
    heading: "Analyse du cas d'utilisation « S'authentifier »",
    ucDiagram: "uc-auth",
    actDiagram: "act-auth",
    ucSpec: {
      title: "Module Authentification",
      actorLabel: "Utilisateur",
      actorY: 100,
      boundary: { x: 160, y: 30, w: 480, h: 280 },
      cases: [
        { cx: 280, cy: 80, rx: 72, ry: 22, label: "S'inscrire" },
        { cx: 280, cy: 150, rx: 72, ry: 22, label: "Se connecter" },
        { cx: 280, cy: 220, rx: 90, ry: 26, label: "Réinitialiser\nmot de passe" },
        { cx: 480, cy: 150, rx: 72, ry: 22, label: "Modifier profil" },
      ],
    },
    table: {
      title: "S'authentifier",
      summary: "Ce cas permet à un utilisateur d'accéder à l'application E-Tontine de manière sécurisée.",
      actors: "Visiteur, Utilisateur authentifié",
      pre: "Pour la connexion : posséder un compte validé. Pour l'inscription : fournir email, mot de passe, nom, prénom et téléphone uniques.",
      scenario:
        "• L'utilisateur accède à la page de connexion ou d'inscription ;\n• Il saisit ses identifiants ou ses informations d'inscription ;\n• Le système vérifie les données via Supabase Auth ;\n• Le système crée ou restaure la session et redirige vers le tableau de bord.",
      post: "L'utilisateur accède au tableau de bord avec un menu adapté à son profil.",
      exception: "Identifiants incorrects, email déjà utilisé, téléphone déjà utilisé ou lien de confirmation expiré.",
    },
  },
  {
    id: "UC-G01",
    heading: "Analyse du cas d'utilisation « Gérer un groupe »",
    ucDiagram: "uc-groupe",
    actDiagram: "act-groupe",
    ucSpec: {
      title: "Module Groupes",
      actorLabel: "Administrateur",
      actorY: 100,
      boundary: { x: 160, y: 30, w: 480, h: 260 },
      cases: [
        { cx: 280, cy: 80, rx: 72, ry: 22, label: "Créer un groupe" },
        { cx: 280, cy: 150, rx: 80, ry: 22, label: "Configurer le groupe" },
        { cx: 280, cy: 220, rx: 80, ry: 22, label: "Supprimer le groupe" },
        { cx: 480, cy: 150, rx: 80, ry: 22, label: "Exporter rapport" },
      ],
    },
    table: {
      title: "Gérer un groupe",
      summary: "Ce cas permet de créer, configurer et administrer un espace de tontine numérique.",
      actors: "Utilisateur authentifié (devient Administrateur), Administrateur de groupe",
      pre: "L'utilisateur est authentifié. Pour la modification : être ADMIN du groupe concerné.",
      scenario:
        "• L'administrateur accède à la section groupes ;\n• Il crée un groupe (nom, description, devise) ou modifie les paramètres ;\n• Le système enregistre le groupe et associe le créateur comme premier ADMIN ;\n• L'administrateur peut exporter un rapport global PDF/Excel.",
      post: "Le groupe est disponible dans le tableau de bord des membres autorisés.",
      exception: "Nom de groupe invalide, droits insuffisants ou groupe contenant encore des opérations non clôturées lors de la suppression.",
    },
  },
  {
    id: "UC-M01",
    heading: "Analyse du cas d'utilisation « Gérer les membres et invitations »",
    ucDiagram: "uc-membres",
    actDiagram: "act-membres",
    ucSpec: {
      title: "Module Membres",
      actorLabel: "Administrateur",
      actorY: 110,
      boundary: { x: 160, y: 30, w: 480, h: 280 },
      cases: [
        { cx: 280, cy: 80, rx: 85, ry: 22, label: "Générer invitation" },
        { cx: 280, cy: 150, rx: 85, ry: 22, label: "Promouvoir membre" },
        { cx: 280, cy: 220, rx: 85, ry: 22, label: "Exclure membre" },
        { cx: 480, cy: 150, rx: 90, ry: 26, label: "Valider\nréintégration" },
      ],
    },
    table: {
      title: "Gérer les membres et invitations",
      summary: "Ce cas permet d'intégrer, gérer les rôles et contrôler l'adhésion des participants au groupe.",
      actors: "Administrateur de groupe, Utilisateur invité, Membre exclu",
      pre: "Le groupe existe. L'administrateur est ACTIF. Un code d'invitation valide existe pour rejoindre le groupe.",
      scenario:
        "• L'administrateur génère ou révoque un code d'invitation ;\n• Un utilisateur rejoint le groupe via le code ;\n• L'administrateur promeut, rétrograde, exclut ou réintègre un membre ;\n• Le système met à jour le rôle et le statut d'adhésion (ACTIF, INACTIF, EN_ATTENTE).",
      post: "La liste des membres et leurs droits sont à jour.",
      exception: "Code révoqué, membre déjà présent, ou tentative de réintégration sans validation admin.",
    },
  },
  {
    id: "UC-C01",
    heading: "Analyse du cas d'utilisation « Gérer un cycle de tontine »",
    ucDiagram: "uc-cycles",
    actDiagram: "act-cycles",
    ucSpec: {
      title: "Module Cycles",
      actorLabel: "Administrateur",
      actorY: 120,
      boundary: { x: 160, y: 30, w: 480, h: 300 },
      cases: [
        { cx: 280, cy: 80, rx: 72, ry: 22, label: "Créer un cycle" },
        { cx: 280, cy: 150, rx: 95, ry: 22, label: "Enregistrer cotisation" },
        { cx: 280, cy: 220, rx: 72, ry: 22, label: "Verser le pot" },
        { cx: 480, cy: 150, rx: 80, ry: 22, label: "Gérer échange" },
      ],
    },
    table: {
      title: "Gérer un cycle de tontine",
      summary: "Ce cas couvre la création d'un cycle rotatif, le suivi des cotisations, pénalités, versements et échanges de tour.",
      actors: "Administrateur de groupe, Membre participant, Système",
      pre: "Le groupe possède au moins deux membres ACTIFS. L'administrateur est autorisé.",
      scenario:
        "• L'administrateur crée un cycle (montant, durée de tour, participants, ordre) ;\n• Les membres ou l'admin enregistrent les cotisations par tour ;\n• Le système calcule les échéances et applique les pénalités configurées ;\n• L'administrateur verse le pot au bénéficiaire du tour ;\n• Un membre peut demander un échange de place soumis à validation.",
      post: "Le cycle avance tour par tour avec traçabilité des cotisations et distributions.",
      exception: "Montant incohérent, tour incomplet avant versement, ou échange refusé par la cible ou l'administrateur.",
    },
  },
  {
    id: "UC-R01",
    heading: "Analyse du cas d'utilisation « Gérer les rubriques »",
    ucDiagram: "uc-rubriques",
    actDiagram: "act-rubriques",
    ucSpec: {
      title: "Module Rubriques",
      actorLabel: "Administrateur",
      actorY: 100,
      boundary: { x: 160, y: 30, w: 480, h: 260 },
      cases: [
        { cx: 280, cy: 80, rx: 80, ry: 22, label: "Créer rubrique" },
        { cx: 280, cy: 150, rx: 95, ry: 22, label: "Enregistrer paiement" },
        { cx: 280, cy: 220, rx: 85, ry: 22, label: "Effectuer retrait" },
        { cx: 480, cy: 150, rx: 90, ry: 26, label: "Verser au\npot commun" },
      ],
    },
    table: {
      title: "Gérer les rubriques de cotisation",
      summary: "Ce cas permet de créer des cotisations complémentaires (ponctuelles ou récurrentes) et d'en suivre les paiements.",
      actors: "Administrateur de groupe, Membre concerné",
      pre: "Le groupe existe. Les membres cibles sont ACTIF.",
      scenario:
        "• L'administrateur crée une rubrique (montant, fréquence, membres concernés) ;\n• Les paiements sont enregistrés manuellement ou via Mobile Money ;\n• Le système met à jour la caisse rubrique et le statut visuel du membre ;\n• L'administrateur peut effectuer un retrait ou un versement au pot commun.",
      post: "Les soldes rubrique et l'historique des paiements sont à jour.",
      exception: "Montant inférieur au montant fixe, rubrique clôturée ou solde insuffisant pour un retrait.",
    },
  },
  {
    id: "UC-RE01",
    heading: "Analyse du cas d'utilisation « Gérer les réunions »",
    ucDiagram: "uc-reunions",
    actDiagram: "act-reunions",
    ucSpec: {
      title: "Module Réunions",
      actorLabel: "Administrateur",
      actorY: 110,
      boundary: { x: 160, y: 30, w: 480, h: 280 },
      cases: [
        { cx: 280, cy: 80, rx: 85, ry: 22, label: "Planifier réunion" },
        { cx: 280, cy: 150, rx: 85, ry: 22, label: "Saisir présences" },
        { cx: 280, cy: 220, rx: 85, ry: 22, label: "Appliquer amende" },
        { cx: 480, cy: 150, rx: 90, ry: 26, label: "Retirer caisse\namendes" },
      ],
    },
    table: {
      title: "Gérer les réunions",
      summary: "Ce cas permet de planifier les réunions, suivre les présences et gérer les amendes associées.",
      actors: "Administrateur de groupe, Membre",
      pre: "Le groupe possède des membres ACTIFS.",
      scenario:
        "• L'administrateur planifie une réunion (date, lieu, type, amende éventuelle) ;\n• Il saisit les présences ou le membre signale une absence à l'avance ;\n• Le système calcule les amendes impayées ;\n• Le membre paie l'amende ; l'administrateur peut retirer des fonds de la caisse amendes.",
      post: "La réunion est clôturée avec feuille de présence et compte-rendu éventuel.",
      exception: "Réunion annulée, double saisie de présence, ou amende déjà réglée.",
    },
  },
  {
    id: "UC-E01",
    heading: "Analyse du cas d'utilisation « Gérer l'épargne »",
    ucDiagram: "uc-epargne",
    actDiagram: "act-epargne",
    ucSpec: {
      title: "Module Épargne",
      actorLabel: "Membre / Admin",
      actorY: 110,
      boundary: { x: 160, y: 30, w: 480, h: 280 },
      cases: [
        { cx: 280, cy: 80, rx: 80, ry: 22, label: "Ouvrir compte" },
        { cx: 280, cy: 150, rx: 85, ry: 22, label: "Effectuer dépôt" },
        { cx: 280, cy: 220, rx: 85, ry: 22, label: "Effectuer retrait" },
        { cx: 480, cy: 150, rx: 90, ry: 26, label: "Signaler\nmouvement" },
      ],
    },
    table: {
      title: "Gérer l'épargne individuelle",
      summary: "Ce cas permet d'ouvrir et d'administrer le compte épargne de chaque membre au sein du groupe.",
      actors: "Administrateur de groupe, Membre",
      pre: "Le membre est ACTIF dans le groupe. Le compte épargne est ouvert ou en cours d'ouverture.",
      scenario:
        "• L'administrateur ouvre un compte épargne pour un membre ;\n• Des dépôts ou retraits sont enregistrés (admin ou Mobile Money) ;\n• Le membre consulte solde et historique ;\n• En cas de contestation, le membre signale un mouvement pour audit admin.",
      post: "Le solde épargne et le journal des mouvements reflètent l'opération.",
      exception: "Compte bloqué ou clôturé, solde insuffisant, ou montant de dépôt invalide.",
    },
  },
  {
    id: "UC-P01",
    heading: "Analyse du cas d'utilisation « Gérer les prêts internes »",
    ucDiagram: "uc-prets",
    actDiagram: "act-prets",
    ucSpec: {
      title: "Module Prêts",
      actorLabel: "Membre / Admin",
      actorY: 120,
      boundary: { x: 160, y: 30, w: 480, h: 300 },
      cases: [
        { cx: 280, cy: 80, rx: 80, ry: 22, label: "Demander prêt" },
        { cx: 280, cy: 150, rx: 90, ry: 22, label: "Accepter garantie" },
        { cx: 280, cy: 220, rx: 85, ry: 22, label: "Approuver prêt" },
        { cx: 480, cy: 150, rx: 85, ry: 22, label: "Rembourser prêt" },
      ],
    },
    table: {
      title: "Gérer les prêts internes",
      summary: "Ce cas permet à un membre éligible d'emprunter auprès de la banque du groupe avec avalistes et contrôle admin.",
      actors: "Membre emprunteur, Avaliste, Administrateur de groupe, Système",
      pre: "Paramètres prêt configurés. Emprunteur éligible (ancienneté, épargne, absence de prêt actif). Banque du groupe suffisante.",
      scenario:
        "• Le membre soumet une demande de prêt ;\n• Il propose des avalistes qui acceptent la garantie ;\n• L'administrateur analyse, approuve ou refuse ;\n• En cas d'approbation, le prêt est décaissé depuis la banque du groupe ;\n• L'emprunteur rembourse capital et intérêts ; le système gère les défauts et garanties.",
      post: "Le prêt passe au statut EN_COURS, SOLDE ou DEFAUT selon le remboursement.",
      exception: "Éligibilité non satisfaite, avaliste refusant, plafond dépassé ou banque insuffisante.",
    },
  },
  {
    id: "UC-F01",
    heading: "Analyse du cas d'utilisation « Effectuer un paiement Mobile Money »",
    ucDiagram: "uc-paiements",
    actDiagram: "act-paiements",
    ucSpec: {
      title: "Module Paiements",
      actorLabel: "Membre / Admin",
      actorY: 100,
      boundary: { x: 160, y: 30, w: 480, h: 260 },
      cases: [
        { cx: 280, cy: 80, rx: 95, ry: 26, label: "Initier\nMobile Money" },
        { cx: 280, cy: 160, rx: 90, ry: 22, label: "Suivre transaction" },
        { cx: 480, cy: 120, rx: 90, ry: 26, label: "Finaliser\npaiement" },
      ],
    },
    table: {
      title: "Effectuer un paiement Mobile Money",
      summary: "Ce cas permet d'initier et de finaliser un paiement entrant ou sortant lié à un contexte métier (cotisation, rubrique, amende, épargne, prêt, distribution).",
      actors: "Membre, Administrateur de groupe, Opérateur Mobile Money (Orange/MTN), Système",
      pre: "L'utilisateur est autorisé sur le contexte (membre pour paiement entrant ; admin pour paiement sortant). Montant et bénéficiaire valides.",
      scenario:
        "• L'utilisateur initie un paiement depuis l'interface ;\n• Le système crée une PaymentTransaction (PENDING puis PROCESSING) ;\n• L'opérateur Mobile Money confirme ou rejette l'opération ;\n• Le système finalise atomiquement : mise à jour métier, caisse, journal financier et notification.",
      post: "La transaction est en statut SUCCESS et les soldes métier sont cohérents.",
      exception: "Paiement expiré, fonds insuffisants, transaction déjà finalisée ou opérateur indisponible.",
    },
  },
  {
    id: "UC-F03",
    heading: "Analyse du cas d'utilisation « Consulter les finances et rapports »",
    ucDiagram: "uc-finances",
    actDiagram: "act-finances",
    ucSpec: {
      title: "Module Finances",
      actorLabel: "Membre / Admin",
      actorY: 100,
      boundary: { x: 160, y: 30, w: 480, h: 260 },
      cases: [
        { cx: 280, cy: 80, rx: 85, ry: 22, label: "Consulter caisses" },
        { cx: 280, cy: 150, rx: 85, ry: 22, label: "Consulter journal" },
        { cx: 280, cy: 220, rx: 90, ry: 22, label: "Télécharger PDF" },
        { cx: 480, cy: 150, rx: 90, ry: 26, label: "Exporter\nExcel" },
      ],
    },
    table: {
      title: "Consulter les finances et rapports",
      summary: "Ce cas permet de consulter le journal financier, les caisses typées et de produire des relevés exportables.",
      actors: "Membre (lecture limitée), Administrateur de groupe",
      pre: "L'utilisateur est membre ACTIF du groupe.",
      scenario:
        "• L'utilisateur ouvre le module Finances ou Rapports ;\n• Le système affiche les caisses (GENERALE, CYCLE, RUBRIQUE, AMENDES, etc.) et le journal paginé ;\n• L'administrateur ou le membre télécharge un relevé PDF individuel ou un rapport groupe PDF/Excel.",
      post: "Les informations affichées correspondent à l'état courant des caisses et mouvements.",
      exception: "Accès refusé pour un membre exclu ou données masquées par l'utilisateur.",
    },
  },
];

genGlobalAdmin();
genGlobalMembre();
genClassDiagram();
for (const uc of useCases) genSimpleUseCase(uc.ucDiagram, uc.ucSpec);

const pngFiles = {};
for (const f of fs.readdirSync(DIAG).filter((n) => n.endsWith(".svg"))) {
  pngFiles[f.replace(".svg", "")] = svgToPng(f.replace(".svg", ""));
}

function img(name, w = 500, h = 320) {
  const p = pngFiles[name];
  if (!p) return new Paragraph({ children: [new TextRun({ text: `[Diagramme ${name} manquant]`, italics: true })] });
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(p), transformation: { width: w, height: h }, altText: { title: name, description: name, name } })],
  });
}

const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width ?? 4680, type: WidthType.DXA },
    shading: opts.header ? { fill: "D5E8F0", type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.header })] })],
  });
}
function useCaseTable(uc) {
  const rows = [
    ["Titre", uc.title],
    ["Résumé", uc.summary],
    ["Acteurs", uc.actors],
    ["Précondition", uc.pre],
    ["Scénario nominal", uc.scenario],
    ["Postcondition", uc.post],
    ["Exception", uc.exception],
  ];
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2200, 6826],
    rows: rows.map(([k, v], i) => new TableRow({ children: [cell(k, { width: 2200, header: i === 0 }), cell(v, { width: 6826 })] })),
  });
}

let figNum = 1;
function nextFig(label) {
  return new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: `Figure ${figNum++} : ${label}`, bold: true })] });
}

const children = [
  new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CAHIER D'ANALYSE", bold: true, size: 36 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Projet E-TONTINE", bold: true, size: 28 })] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: "Analyse et implémentation d'une application web de gestion de tontines communautaires", size: 22 })],
  }),
  new Paragraph({ children: [new PageBreak()] }),

  // ── I. Contexte (première version) ──
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("I. Contexte du projet")] }),
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun(
        "La tontine est une pratique d'épargne collective solidaire très répandue au Cameroun et en Afrique subsaharienne. Malgré son importance économique, sa gestion repose encore largement sur des registres papier, source d'erreurs, d'opacité et de conflits entre membres.",
      ),
    ],
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun(
        "E-Tontine est une application web visant à digitaliser l'intégralité du cycle de vie d'une tontine communautaire : adhésion des membres, cycles rotatifs, rubriques, réunions, épargne individuelle, prêts internes, paiements Mobile Money et reporting. Le projet s'inscrit dans une démarche de transparence, traçabilité et sécurisation des opérations financières informelles.",
      ),
    ],
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: "Problématique : ", bold: true }),
      new TextRun(
        "Comment concevoir une application web adaptée aux réalités camerounaises, capable de couvrir tout le cycle de vie d'une tontine tout en garantissant transparence, traçabilité et sécurité des données ?",
      ),
    ],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({ text: "Objectif général : ", bold: true }),
      new TextRun(
        "Développer une plateforme web permettant aux administrateurs et aux membres de suivre les activités financières et organisationnelles d'un groupe de manière fiable, centralisée et transparente.",
      ),
    ],
  }),

  // ── II. Besoins (première version) ──
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("II. Rappel des besoins")] }),
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("II.1 Besoins fonctionnels")] }),
  new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun("Les besoins fonctionnels décrivent ce que le système doit faire pour répondre aux attentes des utilisateurs. Ils sont regroupés par module métier.")],
  }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Authentification : inscription, connexion, déconnexion, réinitialisation et mise à jour du profil.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Groupes : création, configuration, suppression, tableau de bord et rapports globaux.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Membres : invitations, rôles ADMIN/MEMBRE, exclusion et réintégration.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Cycles : participants, ordre de passage, cotisations, pénalités, versements et échanges de tour.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Rubriques : cotisations ponctuelles ou récurrentes, paiements et retraits.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Réunions : planification, présences, amendes et caisse dédiée.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Épargne : comptes individuels, dépôts, retraits, signalements et audit.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Prêts internes : demande, avalistes, approbation, décaissement et remboursement.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Paiements : initiation Mobile Money, suivi et finalisation multi-contextes.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Finances : journal centralisé, caisses typées, notifications et exports PDF/Excel.")] }),

  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("II.2 Besoins non fonctionnels")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Sécurité : authentification Supabase, contrôle d'accès par membership et séparation admin/membre.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Intégrité : transactions atomiques, journal financier avec soldes avant/après.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Performance : indexation base de données, pagination des finances.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Disponibilité : déploiement cloud (Vercel), endpoint de santé, Node.js ≥ 20.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Utilisabilité : interface bilingue FR/EN, responsive, statuts visuels VERT/ORANGE/ROUGE.")] }),
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Traçabilité : notifications métier, rapports PDF/Excel, audit épargne.")] }),

  // ── III. Acteurs (première version) ──
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("III. Acteurs du système")] }),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun("À partir de l'étude du domaine de la tontine et de l'application E-Tontine, nous identifions les acteurs suivants :")],
  }),
  new Paragraph({ children: [new TextRun({ text: "Visiteur", bold: true }), new TextRun(" : consulte la page d'accueil publique et peut créer un compte ou ouvrir un lien d'invitation.")] }),
  new Paragraph({ children: [new TextRun({ text: "Utilisateur authentifié", bold: true }), new TextRun(" : accède au tableau de bord global et à son compte personnel.")] }),
  new Paragraph({ children: [new TextRun({ text: "Membre de groupe", bold: true }), new TextRun(" : participe aux cycles, paie ses obligations, consulte son épargne et reçoit des notifications.")] }),
  new Paragraph({ children: [new TextRun({ text: "Administrateur de groupe", bold: true }), new TextRun(" : pilote le groupe (membres, cycles, finances, prêts, réunions, rapports).")] }),
  new Paragraph({ children: [new TextRun({ text: "Avaliste", bold: true }), new TextRun(" : membre garant d'un prêt interne, accepte ou refuse la garantie.")] }),
  new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "Système", bold: true }), new TextRun(" : applique automatiquement pénalités, rappels et finalisations de paiements.")] }),

  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("IV. Diagrammes de cas d'utilisation globaux")] }),
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun("Les diagrammes ci-dessous présentent une vue synthétique des interactions entre les acteurs principaux et le système E-Tontine.")],
  }),
  nextFig("Diagramme de cas d'utilisation — Administrateur de groupe"),
  img("uc-global-admin", 520, 330),
  new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun("L'administrateur dispose d'un accès complet à la gestion du groupe : membres, cycles, rubriques, réunions, épargne, prêts, paiements sortants, finances et rapports.")],
  }),
  nextFig("Diagramme de cas d'utilisation — Membre / Visiteur"),
  img("uc-global-membre", 520, 310),

  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("V. Analyse des cas d'utilisation")] }),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun("Pour chaque cas d'utilisation majeur : fiche descriptive (modèle TAMELA), diagramme de cas d'utilisation et diagramme d'activité.")],
  }),
];

useCases.forEach((uc, idx) => {
  const actH = activityHeights[uc.actDiagram] || 420;
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${idx + 1}. ${uc.heading}`)] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Tableau ${idx + 1} : Description du cas d'utilisation « ${uc.table.title} »`, bold: true })] }),
    useCaseTable(uc.table),
    new Paragraph({ spacing: { before: 140, after: 40 }, children: [new TextRun({ text: "Description du cas d'utilisation", bold: true, italics: true })] }),
    nextFig(`Diagramme de cas d'utilisation — ${uc.table.title}`),
    img(uc.ucDiagram, 500, 300),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun(`Identifiant : ${uc.id}`)] }),
    new Paragraph({ spacing: { before: 100, after: 40 }, children: [new TextRun({ text: "Activité du cas d'utilisation", bold: true, italics: true })] }),
    nextFig(`Diagramme d'activité — ${uc.table.title}`),
    img(uc.actDiagram, 500, Math.min(520, actH * 0.85)),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),
  );
});

children.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("VI. Diagramme de classes")] }),
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun("Le diagramme modélise les entités principales du domaine E-Tontine et leurs associations, avec cardinalités explicites.")],
  }),
  nextFig("Diagramme de classes simplifié du système E-Tontine"),
  img("class-diagram", 520, 340),
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("VI.1 Explication du diagramme")] }),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Un User (1) est lié à (0..*) MembreGroupe : chaque adhésion porte le rôle et le statut du membre dans un groupe.")]}),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun("MembreGroupe (0..*) appartient à (1) Groupes : le groupe centralise cycles, rubriques, réunions, prêts et caisses.")]}),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Groupes (1) possède (0..*) CycleTontine ; chaque cycle génère (0..*) Cotisations payées par (1) MembreGroupe.")]}),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun("MembreGroupe (1) possède (0..1) CompteEpargne ; Groupes (1) possède (1..*) CaisseFinanciere enregistrant (0..*) MouvementFinancier.")]}),
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Cette modélisation prépare le MLD Prisma et la conception détaillée du mémoire E-Tontine.")] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Conclusion")] }),
  new Paragraph({
    children: [
      new TextRun(
        "Ce cahier d'analyse a rappelé le contexte, les besoins, les acteurs, les cas d'utilisation avec fiches descriptives, diagrammes de cas d'utilisation, diagrammes d'activité et un diagramme de classes. Il constitue la base analytique pour la rédaction du mémoire.",
      ),
    ],
  }),
);

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial" }, paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{ reference: "bullets", levels: [{ level: 0, format: "bullet", text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }],
  },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }],
});

fs.writeFileSync(OUT, await Packer.toBuffer(doc));
console.log(`Document généré : ${OUT}`);
