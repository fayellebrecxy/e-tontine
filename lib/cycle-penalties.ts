import { prisma } from "@/lib/prisma";
import type { ModePenalite } from "@/lib/generated/prisma/enums";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function computePenaltyAmount(
  mode: ModePenalite,
  configuredValue: number,
  montantCotisation: number,
  joursRetard: number,
) {
  if (mode === "FIXE") return configuredValue;
  if (mode === "POURCENTAGE") return roundCurrency((montantCotisation * configuredValue) / 100);
  return roundCurrency(configuredValue * joursRetard);
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

  const activeParticipants = cycle.participants
    .filter((item) => item.membre_groupe.statut_adhesion === "ACTIF")
    .map((item) => item.id_membre_groupe);

  if (activeParticipants.length === 0) return;

  const totalTours = activeParticipants.length;
  const montantCotisation = Number(cycle.montant_cotisation);
  const configuredValue = Number(cycle.valeur_penalite);
  if (configuredValue <= 0 || montantCotisation <= 0) return;

  const cotisations = await prisma.cotisations.findMany({
    where: { id_cycle: cycleId, id_membre_groupe: { in: activeParticipants } },
    select: {
      id_cotisation: true,
      id_membre_groupe: true,
      numero_tour: true,
      montant: true,
      penalite_appliquee: true,
      montant_penalite: true,
      penalites: {
        select: {
          id_penalite: true,
        },
      },
    },
  });

  const byMemberAndTour = new Map<string, typeof cotisations>();
  for (const item of cotisations) {
    if (!item.numero_tour) continue;
    const key = `${item.id_membre_groupe}:${item.numero_tour}`;
    const list = byMemberAndTour.get(key) ?? [];
    list.push(item);
    byMemberAndTour.set(key, list);
  }

  await prisma.$transaction(async (tx) => {
    for (const memberId of activeParticipants) {
      for (let tour = 1; tour <= totalTours; tour += 1) {
        const dateEcheance = addDays(cycle.date_debut, cycle.duree_tour_de_gain * (tour - 1));
        if (now <= dateEcheance) continue;

        const key = `${memberId}:${tour}`;
        const records = byMemberAndTour.get(key) ?? [];
        const totalPaid = records.reduce((acc, item) => {
          const amount = Number(item.montant);
          return amount > 0 ? acc + amount : acc;
        }, 0);

        if (totalPaid >= montantCotisation) continue;

        const joursRetard = Math.max(
          1,
          Math.ceil((now.getTime() - dateEcheance.getTime()) / ONE_DAY_MS),
        );
        const montantPenalite = computePenaltyAmount(
          cycle.mode_penalite!,
          configuredValue,
          montantCotisation,
          joursRetard,
        );

        const pendingPenaltyRecord = records.find(
          (item) => Number(item.montant) === 0 && item.penalite_appliquee,
        );

        if (pendingPenaltyRecord) {
          if (Number(pendingPenaltyRecord.montant_penalite ?? 0) !== montantPenalite) {
            await tx.cotisations.update({
              where: { id_cotisation: pendingPenaltyRecord.id_cotisation },
              data: {
                montant_penalite: montantPenalite,
                date_de_paiement: now,
                date_echeance: dateEcheance,
              },
            });

            if (pendingPenaltyRecord.penalites[0]?.id_penalite) {
              await tx.penalite.update({
                where: { id_penalite: pendingPenaltyRecord.penalites[0].id_penalite },
                data: {
                  montant_final: montantPenalite,
                  jours_retard: joursRetard,
                  date_application: now,
                  date_echeance: dateEcheance,
                  valeur_configuree: configuredValue,
                },
              });
            }
          }

          continue;
        }

        const created = await tx.cotisations.create({
          data: {
            id_cycle: cycle.id_cycle,
            id_membre_groupe: memberId,
            date_debut: cycle.date_debut,
            date_de_paiement: now,
            numero_tour: tour,
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
            motif: "Retard de paiement detecte automatiquement",
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
      }
    }
  });
}
