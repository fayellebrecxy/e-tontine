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
  LevelFormat,
  HeadingLevel,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DOCS = path.join(ROOT, "Docs");
const MEMOIRE_EDITABLE = path.join(DOCS, "memoire-E-TONTINE.docx");
const MEMOIRE_GENERATED = path.join(DOCS, "memoire-E-TONTINE-genere.docx");
const ETUDE_IMG_DIR = path.join(DOCS, "memoire-etude-existant");

/**
 * Règle de non-écrasement :
 * - Par défaut, le script écrit dans memoire-E-TONTINE-genere.docx
 * - memoire-E-TONTINE.docx est votre version de travail (modifications manuelles)
 * - Pour forcer l'écrasement : MEMOIRE_OVERWRITE=1 node scripts/generate-memoire.mjs
 */
const OVERWRITE_EDITABLE =
  process.env.MEMOIRE_OVERWRITE === "1" || process.argv.includes("--overwrite");
const OUT = OVERWRITE_EDITABLE ? MEMOIRE_EDITABLE : MEMOIRE_GENERATED;

const FONT = "Times New Roman";

let figureNum = 0;
let tableNum = 0;

function pngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function figCaption(text) {
  figureNum += 1;
  return center(`Figure ${figureNum} : ${text}`, { after: 240, size: 22, bold: true });
}

function tableCaption(text) {
  tableNum += 1;
  return center(`Tableau ${tableNum} : ${text}`, {
    before: 200,
    after: 120,
    size: 22,
    bold: true,
  });
}

function figureBlock(imagePath, caption, maxW = 480) {
  if (!fs.existsSync(imagePath)) {
    return [
      justify(`[Capture d'écran manquante : ${path.basename(imagePath)}]`, {
        after: 120,
      }),
      figCaption(caption),
    ];
  }
  const { w, h } = pngSize(imagePath);
  const width = maxW;
  const height = Math.round((h / w) * width);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 80 },
      children: [
        new ImageRun({
          type: "png",
          data: fs.readFileSync(imagePath),
          transformation: { width, height },
          altText: { title: caption, description: caption, name: caption },
        }),
      ],
    }),
    figCaption(caption),
  ];
}

function limitTitle(text) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true })],
  });
}

function compareTable(headers, rows) {
  const border = { style: BorderStyle.SINGLE, size: 1 };
  const borders = {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  };
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
          shading: { fill: "E5EEFF" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, font: FONT, size: 18, bold: true })],
            }),
          ],
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
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell, font: FONT, size: 18 })],
                }),
              ],
            }),
        ),
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [headerRow, ...dataRows],
  });
}

function center(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: opts.after ?? 80, before: opts.before ?? 0 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? 24,
        bold: opts.bold ?? false,
      }),
    ],
  });
}

function justify(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? 24,
        bold: opts.bold ?? false,
      }),
    ],
  });
}

function bulletItem(text, reference = "bullets") {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100 },
    numbering: { reference, level: 0 },
    children: [new TextRun({ text, font: FONT, size: 24 })],
  });
}

function heading(text, level = HeadingLevel.HEADING_1, opts = {}) {
  const spacing =
    level === HeadingLevel.HEADING_1
      ? { before: opts.before ?? 360, after: opts.after ?? 240 }
      : level === HeadingLevel.HEADING_2
        ? { before: opts.before ?? 280, after: opts.after ?? 180 }
        : { before: opts.before ?? 200, after: opts.after ?? 140 };

  return new Paragraph({
    heading: level,
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? 24,
        bold: opts.bold ?? true,
      }),
    ],
  });
}

