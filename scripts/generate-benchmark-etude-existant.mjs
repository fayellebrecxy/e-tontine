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
const OUT = path.join(__dirname, "../Docs/benchmark-etude-existant-tontines-E-TONTINE.docx");
const DATE = "18 juin 2026";

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
    children: [new TextRun({ text, size: 22, bold: opts.bold, italics: opts.italic })],
  });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } });
}
function bullet2(text) {
  return new Paragraph({ text, bullet: { level: 1 }, spacing: { after: 60 } });
}
function table(headers, rows) {
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })],
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
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18 })] })],
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
  new Paragraph({ spacing: { before: 1800 } }),
  p("ÉTUDE DE L'EXISTANT", { center: true, bold: true }),
  p("Benchmark des applications de gestion de tontines", { center: true, bold: true }),
  p("Justification de la pertinence du projet E-Tontine", { center: true }),
  p(`Version 1.0 — ${DATE}`, { center: true }),
  new Paragraph({ pageBreakBefore: true }),

  // I
  h1("I. Introduction et méthodologie"),
  h2("1.1 Objet de l'étude"),
  p(
    "Le présent document constitue une étude de l'existant (benchmark) des applications numériques de gestion de tontines, njangis et épargnes communautaires en Afrique et dans la diaspora. L'objectif est d'analyser en profondeur les fonctionnalités, les problèmes adressés, les solutions proposées et les limites des solutions concurrentes, afin de justifier la pertinence des choix fonctionnels et techniques du projet E-Tontine.",
  ),
  h2("1.2 Périmètre de l'analyse"),
  bullet("Applications ciblant l'Afrique francophone, avec focus Cameroun et zone CEMAC."),
  bullet("Solutions de référence citées par les utilisateurs et la presse (Djangui 3.0, Njangi, KIKA, etc.)."),
  bullet("Plateformes proches par le modèle (épargne collective, prêts internes, Mobile Money)."),
  bullet("Études sectorielles et retours terrain (France 24, WSBI, Included VC, We Are Tech)."),

  h2("1.3 Méthode de collecte"),
  p(
    "Les informations ont été collectées à partir de sources publiques et vérifiables : sites officiels des éditeurs, fiches App Store / Google Play, articles de presse spécialisée, blogs produit, documentation technique publique et études de cas sectorielles. Chaque application est analysée selon un canevas homogène : positionnement, fonctionnalités, problèmes résolus, limites observées et modèle économique.",
  ),
  p("Limites de la méthode : certaines applications ne publient pas de documentation technique détaillée ; les fonctionnalités annoncées peuvent différer de l'expérience réelle ; les tarifs et commissions évoluent.", { italic: true }),

  // II
  new Paragraph({ pageBreakBefore: true }),
  h1("II. Contexte du marché et problématique commune"),
  h2("2.1 Un marché massif mais sous-outillé"),
  p(
    "Au Cameroun et en Afrique subsaharienne, la tontine (njangi, djangui, natt, esusu) reste un pilier de l'épargne et du crédit informel. Selon l'Institut Africain Mondial cité par France 24 (2024), environ 85 % des Africains sont exclus du système bancaire classique. Au Cameroun, les taux d'intérêt bancaires dépassent souvent 10 % (BEAC, 2022), et les banques exigent des garanties que les acteurs informels ne possèdent pas.",
  ),
  p(
    "La tontine comble ce vide : cotisations régulières, tours de gain, solidarité de groupe. Mais sa gestion repose encore largement sur des carnets papier, des calculs manuels et la confiance en un trésorier — sources d'erreurs, de conflits et parfois de pertes financières.",
  ),

  h2("2.2 Problèmes structurels que les applications tentent de résoudre"),
  table(
    ["Problème terrain", "Manifestation concrète", "Impact social"],
    [
      ["Opacité financière", "Carnets éparpillés, pas d'historique partagé", "Accusations de détournement, rupture de confiance"],
      ["Erreurs de calcul", "Tours de gain mal comptés, retards non tracés", "Bénéficiaires lésés, conflits interpersonnels"],
      ["Coordination difficile", "Relances par appels/WhatsApp", "Oublis de cotisation, désorganisation"],
      ["Risque de fraude", "Identités non vérifiées, argent en espèces", "Pertes financières (cas documentés au Cameroun)"],
      ["Exclusion du crédit formel", "Pas d'historique bancaire", "Impossibilité d'investir ou d'emprunter"],
      ["Distance géographique", "Diaspora et membres éloignés", "Participation réduite, suivi impossible"],
    ],
  ),

  h2("2.3 Tendance de digitalisation"),
  p(
    "Depuis 2020, une vague d'applications fintech cible ce marché. France 24 (mars 2024) note que Djangui fut l'une des premières apps de tontine au Cameroun, suivie par plusieurs imitateurs. Les banques elles-mêmes s'intéressent au segment (ex. Afriland First Bank). Pourtant, aucune solution n'a encore atteint le statut d'« application de référence » à l'échelle continentale (Included VC, 2025).",
  ),

  // III
  new Paragraph({ pageBreakBefore: true }),
  h1("III. Analyse détaillée des applications existantes"),

  h2("3.1 Djangui 3.0 / Africa Djangui"),
  h3("Présentation"),
  p("Éditeur : TI Services Consulting (TISCON), Niort (France). Site : djangui.net / africadjangui.com. Cible : Afrique francophone (15+ pays), diaspora, focus Cameroun et Sénégal. Plateforme : Web + Android (v3.0.7). Stack : Flutter/FlutterFlow, Supabase."),
  h3("Fonctionnalités principales"),
  bullet("Création et gestion de tontines rotatives et accumulatives."),
  bullet("Suivi des cotisations en temps réel, rappels automatiques (J-3, J-1, J-0)."),
  bullet("Cycles, tirage au sort, distributions du pot."),
  bullet("Banque d'épargne et de crédit (« Casse Banque » annuelle)."),
  bullet("Prêts entre membres avec échéancier automatique."),
  bullet("Caisses personnalisées (solidarité, scolaire, rapatriement, projets)."),
  bullet("Pénalités, amendes, réunions avec émargement QR Code."),
  bullet("Rapports PDF, notifications, multi-devises (FCFA, EUR, USD, CAD, GBP)."),
  bullet("Paiements : Orange Money, MTN MoMo, PayPal, Stripe, virement, espèces."),
  bullet("Coach financier IA (WhatsApp), KYC, détection de fraudes."),
  h3("Problèmes adressés"),
  bullet("Remplace les carnets et calculs manuels par un suivi automatisé."),
  bullet("Renforce la transparence via historique partagé et reçus numériques."),
  bullet("Facilite les paiements Mobile Money et la participation de la diaspora."),
  h3("Limites et critiques"),
  bullet("Modèle hybride : l'app peut fonctionner en mode déclaratif (l'argent ne transite pas toujours par la plateforme)."),
  bullet("Fonctionnalités premium / IA pouvant complexifier l'expérience pour des utilisateurs peu technophiles."),
  bullet("Éditeur basé en France — risque perçu de déconnexion avec le terrain camerounais."),
  bullet("Frais et commissions non toujours transparents sur la version gratuite."),
  bullet("Risque de fraude documenté par France 24 sur les tontines en ligne au Cameroun (identités falsifiées)."),

  h2("3.2 Njangi App"),
  h3("Présentation"),
  p("Site : njangiapp.com. Fondateur : Dr. ATEH Thomson Pepeah (juriste). Cible : Afrique (njangi camerounais). Plateforme : iOS + Android."),
  h3("Fonctionnalités principales"),
  bullet("Groupes Njangi, cycles automatisés, tableau de bord."),
  bullet("Compte épargne personnel (« Banque Njangi »)."),
  bullet("Prêts : demande, approbation, remboursement intra-groupe."),
  bullet("Messagerie intégrée (groupe, privé, annonces)."),
  bullet("KYC intégré, partage automatique des bénéfices."),
  bullet("Njangi Backmarket (marketplace de services), Fonds de secours, publicité intra-groupe, loto."),
  h3("Problèmes adressés"),
  bullet("Centralise épargne, prêts et communication dans une seule app."),
  bullet("Automatise les cycles pour réduire l'intervention manuelle du trésorier."),
  bullet("KYC pour réduire les risques de fraude."),
  h3("Limites et critiques"),
  bullet("Écosystème très large (marketplace, loto, pub) pouvant diluer le cœur métier tontine."),
  bullet("Frais de plateforme mentionnés dans l'historique des transactions."),
  bullet("Complexité accrue pour des groupes traditionnels cherchant un outil simple."),
  bullet("Pas de version web mentionnée comme canal principal."),

  h2("3.3 KIKA"),
  h3("Présentation"),
  p("Site : kika.africa. Cible : Afrique (présence Cameroun +237). Plateforme : Mobile. Partenaires : BGFI Bank, TaxAfrica."),
  h3("Fonctionnalités principales"),
  bullet("Création de tontine, tours automatisés, rappels, notifications."),
  bullet("Paiements Mobile Money (Orange, MTN, Wave) ou via l'app."),
  bullet("Rôles : président, secrétaire, trésorier, membres."),
  bullet("Simulateur de tontine, module « Financez vos rêves »."),
  bullet("Suspension/remplacement de membres en cas de non-paiement."),
  h3("Problèmes adressés"),
  bullet("Simplifie la tontine par rapport à WhatsApp et carnets."),
  bullet("Automatise tours et rappels pour réduire les oublis."),
  bullet("Transparence en temps réel pour tous les membres."),
  h3("Limites et critiques"),
  bullet("Commission de 5 % sur chaque retrait — coût significatif pour les membres."),
  bullet("Application mobile uniquement (pas de portail web complet identifié)."),
  bullet("Fonctionnalités avancées (réunions, rubriques, prêts avec avalistes) non documentées."),
  bullet("Modèle économique basé sur les frais de retrait, pouvant inciter au retour au cash."),

  h2("3.4 Tchoua"),
  h3("Présentation"),
  p("Site : tchoua.com. Modèle : Open Source (MIT/Apache 2.0), gratuit. Cible : Afrique multi-pays. Plateforme : Web + Android + iOS (Expo/React Native)."),
  h3("Fonctionnalités principales"),
  bullet("18 modules : ROSCA, ASCA, tontines nature, solidarité, hybride."),
  bullet("Cotisations multi-devises, Mobile Money (MTN, Orange, Wave)."),
  bullet("Caisse et microfinance communautaire, prêts internes."),
  bullet("API REST, auto-hébergement (SQLite/PostgreSQL), multilingue."),
  h3("Problèmes adressés"),
  bullet("Couverture exhaustive des types de tontines traditionnelles."),
  bullet("Gratuité totale et open source — accessible aux associations."),
  bullet("Flexibilité d'hébergement pour les organisations souveraines."),
  h3("Limites et critiques"),
  bullet("Complexité des 18 modules — courbe d'apprentissage élevée."),
  bullet("Nécessite compétences techniques pour l'auto-hébergement."),
  bullet("Maturité produit et support commercial moins structurés qu'une fintech."),
  bullet("Site parfois indisponible (observé en juin 2026)."),

  h2("3.5 MaTontine"),
  h3("Présentation"),
  p("Éditeur : MaTontine (Dakar, Sénégal, fondée 2015). Cible : Sénégal, Gambie, Afrique de l'Ouest. Plateforme : Mobile + Web. Modèle : FIaaS (Financial Inclusion as a Service)."),
  h3("Fonctionnalités principales"),
  bullet("Gestion automatisée des groupes d'épargne (ROSCA)."),
  bullet("Cotisations via Mobile Money (Orange Money, Yup, Wari)."),
  bullet("Scoring de crédit individuel et groupe → accès microcrédit partenaires."),
  bullet("KYC biométrique, signature numérique, USSD."),
  bullet("Partenariats MFI, assurances, ONG."),
  h3("Problèmes adressés"),
  bullet("Inclusion financière des femmes et travailleurs informels."),
  bullet("Transformation de l'historique tontine en score de crédit bancaire."),
  bullet("Sécurisation des fonds via institution financière accréditée."),
  h3("Limites et critiques"),
  bullet("Orientée Sénégal/Gambie — pas de focus Cameroun/CEMAC."),
  bullet("Dépendance aux partenaires financiers externes pour le crédit."),
  bullet("Peu d'avis utilisateurs publics ; adoption communautaire difficile à mesurer."),
  bullet("Moins de modules de gouvernance locale (réunions, amendes, rubriques) documentés."),

  h2("3.6 Cirkkle"),
  h3("Présentation"),
  p("Site : cirkkle.com. Cible : Diaspora africaine en France. Plateforme : iOS + Android. Conformité : ORIAS (cadre français)."),
  h3("Fonctionnalités principales"),
  bullet("Création de cercles (tontines), invitations, règles validées par clic."),
  bullet("Wallet centralisé, virement/prélèvement/carte bancaire."),
  bullet("Suivi temps réel, rappels automatiques, historique."),
  bullet("Offre Premium : garantie décès, reconnaissance de dette, plafonds levés."),
  h3("Problèmes adressés"),
  bullet("Remplace Excel, captures WhatsApp et relances manuelles."),
  bullet("Conformité réglementaire française pour la diaspora."),
  bullet("Transparence et vérification d'identité anti-fraude."),
  h3("Limites et critiques"),
  bullet("Cible diaspora France/Europe — pas adapté au Mobile Money CEMAC natif."),
  bullet("Plafond 300 €/personne en offre gratuite."),
  bullet("Pas de modules réunions, amendes, rubriques, prêts avec avalistes."),
  bullet("Modèle freemium avec abonnement Premium."),

  h2("3.7 Ohana (Ollo Africa)"),
  h3("Présentation"),
  p("Éditeur : Ollo Africa (Togo). Lancée août 2024. Licence : établissement de monnaie électronique BCEAO. Plateforme : iOS + Android (5 000+ téléchargements Play Store)."),
  h3("Fonctionnalités principales"),
  bullet("Création de groupes d'épargne, règles de contribution, suivi des paiements."),
  bullet("Distribution planifiée des fonds, transactions traçables."),
  bullet("Rappels et notifications automatiques."),
  h3("Problèmes adressés"),
  bullet("Sécurité des fonds via licence EMI (argent en compte groupe assuré)."),
  bullet("Réduction des litiges par traçabilité complète."),
  bullet("Inclusion financière pour populations peu bancarisées."),
  h3("Limites et critiques"),
  bullet("Zone UEMOA (BCEAO) — pas CEMAC."),
  bullet("Fonctionnalités de gouvernance avancée (cycles rotatifs complexes, rubriques, réunions) limitées."),
  bullet("Jeune application (2024), écosystème en construction."),
  bullet("Pas de prêts internes avec avalistes documentés."),

  h2("3.8 Tontiin"),
  h3("Présentation"),
  p("Site : tontiin.com. Cible : Afrique (blog mentionne Cameroun/Nigeria). Plateforme : iOS + Android."),
  h3("Fonctionnalités principales"),
  bullet("Groupes d'épargne digitaux, cotisations Mobile Money multi-pays."),
  bullet("Cycles automatisés, distribution intelligente, analytics."),
  bullet("Participation transfrontalière, multi-devises."),
  bullet("Prêts rapides (quick loans) mentionnés pour le Cameroun."),
  h3("Problèmes adressés"),
  bullet("Scaling des groupes locaux vers des groupes internationaux."),
  bullet("Réduction des coûts administratifs (75 % selon leur blog)."),
  bullet("Accès au crédit via la plateforme."),
  h3("Limites et critiques"),
  bullet("Peu d'avis App Store, adoption difficile à évaluer."),
  bullet("Marketing ambitieux (5000+ groupes) sans données tierces vérifiables."),
  bullet("Modules de gouvernance associative (réunions, amendes, statuts visuels) non détaillés."),

  h2("3.9 E-Tontines CEMAC"),
  h3("Présentation"),
  p("Site : etontines-cemac.ga. Cible : Zone CEMAC (Gabon, etc.). Éditeur actif depuis 2006. Plateforme : Web (+ mobile prévu Q1 2026)."),
  h3("Fonctionnalités annoncées"),
  bullet("Digitalisation tontines avec Mobile Money (Moov, Airtel, GIMAC)."),
  bullet("Paiements automatiques, rappels, cagnottes solidaires."),
  bullet("2FA, chiffrement, types multiples (rotative, épargne, investissement)."),
  h3("Limites observées"),
  bullet("Application mobile « bientôt disponible » (Q1 2026) — pas encore déployée."),
  bullet("Peu de retours utilisateurs publics, maturité produit à confirmer."),
  bullet("Documentation fonctionnelle limitée en ligne."),

  h2("3.10 RICHAUNTI"),
  h3("Présentation"),
  p("Projet fintech (iFundWomen). Cible : Afrique francophone et diaspora. Plateforme : Mobile."),
  h3("Fonctionnalités annoncées"),
  bullet("Cycles flexibles (quotidien, mensuel, annuel), pénalités automatisées."),
  bullet("Chat intégré, système de vote, transparence temps réel."),
  bullet("Commission 6 % sur collectes, pénalité 10 % en cas de retard."),
  h3("Limites"),
  bullet("Projet en développement, pas encore une solution mature déployée."),
  bullet("Frais de 6 % — parmi les plus élevés du marché."),

  // IV TABLEAU COMPARATIF
  new Paragraph({ pageBreakBefore: true }),
  h1("IV. Tableau comparatif synthétique"),
  p("Légende : ✅ = oui/fort | ⚠️ = partiel | ❌ = non/absent | ? = non documenté"),
  table(
    ["Critère", "Djangui", "Njangi", "KIKA", "Tchoua", "MaTontine", "Cirkkle", "Ohana", "E-Tontine"],
    [
      ["Plateforme Web", "✅", "❌", "❌", "✅", "✅", "❌", "❌", "✅"],
      ["App mobile native", "✅ Android", "✅", "✅", "✅", "✅", "✅", "✅", "❌"],
      ["Cycles rotatifs", "✅", "✅", "✅", "✅", "✅", "✅", "⚠️", "✅"],
      ["Pénalités retard", "✅", "?", "⚠️", "✅", "?", "⚠️", "⚠️", "✅"],
      ["Versements pot", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"],
      ["Rubriques/cotisations", "✅", "❌", "❌", "✅", "❌", "❌", "❌", "✅"],
      ["Réunions + amendes", "✅ QR", "❌", "❌", "✅", "❌", "❌", "❌", "✅"],
      ["Épargne individuelle", "✅", "✅", "❌", "✅", "⚠️", "❌", "❌", "✅"],
      ["Prêts internes", "✅", "✅", "❌", "✅", "✅ externe", "❌", "❌", "✅ avalistes"],
      ["Statut discipline membre", "⚠️", "❌", "⚠️", "?", "❌", "✅", "❌", "✅ VERT/ROUGE"],
      ["Rapports PDF/Excel", "✅ PDF", "?", "❌", "✅", "✅", "⚠️", "❌", "✅ PDF+Excel"],
      ["Mobile Money intégré", "✅", "?", "✅", "✅", "✅", "❌", "✅", "⚠️ enregistrement"],
      ["KYC / identité", "✅", "✅", "✅", "❌", "✅ bio", "✅", "✅", "❌"],
      ["Coach IA", "✅", "❌", "❌", "❌", "✅ ML", "❌", "❌", "❌"],
      ["Open Source", "❌", "❌", "❌", "✅", "❌", "❌", "❌", "❌"],
      ["Commission", "Premium", "Frais plateforme", "5% retrait", "Gratuit", "Partenaires", "Freemium", "?", "Gratuit prévu"],
      ["Focus Cameroun", "✅", "✅", "✅", "✅", "❌", "❌ diaspora", "❌", "✅"],
    ],
  ),

  // V SYNTHESE PROBLEMES
  new Paragraph({ pageBreakBefore: true }),
  h1("V. Synthèse : problèmes, solutions et lacunes du marché"),

  h2("5.1 Problèmes communs bien identifiés par le secteur"),
  p("Toutes les applications convergent vers les mêmes constats terrain :"),
  bullet("La gestion manuelle (carnets, Excel, WhatsApp) génère opacité, erreurs et conflits."),
  bullet("La confiance est le nerf de la tontine — toute solution doit la renforcer, pas la remplacer."),
  bullet("Le Mobile Money est le rail de paiement dominant en Afrique francophone."),
  bullet("La diaspora et les membres éloignés ont besoin d'accès distant."),
  bullet("Les retards de cotisation doivent être tracés et sanctionnés équitablement."),

  h2("5.2 Solutions récurrentes"),
  bullet("Tableau de bord temps réel et historique des transactions."),
  bullet("Notifications et rappels automatiques avant échéances."),
  bullet("Automatisation des cycles et des tours de gain."),
  bullet("Intégration Mobile Money ou wallet pour sécuriser les flux."),
  bullet("KYC et vérification d'identité pour réduire la fraude."),

  h2("5.3 Lacunes persistantes (opportunités pour E-Tontine)"),
  table(
    ["Lacune du marché", "Constat", "Réponse E-Tontine"],
    [
      ["Gouvernance associative complète", "Peu d'apps gèrent réunions + amendes + rubriques + cycles", "Module réunions, amendes, rubriques, cycles intégrés"],
      ["Prêts encadrés par avalistes", "Prêts souvent simplistes ou externalisés (MaTontine)", "Workflow prêt + avalistes + banque groupe + garanties"],
      ["Statut de discipline visible", "Peu d'indicateurs automatiques de fiabilité membre", "Statut visuel VERT/ROUGE calculé automatiquement"],
      ["Mode déclaratif vs paiement réel", "Djangui/KIKA : tension entre suivi et flux réels", "Enregistrement multi-modes (espèces, MoMo) + traçabilité"],
      ["Frais élevés", "KIKA 5%, RICHAUNTI 6% — frein à l'adoption", "Modèle gratuit/accessible envisagé"],
      ["Complexité excessive", "Njangi (marketplace+loto), Tchoua (18 modules)", "Interface focalisée sur le métier tontine"],
      ["UX non adaptée au terrain", "Apps trop « fintech occidentale » (Included VC)", "Design pensé pour associations camerounaises"],
      ["Rapports exportables", "Souvent PDF seul ou absent", "PDF individuel + rapport groupe PDF et Excel"],
      ["Application web accessible", "Beaucoup mobile-only", "Web responsive sans installation"],
      ["Fraude en ligne", "Cas documentés au Cameroun (France 24)", "Transparence totale, signalements épargne, historique"],
    ],
  ),

  h2("5.4 Risques sectoriels documentés"),
  bullet("Fraude et identités falsifiées : Paul Kemayou a perdu >1 M FCFA dans une tontine en ligne (France 24, 2024)."),
  bullet("Frais de transaction prohibitifs poussant au retour au cash."),
  bullet("Bugs et indisponibilité des applications (étude WSBI/La Tontine)."),
  bullet("Difficulté pour les personnes peu alphabétisées numériquement."),
  bullet("Perte du lien social humain si la digitalisation est mal conçue (Included VC, 2025)."),
  bullet("Aucune « killer app » à l'échelle continentale — marché encore fragmenté."),

  // VI POSITIONNEMENT E-TONTINE
  new Paragraph({ pageBreakBefore: true }),
  h1("VI. Positionnement d'E-Tontine et justification de sa pertinence"),

  h2("6.1 Proposition de valeur d'E-Tontine"),
  p(
    "E-Tontine se positionne comme une application web de gestion intégrale des tontines communautaires, conçue pour le contexte camerounais et CEMAC, en combinant la profondeur fonctionnelle des ERP communautaires (type Africa Djangui/Tchoua) avec la simplicité d'accès d'une application web responsive.",
  ),

  h2("6.2 Différenciateurs par rapport à la concurrence"),
  table(
    ["Axe", "Concurrence typique", "E-Tontine"],
    [
      ["Profondeur métier", "Suivi cotisations uniquement", "Cycles + rubriques + réunions + épargne + prêts"],
      ["Prêts internes", "Échéancier simple ou crédit externe", "Avalistes, banque groupe, éligibilité, garanties"],
      ["Discipline", "Rappels SMS/notifications", "Statut visuel auto + pénalités + amendes réunion"],
      ["Transparence", "Historique partiel", "Journal financier, caisses, relevés PDF, signalements"],
      ["Accessibilité", "Mobile-only ou app lourde", "Web responsive, pas d'installation"],
      ["Coût", "Commissions 5-6%", "Gratuit pour démarrer (modèle projet)"],
      ["Stack technique", "Flutter, solutions propriétaires", "Next.js + Supabase + Prisma (moderne, maintenable)"],
    ],
  ),

  h2("6.3 Justification des problèmes ciblés par E-Tontine"),
  p("Problème 1 — Opacité et conflits dans les tontines camerounaises :"),
  bullet2("Confirmé par : France 24 (2024), WSBI, tous les concurrents."),
  bullet2("E-Tontine répond par : transparence temps réel, statut visuel, relevés PDF, notifications à tous les membres."),

  p("Problème 2 — Gestion manuelle inefficace :"),
  bullet2("Confirmé par : Cirkkle, Djangui, KIKA (argument principal)."),
  bullet2("E-Tontine répond par : automatisation cycles, pénalités, calcul trésorerie, rapports Excel."),

  p("Problème 3 — Exclusion du crédit bancaire :"),
  bullet2("Confirmé par : BEAC, France 24, MaTontine, Njangi."),
  bullet2("E-Tontine répond par : épargne individuelle + banque groupe + prêts internes avec avalistes."),

  p("Problème 4 — Frais élevés des apps existantes :"),
  bullet2("Confirmé par : KIKA (5%), RICHAUNTI (6%)."),
  bullet2("E-Tontine répond par : modèle accessible, sans commission sur les cotisations (outil de gestion)."),

  p("Problème 5 — Solutions incomplètes ou trop complexes :"),
  bullet2("Confirmé par : Included VC (pas de killer app), complexité Njangi/Tchoua."),
  bullet2("E-Tontine répond par : périmètre focalisé, modules intégrés mais interface épurée."),

  h2("6.4 Matrice de couverture fonctionnelle E-Tontine"),
  table(
    ["Module E-Tontine", "Présent chez concurrents", "Niveau de différenciation"],
    [
      ["Authentification + profils", "Tous", "Standard"],
      ["Groupes + invitations + rôles", "Tous", "Standard"],
      ["Cycles + cotisations + pénalités", "Djangui, Tchoua, KIKA", "Aligné marché"],
      ["Distributions du pot", "Tous", "Aligné marché"],
      ["Rubriques de cotisation", "Djangui, Tchoua", "Différenciant"],
      ["Réunions + amendes", "Djangui, Tchoua", "Différenciant"],
      ["Épargne individuelle", "Djangui, Njangi, Tchoua", "Aligné marché"],
      ["Prêts + avalistes + banque", "Djangui, Njangi, Tchoua", "Fort — workflow complet"],
      ["Statut visuel membre", "Quasi aucun", "Très différenciant"],
      ["Rapports PDF + Excel", "Djangui (PDF), Tchoua", "Différenciant"],
      ["Mobile Money natif", "Djangui, KIKA, Ohana", "À développer (enregistrement actuel)"],
      ["KYC", "Djangui, Njangi, KIKA", "À développer"],
      ["App mobile native", "Tous sauf Tchoua web", "Faiblesse actuelle"],
    ],
  ),

  h2("6.5 Recommandations stratégiques issues du benchmark"),
  bullet("Conserver la profondeur métier (réunions, rubriques, prêts avalistes) comme avantage compétitif."),
  bullet("Prioriser l'intégration Mobile Money réelle (API MTN/Orange) pour rivaliser avec Djangui et KIKA."),
  bullet("Ajouter un KYC léger (téléphone vérifié, pièce d'identité optionnelle) pour répondre au risque de fraude documenté."),
  bullet("Développer une PWA ou app mobile pour combler l'écart avec les concurrents mobile-first."),
  bullet("Maintenir un modèle économique transparent et accessible (pas de commission cachée)."),
  bullet("Capitaliser sur le web responsive pour les administrateurs/trésoriers utilisant un ordinateur."),

  // VII SOURCES
  new Paragraph({ pageBreakBefore: true }),
  h1("VII. Sources et références"),
  bullet("Africa Djangui — À propos : https://www.africadjangui.com/a-propos-de-nous/ (avril 2026)"),
  bullet("Djangui 3.0 — Site officiel : https://djangui.net/"),
  bullet("Djangui 3.0 — Google Play / Aptoide : fiche application v3.0.7"),
  bullet("Djangui Blog — Guide création tontine 2026 : https://djangui.net/blog/"),
  bullet("Njangi App — Site officiel : https://njangiapp.com/fr/"),
  bullet("KIKA — Site officiel : https://kika.africa/"),
  bullet("Tchoua — Site officiel : http://www.tchoua.com/"),
  bullet("MaTontine — App Store / Google Play : fiches application"),
  bullet("MaTontine — DSG Hub FIaaS : https://dsghub.org/solutions/matontine-fiaas-platform/"),
  bullet("Cirkkle — Site officiel : https://cirkkle.com/"),
  bullet("Ohana / Ollo Africa — We Are Tech (2025) : https://www.wearetech.africa/"),
  bullet("Tontiin — Blog : https://tontiin.com/en/blog/"),
  bullet("E-Tontines CEMAC — Site : https://www.etontines-cemac.ga/"),
  bullet("RICHAUNTI — iFundWomen : https://www.ifundwomen.com/projects/richaunti"),
  bullet("France 24 — « Ancient community banking enters digital age in Cameroon » (mars 2024)"),
  bullet("WSBI-ESBG — Étude de cas « La Tontine » (décembre 2025)"),
  bullet("Included VC / Medium — « Why Africa's Oldest Financial Infrastructure Still Has No Killer App » (Hapsa Dia, 2025)"),
  bullet("Revue Banque — « MaTontine digitalise l'épargne traditionnelle » (2018)"),
  bullet("Code source et documentation E-Tontine — dépôt projet (juin 2026)"),

  // CONCLUSION
  new Paragraph({ pageBreakBefore: true }),
  h1("Conclusion"),
  p(
    "L'étude de l'existant confirme que le marché des applications de tontines en Afrique est dynamique mais fragmenté. Des acteurs comme Djangui 3.0, Njangi, KIKA et MaTontine ont validé le besoin de digitalisation et adressent partiellement les problèmes d'opacité, de coordination et d'inclusion financière.",
  ),
  p(
    "Cependant, aucune solution ne combine à ce jour l'ensemble des besoins d'une association camerounaise type : cycles rotatifs, rubriques, réunions avec amendes, épargne individuelle, prêts internes encadrés par avalistes, statut de discipline automatique et rapports PDF/Excel — le tout dans une application web accessible sans installation.",
  ),
  p(
    "Les lacunes identifiées — frais élevés, fraude en ligne, complexité excessive, absence de gouvernance associative complète, UX inadaptée — constituent des opportunités claires pour E-Tontine. Le projet est donc pertinent et justifié : il répond à des problèmes réels documentés par la presse, les études sectorielles et l'analyse concurrentielle, tout en proposant une différenciation fonctionnelle mesurable par rapport aux solutions existantes.",
  ),
  new Paragraph({ spacing: { before: 300 } }),
  p(`Document établi le ${DATE} — Projet E-Tontine.`),
];

const doc = new Document({ sections: [{ properties: {}, children }] });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`Benchmark généré : ${OUT}`);
