import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGroupSchema, normalizeEmail, normalizeName, normalizePhone } from "@/lib/validations";
import { Prisma } from "@/lib/generated/prisma/client";

function generateInviteCode() {
  // 16 bytes => 22 chars base64url-ish (no + / =)
  return crypto.randomBytes(16).toString("base64url");
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const parsedBody = createGroupSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const authUser = data.user;

  const existing = await prisma.user.findUnique({
    where: { id_user: authUser.id },
    select: { id_user: true },
  });
  if (!existing) {
    const meta = authUser.user_metadata ?? {};
    const fullName =
      firstNonEmptyString(meta.full_name, meta.name, meta.display_name)?.trim() ?? null;
    const [fullNamePrenom, ...fullNameNomParts] = fullName ? fullName.split(/\s+/) : [];

    const prenom = normalizeName(
      firstNonEmptyString(meta.prenom, meta.first_name, fullNamePrenom) ?? "",
    );
    const nom = normalizeName(
      firstNonEmptyString(meta.nom, meta.last_name, meta.family_name, fullNameNomParts.join(" ")) ??
        "",
    );
    const email = authUser.email ? normalizeEmail(authUser.email) : null;
    const telephoneRaw = firstNonEmptyString(authUser.phone, meta.telephone, meta.phone);
    const telephone = telephoneRaw ? normalizePhone(telephoneRaw) : null;

    if (!email || !telephone || !nom || !prenom) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Votre profil utilisateur est incomplet. Veuillez compléter vos informations (nom, prénom, téléphone) avant de créer un groupe.",
        },
        { status: 409 },
      );
    }

    try {
      await prisma.user.create({
        data: {
          id_user: authUser.id,
          email,
          nom,
          prenom,
          telephone,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Impossible de créer le profil utilisateur (email ou téléphone déjà utilisé).",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
    }
  }

  const nom = normalizeName(parsedBody.data.nom);
  const description = parsedBody.data.description?.trim();
  const devise = parsedBody.data.devise?.trim().toUpperCase();

  const regles = parsedBody.data.regles?.map((r) => ({
    type_regle: r.type_regle,
    nom_regle: r.nom_regle?.trim() ?? r.type_regle,
    valeur: r.valeur.trim(),
    est_active: r.est_active ?? true,
  }));

  for (let attempt = 0; attempt < 3; attempt++) {
    const inviteCode = generateInviteCode();

    try {
      const groupe = await prisma.groupes.create({
        data: {
          nom,
          description,
          devise: devise || undefined,
          lien_invitation: inviteCode,
          invitations: {
            create: {
              code: inviteCode,
              id_user_createur: authUser.id,
            },
          },
          membres: {
            create: {
              id_user: authUser.id,
              role: "ADMIN",
              statut_adhesion: "ACTIF",
            },
          },
          ...(regles?.length
            ? {
                regles: {
                  create: regles,
                },
              }
            : {}),
        },
        select: {
          id_groupe: true,
          nom: true,
          description: true,
          devise: true,
          lien_invitation: true,
          date_de_creation: true,
          date_mise_a_jour: true,
          membres: {
            where: { id_user: authUser.id },
            select: {
              id_membre_groupe: true,
              role: true,
              statut_adhesion: true,
              statut_visuel: true,
              date_adhesion: true,
            },
          },
          regles: {
            select: {
              id_regle: true,
              type_regle: true,
              nom_regle: true,
              valeur: true,
              est_active: true,
              date_debut_validite: true,
              date_fin_validite: true,
            },
          },
        },
      });

      return NextResponse.json({ ok: true, groupe }, { status: 201 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // Collision on unique invite code -> retry
        continue;
      }

      return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
    }
  }

  return NextResponse.json(
    { ok: false, error: "Failed to generate unique invite code." },
    { status: 500 },
  );
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const authUser = data.user;

  const memberships = await prisma.membreGroupe.findMany({
    where: { id_user: authUser.id },
    include: {
      groupe: true,
    },
    orderBy: { date_adhesion: "desc" },
  });

  const groups = memberships.map((m) => ({
    membership: {
      id_membre_groupe: m.id_membre_groupe,
      role: m.role,
      statut_adhesion: m.statut_adhesion,
      statut_visuel: m.statut_visuel,
      date_adhesion: m.date_adhesion,
      date_depart: m.date_depart,
    },
    groupe: {
      id_groupe: m.groupe.id_groupe,
      nom: m.groupe.nom,
      description: m.groupe.description,
      devise: m.groupe.devise,
      lien_invitation: m.groupe.lien_invitation,
      date_de_creation: m.groupe.date_de_creation,
      date_mise_a_jour: m.groupe.date_mise_a_jour,
    },
  }));

  return NextResponse.json(
    {
      ok: true,
      groups,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