function chapter1PartI1() {
  const chapterIntroP1 =
    "Avant d'aborder l'étude des solutions existantes et la conception de la plateforme E-Tontine, il convient de situer le cadre dans lequel ce projet s'inscrit. En effet, toute démarche de conception informatique crédible doit reposer sur un ancrage concret dans un environnement professionnel où un besoin réel a été identifié, analysé et formalisé.";

  const chapterIntroP2 =
    "Le présent chapitre a pour vocation de présenter l'entreprise d'accueil du stage, de décrire la structure organisationnelle dans laquelle la problématique a émergé, de rappeler les grandes lignes du cahier des charges retenu et d'exposer le déroulement des activités menées sur la période avril-juin 2026. Cette mise en contexte permettra de comprendre l'origine du besoin, la pertinence de la solution proposée et la manière dont le travail de stage a alimenté le projet de fin d'études.";

  const i1Intro =
    "La présentation de l'entreprise constitue une étape préalable indispensable pour situer le projet E-Tontine dans son environnement professionnel. Cette section expose successivement l'identité et l'historique de Worketyamo, la structure organisationnelle de l'entreprise, le pôle d'accueil du stage, la problématique rencontrée sur le terrain, le cahier des charges retenu et le déroulement des activités menées au cours du stage.";

  const i11Intro =
    "Pour appréhender le contexte du stage, il est d'abord nécessaire de revenir sur l'origine et l'évolution de l'entreprise d'accueil, ainsi que sur les activités qu'elle développe au quotidien.";

  const i11P1 =
    "WORKETYAMO SARL est une société à responsabilité limitée créée en 2019 à Yaoundé par M. Haruna Rachid, ingénieur en informatique ayant préalablement exercé pendant plusieurs années au sein d'une société de services informatiques locale. L'entreprise est implantée dans le quartier Melen, plus précisément Total Melen. Son activité principale consiste en la conception et le développement d'applications web et mobiles, ainsi que l'accompagnement de petites et moyennes entreprises, d'associations et de startups dans leur transformation numérique.";

  const i11P2 =
    "Depuis sa création, Worketyamo s'est progressivement structurée autour de plusieurs pôles de compétences. Les premières années ont été consacrées à la réalisation de sites vitrines et d'applications de gestion commerciale pour des clients locaux. À partir de 2022, l'entreprise a organisé son activité en pôles distincts dédiés au développement web, au développement mobile et au design UX/UI. En 2023, un pôle Applications métier a été lancé pour répondre aux besoins spécifiques de gestion interne, de tableaux de bord et d'outils collaboratifs.";

  const i11P3 =
    "En 2026, Worketyamo compte dix-huit collaborateurs et intervient auprès d'une clientèle variée comprenant des associations, des coopératives, des commerces et des jeunes entreprises technologiques. Dans ce contexte de croissance, l'entreprise accueille régulièrement des stagiaires en génie informatique , les offrant ainsi l'opportunité de participer à des projets concrets de développement d'applications.";

  const i12Intro =
    "Afin de mieux comprendre le fonctionnement interne de l'entreprise et les relations hiérarchiques entre les différents acteurs, il importe de présenter brièvement sa structure organisationnelle.";

  const i12P1 =
    "La direction générale de Worketyamo est assurée par M. Haruna Rachid, Gérant de la société. Il supervise trois départements principaux : la Direction Technique, dirigée par M. Tafotsi Dimitri ; la Direction Commerciale, dirigée par M. Kenwou Barthez ; et le Service Administratif et Financier, assuré par Mme Silviane.";

  const i12P2 =
    "Sous la Direction Technique se trouvent le Pôle Développement Web, encadré par M. Prince Mabengue en qualité de chef d'équipe ; le Pôle Développement Mobile ; et le Pôle Design UX/UI. Le Support technique et la Maintenance applicative relèvent également de la Direction Technique. Cette organisation permet une répartition claire des responsabilités entre la gestion commerciale, l'administration financière et la production technique, condition essentielle à la bonne conduite des projets numériques confiés à l'entreprise.";

  const i13Intro =
    "Le stage s'est déroulé au sein d'une unité précise de l'entreprise, placée sous la responsabilité de l'équipe technique. Cette section en présente le cadre organisationnel et les conditions d'encadrement.";

  const i13P1 =
    "Notre stage s'est effectué au Pôle Développement Web de Worketyamo, unité chargée de la conception, du développement et de la maintenance des applications web destinées aux clients de l'entreprise. Ce pôle regroupe des développeurs full-stack, des intégrateurs et un chef d'équipe responsable de la planification des sprints, de la revue de code et du suivi des livrables.";

  const i13P2 =
    "L'encadrement professionnel du stage a été assuré par M. Tafotsi Dimitri, Directeur Technique, et par M. Prince Mabengue, Chef d'équipe Développement Web, qui ont veillé au quotidien sur l'avancement du projet, la qualité du code produit et le respect du cahier des charges. La période de stage s'est étendue du 15 avril au 30 juin 2026, soit une durée de deux mois et démi correspondant aux exigences du projet de fin d'études en licence de génie informatique.";

  const i14Intro =
    "C'est au sein de cette entreprise que la problématique à l'origine du projet E-Tontine a été identifiée. Il convient donc d'exposer le contexte concret dans lequel ce besoin s'est manifesté.";

  const i14P1 =
    "Au sein de Worketyamo, une association informelle regroupant une quinzaine de salariés adultes  nommée Association des Tontiniers de Worketyamo (ATW)  organise une tontine annuelle depuis 2023. Chaque membre cotise une somme fixe et le pot ainsi constitué est versé à tour de rôle à l'un des participants. Un administrateur, désigné parmi le personnel administratif, est chargé de tenir les registres, de centraliser les fonds et de rendre compte des opérations lors des réunions périodiques du groupe.";

  const i14P2 =
    "Or, au cours du mois d'avril 2026, lors de notre intégration au Pôle Développement Web, plusieurs dysfonctionnements ont été signalés en réunion du personnel : erreurs de calcul sur les tours de gain, retards de cotisation insuffisamment suivis, registres papier égarés ou incomplets, et une méfiance croissante envers le trésorier, accusé de manquer de transparence dans la communication des soldes. Ces tensions ont mis en évidence les limites d'une gestion manuelle, fondée sur la confiance accordée à une seule personne et sur des supports fragiles.";

  const i14P3 =
    "Face à cette situation, la direction technique, consciente que l'entreprise développe des applications métier pour des clients locaux, a proposé qu'un stagiaire du pôle Web analyse le fonctionnement de l'ATW, recueille les besoins des membres et conçoive une solution numérique adaptée. Nous avons ainsi été chargés, sous la supervision de M. Prince Mabengue, d'étudier la faisabilité d'une application web permettant de digitaliser la gestion de cette tontine interne.";

  const i14P4 =
    "Il importe toutefois de préciser que la portée de la solution dépasse le seul cadre de l'ATW. Si le constat initial est né en entreprise, les besoins identifiés qui sont entre autres, la transparence des opérations, la traçabilité des cotisations, le suivi des cycles et des mouvements financiers reflètent une réalité plus large, celle des tontines communautaires pratiquées dans la société camerounaise. Le projet E-Tontine a donc été conçu comme une application générique, destinée à tout groupe de tontiniers, tout en ayant été validé en premier lieu auprès de l'association interne de Worketyamo.";

  const i15Intro =
    "À partir de l'analyse de la situation rencontrée au sein de l'ATW et des entretiens menés avec les membres, un cahier des charges a été rédigé afin de formaliser les attentes fonctionnelles et les contraintes du futur système.";

  const i15P1 =
    "Le cahier des charges retient pour objectif général le développement d'une application web de gestion de tontines communautaires, permettant aux administrateurs et aux membres de suivre les activités financières et organisationnelles d'un groupe de manière fiable, centralisée et transparente. Il formalise une problématique centrale : comment concevoir une application web adaptée aux réalités camerounaises, capable de digitaliser l'ensemble du cycle de vie d'une tontine tout en garantissant la transparence des opérations, la traçabilité des transactions et la sécurité des données des membres ?";

  const i15P2 =
    "Sur le plan fonctionnel, le document définit plusieurs modules devant être couverts par la solution : authentification et gestion de profil, création et administration de groupes, gestion des membres et des invitations, cycles de tontine avec cotisations, pénalités et distributions du pot, rubriques de cotisation complémentaires, réunions avec suivi des présences et amendes, épargne individuelle par membre, prêts internes encadrés par des avalistes, journal financier centralisé, notifications internes et génération de relevés PDF ainsi que de rapports groupe au format PDF ou Excel.";

  const i15P3 =
    "Le périmètre retenu exclut explicitement l'intégration directe aux API Mobile Money, la certification bancaire ou microfinancière, ainsi que le développement d'applications mobiles natives. En revanche, la solution doit être accessible via un navigateur web sur ordinateur, tablette ou smartphone, avec une interface qui peut être en français ou en anglais, une simulation des paiements mobile money et une architecture déployable sur une infrastructure cloud. Ce cahier des charges a servi de référence tout au long du stage et du projet de fin d'études.";

  const i16Intro =
    "Pour mener à bien le projet confié, un déroulement structuré a été adopté, articulé autour de phases successives d'analyse, de conception, de développement et de validation.";

  const i16P1 =
    "Les deux dernières semaines du mois d'avril ont été consacrées à l'immersion dans l'entreprise, à la découverte du fonctionnement de l'ATW et à la conduite d'entretiens avec les membres et le l\u2019administrateur. Cette phase a permis de recueillir les besoins exprimés sur le terrain et de rédiger le cahier des charges, validé par M. Prince Mabengue et M. Tafotsi Dimitri.";

  const i16P2 =
    "Durant les deux premières semaines du mois de mai, nous avons entamé la modélisation du système à l'aide du langage UML, en produisant notamment les diagrammes de cas d'utilisation et les premiers schémas de conception. Les deux dernières semaines du mois de mai et les deux premières semaines du mois de juin ont été principalement dédiées à la conception technique et au développement itératif de l'application : authentification, gestion des groupes, cycles de cotisation, finances et modules complémentaires, avec des revues hebdomadaires auprès du tuteur de stage.";

  const i16P3 =
    "Enfin, les deux dernères semaines du mois de juin ont été consacrées à la finalisation des fonctionnalités restantes, aux tests de la solution auprès de l'ATW et de groupes pilotes extérieurs à l'entreprise, aux corrections identifiées lors de la recette, à la rédaction de la documentation technique et à la présentation du livrable à Worketyamo. Les principaux livrables du stage comprennent le cahier des charges, les diagrammes UML, l'application web fonctionnelle, la documentation associée et le présent mémoire de fin d'études.";

  return [
    heading("CHAPITRE I : PRÉSENTATION DE L'ENTREPRISE ET ÉTUDE DE L'EXISTANT"),
    heading("Introduction", HeadingLevel.HEADING_2, { bold: true }),
    justify(chapterIntroP1, { after: 200 }),
    justify(chapterIntroP2, { after: 240 }),
    heading("I.1 Présentation de l'entreprise", HeadingLevel.HEADING_2),
    justify(i1Intro, { after: 200 }),
    heading("I.1.1 Historique de l'entreprise", HeadingLevel.HEADING_3),
    justify(i11Intro, { after: 160 }),
    justify(i11P1, { after: 200 }),
    justify(i11P2, { after: 200 }),
    justify(i11P3, { after: 240 }),
    heading("I.1.2 Organigramme de l'entreprise", HeadingLevel.HEADING_3),
    justify(i12Intro, { after: 160 }),
    justify(i12P1, { after: 200 }),
    justify(i12P2, { after: 240 }),
    heading("I.1.3 Unité de stage", HeadingLevel.HEADING_3),
    justify(i13Intro, { after: 160 }),
    justify(i13P1, { after: 200 }),
    justify(i13P2, { after: 240 }),
    heading("I.1.4 Problématique rencontrée en entreprise", HeadingLevel.HEADING_3),
    justify(i14Intro, { after: 160 }),
    justify(i14P1, { after: 200 }),
    justify(i14P2, { after: 200 }),
    justify(i14P3, { after: 200 }),
    justify(i14P4, { after: 240 }),
    heading("I.1.5 Rappel du cahier des charges", HeadingLevel.HEADING_3),
    justify(i15Intro, { after: 160 }),
    justify(i15P1, { after: 200 }),
    justify(i15P2, { after: 200 }),
    justify(i15P3, { after: 240 }),
    heading("I.1.6 Déroulement du stage", HeadingLevel.HEADING_3),
    justify(i16Intro, { after: 160 }),
    justify(i16P1, { after: 200 }),
    justify(i16P2, { after: 200 }),
    justify(i16P3, { after: 200 }),
  ];
}

