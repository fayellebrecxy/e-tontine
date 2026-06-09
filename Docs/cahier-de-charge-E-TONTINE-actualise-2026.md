# Cahier des charges actualise - E-Tontine

Date de mise a jour : 08 juin 2026

Ce document remplace fonctionnellement le cahier des charges initial pour la version actuelle de l'application E-Tontine. Il tient compte des modules ajoutes apres la premiere conception : invitations, reintegration, cycles avances, penalites, distributions, rubriques de cotisation, reunions, amendes, journal financier, epargne, notifications, releves PDF et rapports.

## 1. Contexte et problematique

La tontine est un mecanisme d'epargne collective tres repandu au Cameroun et en Afrique subsaharienne. Dans sa forme traditionnelle, les membres cotisent regulierement et recoivent a tour de role la somme collectee. Cette organisation repose souvent sur des registres papier, des calculs manuels et des echanges informels, ce qui expose les groupes a des erreurs, oublis, conflits et pertes de transparence.

Les outils generalistes comme WhatsApp ou Excel ne permettent pas de gerer correctement les cycles, les penalites, les historiques individuels, les distributions ou les reunions. Certaines applications specialisees existent, mais elles restent parfois complexes, payantes ou peu adaptees aux regles propres de chaque association.

E-Tontine propose une application web accessible depuis un navigateur, concue pour numeriser la gestion d'un groupe de tontine tout en conservant la flexibilite des regles locales. L'objectif est de fournir un outil simple, transparent et securise, ou les administrateurs pilotent l'organisation et ou les membres peuvent consulter leur situation en temps reel.

Problematique : comment concevoir et developper une application web permettant aux groupes de tontine de gerer leurs membres, cycles, cotisations, penalites, distributions, reunions, rubriques, epargne et historiques financiers, tout en garantissant la transparence, la tracabilite et un acces adapte aux roles de chaque utilisateur ?

## 2. Objectifs du projet

### Objectif general

Developper une application web de gestion de tontines communautaires permettant aux administrateurs et membres de suivre les activites financieres et organisationnelles d'un groupe de maniere fiable, centralisee et transparente.

### Objectifs specifiques

- Permettre l'inscription, la connexion, la deconnexion, la reinitialisation du mot de passe et la mise a jour du profil.
- Permettre la creation et la configuration de groupes de tontine.
- Integrer les membres par lien ou code d'invitation.
- Gerer les roles ADMIN et MEMBRE au sein de chaque groupe.
- Gerer l'exclusion, la demande de reintegration et la validation par l'administrateur.
- Creer des cycles de tontine avec participants, ordre de passage, duree des tours et montant de cotisation.
- Enregistrer les cotisations et appliquer les penalites de retard selon un mode fixe, pourcentage ou progressif.
- Gerer les demandes d'echange de tour entre participants, avec validation selon le processus prevu.
- Enregistrer les versements du pot aux beneficiaires et suivre la tresorerie du cycle.
- Creer des rubriques de cotisation ponctuelles ou recurrentes, suivre les paiements et les retraits.
- Planifier les reunions, enregistrer les presences, gerer les excuses, appliquer les amendes et suivre la caisse des amendes.
- Ouvrir et administrer des comptes d'epargne individuels par membre, avec depots, retraits, signalements et cloture.
- Centraliser les mouvements financiers dans un journal et des caisses dediees.
- Envoyer des notifications internes aux membres concernes.
- Generer des releves PDF individuels et des rapports groupe PDF/Excel.

## 3. Acteurs

### Utilisateur non authentifie

- Consulte la page publique.
- Cree un compte.
- Se connecte.
- Demande une reinitialisation de mot de passe.
- Ouvre un lien d'invitation.

### Membre

- Consulte ses groupes.
- Consulte le tableau de bord d'un groupe.
- Consulte les cycles auxquels il participe.
- Consulte son ordre de passage, ses cotisations, penalites, distributions et releves.
- Consulte les rubriques qui le concernent.
- Consulte les reunions et signale une absence avant la reunion.
- Consulte son compte d'epargne et peut signaler un mouvement.
- Lit et supprime ses notifications.
- Masque certains historiques dans son interface.

### Administrateur de groupe

- Cree et modifie un groupe.
- Genere, consulte, revoque et partage les invitations.
- Gere les membres, les roles, exclusions et reintegrations.
- Cree, modifie, relance, supprime et cloture les cycles.
- Gere l'ordre de passage et les demandes d'echange.
- Enregistre les cotisations, penalites et versements du pot.
- Gere les rubriques, paiements, retraits et versements associes.
- Planifie les reunions, enregistre les presences et encaisse les amendes.
- Gere la caisse des amendes et les retraits.
- Ouvre et administre les comptes d'epargne.
- Consulte le journal financier et exporte les rapports.

## 4. Besoins fonctionnels

### Module 1 - Authentification et profil

- Creation de compte avec nom, prenom, telephone, email et mot de passe.
- Connexion par email et mot de passe.
- Gestion des sessions serveur via Supabase Auth.
- Reinitialisation et mise a jour du mot de passe.
- Modification du profil : nom, prenom, telephone, photo.
- Deconnexion.

### Module 2 - Groupes, membres et invitations

- Creation d'un groupe avec nom, description et devise.
- Attribution automatique du role ADMIN au createur.
- Generation d'un code/lien d'invitation.
- Adhesion par lien d'invitation.
- Liste des membres avec role, statut d'adhesion et statut visuel.
- Changement de role par un administrateur.
- Protection contre la suppression du dernier administrateur.
- Exclusion d'un membre.
- Demande et validation de reintegration.

### Module 3 - Cycles de tontine

