#!/usr/bin/env node
/**
 * Retire le compte de capture des groupes réels (hors groupe démo dédié).
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/index.js";

const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? "screenshots-internal@etontine.dev";
const DEMO_GROUP_NAME = "Groupe démo captures";

const prisma = new PrismaClient();

async function main() {
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
    console.log("Aucun compte capture trouvé.");
    return;
  }

  const toRemove = user.memberships.filter((m) => m.groupe.nom !== DEMO_GROUP_NAME);

  if (!toRemove.length) {
    console.log("Aucune adhésion indésirable à retirer.");
    return;
  }

  for (const membership of toRemove) {
    await prisma.membreGroupe.update({
      where: { id_membre_groupe: membership.id_membre_groupe },
      data: { statut_adhesion: "INACTIF", date_depart: new Date() },
    });
    console.log(
      `Retiré de « ${membership.groupe.nom} » (${membership.role}) — ${user.prenom} ${user.nom}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