function chapter1PartI2() {
  const i2Intro =
    "L'étude de l'existant vise à analyser les solutions numériques déjà disponibles sur le marché des tontines communautaires, afin d'identifier leurs apports, leurs limites et les opportunités qu'elles laissent ouvertes. Cette section présente d'abord le contexte du marché, puis examine deux applications de référence à l'échelle internationale et deux solutions camerounaises, avant d'analyser les limites observées, de proposer un tableau comparatif et de présenter la solution retenue.";

  const i21Intro =
    "Avant d'analyser les applications concurrentes, il convient de rappeler le contexte économique et social dans lequel s'inscrit la digitalisation des tontines au Cameroun.";

  const i21P1 =
    "Au Cameroun et en Afrique subsaharienne, la tontine également appelée njangi, djangui ou natt selon les régions demeure un mécanisme d'épargne collective et de solidarité financière largement répandu. Selon l'Institut africain mondial cité par France 24, environ 85 % des Africains demeureraient exclus du système bancaire classique, ce qui renforce le recours aux dispositifs informels d'épargne et de crédit rotatif [1]. Face à cette exclusion, de nombreux ménages et associations organisent des cotisations périodiques pour constituer un pot commun, versé à tour de rôle à chaque participant.";

  const i21P2 =
    "Pourtant, la gestion de ces groupes repose encore majoritairement sur des carnets papier, des tableurs ou des échanges informels via messageries instantanées. Cette organisation manuelle favorise les erreurs de calcul, l'opacité des opérations, les retards mal suivis et, dans certains cas, la méfiance entre membres. Depuis une dizaine d'années, plusieurs applications fintech tentent de répondre à ces limites en proposant de digitaliser tout ou partie du cycle de vie d'une tontine [1].";

  const i21P3 =
    "France 24 relève ainsi que Djangui, lancée en 2016, fut l'une des premières applications de tontine au Cameroun, suivie par de nombreux acteurs imitateurs. Toutefois, aucune solution ne s'est encore imposée comme référence unique à l'échelle continentale, le marché demeurant fragmenté entre applications mobiles, plateformes web et modèles hybrides [1][2]. Cette dynamique justifie une analyse comparative rigoureuse avant toute proposition de solution nouvelle.";

  const i22Intro =
    "Au-delà du contexte camerounais, certaines applications ciblent la diaspora africaine ou proposent des modèles numériques de tontines à plus large échelle. Deux d'entre elles ont retenu notre attention pour leur maturité et leur visibilité.";

  const cirkkleIntro =
    "Cirkkle constitue une première référence internationale orientée vers la diaspora africaine installée en Europe, en particulier en France.";

  const cirkkleP1 =
    "Cirkkle est une application mobile dédiée à la création et à la gestion de cercles d'épargne collective. Elle propose la création de groupes, l'invitation de membres, la définition de règles de cotisation, un wallet centralisé, le suivi en temps réel des contributions, des rappels automatiques et un historique des opérations. L'application met également l'accent sur la conformité réglementaire au sein du cadre français, notamment via son enregistrement ORIAS [3].";

  const cirkkleP2 =
    "Les principaux apports de Cirkkle résident dans la simplification du suivi des cotisations, le remplacement des fichiers Excel ou des relances manuelles sur messagerie, ainsi que la sécurisation des flux via un portefeuille numérique. Toutefois, la solution cible principalement la diaspora et les usages bancaires européens ; elle ne couvre pas nativement les spécificités du Mobile Money en zone CEMAC, ni les modules de gouvernance associative avancée tels que les réunions, les rubriques ou les prêts internes encadrés par avalistes [3].";

  const njangiIntro =
    "Njangi App représente une seconde référence panafricaine, plus directement ancrée dans la pratique du njangi camerounais.";

  const njangiP1 =
    "Njangi App est une application mobile conçue pour digitaliser l'expérience njangi : création de groupes, cycles automatisés, suivi des cotisations, compte épargne personnel, demandes et remboursements de prêts internes, messagerie intégrée et mécanismes de vérification d'identité (KYC). Son positionnement met en avant la rencontre entre la tradition africaine de l'épargne collective et les outils de la finance numérique moderne [4].";

  const njangiP2 =
    "L'application présente l'avantage de centraliser dans un même environnement l'épargne, les prêts et la communication entre membres. Elle automatise les cycles et améliore la visibilité des transactions. Néanmoins, son écosystème fonctionnel est relativement large marketplace, publicité, loto ce qui peut complexifier l'expérience pour des groupes traditionnels recherchant un outil simple. Par ailleurs, la solution est essentiellement mobile et ne met pas en avant un portail web complet comme canal principal d'administration [4].";

  const i23Intro =
    "Au Cameroun, plusieurs applications se sont spécialisées dans la digitalisation des tontines et njangis. Parmi elles, Djangui 3.0 et KIKA apparaissent comme les plus représentatives du marché local.";

  const djanguiIntro =
    "Djangui 3.0, éditée par TI Services Consulting, est souvent citée comme l'une des applications pionnières de la tontine numérique au Cameroun.";

  const djanguiP1 =
    "Djangui 3.0 / Africa Djangui propose une plateforme web et mobile couvrant la création de tontines rotatives ou accumulatives, le suivi des cotisations, les cycles, les distributions du pot, les pénalités, les réunions avec émargement, les caisses personnalisées, les prêts internes, les rapports PDF et l'intégration de plusieurs moyens de paiement, dont Orange Money et MTN MoMo. L'éditeur met en avant également des fonctionnalités avancées telles que le KYC, les rappels automatiques et un coach financier [1][5].";

  const djanguiP2 =
    "Cette richesse fonctionnelle constitue un atout majeur pour les associations structurées. Toutefois, l'application peut fonctionner en mode déclaratif, l'argent ne transitant pas toujours par la plateforme, et certaines fonctionnalités premium ou d'intelligence artificielle peuvent alourdir l'expérience pour des utilisateurs peu technophiles. France 24 signale par ailleurs que les tontines en ligne demeurent exposées à des risques de fraude liés à des identités falsifiées [1][5].";

  const kikaIntro =
    "KIKA constitue une seconde solution camerounaise orientée vers une expérience mobile simple et accessible.";

  const kikaP1 =
    "KIKA est une application mobile permettant de créer et de gérer des tontines, d'automatiser les tours de gain, d'envoyer des rappels et des notifications, de suivre les paiements en temps réel et de gérer les rôles au sein du groupe (président, secrétaire, trésorier, membres). Elle met en avant l'intégration du Mobile Money via Orange Money, MTN MoMo ou Wave, ainsi qu'un simulateur de tontine facilitant la planification des cotisations [6].";

  const kikaP2 =
    "KIKA se distingue par une interface claire et un positionnement résolument mobile, adapté aux usages locaux. Cependant, la solution facture une commission de 5 % sur chaque retrait, ce qui peut représenter un coût significatif pour les membres. De plus, les fonctionnalités avancées de gouvernance associative réunions, rubriques, prêts avec avalistes, rapports exportables ne sont pas documentées avec le même niveau de profondeur que chez certains concurrents [6].";

  const i24Intro =
    "Malgré les apports des applications analysées, plusieurs limites demeurent et freinent une digitalisation réellement adaptée aux tontines communautaires camerounaises.";

  const lim1 =
    "Plusieurs solutions se contentent d'un suivi partiel des cotisations ou d'un tableau de bord simplifié, sans couvrir l'ensemble du cycle de vie d'une tontine : rubriques complémentaires, réunions avec amendes, épargne individuelle, prêts internes encadrés par avalistes, statut de discipline automatique ou rapports exportables. Les groupes doivent alors continuer à combiner l'application avec des carnets, WhatsApp ou Excel, ce qui recrée les problèmes de coordination et d'opacité que la digitalisation devait résoudre.";

  const lim2 =
    "Certaines plateformes proposent un écosystème très large marketplace, publicité, fonctionnalités premium ou intelligence artificielle qui peut éloigner l'utilisateur du besoin principal : gérer simplement et fidèlement une tontine. Par ailleurs, des modèles économiques basés sur des commissions ou des frais de retrait, comme la commission de 5 % appliquée par KIKA, peuvent inciter les membres à revenir aux pratiques informelles en espèces.";

  const lim3 =
    "Plusieurs applications ciblent la diaspora ou des contextes bancaires étrangers, sans toujours tenir compte des réalités du Cameroun et de la zone CEMAC : usage du franc CFA, réunions physiques, rôle du trésorier, importance du Mobile Money et niveau variable de maîtrise du numérique. De plus, de nombreuses solutions sont exclusivement mobiles, alors que les administrateurs et membres ont souvent besoin d'un accès confortable depuis un ordinateur.";

  const lim4 =
    "La gestion manuelle ou semi-numérique laisse subsister une opacité financière : historique incomplet, registres éparpillés, retards mal tracés et communication insuffisante entre membres. France 24 signale par ailleurs que les tontines en ligne peuvent être exposées à des risques de fraude lorsque l'identité des participants n'est pas suffisamment vérifiée, ce qui accentue la méfiance au sein des groupes [1].";

  const lim5 =
    "Enfin, aucune application ne s'est encore imposée comme référence unique à l'échelle continentale. Le marché demeure fragmenté, sans standard commun de gouvernance associative ni infrastructure partagée permettant aux groupes de migrer facilement d'une solution à l'autre [2].";

  const i25Intro =
    "Le tableau 1 ci-dessous présente quelques comparaisons entre les différentes solutions existantes citées plus haut et la solution que nous proposons.";

  const i26P1 =
    "Au vu des initiatives existantes, il est clair que plusieurs efforts ont été déployés pour digitaliser la gestion des tontines au Cameroun et en Afrique. Toutefois, ces approches présentent souvent des limites, qu'il s'agisse d'une couverture fonctionnelle incomplète, d'une faible transparence, d'une complexité excessive, d'un modèle économique peu accessible ou d'une adaptation insuffisante au contexte local. Il est donc crucial de développer une solution innovante, centralisée et mieux alignée sur les pratiques réelles des associations de tontiniers.";

  const i26P2 =
    "Dans cette optique, nous proposons la mise en œuvre d'une application web dénommée E-Tontine, qui respecte l'ensemble des critères retenus dans le tableau 1. Contrairement aux solutions existantes, cette plateforme offre une gestion intégrale du cycle de vie d'une tontine communautaire : groupes et membres, cycles de cotisation, rubriques, réunions, épargne individuelle, prêts internes avec avalistes, journal financier, notifications et rapports PDF ou Excel. Accessible depuis un navigateur, sans installation préalable, elle vise la transparence, la traçabilité et la simplicité d'usage pour les administrateurs comme pour les membres.";

  const i26P3 =
    "E-Tontine répond ainsi directement aux dysfonctionnements observés au sein de l'Association des Tontiniers de Worketyamo, tout en conservant une portée générique applicable à tout groupe de tontiniers.";

  return [
    heading("I.2 Étude de l'existant", HeadingLevel.HEADING_2),
    justify(i2Intro, { after: 200 }),
    heading("I.2.1 Contexte du marché", HeadingLevel.HEADING_3),
    justify(i21Intro, { after: 160 }),
    justify(i21P1, { after: 200 }),
    justify(i21P2, { after: 200 }),
    justify(i21P3, { after: 240 }),
    heading("I.2.2 Applications à l'échelle mondiale", HeadingLevel.HEADING_3),
    justify(i22Intro, { after: 160 }),
    heading("I.2.2.1 Cirkkle", HeadingLevel.HEADING_3),
    justify(cirkkleIntro, { after: 160 }),
    justify(cirkkleP1, { after: 200 }),
    justify(cirkkleP2, { after: 160 }),
    ...figureBlock(
      path.join(ETUDE_IMG_DIR, "capture-cirkkle.png"),
      "Interface du site officiel de l'application Cirkkle [3]",
    ),
    heading("I.2.2.2 Njangi App", HeadingLevel.HEADING_3),
    justify(njangiIntro, { after: 160 }),
    justify(njangiP1, { after: 200 }),
    justify(njangiP2, { after: 160 }),
    ...figureBlock(
      path.join(ETUDE_IMG_DIR, "capture-njangi.png"),
      "Interface du site officiel de Njangi App [4]",
    ),
    heading("I.2.3 Applications au Cameroun", HeadingLevel.HEADING_3),
    justify(i23Intro, { after: 160 }),
    heading("I.2.3.1 Djangui 3.0", HeadingLevel.HEADING_3),
    justify(djanguiIntro, { after: 160 }),
    justify(djanguiP1, { after: 200 }),
    justify(djanguiP2, { after: 160 }),
    ...figureBlock(
      path.join(ETUDE_IMG_DIR, "capture-djangui.png"),
      "Interface du blog officiel Djangui 3.0 [5]",
    ),
    heading("I.2.3.2 KIKA", HeadingLevel.HEADING_3),
    justify(kikaIntro, { after: 160 }),
    justify(kikaP1, { after: 200 }),
    justify(kikaP2, { after: 160 }),
    ...figureBlock(
      path.join(ETUDE_IMG_DIR, "capture-kika.png"),
      "Interface du site officiel de KIKA [6]",
    ),
    heading("I.2.4 Limites des solutions existantes", HeadingLevel.HEADING_3),
    justify(i24Intro, { after: 160 }),
    limitTitle("Couverture fonctionnelle incomplète"),
    justify(lim1, { after: 200 }),
    limitTitle("Complexité des interfaces et modèles économiques"),
    justify(lim2, { after: 200 }),
    limitTitle("Faible adaptation au contexte local"),
    justify(lim3, { after: 200 }),
    limitTitle("Opacité financière et risques de fraude"),
    justify(lim4, { after: 200 }),
    limitTitle("Marché fragmenté et absence de référence unique"),
    justify(lim5, { after: 240 }),
    heading("I.2.5 Tableau comparatif", HeadingLevel.HEADING_3),
    justify(i25Intro, { after: 160 }),
    tableCaption("Tableau comparatif des solutions existantes"),
    compareTable(
      [
        "Critères d'évaluation",
        "Cirkkle",
        "Njangi App",
        "Djangui 3.0",
        "KIKA",
        "E-Tontine",
      ],
      [
        ["Couverture fonctionnelle complète", "✗", "✗", "✓", "✗", "✓"],
        ["Application web responsive sans installation", "✗", "✗", "✓", "✗", "✓"],
        ["Gestion des cycles rotatifs et cotisations", "✓", "✓", "✓", "✓", "✓"],
        ["Rubriques de cotisation personnalisées", "✗", "✗", "✓", "✗", "✓"],
        ["Réunions et amendes", "✗", "✗", "✓", "✗", "✓"],
        ["Épargne individuelle par membre", "✗", "✓", "✓", "✗", "✓"],
        ["Prêts internes avec avalistes", "✗", "✗", "✓", "✗", "✓"],
        ["Statut de discipline automatique", "✗", "✗", "✗", "✗", "✓"],
        ["Rapports PDF et Excel exportables", "✗", "✗", "✓", "✗", "✓"],
        ["Journal financier centralisé", "✓", "✓", "✓", "✓", "✓"],
        ["Notifications aux membres", "✓", "✓", "✓", "✓", "✓"],
        ["Traçabilité et transparence des opérations", "✓", "✓", "✓", "✓", "✓"],
        ["Interface adaptée au contexte camerounais", "✗", "✓", "✓", "✓", "✓"],
        ["Gestion multi-groupes et contrôle des rôles", "✓", "✓", "✓", "✓", "✓"],
        ["Enregistrement multi-modes de paiement", "✗", "✗", "✓", "✓", "✓"],
      ],
    ),
    new Paragraph({ spacing: { after: 240 } }),
    heading("I.2.6 Notre solution", HeadingLevel.HEADING_3),
    justify(i26P1, { after: 200 }),
    justify(i26P2, { after: 200 }),
    justify(i26P3, { after: 240 }),
  ];
}