- Creation d'un cycle avec nom, date de debut, date de fin, duree de tour, montant de cotisation et participants.
- Definition manuelle ou tiree au sort de l'ordre des beneficiaires.
- Consultation de l'ordre de passage.
- Modification de l'ordre par l'administrateur.
- Demande d'echange de tour entre membres et validation.
- Enregistrement de cotisations par tour actif.
- Calcul du reste a payer par membre et par tour.
- Application des penalites de retard.
- Collecte des penalites et retrait de la caisse des penalites.
- Versement du pot au beneficiaire du tour.
- Suivi de la tresorerie du cycle : collecte, penalites, distribution et solde.
- Relance ou cloture de cycle.

### Module 4 - Rubriques de cotisation

- Creation de rubriques ponctuelles ou recurrentes.
- Definition du montant fixe, de la frequence, de la duree et des membres concernes.
- Paiement d'une rubrique.
- Retrait depuis une rubrique.
- Versement du pot associe si necessaire.
- Relance d'une rubrique expiree.
- Notifications d'echeance.

### Module 5 - Reunions et amendes

- Creation, modification, annulation et suppression de reunion.
- Definition du type de reunion, lieu, date, ordre du jour et montant d'amende.
- Signalement d'absence par le membre avant la reunion.
- Enregistrement des presences par l'administrateur : present, absent, excuse ou en retard.
- Cloture de la reunion apres enregistrement des presences.
- Encaissement des amendes d'absence ou de retard.
- Retrait depuis la caisse des amendes de reunion.
- Compte rendu consultable par les membres.

### Module 6 - Epargne

- Ouverture d'un compte d'epargne par membre.
- Creation automatique ou manuelle des comptes.
- Depot et retrait sur un compte actif.
- Blocage, activation, cloture ou suppression selon l'historique.
- Consultation des mouvements d'epargne.
- Signalement d'un mouvement par un membre.
- Audit des comptes et mouvements.

### Module 7 - Suivi financier et rapports

- Creation automatique de caisses financieres : generale, cycle, rubriques, penalites, amendes.
- Journalisation de chaque entree, sortie ou correction financiere.
- Consultation des soldes et mouvements financiers.
- Export d'un rapport groupe en PDF et Excel.
- Generation d'un releve PDF individuel.
- Masquage d'historiques cote utilisateur sans suppression des donnees.

### Module 8 - Notifications

- Notification de creation de cycle.
- Notification de paiement, penalite, versement du pot et changement de role.
- Notification d'invitation, demande de reintegration et validation.
- Notification de reunion, presence, absence, amende et rappel.
- Notification liee aux rubriques et a l'epargne.
- Lecture, suppression unitaire et suppression globale des notifications.

## 5. Besoins non fonctionnels

### Securite

- Les mots de passe sont geres par Supabase Auth et ne sont pas stockes dans la base metier.
- Les routes sensibles verifient l'utilisateur connecte et son appartenance au groupe.
- Les actions d'administration exigent un membre actif avec role ADMIN.
- Les donnees d'un groupe ne sont accessibles qu'aux membres autorises.
- Les variables sensibles sont conservees dans les fichiers d'environnement.

### Performance

- Les operations courantes doivent rester rapides : consultation de tableau de bord, enregistrement de paiement, liste des membres.
- Les pages principales utilisent des requetes ciblees par groupe, membre et role.
- Les exports PDF/Excel sont generes a la demande.

### Accessibilite et ergonomie

- Application responsive pour ordinateur, tablette et smartphone.
- Interface en francais.
- Navigation separee entre vue publique, authentification, tableau de bord, groupes et modules internes.
- Feedback visuel par statut : vert, orange, rouge.

### Maintenabilite

- Architecture Next.js App Router avec composants React, API Routes, Server Actions et Prisma.
- Validation des entrees avec Zod.
- Separation des services metier : notifications, epargne, journal financier, cycles, penalites, rubriques, rappels.
- Schema relationnel centralise dans Prisma.

### Disponibilite et deploiement

- Application prevue pour un deploiement Vercel.
- Base PostgreSQL et authentification via Supabase.
- Compatible avec les navigateurs modernes.

## 6. Contraintes techniques

- Frontend : Next.js, React, Tailwind CSS, composants UI.
- Backend : API Routes et Server Actions Next.js.
- Authentification : Supabase Auth SSR.
- Base de donnees : PostgreSQL via Supabase, acces serveur via Prisma.
- Generation de documents : PDF React, Excel XLSX.
- Versioning : Git et GitHub.
- Environnement : Node.js, npm, VS Code.

## 7. Regles metier principales

- Un utilisateur peut appartenir a plusieurs groupes.
- Le role est propre a chaque groupe, pas global a l'utilisateur.
- Un groupe doit toujours conserver au moins un administrateur actif.
- Un membre exclu devient INACTIF et peut demander une reintegration.
- Seuls les membres ACTIF peuvent participer aux cycles courants.
- Le membre ordinaire ne voit que les cycles auxquels il participe.
- Les cotisations concernent uniquement le tour actif.
- Les penalites de retard peuvent etre fixes, en pourcentage ou progressives.
- Un tour ne peut etre distribue qu'une seule fois.
- Les mouvements financiers importants sont journalises avec solde avant et solde apres.
- Les donnees historisees ne doivent pas etre supprimees lorsqu'elles servent a la tracabilite financiere.

## 8. Livrables de conception associes

Les diagrammes actualises sont fournis dans le dossier `Docs` :

- `diagrammes-uml-e-tontine-actualises.md` : ensemble complet des diagrammes en Mermaid.
- `diagrammes-e-tontine/` : sources individuelles `.mmd` et rendus generes si disponibles.
- `MLD-E-TONTINE-actualise.md` : modele logique de donnees actualise.

