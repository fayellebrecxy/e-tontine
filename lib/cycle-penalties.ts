import { prisma } from "@/lib/prisma";
import type { ModePenalite } from "@/lib/generated/prisma/client";
import { getCycleTurnSnapshot } from "@/lib/cycle-turns";
import { createNotification } from "@/lib/notifications";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function computePenaltyAmount(
  mode: ModePenalite,
  configuredValue: number,
  montantCotisation: number,
  joursRetard: number,
) {
  if (mode === "FIXE") return configuredValue;
  if (mode === "POURCENTAGE") return roundCurrency((montantCotisation * configuredValue) / 100);
  return roundCurrency(configuredValue * joursRetard);
}

/** Fige les pénalités des retardataires à la clôture d'un tour (versement du pot). */
export async function finalizeTourPenalties(cycleId: string, numeroTour: number) {
  const cycle = await prisma.cycleTontine.findUnique({
    where: { id_cycle: cycleId },
    select: {
      id_cycle: true,
      date_debut: true,
      duree_tour_de_gain: true,
      montant_cotisation: true,
      penalites_activees: true,
      mode_penalite: true,
      valeur_penalite: true,
      versements: { select: { numero_tour: true, date_versement: true } },
      participants: {
        select: {
          id_membre_groupe: true,
          membre_groupe: { select: { statut_adhesion: true, id_user: true, id_groupe: true } },
        },
      },
    },
  });

  if (!cycle || !cycle.penalites_activees || !cycle.mode_penalite || !cycle.valeur_penalite) {
    return;
  }

  const montantCotisation = Number(cycle.montant_cotisation);
  const configuredValue = Number(cycle.valeur_penalite);
  if (configuredValue <= 0 || montantCotisation <= 0) return;

  const { getTourWindow } = await import("@/lib/cycle-turns");
  const { tourEnd } = getTourWindow(
    {
      date_debut: cycle.date_debut,
      duree_tour_de_gain: cycle.duree_tour_de_gain,
      versements: cycle.versements,
    },
    numeroTour,
  );

  const now = new Date();
  const joursRetard = Math.max(1, Math.ceil((now.getTime() - tourEnd.getTime()) / (24 * 60 * 60 * 1000)));
  if (joursRetard < 1) return;

  const montantPenalite = computePenaltyAmount(
    cycle.mode_penalite,
    configuredValue,
    montantCotisation,
    joursRetard,
  );
  if (montantPenalite <= 0) return;

  const cotisations = await prisma.cotisations.findMany({
    where: { id_cycle: cycleId, numero_tour: numeroTour },
    select: {
      id_cotisation: true,
      id_membre_groupe: true,
      montant: true,
      penalite_appliquee: true,
      montant_penalite: true,
      penalite_collectee: true,
      penalites: { select: { id_penalite: true } },
    },
  });

  const byMember = new Map<string, typeof cotisations>();
  for (const item of cotisations) {
    const list = byMember.get(item.id_membre_groupe) ?? [];
    list.push(item);
    byMember.set(item.id_membre_groupe, list);
  }

  for (const participant of cycle.participants) {
    if (participant.membre_groupe.statut_adhesion !== "ACTIF") continue;

    const memberId = participant.id_membre_groupe;
    const records = byMember.get(memberId) ?? [];
    const totalPaid = records
      .filter((r) => Number(r.montant) > 0)
      .reduce((acc, r) => acc + Number(r.montant), 0);

    if (totalPaid >= montantCotisation) continue;

    const penaltyCollected = records.some((r) => r.penalite_collectee);
    if (penaltyCollected) continue;

    const pendingRecord = records.find(
      (r) =>
        Number(r.montant) === 0 && r.penalite_appliquee && !r.penalite_collectee,
    );

    if (pendingRecord) {
      const existingAmount = Number(pendingRecord.montant_penalite ?? 0);
      if (existingAmount !== montantPenalite && pendingRecord.penalites[0]) {
        await prisma.$transaction(async (tx) => {
          await tx.cotisations.update({
            where: { id_cotisation: pendingRecord.id_cotisation },
            data: { montant_penalite: montantPenalite, date_de_paiement: now },
          });
          await tx.penalite.update({
            where: { id_penalite: pendingRecord.penalites[0].id_penalite },
            data: {
              montant_final: montantPenalite,
              jours_retard: joursRetard,
              date_application: now,
            },
          });
        });
      }
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const created = await tx.cotisations.create({
        data: {
          id_cycle: cycle.id_cycle,
          id_membre_groupe: memberId,
          date_debut: cycle.date_debut,
          date_de_paiement: now,
          numero_tour: numeroTour,
          date_echeance: tourEnd,
          montant: 0,
          penalite_appliquee: true,
          montant_penalite: montantPenalite,
        },
        select: { id_cotisation: true },
      });

      await tx.penalite.create({
        data: {
          id_cotisation: created.id_cotisation,
          id_membre_groupe: memberId,
          montant_base: configuredValue,
          motif: "Retard de cotisation — clôture du tour",
          taux_augmentation_heure: 0,
          seuil_heure_augmentation: 24,
          date_application: now,
          montant_final: montantPenalite,
          mode_penalite: cycle.mode_penalite,
          valeur_configuree: configuredValue,
          jours_retard: joursRetard,
          date_echeance: tourEnd,
        },
      });

      await createNotification({
        userId: participant.membre_groupe.id_user,
        groupId: participant.membre_groupe.id_groupe,
        type: "PENALITE_APPLIQUEE",
        message: `Pénalité de ${montantPenalite.toLocaleString("fr-FR")} appliquée pour retard au tour ${numeroTour} (${joursRetard} jour(s) de retard).`,
      });
    });
  }
}

