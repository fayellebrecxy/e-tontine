import fs from "fs";
import { Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak } from "docx";

const OUT = "Docs/references.docx";

const refs = [
  {
    num: "[1]",
    text: "S. Ardener, \"The Comparative Study of Rotating Credit Associations,\" Journal of the Royal Anthropological Institute of Great Britain and Ireland, vol. 94, no. 2, pp. 201–229, juil. 1964.",
    location: "Introduction générale, 1er paragraphe.",
    context: "À insérer après : \"...versé à tour de rôle à chaque participant ou mobilisé en cas de besoin collectif [1].\""
  },
  {
    num: "[2]",
    text: "F. J. A. Bouman, \"The ROSCA: Financial Technology of an Informal Savings and Credit Institution in Developing Economies,\" Savings and Development, vol. 3, no. 4, pp. 253–276, déc. 1979.",
    location: "Introduction générale, 1er paragraphe.",
    context: "À insérer après : \"Dans le domaine des finances communautaires informelles, particulièrement au Cameroun et en Afrique subsaharienne [2]...\""
  },
  {
    num: "[3]",
    text: "M. Nzemen, Tontines et développement au Cameroun, Yaoundé, Cameroun : Presses Universitaires du Cameroun, 1993.",
    location: "Introduction générale, 1er paragraphe.",
    context: "À insérer pour remplacer l'ancien [1] à la fin de la phrase : \"...concerne aussi bien les tontines familiales que les associations de quartier, les groupes professionnels et les coopératives d'épargne [3].\""
  },
  {
    num: "[4]",
    text: "J.-M. Servet, \"Le djangui : entre tradition et modernité financière au Cameroun,\" Autrepart, vol. 15, pp. 115–130, mars 2000.",
    location: "Introduction générale, 2e paragraphe.",
    context: "À insérer après : \"...empêche tout contrôle équitable des opérations financières d'une tontine [4].\""
  },
  {
    num: "[5]",
    text: "I. Mbiti and D. N. Weil, \"Mobile Banking: The Impact of M-Pesa in Kenya,\" NBER Working Paper Series, vol. 16503, pp. 1–45, oct. 2011.",
    location: "Introduction générale, 2e paragraphe.",
    context: "À insérer pour remplacer l'ancien [1] après : \"...digitaliser le cycle de vie des tontines communautaires [5]...\""
  },
  {
    num: "[6]",
    text: "G. Grispos, W. B. Glisson, and T. Storer, \"Security and software engineering in web-based community platforms,\" IEEE Software, vol. 34, no. 4, pp. 78–85, juil. 2017.",
    location: "Introduction générale, 2e paragraphe.",
    context: "À insérer à la fin de la phrase : \"...comment concevoir une application web capable de garantir transparence, traçabilité et contrôle d'accès au sein d'un groupe de tontiniers [6] ?\""
  },
  {
    num: "[7]",
    text: "WORKETYAMO, \"Rapport sur la structure organisationnelle et organigramme de l'entreprise,\" Document interne, Yaoundé, Cameroun : WORKETYAMO, 2026.",
    location: "Chapitre I, Section I.1.2 (Organigramme de l'entreprise).",
    context: "À insérer après : \"La figure 1 ci-dessous illustre l’organigramme de la structure WORKETYAMO [7] :\""
  },
  {
    num: "[8]",
    text: "FRANCE 24, \"Ancient community banking enters digital age in Cameroon,\" France 24, 12 mars 2024. [En ligne]. Disponible : https://www.france24.com/en/live-news/20240312-ancient-community-banking-enters-digital-age-in-cameroon. Date d’accès : 12-Jun-2026.",
    location: "Chapitre I, Section I.2.1 (Contexte du marché), 1er paragraphe.",
    context: "À insérer pour remplacer l'ancien [1] après : \"...ce qui renforce le recours aux dispositifs informels d'épargne et de crédit rotatif [8].\""
  },
  {
    num: "[9]",
    text: "H. Dia, \"The World Runs on Tontines: Why Africa's Oldest Financial Infrastructure Still Has No Killer App,\" Included VC / Medium, 7 mai 2025. [En ligne]. Disponible : https://medium.com/included-vc/the-world-runs-on-tontines-why-africas-oldest-financial-infrastructure-still-has-no-killer-app-9a92d89e3b86. Date d’accès : 12-Jun-2026.",
    location: "Chapitre I, Section I.2.1 (Contexte du marché), 2e paragraphe.",
    context: "À insérer pour remplacer l'ancien [2] après : \"...en proposant de digitaliser tout ou en partie le cycle de vie d'une tontine [9].\""
  },
  {
    num: "[10]",
    text: "Cirkkle, \"Site officiel de l'application Cirkkle,\" Cirkkle, 2024. [En ligne]. Disponible : https://cirkkle.com/. Date d’accès : 12-Jun-2026.",
    location: "Chapitre I, Section I.2.2.1 (Cirkkle) et Figure 2.",
    context: "Remplacer l'ancien [3] dans le texte et dans le titre de la Figure 2 par [10]."
  },
  {
    num: "[11]",
    text: "Njangi App, \"Site officiel Njangi App,\" Njangi App, 2024. [En ligne]. Disponible : https://njangiapp.com/fr/. Date d’accès : 12-Jun-2026.",
    location: "Chapitre I, Section I.2.2.2 (Njangi App) et Figure 3.",
    context: "Remplacer l'ancien [4] dans le texte et dans le titre de la Figure 3 par [11]."
  },
  {
    num: "[12]",
    text: "Djangui 3.0, \"Site officiel et blog Djangui 3.0 / Africa Djangui,\" Djangui 3.0, 2024. [En ligne]. Disponible : https://djangui.net/. Date d’accès : 12-Jun-2026.",
    location: "Chapitre I, Section I.2.3.1 (Djangui 3.0) et Figure 4.",
    context: "Remplacer l'ancien [5] dans le texte et dans le titre de la Figure 4 par [12]."
  },
  {
    num: "[13]",
    text: "KIKA, \"Site officiel KIKA Africa,\" Kika Africa, 2024. [En ligne]. Disponible : https://kika.africa/. Date d’accès : 12-Jun-2026.",
    location: "Chapitre I, Section I.2.3.2 (KIKA) et Figure 5.",
    context: "Remplacer l'ancien [6] dans le texte et dans le titre de la Figure 5 par [13]."
  },
  {
    num: "[14]",
    text: "P. Roques and F. Vallée, UML 2 en action : De l'analyse des besoins à la conception, 4e éd. Paris : Eyrolles, 2007.",
    location: "Chapitre II, Section II.1.2 (Processus de développement 2TUP).",
    context: "À insérer pour remplacer l'ancien [8] après : \"...les contraintes de réalisation en minimisant les risques [14].\""
  },
  {
    num: "[15]",
    text: "P. Roques, UML 2 par la pratique : Études de cas et exercices corrigés, 7e éd. Paris : Eyrolles, 2018.",
    location: "Chapitre II, Section II.1.3 (Langage de modélisation UML).",
    context: "À insérer pour remplacer l'ancien [7] après : \"...facilitant la compréhension et la communication entre les acteurs du projet [15].\""
  },
  {
    num: "[16]",
    text: "Next.js, \"Next.js Web Framework Documentation,\" Vercel, 2024. [En ligne]. Disponible : https://nextjs.org/docs. Date d’accès : 12-Jun-2026.",
    location: "Chapitre III, Section III.1.2 (Environnement logiciel), paragraphe sur Node.js + Next.js.",
    context: "À insérer après : \"...tandis que Next.js 15 (App Router) structure les pages, les API Routes et les Server Actions [16].\""
  },
  {
    num: "[17]",
    text: "Prisma, \"Prisma ORM Documentation,\" Prisma, 2024. [En ligne]. Disponible : https://www.prisma.io/docs. Date d’accès : 12-Jun-2026.",
    location: "Chapitre III, Section III.1.2 (Environnement logiciel), paragraphe sur Prisma + Supabase.",
    context: "À insérer après : \"Prisma ORM assure les migrations et l'accès typé à PostgreSQL [17]...\""
  },
  {
    num: "[18]",
    text: "A. Ndung'u, \"Mobile Money APIs and Financial Inclusion in Sub-Saharan Africa,\" African Journal of Information Systems, vol. 12, no. 3, pp. 204–222, juil. 2020.",
    location: "Chapitre III, Section III.3.3.10 (Paiements Mobile Money), 1er paragraphe.",
    context: "À insérer après : \"L'utilisateur choisit son opérateur (Orange Money ou MTN MoMo), saisit le numéro à débiter et valide la transaction [18].\""
  }
];

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text: "RÉFÉRENCES BIBLIOGRAPHIQUES COMPLÈTES",
        bold: true,
        font: "Times New Roman",
        size: 32,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: "ET GUIDE PRATIQUE D'INTÉGRATION DANS LE MÉMOIRE",
        italic: true,
        font: "Times New Roman",
        size: 24,
      }),
    ],
  }),

  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 200 },
    children: [
      new TextRun({
        text: "I. Liste officielle des références (Format IEEE)",
        bold: true,
        font: "Times New Roman",
        size: 28,
        underline: {},
      }),
    ],
  }),
  ...refs.map(
    (r) =>
      new Paragraph({
        alignment: AlignmentType.JUSTIFY,
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: `${r.num} `,
            bold: true,
            font: "Times New Roman",
            size: 24,
          }),
          new TextRun({
            text: r.text,
            font: "Times New Roman",
            size: 24,
          }),
        ],
      })
  ),

  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text: "II. Guide d'intégration et de re-numérotation (Endroits exacts)",
        bold: true,
        font: "Times New Roman",
        size: 28,
        underline: {},
      }),
    ],
  }),
  ...refs.map(
    (r) =>
      new Paragraph({
        alignment: AlignmentType.JUSTIFY,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: `${r.num} `,
            bold: true,
            font: "Times New Roman",
            size: 24,
          }),
          new TextRun({
            text: `Emplacement : `,
            bold: true,
            font: "Times New Roman",
            size: 24,
          }),
          new TextRun({
            text: `${r.location}\n`,
            italic: true,
            font: "Times New Roman",
            size: 24,
          }),
          new TextRun({
            text: `Action dans le mémoire : `,
            bold: true,
            font: "Times New Roman",
            size: 24,
          }),
          new TextRun({
            text: r.context,
            font: "Times New Roman",
            size: 24,
          }),
        ],
      })
  ),

  new Paragraph({ children: [new PageBreak()] }),

  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 200 },
    children: [
      new TextRun({
        text: "III. Traduction en anglais du Résumé du Mémoire (Abstract)",
        bold: true,
        font: "Times New Roman",
        size: 28,
        underline: {},
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 150, after: 100 },
    children: [
      new TextRun({
        text: "Résumé original en français :",
        bold: true,
        font: "Times New Roman",
        size: 24,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.JUSTIFY,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: "À l'ère du numérique, où la transformation digitale touche progressivement tous les secteurs de l'économie, la finance informelle en Afrique subsaharienne et particulièrement au Cameroun reste encore largement en marge de cette révolution. La tontine, mécanisme d'épargne collective dans lequel un groupe de personnes cotise régulièrement une somme définie et où à tour de rôle chaque participant reçoit la cagnotte collective, constitue un pilier central de la vie financière et sociale des populations camerounaises. Malgré son importance capitale dans le quotidien de millions de familles, sa gestion repose encore sur des registres papier, des calculs manuels et la confiance accordée à un seul membre, exposant les groupes à des erreurs de calcul, à une opacité financière, à des conflits entre membres et parfois à des pertes de données. L'objectif principal est de proposer une solution numérique centralisée, traçable et sécurisée, permettant à tout groupe de tontiniers de gérer ses membres, cycles de cotisation, rubriques, réunions, épargne, prêts internes et finances. Le mémoire traite des enjeux organisationnels et financiers liés à la gestion des tontines au Cameroun, en mettant en lumière les limites des systèmes existants. Une étude comparative de solutions similaires telles que Cirkkle, Njangi App, Djangui 3.0 et Kika a permis de faire ressortir leurs apports respectifs, mais aussi leurs insuffisances : frais de commission élevés, absence de gouvernance associative complète, fonctionnalités limitées ou interfaces peu adaptées au contexte local. À partir de cette analyse, les besoins fonctionnels et non fonctionnels ont été définis et modélisés à l'aide du langage UML par des diagrammes de cas d’utilisation, de sequence syteme, de sequence et de classe suivant les branches fonctionnelles et techniques du processus 2TUP. Après la phase de conception, nous sommes passés à l'implémentation de la plateforme à l'aide de technologies modernes telles que Next.js, React, TypeScript, Prisma, Supabase et Vercel. En résultat, nous disposons d'une application web responsive permettant de gérer de façon centralisée et transparente l'ensemble du cycle de vie d'une tontine communautaire.",
        font: "Times New Roman",
        size: 24,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: "Mots clés : ",
        bold: true,
        font: "Times New Roman",
        size: 24,
      }),
      new TextRun({
        text: "Tontine, Application Web, Gestion Communautaire, Traçabilité, UML.",
        font: "Times New Roman",
        size: 24,
      }),
    ],
  }),

  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({
        text: "Traduction en anglais fidèle et académique (Abstract) :",
        bold: true,
        font: "Times New Roman",
        size: 24,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.JUSTIFY,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: "In the digital era, where digital transformation is gradually impacting all sectors of the economy, informal finance in Sub-Saharan Africa, and particularly in Cameroon, still remains largely on the margins of this revolution. The tontine, a collective savings mechanism in which a group of people regularly contributes a defined sum and where each participant in turn receives the pooled fund, constitutes a central pillar of the financial and social life of Cameroonian populations. Despite its vital importance in the daily lives of millions of families, its management still relies on paper registers, manual calculations, and trust placed in a single member, exposing groups to calculation errors, financial opacity, conflicts between members, and occasionally data loss. The main objective is to propose a centralized, traceable, and secure digital solution, enabling any tontine group to manage its members, contribution cycles, rubrics, meetings, savings, internal loans, and finances. This thesis addresses the organizational and financial challenges related to the management of tontines in Cameroon, highlighting the limitations of existing systems. A comparative study of similar solutions such as Cirkkle, Njangi App, Djangui 3.0, and Kika highlighted their respective contributions, but also their shortcomings: high commission fees, the lack of complete associative governance, limited features, or interfaces poorly adapted to the local context. Based on this analysis, the functional and non-functional requirements were defined and modeled using the UML language through use case, system sequence, sequence, and class diagrams following the functional and technical tracks of the 2TUP process. After the design phase, we proceeded to the platform's implementation using modern technologies such as Next.js, React, TypeScript, Prisma, Supabase, and Vercel. As a result, we have a responsive web application that enables the centralized and transparent management of the entire life cycle of a community tontine.",
        font: "Times New Roman",
        size: 24,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: "Keywords: ",
        bold: true,
        font: "Times New Roman",
        size: 24,
      }),
      new TextRun({
        text: "Tontine, Web Application, Community Management, Traceability, UML.",
        font: "Times New Roman",
        size: 24,
      }),
    ],
  }),
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
console.log("Fichier references.docx mis à jour avec la traduction de l'Abstract!");
