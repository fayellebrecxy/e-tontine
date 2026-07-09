#!/usr/bin/env node
import fs from "fs";
import path from "path";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOCS = path.join(ROOT, "Docs");
const OUT = path.join(DOCS, "description-du-package.docx");
const IMG_PATH = path.join(DOCS, "diagramme-packages-e-tontine.png");

const P = { after: 120, before: 60 };
const H1 = { before: 240, after: 120 };
const H2 = { before: 180, after: 90 };

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
      children: [new TextRun({ text: `[Image manquante : ${path.basename(filePath)}]`, italics: true })],
    });
  }
  const { w, h } = pngSize(filePath);
  const width = maxW;
  const height = Math.round((h / w) * width);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
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

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: H1, children: [new TextRun({ text, bold: true, size: 28 })] });
}

function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: H2, children: [new TextRun({ text, bold: true, size: 24 })] });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: P,
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 22, bold: opts.bold, italics: opts.italics })],
  });
}

function bullet(text, boldPrefix = "") {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix, bold: true, size: 22 }));
  }
  children.push(new TextRun({ text, size: 22 }));
  return new Paragraph({
    spacing: { after: 60, before: 30 },
    bullet: { level: 0 },
    children,
  });
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        h1("Description du Diagramme de Packages Fonctionnels"),
        p("Ce document fournit une explication détaillée de l'organisation et des relations de dépendance du diagramme de packages de l'application E-Tontine dans un cadre académique d'analyse."),

        h2("1. Le Diagramme de Packages"),
        imgPara(IMG_PATH, 520, "Diagramme de packages E-Tontine"),
        p("Figure 1 : Diagramme de packages fonctionnels E-Tontine", { center: true, italics: true }),

        h2("2. Principes Fondamentaux de la Modélisation UML"),
        p("Conformément aux normes UML standard :"),
        bullet(" représente une relation de dépendance. La flèche pointe du client (le module initiateur ou consommateur) vers le fournisseur (le module requis).", "Une flèche pointillée avec une tête ouverte (A ──> B)"),
        bullet("Une dépendance indique que toute modification de l'interface ou du comportement du package de destination (fournisseur) peut impacter le package source (client)."),
        bullet("Les packages représentent des regroupements logiques ou des modules métiers cohérents de l'application (stéréotypés «module»), éliminant ainsi toute notation technique superflue lors de la phase d'analyse."),

        h2("3. Justification Métier des Dépendances"),
        
        p("3.1. Gestion des Accès et de la Structure de Base", { bold: true }),
        bullet(" : Pour créer un membre et configurer son profil, le système doit l'associer à un compte utilisateur déjà existant et authentifié. La gestion des profils membres consomme les informations du module d'authentification.", "GestionMembres ──> Authentification"),
        bullet(" : Un membre n'existe pas de façon isolée ; son adhésion (Membership) est structurellement liée à un groupe de tontine. La création du membre nécessite donc la référence au groupe.", "GestionMembres ──> GestionGroupes"),

        p("3.2. Rattachement au Contexte du Groupe", { bold: true }),
        bullet("Tous les modules opérationnels métier (Cycles de Tontine, Rubriques de Cotisation, Réunions et Amendes, Épargne Individuelle, Prêts Internes) dépendent directement du package GestionGroupes (représenté par les flèches pointant vers le haut vers le bus de routage).", "Dépendance contextuelle"),
        bullet("En effet, dans la logique applicative et le schéma de données, ces entités ne peuvent exister sans être associées à un groupe tontine spécifique (présence d'une clé étrangère groupId dans la base de données)."),

        p("3.3. Logique de Financement Inter-Modules", { bold: true }),
        bullet(" : L'octroi d'un prêt est conditionné par la désignation d'avalistes (garants) au sein du groupe. La validation du prêt nécessite d'inspecter et de réserver les fonds sur les comptes d'épargne individuelle de ces garants.", "Prêts Internes ──> Épargne Individuelle"),
        bullet(" : Les échéances de remboursement et le calcul des taux/tours du prêt sont directement calqués sur la configuration du cycle actif de la tontine.", "Prêts Internes ──> Cycles Tontine"),

        p("3.4. Flux Monétaires et Traitement des Paiements", { bold: true }),
        bullet("Les modules Cycles, Rubriques, Épargne et Prêts dépendent du package Paiements Mobile Money pour l'exécution technique des flux financiers électroniques (dépôts de cotisations, retraits, décaissements de prêts).", "Paiements Mobile Money"),

        p("3.5. Consolidation Comptable et Grand Livre", { bold: true }),
        bullet("Les écritures comptables générées par les transactions des cycles, des rubriques, des réunions (amendes payées), des comptes d'épargne et des prêts sont toutes transmises et consignées dans le Journal Financier.", "Journal Financier"),
        bullet("Le Journal Financier centralise le Grand Livre et assure la cohérence des caisses et de la trésorerie globale du groupe."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  console.log(`Document généré avec succès à l'emplacement : ${OUT}`);
});