function chapter1Conclusion() {
  const conclusion =
    "En conclusion, dans ce chapitre, nous avons présenté l'entreprise d'accueil du stage, la problématique rencontrée au sein de Worketyamo, ainsi que l'étude des solutions existantes et leurs limites. Dans le chapitre suivant, nous effectuerons une analyse complète des besoins de notre application web et présenterons sa conception.";

  return [
    heading("Conclusion", HeadingLevel.HEADING_2, { bold: true }),
    justify(conclusion, { after: 200 }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function referencesSection() {
  const refs = [
    "[1] FRANCE 24. Ancient community banking enters digital age in Cameroon. 12 mars 2024. Disponible sur : https://www.france24.com/en/live-news/20240312-ancient-community-banking-enters-digital-age-in-cameroon (consulté en juin 2026).",
    "[2] DIA H. The World Runs on Tontines: Why Africa's Oldest Financial Infrastructure Still Has No Killer App. Included VC / Medium, 2025. Disponible sur : https://medium.com/included-vc/the-world-runs-on-tontines-why-africas-oldest-financial-infrastructure-still-has-no-killer-app-9a92d89e3b86 (consulté en juin 2026).",
    "[3] CIRKKLE. Site officiel de l'application Cirkkle. Disponible sur : https://cirkkle.com/ (consulté en juin 2026).",
    "[4] NJANGI APP. Site officiel Njangi App. Disponible sur : https://njangiapp.com/fr/ (consulté en juin 2026).",
    "[5] DJANGUI 3.0. Site officiel et blog Djangui 3.0 / Africa Djangui. Disponible sur : https://djangui.net/ et https://www.africadjangui.com/ (consulté en juin 2026).",
    "[6] KIKA. Site officiel KIKA Africa. Disponible sur : https://kika.africa/ (consulté en juin 2026).",
  ];

  return [
    center("RÉFÉRENCES", { bold: true, before: 400, after: 360 }),
    ...refs.map((ref) => justify(ref, { after: 160 })),
  ];
}

function coverPage() {
  const stars = "*********";
  return [
    center("REPUBLIQUE DU CAMEROUN"),
    center("PAIX-TRAVAIL-PATRIE"),
    center(stars),
    center("UNIVERSITE PROTESTANTE D'AFRIQUE CENTRALE"),
    center(stars),
    center("FACULTE DES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION"),
    new Paragraph({ spacing: { after: 200 } }),
    center("REPUBLIC OF CAMEROON"),
    center("PEACE-WORK-FATHERLAND"),
    center(stars),
    center("PROTESTANT UNIVERSITY OF CENTRAL AFRICA"),
    center(stars),
    center("FACULTY OF INFORMATION AND COMMUNICATION TECHNOLOGIES"),
    new Paragraph({ spacing: { after: 240 } }),
    center("INSTITUT UNIVERSITAIRE PROTESTANT DE YAOUNDE"),
    center("B.P. 4011 Yaoundé - Cameroun"),
    new Paragraph({ spacing: { after: 360 } }),
    center("ANALYSE ET IMPLÉMENTATION D'UNE APPLICATION WEB", { bold: true, size: 26 }),
    center("DE GESTION DE TONTINES COMMUNAUTAIRES", { bold: true, size: 26, after: 280 }),
    center("Projet de fin d'étude", { after: 200 }),
    center("Rédigé et soutenu par :"),
    center("FOUEJIO YVANNA FAYELLE", { bold: true, after: 120 }),
    center("Matricule : 23I032", { after: 200 }),
    center("En vue de l'obtention du diplôme de :"),
    center("LICENCE EN SCIENCE DE L'INGENIEUR", { bold: true }),
    center("Option : GENIE INFORMATIQUE", { after: 240 }),
    center("SOUS L'ENCADREMENT DE :"),
    center("Dr Kungne Willy", { bold: true, after: 240 }),
    center("DEVANT LE JURY COMPOSE DE :", { after: 120 }),
    center("M. _______________________________, Président du jury", { after: 80 }),
    center("M. _______________________________, Rapporteur", { after: 80 }),
    center("M. _______________________________, Examinateur", { after: 280 }),
    center("Année académique"),
    center("2026-2027"),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function dedicationPage() {
  return [
    new Paragraph({ spacing: { before: 2400 } }),
    center("DÉDICACE", { bold: true, after: 600 }),
    center("À", { after: 400 }),
    center("La famille Fouedjio"),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function resumePage() {
  const resumeText =
    "Ce projet de fin d'étude porte sur l'analyse et l'implémentation d'une application web de gestion de tontines communautaires, dénommée E-Tontine. Il s'inscrit dans un contexte où la tontine demeure un mécanisme d'épargne collective largement pratiqué au Cameroun, mais où sa gestion repose encore sur des registres papier, des calculs manuels et la confiance accordée à un seul membre, exposant les groupes à des erreurs de calcul, à une opacité financière, à des conflits entre membres et parfois à des pertes de données. L'objectif principal est de proposer une solution numérique centralisée, traçable et sécurisée, permettant à tout groupe de tontiniers de gérer ses membres, cycles de cotisation, rubriques, réunions, épargne, prêts internes et finances. Le mémoire traite des enjeux organisationnels et financiers liés à la gestion des tontines au Cameroun, en mettant en lumière les limites des systèmes existants. Une étude comparative de solutions similaires a permis de faire ressortir leurs apports respectifs, mais aussi leurs insuffisances : frais de commission élevés, absence de gouvernance associative complète, fonctionnalités limitées ou interfaces peu adaptées au contexte local. À partir de cette analyse, les besoins fonctionnels et non fonctionnels ont été définis et modélisés à l'aide du langage UML, selon une démarche structurée par le processus 2TUP. Après la phase de conception, nous sommes passés à l'implémentation de la plateforme à l'aide de technologies modernes telles que Next.js, React, TypeScript, Prisma, Supabase et Vercel. En résultat, nous disposons d'une application web responsive permettant de gérer de façon centralisée et transparente l'ensemble du cycle de vie d'une tontine communautaire.";

  return [
    center("RÉSUMÉ", { bold: true, before: 400, after: 360 }),
    justify(resumeText, { after: 240 }),
    justify("Mots clés : tontine, application web, gestion communautaire, traçabilité, UML."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function abstractPage() {
  const abstractText =
    "This final year project focuses on the analysis and implementation of a web application for managing community tontines, called E-Tontine. It emerges in a context where tontines remain a widely used collective savings mechanism in Cameroon, while their management still relies on paper records, manual calculations and trust placed in a single member, exposing groups to calculation errors, financial opacity, conflicts among members and sometimes data loss. The main objective is to propose a centralized, traceable and secure digital solution enabling any tontine group to manage its members, contribution cycles, categories, meetings, savings, internal loans and finances. The thesis addresses the organizational and financial challenges of tontine management in Cameroon, highlighting the limitations of existing systems. A comparative study of similar solutions helped identify their respective strengths, but also their shortcomings: high commission fees, lack of complete associative governance, limited features or interfaces poorly adapted to the local context. Based on this analysis, both functional and non-functional requirements were defined and modeled using UML, following a structured approach based on the 2TUP process. Following the design phase, the platform was implemented using modern technologies including Next.js, React, TypeScript, Prisma, Supabase and Vercel. The result is a responsive web application enabling centralized and transparent management of the entire life cycle of a community tontine.";

  return [
    center("ABSTRACT", { bold: true, before: 400, after: 360 }),
    justify(abstractText, { after: 240 }),
    justify("Keywords: tontine, web application, community management, traceability, UML."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function reservedPage(title, placeholder = "(À compléter après rédaction)") {
  return [
    center(title, { bold: true, before: 400, after: 480 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: placeholder,
          font: FONT,
          size: 22,
          italics: true,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sommairePage() {
  const entries = [
    { level: 1, text: "INTRODUCTION GENERALE" },
    { level: 1, text: "CHAPITRE I : PRESENTATION DE L'ENTREPRISE ET ETUDE DE L'EXISTANT" },
    { level: 2, text: "I.1 Presentation de l'entreprise" },
    { level: 2, text: "I.2 Etude de l'existant" },
    { level: 1, text: "CHAPITRE II : METHODOLOGIE ET CONCEPTION" },
    { level: 2, text: "II.1 Methodologie" },
    { level: 2, text: "II.2 Analyse des besoins" },
    { level: 2, text: "II.3 Diagramme de classes" },
    { level: 2, text: "II.4 Conception" },
    { level: 1, text: "CHAPITRE III : IMPLEMENTATION ET PRESENTATION DES RESULTATS" },
    { level: 2, text: "III.1 Diagramme de deploiement" },
    { level: 2, text: "III.2 Environnement de developpement" },
    { level: 2, text: "III.3 Presentation des resultats" },
    { level: 1, text: "CONCLUSION GENERALE ET PERSPECTIVES" },
    { level: 1, text: "REFERENCES" },
  ];

  return [
    center("SOMMAIRE", { bold: true, before: 400, after: 360 }),
    ...entries.map(
      ({ level, text }) =>
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 80 },
          indent: { left: level === 2 ? 720 : 0 },
          children: [
            new TextRun({ text, font: FONT, size: 24 }),
            new TextRun({ text: "\t………………", font: FONT, size: 24 }),
          ],
        }),
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function preliminaryReservedPages() {
  return [
    ...sommairePage(),
    ...reservedPage("LISTE DES FIGURES"),
    ...reservedPage("LISTE DES TABLEAUX"),
    ...reservedPage("LISTE DES ABREVIATIONS"),
  ];
}

function acknowledgmentsPage() {
  return [
    center("REMERCIEMENTS", { bold: true, before: 400, after: 360 }),
    justify(
      "Je tiens à exprimer ma profonde gratitude envers toutes les personnes qui, de près ou de loin, ont contribué à la réalisation de ce mémoire.",
      { after: 200 },
    ),
    bulletItem("M. le Président du jury, d'avoir accepté d'évaluer mon travail ;"),
    bulletItem(
      "M. le Rapporteur, pour l'attention portée à ce mémoire et pour ses remarques constructives ;",
    ),
    bulletItem("M. l'Examinateur, d'avoir accepté d'évaluer mon travail ;"),
    bulletItem(
      "Mon encadreur académique, Dr Kungne Willy, pour sa disponibilité, son soutien et son orientation dans l'élaboration de ce projet ;",
    ),
    bulletItem(
      "Le Recteur Rév. Pr FRISSOU Samuel, de m'avoir accueilli au sein de son université ;",
    ),
    bulletItem(
      "Le Doyen Pr Thomas Tamo Tatieste, pour son soutien et ses précieux conseils tout au long de mon parcours ;",
    ),
    bulletItem(
      "L'administration de l'Université Protestante d'Afrique Centrale ainsi que l'ensemble du corps enseignant de la Faculté des Technologies de l'Information et de la Communication, pour la formation de qualité reçue durant mon cursus ;",
    ),
    bulletItem(
      "L'entreprise Worketyamo, pour m'avoir accueilli en stage et pour les compétences en développement d'applications web qui m'ont permis de mener à bien ce projet ;",
    ),
    bulletItem(
      "Mes parents, Monsieur et Madame Fouedjio, pour leur amour, leurs sacrifices et l'atmosphère de travail qu'ils m'ont offerte tout au long de mes études ;",
    ),
    bulletItem("Ma grande sœur, pour son soutien, ses encouragements et sa présence à mes côtés ;"),
    bulletItem(
      "Mes amis et camarades de promotion, pour leur entraide et leur soutien moral tout au long de ces années d'études.",
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function introductionGeneralePage() {
  const p1 =
    "La tontine constitue un mécanisme d'épargne et de crédit rotatif par lequel un groupe de personnes cotise régulièrement pour constituer un pot commun, versé à tour de rôle à chaque participant ou mobilisé en cas de besoin collectif. Dans le domaine des finances communautaires informelles, particulièrement au Cameroun et en Afrique subsaharienne, cette pratique concerne aussi bien les tontines familiales que les associations de quartier, les groupes professionnels et les coopératives d'épargne. Pourtant, la gestion de ces groupes repose encore largement sur des registres papier, des calculs manuels et la centralisation des informations entre les mains d'un seul membre, sans mécanisme de contrôle partagé. Cette situation expose les groupes à des erreurs de calcul, à une opacité financière, à des conflits entre participants, à des falsifications ou à des pertes de données, et parfois à des situations de méfiance voire de fraude.";

  const p2 =
    "Face à cette situation, la persistance de ces dysfonctionnements traduit une problématique d'organisation et de gouvernance informationnelle : l'absence d'un système centralisé, traçable et accessible à l'ensemble des membres empêche tout contrôle équitable des opérations financières d'une tontine. Dans ce contexte, le recours aux technologies de l'information apparaît comme une voie pertinente pour digitaliser le cycle de vie des tontines communautaires, automatiser le suivi des cotisations et des mouvements financiers, et garantir la transparence des échanges au sein du groupe. Il s'agit donc de s'interroger sur la manière dont une solution informatique adaptée pourrait répondre efficacement à ces limites : comment concevoir une application web capable de garantir transparence, traçabilité et contrôle d'accès au sein d'un groupe de tontiniers ?";

  const p3 =
    "L'objectif général de ce projet est donc de concevoir et de mettre en œuvre une application web de gestion de tontines communautaires, dénommée E-Tontine, permettant aux administrateurs et aux membres de suivre, de manière fiable et centralisée, l'ensemble des activités financières et organisationnelles d'un groupe. Pour atteindre cet objectif, il s'agit d'analyser le fonctionnement des tontines communautaires et les limites des solutions existantes, de recueillir et de formaliser les besoins du système, de modéliser l'application à l'aide du langage UML, de développer une plateforme web couvrant les modules essentiels de gestion, de garantir la traçabilité des opérations financières et la gestion des rôles, puis de déployer et de valider la solution auprès de groupes pilotes.";

  const p4Intro =
    "Pour atteindre ces objectifs, le présent mémoire s'articule autour des chapitres ci-dessous.";

  return [
    center("INTRODUCTION GENERALE", { bold: true, before: 400, after: 360 }),
    justify(p1, { after: 200 }),
    justify(p2, { after: 200 }),
    justify(p3, { after: 200 }),
    justify(p4Intro, { after: 160 }),
    bulletItem(
      "Chapitre 1 : présentation de l'entreprise et étude de l'existant.",
      "intro-chapters",
    ),
    bulletItem("Chapitre 2 : méthodologie et conception.", "intro-chapters"),
    bulletItem(
      "Chapitre 3 : implémentation et présentation des résultats et enfin la conclusion dans laquelle on fera un bilan de notre travail et on proposera des perspectives d'évolution.",
      "intro-chapters",
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

const children = [
  ...coverPage(),
  ...dedicationPage(),
  ...acknowledgmentsPage(),
  ...resumePage(),
  ...abstractPage(),
  ...preliminaryReservedPages(),
  ...introductionGeneralePage(),
  ...chapter1PartI1(),
  ...chapter1PartI2(),
  ...chapter1Conclusion(),
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "intro-chapters",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
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

if (OVERWRITE_EDITABLE) {
  console.log(`Mémoire régénéré (écrasement) : ${OUT}`);
  console.warn(
    "ATTENTION : memoire-E-TONTINE.docx a été écrasé. Vos modifications manuelles ont été perdues si elles n'étaient pas sauvegardées ailleurs.",
  );
} else {
  console.log(`Mémoire généré : ${OUT}`);
  if (fs.existsSync(MEMOIRE_EDITABLE)) {
    console.log(
      `Votre version de travail est préservée : ${MEMOIRE_EDITABLE}`,
    );
    console.log(
      "Copiez-collez depuis le fichier -genere.docx uniquement les sections que vous souhaitez intégrer.",
    );
  } else {
    console.log(
      `Astuce : renommez ou copiez ce fichier en memoire-E-TONTINE.docx pour commencer vos modifications manuelles.`,
    );
  }
}
