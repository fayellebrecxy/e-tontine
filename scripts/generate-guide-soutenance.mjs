/**
 * Guide technique de soutenance — E-Tontine
 * Sortie : Docs/guide-soutenance-E-TONTINE.docx
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
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "Docs", "guide-soutenance-E-TONTINE.docx");
const FONT = "Times New Roman";

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
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 28, bold: true })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 26, bold: true })],
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 60 },
    bullet: { level },
    children: [new TextRun({ text, font: FONT, size: 22 })],
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
                        size: 20,
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

function glossaryTable(entries) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
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
    rows: [
      new TableRow({
        children: ["Terme", "Définition"].map(
          (text) =>
            new TableCell({
              shading: { fill: "D9E2F3" },
              children: [
                new Paragraph({
                  children: [new TextRun({ text, font: FONT, size: 20, bold: true })],
                }),
              ],
            }),
        ),
      }),
      ...entries.map(
        ([term, def]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 28, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: term, font: FONT, size: 20, bold: true })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 72, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [new TextRun({ text: def, font: FONT, size: 20 })],
                  }),
                ],
              }),
            ],
          }),
      ),
    ],
  });
}

const GLOSSARY = {
  architecture: [
    [
      "API (Application Programming Interface)",
      "Interface qui permet à deux programmes de communiquer. Dans E-Tontine, les API Routes (/api/...) reçoivent des requêtes HTTP (GET, POST…) et renvoient des données JSON.",
    ],
    [
      "API Route",
      "Fichier route.ts dans app/api/ qui expose un point d'accès HTTP. Exemple : app/api/groups/[groupId]/cycles/route.ts gère les cycles d'un groupe.",
    ],
    [
      "App Router",
      "Système de routage de Next.js 13+ basé sur le dossier app/. Chaque dossier = un segment d'URL ; page.tsx = la page affichée.",
    ],
    [
      "Architecture trois tiers",
      "Découpage en 3 couches : présentation (navigateur), logique applicative (serveur Next.js), données (PostgreSQL). Chaque couche a un rôle distinct.",
    ],
    [
      "Backend / Serveur",
      "Partie qui s'exécute sur le serveur (Vercel) : vérifie l'auth, applique les règles métier, accède à la base. L'utilisateur ne voit pas ce code directement.",
    ],
    [
      "CDN (Content Delivery Network)",
      "Réseau de serveurs qui distribue les fichiers statiques (images, CSS, JS) près de l'utilisateur pour un chargement plus rapide. Vercel en intègre un.",
    ],
    [
      "CI/CD (Intégration / Déploiement continus)",
      "Automatisation des tests (lint, build) à chaque modification du code, puis déploiement en production. E-Tontine utilise GitHub Actions + Vercel.",
    ],
    [
      "Client",
      "Partie qui s'exécute dans le navigateur de l'utilisateur : affichage React, formulaires, clics. Ne doit jamais contenir de secrets.",
    ],
    [
      "Cookie HTTP-only",
      "Fichier texte stocké par le navigateur, envoyé automatiquement au serveur, inaccessible en JavaScript. Utilisé pour la session Supabase (sécurité).",
    ],
    [
      "Cron / Tâche planifiée",
      "Exécution automatique d'un script à intervalle régulier (ex. chaque jour). E-Tontine envoie les rappels de réunion via /api/cron/reunion-reminders.",
    ],
    [
      "Déploiement",
      "Mise en ligne de l'application sur un serveur accessible au public. E-Tontine est déployée sur Vercel à l'adresse e-tontine.vercel.app.",
    ],
    [
      "Endpoint",
      "URL précise d'une API. Exemple : POST /api/groups/abc123/payments/initiate déclenche un paiement.",
    ],
    [
      "Frontend",
      "Partie visible de l'application : pages, boutons, tableaux. Construite en React dans le dossier components/ et app/.",
    ],
    [
      "Full-stack",
      "Application qui gère à la fois l'interface utilisateur et la logique serveur dans un même projet (Next.js).",
    ],
    [
      "Handler",
      "Fonction qui traite une requête HTTP entrante dans une API Route (ex. export async function POST(...)).",
    ],
    [
      "JSON (JavaScript Object Notation)",
      "Format d'échange de données lisible par les machines : {\"nom\": \"ATW\", \"devise\": \"XAF\"}. Utilisé par toutes les API.",
    ],
    [
      "Middleware",
      "Code exécuté avant chaque requête (middleware.ts). Rafraîchit la session et bloque l'accès aux pages protégées sans connexion.",
    ],
    [
      "Monolithe",
      "Application unique contenant frontend + backend. E-Tontine est un monolithe Next.js (pas de microservices séparés).",
    ],
    [
      "PWA (Progressive Web App)",
      "Site web qui se comporte comme une application mobile (responsive, installable). E-Tontine est une web app responsive.",
    ],
    [
      "Requête HTTP",
      "Message envoyé par le navigateur au serveur : GET (lire), POST (créer), PUT/PATCH (modifier), DELETE (supprimer).",
    ],
    [
      "Runtime",
      "Environnement d'exécution du code serveur. Node.js est le runtime qui fait tourner Next.js et Prisma.",
    ],
    [
      "Server Actions",
      "Fonctions serveur appelées directement depuis un formulaire React (\"use server\"). Utilisées pour l'auth et les rubriques.",
    ],
    [
      "Server Components",
      "Composants React rendus côté serveur (pas de JavaScript envoyé au client). Améliorent les performances des pages dashboard.",
    ],
    [
      "SPA (Single Page Application)",
      "Application web qui charge une seule page HTML puis met à jour le contenu dynamiquement sans rechargement complet.",
    ],
    [
      "SSR (Server-Side Rendering)",
      "Génération du HTML côté serveur avant envoi au navigateur. Next.js fait du SSR pour les pages non statiques.",
    ],
    [
      "UUID",
      "Identifiant unique universel (ex. a3f2c8d1-...). Chaque utilisateur, groupe et transaction en possède un.",
    ],
    [
      "Variable d'environnement",
      "Paramètre secret ou de configuration (DATABASE_URL, clés API) stocké hors du code source, lu au démarrage du serveur.",
    ],
    [
      "Web responsive",
      "Interface qui s'adapte automatiquement à la taille de l'écran (mobile, tablette, ordinateur).",
    ],
  ],
  stack: [
    [
      "Next.js",
      "Framework React qui ajoute le routage, le rendu serveur, les API Routes et le build optimisé. Version 15 dans E-Tontine.",
    ],
    [
      "React",
      "Bibliothèque JavaScript pour construire des interfaces par composants réutilisables (boutons, formulaires, tableaux). Version 19.",
    ],
    [
      "TypeScript",
      "Sur-ensemble de JavaScript avec typage statique. Détecte les erreurs avant l'exécution (ex. interdire un montant texte là où un nombre est attendu).",
    ],
    [
      "Node.js",
      "Runtime JavaScript côté serveur. Exécute Next.js en développement et en production. Version minimale : 20.12.",
    ],
    [
      "npm",
      "Gestionnaire de paquets Node.js. Installe les dépendances listées dans package.json (npm install / npm ci).",
    ],
    [
      "Prisma / Prisma ORM",
      "Outil qui mappe les tables PostgreSQL en objets TypeScript typés. Gère aussi les migrations (évolution du schéma).",
    ],
    [
      "PostgreSQL",
      "Système de gestion de base de données relationnelle (SQL). Hébergé par Supabase pour E-Tontine.",
    ],
    [
      "Supabase",
      "Plateforme open-source fournissant PostgreSQL managé + authentification + API. E-Tontine utilise surtout Auth et l'hébergement DB.",
    ],
    [
      "Supabase Auth",
      "Service d'authentification de Supabase : inscription, connexion, confirmation email, réinitialisation mot de passe, gestion des sessions.",
    ],
    [
      "@supabase/ssr",
      "Bibliothèque qui adapte Supabase Auth au rendu serveur Next.js via des cookies sécurisés.",
    ],
    [
      "Tailwind CSS",
      "Framework CSS « utility-first » : on stylise avec des classes (bg-primary, text-sm) plutôt qu'en écrivant du CSS long.",
    ],
    [
      "shadcn/ui",
      "Collection de composants UI (bouton, dialog, formulaire) copiés dans le projet, basés sur Radix + Tailwind. Style « new-york ».",
    ],
    [
      "Radix UI",
      "Bibliothèque de composants accessibles sans style imposé (dialogs, menus, onglets). shadcn/ui s'appuie dessus.",
    ],
    [
      "Zod",
      "Bibliothèque de validation de schémas TypeScript. Vérifie que les données reçues (formulaire, API) ont le bon format avant traitement.",
    ],
    [
      "Vercel",
      "Plateforme d'hébergement optimisée pour Next.js : déploiement automatique, HTTPS, CDN, variables d'environnement.",
    ],
    [
      "GitHub Actions",
      "Service d'automatisation CI intégré à GitHub. Lance lint et build à chaque push pour éviter les bugs en production.",
    ],
    [
      "ESLint",
      "Outil d'analyse statique du code JavaScript/TypeScript. Détecte les erreurs de style et certaines erreurs logiques (npm run lint).",
    ],
    [
      "Docker",
      "Technologie de conteneurisation pour empaqueter l'application et ses dépendances. Alternative à Vercel pour auto-hébergement.",
    ],
    [
      "Recharts",
      "Bibliothèque de graphiques React utilisée dans le tableau de bord (statistiques financières).",
    ],
    [
      "next-intl",
      "Bibliothèque d'internationalisation pour Next.js. Permet le français et l'anglais (messages/fr.json, messages/en.json).",
    ],
    [
      "next-themes",
      "Gestion du thème clair/sombre de l'interface utilisateur.",
    ],
    [
      "react-hook-form",
      "Bibliothèque pour gérer les formulaires React (validation, soumission, erreurs) avec peu de re-rendus.",
    ],
    [
      "Lucide React",
      "Pack d'icônes SVG utilisées dans la navigation (cycles, prêts, épargne…).",
    ],
  ],
  securite: [
    [
      "Authentification (Auth)",
      "Vérifier QUI est l'utilisateur (identité). Login + mot de passe via Supabase. Répond à : « Es-tu bien Fouedjio ? »",
    ],
    [
      "Autorisation",
      "Vérifier CE QUE l'utilisateur a le droit de faire. Répond à : « As-tu le droit de modifier ce groupe ? » Distinct de l'auth.",
    ],
    [
      "CSRF (Cross-Site Request Forgery)",
      "Attaque où un site malveillant déclenche une action à votre place. Les Server Actions Next.js intègrent une protection native.",
    ],
    [
      "CSP (Content Security Policy)",
      "En-tête HTTP qui restreint les sources de scripts, images et connexions autorisées. Configuré dans next.config.ts.",
    ],
    [
      "HSTS (HTTP Strict Transport Security)",
      "Force le navigateur à n'utiliser que HTTPS en production, empêchant l'interception des données en clair.",
    ],
    [
      "Hachage (hash)",
      "Transformation irréversible d'un mot de passe en empreinte numérique. Supabase stocke le hash, jamais le mot de passe en clair.",
    ],
    [
      "OTP (One-Time Password)",
      "Code à usage unique envoyé par email pour confirmer une action (réinitialisation mot de passe, vérification compte).",
    ],
    [
      "JWT (JSON Web Token)",
      "Jeton signé contenant l'identité de l'utilisateur. Supabase l'utilise en interne ; E-Tontine passe par des cookies SSR.",
    ],
    [
      "RLS (Row Level Security)",
      "Mécanisme PostgreSQL qui filtre les lignes accessibles par utilisateur. Activé sur Supabase mais sans policies dans E-Tontine ; le filtrage est fait dans le code Prisma.",
    ],
    [
      "Injection SQL",
      "Attaque consistant à insérer du code SQL malveillant dans un formulaire. Prisma utilise des requêtes paramétrées qui neutralisent ce risque.",
    ],
    [
      "Secret / Clé API",
      "Chaîne confidentielle donnant accès à un service (SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET). Jamais exposée au navigateur.",
    ],
    [
      "Session",
      "État de connexion d'un utilisateur entre plusieurs requêtes. Maintenue par des cookies Supabase rafraîchis par le middleware.",
    ],
    [
      "Validation",
      "Contrôle du format et des valeurs des données entrantes (email valide, montant positif, UUID correct) avant traitement.",
    ],
    [
      "Transaction (BDD)",
      "Ensemble d'opérations base de données exécutées comme une unité : tout réussit ou tout est annulé (rollback). Essentiel pour les paiements.",
    ],
    [
      "Atomique",
      "Qualifie une opération indivisible : pas d'état intermédiaire visible. Une transaction financière est atomique.",
    ],
    [
      "403 Forbidden",
      "Code HTTP renvoyé quand l'utilisateur est connecté mais n'a pas le droit d'accéder à la ressource (ex. membre non admin).",
    ],
    [
      "401 Unauthorized",
      "Code HTTP renvoyé quand l'utilisateur n'est pas authentifié (pas connecté ou session expirée).",
    ],
    [
      "Redirection ouverte (Open Redirect)",
      "Faille où un attaquant redirige l'utilisateur vers un site malveillant après connexion. Bloquée par normalizeNextPath.",
    ],
    [
      "Service Role Key",
      "Clé Supabase avec droits administrateur complets. Utilisée uniquement côté serveur (ex. génération de lien de reset password).",
    ],
    [
      "Anon Key (clé publique Supabase)",
      "Clé publique permettant l'auth côté client. Peut être exposée dans le navigateur (préfixe NEXT_PUBLIC_).",
    ],
  ],
  donnees: [
    [
      "ORM (Object-Relational Mapping)",
      "Couche qui traduit les tables SQL en objets de programmation. Prisma est l'ORM d'E-Tontine.",
    ],
    [
      "Schéma (Prisma)",
      "Fichier prisma/schema.prisma décrivant toutes les tables, colonnes, relations et enums de la base.",
    ],
    [
      "Migration",
      "Fichier SQL versionné qui modifie la structure de la base (ajout table, colonne…). Appliqué via prisma migrate.",
    ],
    [
      "Requête paramétrée",
      "Requête SQL où les valeurs utilisateur sont passées séparément du code SQL, empêchant l'injection.",
    ],
    [
      "Upsert",
      "Opération « update or insert » : met à jour un enregistrement s'il existe, sinon le crée. Utilisé pour synchroniser users.",
    ],
    [
      "Relation many-to-many",
      "Lien entre deux entités où chaque côté peut avoir plusieurs occurrences. Ex. un User dans plusieurs Groupes via MembreGroupe.",
    ],
    [
      "Enum (énumération)",
      "Type dont les valeurs sont fixes. Ex. RoleGroupe = ADMIN | MEMBRE ; StatutAdhesion = ACTIF | INACTIF | EN_ATTENTE.",
    ],
    [
      "Clé primaire",
      "Identifiant unique d'une ligne en base (souvent un UUID). Ex. id_groupe, id_user.",
    ],
    [
      "Clé étrangère (Foreign Key)",
      "Colonne qui référence la clé primaire d'une autre table. Ex. id_groupe dans MembreGroupe pointe vers Groupes.",
    ],
    [
      "Index",
      "Structure en base qui accélère les recherches sur une colonne (ex. index sur id_user dans membres_groupe).",
    ],
    [
      "Client Prisma",
      "Objet TypeScript généré (lib/generated/prisma) permettant d'interroger la base avec autocomplétion et typage.",
    ],
    [
      "DATABASE_URL",
      "Chaîne de connexion PostgreSQL utilisée par Prisma en runtime (souvent via pooler Supabase).",
    ],
    [
      "DIRECT_URL",
      "Connexion PostgreSQL directe pour les migrations Prisma (sans pooler).",
    ],
  ],
  metier: [
    [
      "Tontine",
      "Système d'épargne collective où les membres cotisent régulièrement et reçoivent le pot à tour de rôle.",
    ],
    [
      "Groupe",
      "Espace isolé représentant une tontine : membres, cycles, finances propres. Table Groupes en base.",
    ],
    [
      "Cycle (de tontine)",
      "Période durant laquelle chaque membre cotise et reçoit le pot une fois selon l'ordre de passage.",
    ],
    [
      "Cotisation",
      "Paiement périodique d'un membre dans un cycle de tontine. Enregistrée dans la table Cotisations.",
    ],
    [
      "Distribution / Versement",
      "Remise du pot au bénéficiaire du tour en cours. Enregistrée dans Versements.",
    ],
    [
      "Pot",
      "Montant total collecté auprès des membres lors d'un tour de cycle, versé au bénéficiaire.",
    ],
    [
      "Ordre de passage",
      "Séquence définissant quel membre reçoit le pot à chaque tour. Modifiable par échange (DemandeEchange).",
    ],
    [
      "Rubrique",
      "Catégorie de contribution hors cycle (fonds social, assurance, événement). Chaque rubrique a sa caisse.",
    ],
    [
      "Caisse financière",
      "Compte virtuel du groupe typé (GENERALE, CYCLE, RUBRIQUE, EPARGNE…) qui reçoit les entrées et sorties d'argent.",
    ],
    [
      "Journal financier",
      "Historique chronologique de tous les mouvements d'argent du groupe. Chaque ligne = un MouvementFinancier.",
    ],
    [
      "Mouvement financier",
      "Écriture comptable : entrée ou sortie sur une caisse, avec montant, motif, source et références.",
    ],
    [
      "Épargne",
      "Compte individuel d'un membre dans le groupe (CompteEpargne) pour déposer et retirer de l'argent personnellement.",
    ],
    [
      "Prêt interne",
      "Argent prêté par la caisse du groupe à un membre, avec remboursements et éventuels avalistes.",
    ],
    [
      "Avaliste",
      "Membre qui se porte garant pour un prêt. Si l'emprunteur ne rembourse pas, l'avaliste peut être débité.",
    ],
    [
      "Mobile Money / MoMo",
      "Paiement via téléphone mobile (Orange Money, MTN MoMo). Simulé dans E-Tontine, architecture prête pour intégration réelle.",
    ],
    [
      "Pénalité",
      "Sanction financière pour retard de cotisation dans un cycle.",
    ],
    [
      "Amende (réunion)",
      "Sanction pour absence ou retard à une réunion du groupe.",
    ],
    [
      "Invitation",
      "Code ou lien permettant à un nouvel utilisateur de rejoindre un groupe (InvitationGroupe).",
    ],
    [
      "XAF",
      "Franc CFA (devise par défaut des groupes au Cameroun). Code ISO de la monnaie.",
    ],
    [
      "ADMIN",
      "Rôle administrateur d'un groupe : gestion complète (invitations, paramètres, distributions, retraits).",
    ],
    [
      "MEMBRE",
      "Rôle standard : consulter, payer ses cotisations, gérer son épargne, demander des prêts.",
    ],
    [
      "Statut d'adhésion",
      "ACTIF (membre en règle), INACTIF (parti ou suspendu), EN_ATTENTE (demande non validée).",
    ],
    [
      "Statut visuel (VERT/ORANGE/ROUGE)",
      "Indicateur de régularité du membre : vert = à jour, orange = léger retard, rouge = situation critique.",
    ],
    [
      "PaymentTransaction",
      "Enregistrement technique de chaque tentative de paiement Mobile Money (montant, statut, provider, références).",
    ],
    [
      "Notification",
      "Message in-app informant un membre (rappel réunion, paiement confirmé, demande de prêt…).",
    ],
  ],
  design: [
    [
      "Design system",
      "Ensemble de règles visuelles (couleurs, polices, espacements, composants) garantissant une interface cohérente.",
    ],
    [
      "Token (design)",
      "Variable CSS nommée représentant une valeur de design (--ds-primary, --primary). Permet de changer le thème globalement.",
    ],
    [
      "Composant",
      "Brique UI réutilisable (Button, Dialog, Table). Un composant = un fichier .tsx dans components/.",
    ],
    [
      "Utility-first (Tailwind)",
      "Approche CSS où chaque classe applique une seule propriété (p-4 = padding, text-sm = petite taille).",
    ],
    [
      "ARIA",
      "Standard d'accessibilité web pour les lecteurs d'écran. Radix UI gère les attributs ARIA automatiquement.",
    ],
    [
      "Thème clair / sombre",
      "Deux palettes de couleurs interchangeables. Variables CSS différentes dans :root et .dark (globals.css).",
    ],
    [
      "Sidebar",
      "Barre de navigation latérale bleu marine (#00164e) visible dans l'espace groupe connecté.",
    ],
    [
      "Toast / Sonner",
      "Petite notification temporaire en bas d'écran (succès, erreur) après une action utilisateur.",
    ],
    [
      "Dialog / Modal",
      "Fenêtre surgissante pour une action (confirmer suppression, saisir un montant) sans quitter la page.",
    ],
    [
      "Layout",
      "Structure de page réutilisable (en-tête, menu, zone de contenu). Ex. GroupLayout pour toutes les pages d'un groupe.",
    ],
  ],
};

function glossarySection(title, entries) {
  return [h2(title), glossaryTable(entries), body("", { after: 80 })];
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: "GUIDE TECHNIQUE DE SOUTENANCE",
        font: FONT,
        size: 32,
        bold: true,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: "Application E-Tontine — Ce qu'il faut savoir pour la soutenance",
        font: FONT,
        size: 24,
        italics: true,
      }),
    ],
  }),
  body(
    "Document de référence rapide pour présenter le fonctionnement technique d'E-Tontine devant le jury. Il synthétise l'architecture, la stack, la sécurité, les autorisations et les modules métier, à partir du code source réel du projet.",
    { after: 200 },
  ),
  body("Projet : https://e-tontine.vercel.app — Stack : Next.js 15, React 19, Prisma, Supabase, Vercel.", {
    italic: true,
    after: 120,
  }),
  body(
    "Ce guide comprend un glossaire complet (section 12) définissant tous les termes techniques utilisés dans le projet et dans ce document.",
    { after: 300 },
  ),

  // 1
  h1("1. Qu'est-ce qu'E-Tontine ?"),
  body(
    "E-Tontine est une application web de gestion de tontines communautaires. Elle digitalise les opérations d'un groupe d'épargne collective : adhésion des membres, cycles de cotisation, distributions du pot, rubriques de contribution, épargne individuelle, prêts internes, réunions, journal financier et paiements Mobile Money (Orange Money / MTN MoMo, actuellement simulés en développement).",
  ),
  body(
    "Chaque groupe est un espace isolé : un utilisateur peut appartenir à plusieurs groupes avec un rôle différent dans chacun (administrateur ou membre).",
  ),

  // 2
  h1("2. Architecture du système"),
  body("L'application suit une architecture trois tiers, déployée en production :"),
  bullet("Couche présentation : navigateur web (interface React responsive, thème clair/sombre)."),
  bullet("Couche application : Next.js 15 sur Vercel (pages, API Routes, Server Actions)."),
  bullet("Couche données : PostgreSQL hébergé par Supabase + authentification Supabase Auth."),
  body("Flux général d'une requête :"),
  bullet("Le navigateur envoie une requête (page ou appel API)."),
  bullet("Le middleware Next.js rafraîchit la session Supabase (cookies HTTP-only)."),
  bullet("Le serveur vérifie l'identité (getUser) puis les droits métier (appartenance au groupe, rôle)."),
  bullet("Prisma exécute les requêtes SQL paramétrées sur PostgreSQL."),
  bullet("La réponse est renvoyée (HTML côté serveur ou JSON pour les API)."),
  h3("Organisation du code"),
  specTable([
    ["Dossier", "Rôle"],
    ["app/", "Pages Next.js (App Router), API Routes, actions serveur auth"],
    ["components/", "Composants React par module (groupes, cycles, prêts, etc.)"],
    ["lib/", "Logique métier, Prisma, Supabase, validations Zod"],
    ["prisma/", "Schéma de base de données et migrations"],
    ["middleware.ts", "Protection des routes /dashboard et /account"],
  ]),

  // 3
  h1("3. Stack technologique et justifications"),
  specTable([
    ["Technologie", "Rôle", "Pourquoi ce choix (vs alternatives)"],
    [
      "Next.js 15",
      "Framework full-stack",
      "Unifie frontend et backend dans un seul projet TypeScript. App Router + Server Components = performances et SEO. Alternative Laravel/Django : plus lourd pour une SPA moderne ; React seul : pas de routage/API intégrés.",
    ],
    [
      "React 19",
      "Interface utilisateur",
      "Standard de l'écosystème web, composants réutilisables, large communauté. Alternative Vue/Angular : moins d'offres et d'intégrations avec Next.js.",
    ],
    [
      "TypeScript",
      "Typage statique",
      "Réduit les erreurs à la compilation, indispensable pour un modèle métier complexe (tontines, prêts, caisses).",
    ],
    [
      "Node.js 20+",
      "Runtime serveur",
      "Même langage (JavaScript/TS) côté client et serveur. Exécute Next.js, Prisma CLI et les scripts de build.",
    ],
    [
      "Prisma ORM",
      "Accès base de données",
      "Schéma typé, migrations versionnées, requêtes paramétrées (anti-injection SQL). Alternative SQL brut : plus risqué ; TypeORM : moins ergonomique avec TypeScript.",
    ],
    [
      "Supabase",
      "Auth + PostgreSQL",
      "Authentification clé en main (email/mot de passe, OTP), hébergement Postgres managé. Alternative Firebase : NoSQL moins adapté aux transactions financières ; auth maison : plus long et risqué.",
    ],
    [
      "Tailwind CSS",
      "Mise en forme",
      "Utility-first, cohérent avec le design system, responsive rapide. Alternative Bootstrap : moins personnalisable.",
    ],
    [
      "shadcn/ui + Radix",
      "Composants UI",
      "Accessibles (ARIA), personnalisables, pas de dépendance lourde. Radix gère dialogs, menus, formulaires.",
    ],
    [
      "Zod",
      "Validation",
      "Valide les entrées utilisateur côté serveur avant toute écriture en base.",
    ],
    [
      "Vercel",
      "Hébergement",
      "Déploiement automatique depuis GitHub, CDN, HTTPS, adapté à Next.js.",
    ],
    [
      "GitHub Actions",
      "CI",
      "Lint + build à chaque push/PR pour détecter les régressions avant déploiement.",
    ],
  ]),

  // 4
  h1("4. Fonctionnement global de l'application"),
  h2("4.1 Parcours utilisateur"),
  bullet("Visiteur : page d'accueil publique, inscription, connexion."),
  bullet("Membre connecté : tableau de bord, liste « Mes groupes », accès au détail d'un groupe."),
  bullet("Rejoindre un groupe : via lien d'invitation (code unique) ou demande d'adhésion."),
  bullet("Dans un groupe : navigation par modules (Aperçu, Membres, Cycles, Rubriques, Épargne, Prêts, Réunions, Finances)."),
  h2("4.2 Modules métier essentiels"),
  specTable([
    ["Module", "Fonction", "Point technique clé"],
    [
      "Groupes",
      "Créer/gérer une tontine, devise (XAF), lien d'invitation",
      "Le créateur devient ADMIN automatiquement",
    ],
    [
      "Membres",
      "Liste, rôles, statut d'adhésion, indicateur VERT/ORANGE/ROUGE",
      "Statut calculé selon retards et amendes (lib/membre-statut.ts)",
    ],
    [
      "Invitations",
      "Générer des codes, rejoindre un groupe",
      "Réservé aux ADMIN",
    ],
    [
      "Cycles",
      "Tontine rotative : tours, ordre de passage, cotisations, distributions",
      "CycleParticipant, Cotisations, Versements ; échanges d'ordre possibles",
    ],
    [
      "Rubriques",
      "Contributions ponctuelles ou récurrentes (hors cycle)",
      "Caisse dédiée par rubrique, paiements par membre",
    ],
    [
      "Paiements",
      "Mobile Money (Orange / MTN)",
      "Initiation → simulation → finalisation ; journal financier mis à jour",
    ],
    [
      "Épargne",
      "Compte d'épargne par membre, dépôts/retraits",
      "Peut servir de garantie pour les prêts",
    ],
    [
      "Prêts",
      "Demande, avalistes, remboursements, paramètres groupe",
      "Workflow avec statuts (EN_ATTENTE, APPROUVE, etc.)",
    ],
    [
      "Réunions",
      "Planification, présences, amendes d'absence",
      "Rappels automatiques via cron (CRON_SECRET)",
    ],
    [
      "Finances",
      "Journal des mouvements, caisses (générale, cycle, rubrique…)",
      "Chaque opération passe par recordMouvementFinancier",
    ],
  ]),

  // 5
  h1("5. Modèle de données (résumé)"),
  body(
    "La base PostgreSQL contient une trentaine de tables. L'identifiant utilisateur (id_user) est le même UUID que dans Supabase Auth. Les relations principales :",
  ),
  bullet("User ↔ MembreGroupe ↔ Groupes (many-to-many avec rôle et statut)."),
  bullet("Groupes → CycleTontine → CycleParticipant, Cotisations, Versement, Penalite."),
  bullet("Groupes → RubriqueCotisation → PaiementRubrique."),
  bullet("Groupes → CaisseFinanciere → MouvementFinancier (journal comptable)."),
  bullet("MembreGroupe → CompteEpargne → MouvementEpargne."),
  bullet("Groupes → Pret → AvalistePret, MouvementPret."),
  bullet("PaymentTransaction : trace chaque tentative de paiement Mobile Money."),
  body(
    "Les migrations Prisma (dossier prisma/migrations/) versionnent l'évolution du schéma. Prisma génère un client TypeScript typé dans lib/generated/prisma.",
  ),

  // 6
  h1("6. Design system E-Tontine"),
  body(
    "Le design system est défini dans app/globals.css et tailwind.config.js. Il assure une identité visuelle cohérente sur toute l'application.",
  ),
  h3("Couleurs principales"),
  bullet("Primaire : vert #006b2c (confiance, épargne, croissance)."),
  bullet("Secondaire : bleu #4059aa (actions, liens)."),
  bullet("Fond : vert très clair #f4fcf0 (lisibilité, ambiance communautaire)."),
  bullet("Sidebar : bleu marine #00164e (navigation persistante)."),
  bullet("Sémantiques : rouge erreur, orange avertissement."),
  h3("Typographie et composants"),
  bullet("Polices : Inter (texte), Poppins (titres) — chargées dans app/layout.tsx."),
  bullet("Composants : shadcn/ui (style new-york) basés sur Radix UI — boutons, formulaires, dialogs, tableaux, graphiques (Recharts)."),
  bullet("Utilitaire cn() (lib/utils.ts) : fusionne les classes Tailwind sans conflit."),
  bullet("Thème clair par défaut ; mode sombre disponible via next-themes."),
  bullet("Référence visuelle : dossier stitch_e_tontine_design_system/ (maquettes Stitch)."),
  body(
    "Pour le jury : le design system garantit que toutes les pages du groupe (cycles, prêts, finances…) partagent la même charte, ce qui renforce la crédibilité professionnelle de l'application.",
  ),

  // 7
  h1("7. Sécurité de l'application"),
  h2("7.1 Ressources à protéger"),
  specTable([
    ["Ressource", "Risque si exposée", "Protection"],
    [
      "SUPABASE_SERVICE_ROLE_KEY",
      "Accès admin total à Supabase",
      "Variable serveur uniquement, jamais côté client",
    ],
    [
      "DATABASE_URL / DIRECT_URL",
      "Accès direct à PostgreSQL",
      "Secrets Vercel, jamais dans le code source",
    ],
    [
      "CRON_SECRET",
      "Déclenchement abusif des tâches planifiées",
      "Header Authorization Bearer sur /api/cron/*",
    ],
    [
      "Données financières",
      "Fraude, modification de soldes",
      "Transactions Prisma, validation Zod, contrôle des rôles",
    ],
    [
      "Sessions utilisateur",
      "Usurpation d'identité",
      "Cookies HTTP-only Supabase, refresh via middleware",
    ],
    [
      "SMTP (mot de passe email)",
      "Envoi de mails frauduleux",
      "Variables d'environnement serveur",
    ],
  ]),
  h2("7.2 Mécanismes de sécurité"),
  bullet("Authentification Supabase : mot de passe hashé côté Supabase, confirmation email, réinitialisation par OTP."),
  bullet("Middleware (middleware.ts) : bloque /dashboard et /account sans session valide ; redirige vers /auth/login."),
  bullet("Validation Zod (lib/validations.ts) : tout formulaire et corps API est validé avant traitement."),
  bullet("Prisma ORM : requêtes paramétrées — pas d'injection SQL (aucun $queryRaw dans le projet)."),
  bullet("Transactions Prisma (runExtendedTransaction) : opérations financières atomiques (tout réussit ou tout échoue)."),
  bullet("En-têtes HTTP (next.config.ts) : CSP, X-Frame-Options DENY, HSTS en production HTTPS, pas de header X-Powered-By."),
  bullet("Server Actions Next.js : protection CSRF intégrée par le framework."),
  bullet("normalizeNextPath (lib/auth/navigation.ts) : empêche les redirections ouvertes après connexion."),
  h2("7.3 Pourquoi la sécurité est gérée ainsi"),
  body(
    "L'authentification est déléguée à Supabase (spécialiste Auth) pour ne pas réinventer le hachage, les tokens et le refresh. Les autorisations métier restent dans l'application car les règles d'une tontine (qui peut payer pour qui, qui distribue le pot) sont trop fines pour du RLS générique. Le RLS est activé côté Supabase mais sans policies : l'accès passe par Prisma avec la chaîne de connexion serveur, donc c'est le code applicatif qui filtre.",
  ),

  // 8
  h1("8. Gestion des autorisations"),
  h2("8.1 Rôles dans un groupe"),
  specTable([
    ["Rôle", "Code", "Droits principaux"],
    [
      "Administrateur",
      "ADMIN",
      "Invitations, paramètres groupe, paiements sortants, distributions, retraits caisse, gestion complète",
    ],
    [
      "Membre",
      "MEMBRE",
      "Consulter, payer ses cotisations, gérer son épargne, demander un prêt, participer aux réunions",
    ],
  ]),
  body(
    "Important : le rôle est par groupe, pas global. Un utilisateur peut être ADMIN dans le groupe ATW et MEMBRE dans un autre.",
  ),
  h2("8.2 Où les droits sont vérifiés"),
  bullet("Layout groupe (app/dashboard/groups/[groupId]/layout.tsx) : membre actif requis."),
  bullet("Navigation (components/groups/group-nav.tsx) : Invitations et Paramètres masqués si non ADMIN."),
  bullet("API Routes : getGroupMembership / requireAdmin (lib/pret-auth.ts) en début de handler."),
  bullet("Paiements : canInitiatePayment (lib/payment-auth.ts) — un membre ne paie que pour lui ; l'admin peut payer pour d'autres et gère les sorties de caisse."),
  bullet("Server Actions rubriques : requireGroupAdmin (lib/actions/rubriques.ts)."),
  bullet("Accès transaction : canAccessPaymentTransaction (lib/payment-access.ts) — propriétaire, initiateur ou admin."),
  h2("8.3 Statuts membres"),
  bullet("ACTIF / INACTIF / EN_ATTENTE : adhésion au groupe."),
  bullet("VERT / ORANGE / ROUGE (statut_visuel) : indicateur de régularité (retards cotisations, amendes réunion, rubriques impayées)."),
  body(
    "Réponse type jury : « La sécurité n'est pas seulement login/mot de passe ; chaque action vérifie que l'utilisateur est membre actif du bon groupe et, si nécessaire, administrateur. »",
  ),

  // 9
  h1("9. Flux techniques à connaître"),
  h2("9.1 Connexion"),
  body("Inscription → Supabase crée le compte → email de confirmation → callback échange le code → cookie session → upsert ligne users dans Prisma."),
  h2("9.2 Paiement Mobile Money"),
  body("POST /api/groups/[id]/payments/initiate → création PaymentTransaction → simulation délai/failure → finalizePaymentTransaction → écriture journal financier + mise à jour cotisation/rubrique/épargne selon le contexte."),
  h2("9.3 Journal financier"),
  body(
    "Toute entrée/sortie d'argent appelle recordMouvementFinancier (lib/financial-journal.ts) : crée ou met à jour une caisse (GENERALE, CYCLE, RUBRIQUE…) et enregistre le mouvement avec source, montant, motif et références.",
  ),

  // 10
  h1("10. Déploiement et exploitation"),
  bullet("Production : Vercel (frontend + API) + Supabase (Auth + PostgreSQL)."),
  bullet("Build : prisma generate && next build (script vercel-build)."),
  bullet("CI GitHub Actions : npm ci, lint, build sur chaque push/PR."),
  bullet("Variables d'environnement configurées dans le dashboard Vercel (jamais commitées)."),
  bullet("Alternative : Docker (Dockerfile standalone) pour auto-hébergement."),
  bullet("Cron réunions : GET /api/cron/reunion-reminders protégé par CRON_SECRET."),

  // 11
  h1("11. Questions fréquentes du jury (réponses courtes)"),
  h3("Pourquoi Next.js et pas une application mobile native ?"),
  body(
    "Une PWA/web responsive couvre ordinateur et smartphone sans maintenir deux codebases. Les tontiniers utilisent souvent un navigateur mobile ; Next.js offre une expérience proche du natif avec un seul dépôt Git.",
  ),
  h3("Pourquoi Prisma si Supabase a déjà PostgreSQL ?"),
  body(
    "Supabase héberge la base ; Prisma fournit un client TypeScript typé, des migrations versionnées et des transactions — indispensable pour la logique financière complexe.",
  ),
  h3("Comment empêcher un membre de voir les données d'un autre groupe ?"),
  body(
    "Chaque requête API inclut groupId ; le serveur vérifie MembreGroupe avec id_user + id_groupe + statut ACTIF. Sans adhésion, réponse 403.",
  ),
  h3("Les paiements Mobile Money sont-ils réels ?"),
  body(
    "En production actuelle, le flux est simulé (lib/payment-simulation.ts) pour la démonstration. L'architecture (initiate → confirm → finalize) est prête pour brancher les API Orange/MTN.",
  ),
  h3("Que se passe-t-il si deux paiements simultanés ?"),
  body(
    "Les écritures financières utilisent des transactions Prisma : soit toutes les opérations réussissent, soit aucune n'est enregistrée — pas de solde incohérent.",
  ),
  h3("Qui peut modifier le rôle d'un membre ?"),
  body("Un ADMIN du groupe, via l'API membres (updateMemberRoleSchema validé par Zod). Un MEMBRE ne peut pas s'auto-promouvoir."),
  h3("Où est stockée la session ?"),
  body("Cookies HTTP-only gérés par @supabase/ssr ; le middleware rafraîchit le token à chaque requête protégée."),
  h3("Comment auditer les opérations financières ?"),
  body(
    "Module Finances : liste des MouvementFinancier avec type, source, montant, date, membre et admin concernés. Chaque paiement laisse une PaymentTransaction.",
  ),

  // 12 — Glossaire
  h1("12. Glossaire des termes techniques"),
  body(
    "Définitions de tous les mots techniques cités dans ce guide et dans le projet E-Tontine. À consulter avant la soutenance pour maîtriser le vocabulaire du jury.",
    { after: 160 },
  ),
  ...glossarySection("12.1 Architecture, réseau et déploiement", GLOSSARY.architecture),
  ...glossarySection("12.2 Stack technologique", GLOSSARY.stack),
  ...glossarySection("12.3 Sécurité", GLOSSARY.securite),
  ...glossarySection("12.4 Base de données", GLOSSARY.donnees),
  ...glossarySection("12.5 Vocabulaire métier (tontine)", GLOSSARY.metier),
  ...glossarySection("12.6 Design et interface", GLOSSARY.design),

  // 13
  h1("13. Synthèse — phrases clés pour la soutenance"),
  bullet("« E-Tontine est une application web full-stack Next.js déployée sur Vercel, avec authentification Supabase et données PostgreSQL via Prisma. »"),
  bullet("« L'architecture est en trois tiers : navigateur, serveur Next.js, base Supabase. »"),
  bullet("« La sécurité combine auth managée, validation Zod, transactions atomiques et contrôle des rôles ADMIN/MEMBRE par groupe. »"),
  bullet("« Le journal financier centralise toutes les opérations d'argent dans des caisses typées. »"),
  bullet("« Le design system vert/bleu assure une interface cohérente et professionnelle. »"),
  bullet("« Les modules couvrent le cycle de vie complet d'une tontine : adhésion, cycles, épargne, prêts, réunions et paiements. »"),
  body(
    "Document généré automatiquement à partir du code source E-Tontine — juin 2026.",
    { italic: true, center: true, after: 200 },
  ),
];

const doc = new Document({
  sections: [{ properties: {}, children }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`Guide généré : ${OUT}`);
