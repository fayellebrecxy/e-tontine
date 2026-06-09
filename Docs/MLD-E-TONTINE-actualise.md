# MLD actualise - E-Tontine

Date de mise a jour : 08 juin 2026

Ce MLD est aligne sur le schema Prisma actuel. Il remplace l'ancien MLD qui rattachait encore certains champs de groupe et de role directement a `user`.

## Tables principales

`users`(
`id_user` PK,
`nom`,
`prenom`,
`email` UNIQUE,
`telephone` UNIQUE,
`photo_de_profil`,
`date_creation`,
`date_mise_a_jour`
)

`groupes`(
`id_groupe` PK,
`nom`,
`description`,
`devise`,
`lien_invitation` UNIQUE,
`date_de_creation`,
`date_mise_a_jour`
)

`membres_groupe`(
`id_membre_groupe` PK,
`role`,
`statut_adhesion`,
`date_adhesion`,
`date_depart`,
`statut_visuel`,
`id_user` FK -> `users.id_user`,
`id_groupe` FK -> `groupes.id_groupe`,
UNIQUE(`id_user`, `id_groupe`)
)

`invitations_groupe`(
`id_invitation` PK,
`code` UNIQUE,
`date_creation`,
`date_revocation`,
`id_groupe` FK -> `groupes.id_groupe`,
`id_user_createur` FK -> `users.id_user`
)

## Cycles et tontine rotative

`cycles_tontine`(
`id_cycle` PK,
`nom_cycle`,
`date_debut`,
`date_fin`,
`duree_tour_de_gain`,
`ordre_beneficiaire`,
`montant_cotisation`,
`penalites_activees`,
`mode_penalite`,
`valeur_penalite`,
`id_groupe` FK -> `groupes.id_groupe`
)

`cycles_participants`(
`id_cycle_participant` PK,
`ordre`,
`date_ajout`,
`id_cycle` FK -> `cycles_tontine.id_cycle`,
`id_membre_groupe` FK -> `membres_groupe.id_membre_groupe`,
UNIQUE(`id_cycle`, `id_membre_groupe`)
)

`cotisations`(
`id_cotisation` PK,
`date_debut`,
`montant`,
`date_de_paiement`,
`numero_tour`,
`date_echeance`,
`penalite_appliquee`,
`montant_penalite`,
`penalite_collectee`,
`id_membre_groupe` FK -> `membres_groupe.id_membre_groupe`,
`id_cycle` FK -> `cycles_tontine.id_cycle`
)

`penalites`(
`id_penalite` PK,
`montant_base`,
`motif`,
`taux_augmentation_heure`,
`seuil_heure_augmentation`,
`date_application`,
`montant_final`,
`mode_penalite`,
`valeur_configuree`,
`jours_retard`,
`date_echeance`,
`id_membre_groupe` FK -> `membres_groupe.id_membre_groupe`,
`id_cotisation` FK -> `cotisations.id_cotisation`
)

`versements`(
`id_versement` PK,
`id_cycle` FK -> `cycles_tontine.id_cycle`,
`id_beneficiaire` FK -> `membres_groupe.id_membre_groupe`,
`numero_tour`,
`montant_verse`,
`date_versement`,
`mode_versement`,
`reference_externe`,
`id_admin_valideur` FK -> `membres_groupe.id_membre_groupe`
)

`demandes_echange`(
`id_demande` PK,
`id_cycle` FK -> `cycles_tontine.id_cycle`,
`id_demandeur` FK -> `membres_groupe.id_membre_groupe`,
`id_cible` FK -> `membres_groupe.id_membre_groupe`,
`tour_demandeur`,
`tour_cible`,
`statut`,
`note`,
`date_demande`,
`date_reponse`
)

## Rubriques

`rubriques_cotisation`(
`id_rubrique` PK,
`nom`,
`montant_fixe`,
`duree`,
`est_obligatoire`,
`type_rubrique`,
`frequence`,
`date_debut`,
`date_fin`,
`duree_jours`,
`id_groupe` FK -> `groupes.id_groupe`
)

`membres_rubrique`(
`id_membre_rubrique` PK,
`id_rubrique` FK -> `rubriques_cotisation.id_rubrique`,
`id_membre_groupe` FK -> `membres_groupe.id_membre_groupe`,
UNIQUE(`id_rubrique`, `id_membre_groupe`)
)

