#!/usr/bin/env node
/**
 * Prépare un compte dédié aux captures d'écran (Supabase Admin + Prisma).
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../lib/generated/prisma/index.js";

const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? "screenshots-internal@etontine.dev";
const PASSWORD = process.env.SCREENSHOT_USER_PASSWORD ?? "ScreenshotCapture2026!";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  console.error("Variables Supabase admin manquantes.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prisma = new PrismaClient();

async function ensureUser() {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  let user = list?.users?.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nom: "Capture", prenom: "Screenshots" },
    });
    if (error) throw new Error(error.message);
    user = data.user;
    console.error("Compte capture créé.");
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    console.error("Compte capture mis à jour.");
  }

  const phone = `+2376${String(user.id).replace(/\D/g, "").slice(0, 8).padEnd(8, "0")}`;
  await prisma.user.upsert({
    where: { id_user: user.id },
    update: { email: EMAIL, nom: "Capture", prenom: "Screenshots", telephone: phone },
    create: {
      id_user: user.id,
      email: EMAIL,
      nom: "Capture",
      prenom: "Screenshots",
      telephone: phone,
    },
  });

  const group =
    (await prisma.groupes.findFirst({ orderBy: { date_de_creation: "asc" } })) ??
    (await prisma.groupes.create({
      data: { nom: "Groupe démo captures", description: "Groupe pour captures d'écran" },
    }));

  await prisma.membreGroupe.upsert({
    where: { id_user_id_groupe: { id_user: user.id, id_groupe: group.id_groupe } },
    update: { role: "ADMIN", statut_adhesion: "ACTIF" },
    create: {
      id_user: user.id,
      id_groupe: group.id_groupe,
      role: "ADMIN",
      statut_adhesion: "ACTIF",
    },
  });

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_groupe: group.id_groupe },
    orderBy: { date_debut: "desc" },
    select: { id_cycle: true },
  });

  console.log(
    JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      groupId: group.id_groupe,
      cycleId: cycle?.id_cycle ?? null,
    }),
  );
}

ensureUser()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