export async function applyAutomaticOverduePenalties(cycleId: string) {
  const cycle = await prisma.cycleTontine.findUnique({
    where: { id_cycle: cycleId },
    select: {
      id_cycle: true,
      date_debut: true,
      date_fin: true,
      duree_tour_de_gain: true,
      montant_cotisation: true,
      penalites_activees: true,
      mode_penalite: true,
      valeur_penalite: true,
      participants: {
        select: {
          id_membre_groupe: true,
          membre_groupe: { select: { statut_adhesion: true } },
        },
      },
    },
  });

  if (!cycle) return;
  if (!cycle.penalites_activees || !cycle.mode_penalite || !cycle.valeur_penalite) return;

  const now = new Date();
  if (now <= cycle.date_debut || cycle.date_fin <= cycle.date_debut) return;

  const snapshot = await getCycleTurnSnapshot(cycleId);
  if (!snapshot.activeTour || !snapshot.activeTourEnd) return;

  // Pénalité uniquement à partir du lendemain de l'échéance, tour actif non encore clos.
  if (!snapshot.isPastDue) return;
  const activeParticipants = cycle.participants
    .filter((item) => item.membre_groupe.statut_adhesion === "ACTIF")
    .map((item) => item.id_membre_groupe);

  if (activeParticipants.length === 0) return;

  const montantCotisation = Number(cycle.montant_cotisation);
  const configuredValue = Number(cycle.valeur_penalite);
  if (configuredValue <= 0 || montantCotisation <= 0) return;

  const dateEcheance = snapshot.activeTourEnd;

  const joursRetard = Math.max(
    1,
    Math.ceil((now.getTime() - dateEcheance.getTime()) / ONE_DAY_MS),
  );

  // Récupérer les cotisations existantes pour ce tour
  const cotisations = await prisma.cotisations.findMany({
    where: {
      id_cycle: cycleId,
      id_membre_groupe: { in: activeParticipants },
      numero_tour: snapshot.activeTour,
    },
    select: {
      id_cotisation: true,
      id_membre_groupe: true,
      montant: true,
      penalite_appliquee: true,
      montant_penalite: true,
      penalite_collectee: true,
      penalites: { select: { id_penalite: true } },
    },
  });

  const byMember = new Map<string, typeof cotisations>();
  for (const item of cotisations) {
    const list = byMember.get(item.id_membre_groupe) ?? [];
    list.push(item);
    byMember.set(item.id_membre_groupe, list);
  }

  // Traiter chaque membre indépendamment pour éviter qu'une erreur bloque les autres
  for (const memberId of activeParticipants) {
    try {
      const records = byMember.get(memberId) ?? [];
      const totalPaid = records.reduce((acc, item) => {
        const amount = Number(item.montant);
        return amount > 0 ? acc + amount : acc;
      }, 0);

      // Membre déjà entièrement payé → pas de pénalité
      if (totalPaid >= montantCotisation) continue;

      const montantPenalite = computePenaltyAmount(
        cycle.mode_penalite!,
        configuredValue,
        montantCotisation,
        joursRetard,
      );

      if (montantPenalite <= 0) continue;

      const pendingPenaltyRecord = records.find(
        (item) => Number(item.montant) === 0 && item.penalite_appliquee && !item.penalite_collectee,
      );

      if (pendingPenaltyRecord) {
        // Mettre à jour la pénalité si le montant a changé (pénalité progressive par jour)
        const existingAmount = Number(pendingPenaltyRecord.montant_penalite ?? 0);
        if (existingAmount !== montantPenalite) {
          await prisma.$transaction(async (tx) => {
            await tx.cotisations.update({
              where: { id_cotisation: pendingPenaltyRecord.id_cotisation },
              data: { montant_penalite: montantPenalite, date_de_paiement: now },
            });
            if (pendingPenaltyRecord.penalites[0]?.id_penalite) {
              await tx.penalite.update({
                where: { id_penalite: pendingPenaltyRecord.penalites[0].id_penalite },
                data: {
                  montant_final: montantPenalite,
                  jours_retard: joursRetard,
                  date_application: now,
                  valeur_configuree: configuredValue,
                },
              });
            }
          });
        }
        continue;
      }

      // Créer un enregistrement "pénalité seule" : montant = 0, pénalité = montantPenalite
      await prisma.$transaction(async (tx) => {
        const created = await tx.cotisations.create({
          data: {
            id_cycle: cycle.id_cycle,
            id_membre_groupe: memberId,
            date_debut: cycle.date_debut,
            date_de_paiement: now,
            numero_tour: snapshot.activeTour!,
            date_echeance: dateEcheance,
            montant: 0,
            penalite_appliquee: true,
            montant_penalite: montantPenalite,
          },
          select: { id_cotisation: true },
        });

        await tx.penalite.create({
          data: {
            id_cotisation: created.id_cotisation,
            id_membre_groupe: memberId,
            montant_base: configuredValue,
            motif: "Retard de paiement détecté automatiquement",
            taux_augmentation_heure: 0,
            seuil_heure_augmentation: 24,
            date_application: now,
            montant_final: montantPenalite,
            mode_penalite: cycle.mode_penalite,
            valeur_configuree: configuredValue,
            jours_retard: joursRetard,
            date_echeance: dateEcheance,
          },
        });

        // Notifier le membre
        const member = await tx.membreGroupe.findUnique({
          where: { id_membre_groupe: memberId },
          select: { id_user: true, id_groupe: true },
        });
        if (member) {
          await createNotification({
            userId: member.id_user,
            groupId: member.id_groupe,
            type: "PENALITE_APPLIQUEE",
            message: `Pénalité de ${montantPenalite.toLocaleString("fr-FR")} appliquée pour retard de cotisation — Tour ${snapshot.activeTour} (${joursRetard} jour(s) de retard).`,
          });
        }
      });
    } catch {
      // Erreur silencieuse par membre pour ne pas bloquer le chargement de la page
      // (ex: conflit de contrainte si deux onglets chargent simultanément)
    }
  }
}
