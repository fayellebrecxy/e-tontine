import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { RubriquesClient } from "@/components/rubriques/rubriques-client";
import { sendRubriqueEcheanceReminders } from "@/lib/rubrique-reminders";

export const dynamic = "force-dynamic";

export default async function RubriquesPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const membership = await prisma.membreGroupe.findUnique({
    where: {
      id_user_id_groupe: {
        id_user: user.id,
        id_groupe: groupId,
      },
    },
    include: {
      user: true,
    },
  });

  if (!membership || membership.statut_adhesion !== "ACTIF") {
    notFound();
  }

  await sendRubriqueEcheanceReminders(groupId);

  const isAdmin = membership.role === "ADMIN";

  const rubriques = await prisma.rubriqueCotisation.findMany({
    where: { id_groupe: groupId },
    include: {
      membres_concernes: {
        where: isAdmin ? undefined : { id_membre_groupe: membership.id_membre_groupe },
        include: {
          membre: {
            include: {
              user: true,
            },
          },
        },
      },
      paiements: {
        where: isAdmin ? undefined : { id_membre_groupe: membership.id_membre_groupe },
        include: {
          membre: {
            include: {
              user: true,
            },
          },
        },
      },
      retraits: isAdmin
        ? {
            include: {
              valideur: {
                include: {
                  user: true,
                },
              },
            },
          }
        : false,
    },
    orderBy: { date_creation: "desc" },
  });

  const members = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
    include: {
      user: true,
    },
  });

  return (
    <RubriquesClient
      groupId={groupId}
      rubriques={rubriques}
      members={members}
      isAdmin={isAdmin}
      adminId={membership.id_membre_groupe}
    />
  );
}