`paiements_rubrique`(
`id_paiement` PK,
`id_rubrique` FK -> `rubriques_cotisation.id_rubrique`,
`id_membre_groupe` FK -> `membres_groupe.id_membre_groupe`,
`montant_paye`,
`date_paiement`,
`note`
)

`retraits`(
`id_retrait` PK,
`montant`,
`motif`,
`date_retrait`,
`id_groupe` FK -> `groupes.id_groupe`,
`id_admin_valideur` FK -> `membres_groupe.id_membre_groupe`,
`id_rubrique` FK -> `rubriques_cotisation.id_rubrique` NULL
)

## Reunions

`reunions`(
`id_reunion` PK,
`id_groupe` FK -> `groupes.id_groupe`,
`titre`,
`description`,
`date_reunion`,
`lieu`,
`type_reunion`,
`statut`,
`montant_amende`,
`compte_rendu`,
`date_creation`,
`date_mise_a_jour`
)

`presences_reunion`(
`id_presence` PK,
`id_reunion` FK -> `reunions.id_reunion`,
`id_membre_groupe` FK -> `membres_groupe.id_membre_groupe`,
`statut_presence`,
`amende_payee`,
`note_absence`,
`date_enregistrement`,
UNIQUE(`id_reunion`, `id_membre_groupe`)
)

`retraits_amendes_reunions`(
`id_retrait_amende` PK,
`id_groupe` FK -> `groupes.id_groupe`,
`id_admin_valideur` FK -> `membres_groupe.id_membre_groupe`,
`montant`,
`motif`,
`date_retrait`
)

## Epargne

`comptes_epargne`(
`id_compte` PK,
`numero_compte` UNIQUE,
`id_groupe` FK -> `groupes.id_groupe`,
`id_membre_groupe` FK -> `membres_groupe.id_membre_groupe` UNIQUE,
`solde_actuel`,
`statut`,
`date_ouverture`,
`date_mise_a_jour`
)

`mouvements_epargne`(
`id_mouvement` PK,
`id_compte` FK -> `comptes_epargne.id_compte`,
`id_groupe` FK -> `groupes.id_groupe`,
`id_membre_groupe` FK -> `membres_groupe.id_membre_groupe`,
`id_operateur` FK -> `membres_groupe.id_membre_groupe` NULL,
`role_acteur`,
`type_operation`,
`montant`,
`motif`,
`solde_avant`,
`solde_apres`,
`date_operation`
)

`signalements_epargne`(
`id_signalement` PK,
`id_compte` FK -> `comptes_epargne.id_compte`,
`id_mouvement` FK -> `mouvements_epargne.id_mouvement`,
`id_membre_groupe` FK -> `membres_groupe.id_membre_groupe`,
`motif`,
`statut`,
`date_signalement`
)

## Suivi financier et notifications

`caisses_financieres`(
`id_caisse` PK,
`id_groupe` FK -> `groupes.id_groupe`,
`type_caisse`,
`nom`,
`reference_key`,
`id_cycle` FK -> `cycles_tontine.id_cycle` NULL,
`id_rubrique` FK -> `rubriques_cotisation.id_rubrique` NULL,
`solde_actuel`,
`date_creation`,
UNIQUE(`id_groupe`, `type_caisse`, `reference_key`)
)

`mouvements_financiers`(
`id_mouvement` PK,
`id_groupe` FK -> `groupes.id_groupe`,
`id_caisse` FK -> `caisses_financieres.id_caisse`,
`type_mouvement`,
`source`,
`montant`,
`motif`,
`solde_avant`,
`solde_apres`,
`id_admin_createur` FK -> `membres_groupe.id_membre_groupe` NULL,
`id_membre_concerne` FK -> `membres_groupe.id_membre_groupe` NULL,
`reference_type`,
`reference_id`,
`statut`,
`date_mouvement`
)

`notifications_groupe`(
`id_notification` PK,
`type_notification`,
`message`,
`date_creation`,
`date_lecture`,
`id_user` FK -> `users.id_user`,
`id_groupe` FK -> `groupes.id_groupe` NULL
)

`historiques_masques`(
`id_masquage` PK,
`id_user` FK -> `users.id_user`,
`scope`,
`target_id`,
`date_masquage`,
UNIQUE(`id_user`, `scope`, `target_id`)
)

