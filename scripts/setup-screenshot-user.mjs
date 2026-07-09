#!/usr/bin/env node
/**
 * Résout le contexte de capture (compte et groupe réels) — sans créer de données fictives.
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/index.js";

const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? "fayellefouedjio@gmail.com";
const DEFAULT_GROUP_ID = "7c9ec4ca-703b-4c9d-afa5-242087b66e31";

const prisma = new PrismaClient();

async function resolveContext() {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: {
      id_user: true,
      prenom: true,
      nom: true,
      memberships: {
        where: { statut_adhesion: "ACTIF" },
        select: {
          id_membre_groupe: true,
          id_groupe: true,
          role: true,
          groupe: { select: { nom: true } },
        },
      },
    },
  });

  if (!user) {
    throw new Error(`Utilisateur introuvable : ${EMAIL}`);
  }

  const groupId =
    process.env.SCREENSHOT_GROUP_ID?.trim() ||
    user.memberships.find((m) => m.id_groupe === DEFAULT_GROUP_ID)?.id_groupe ||
    user.memberships[0]?.id_groupe;

  if (!groupId) {
    throw new Error(`Aucun groupe actif pour ${EMAIL}`);
  }

  const membership = user.memberships.find((m) => m.id_groupe === groupId);
  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_groupe: groupId },
    orderBy: { date_debut: "desc" },
    select: { id_cycle: true, nom_cycle: true },
  });

  const rubrique = await prisma.rubriqueCotisation.findFirst({
    where: { id_groupe: groupId },
    select: { id_rubrique: true, nom: true },
  });

  console.error(
    `Capture : ${user.prenom} ${user.nom} — groupe « ${membership?.groupe.nom ?? groupId} »`,
  );

  console.log(
    JSON.stringify({
      email: EMAIL,
      password: process.env.SCREENSHOT_USER_PASSWORD ?? null,
      groupId,
      cycleId: cycle?.id_cycle ?? null,
      rubriqueId: rubrique?.id_rubrique ?? null,
      groupName: membership?.groupe.nom ?? null,
    }),
  );
}

resolveContext()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
