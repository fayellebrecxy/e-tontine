import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReleveMembre } from "@/lib/pdf/releve-membre";
import type { ReleveData } from "@/lib/pdf/releve-membre";

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string; membreId: string }> },
) {
  const { groupId, membreId } = await ctx.params;

  // ─── Auth ───
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Missing env." }, { status: 500 });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ─── Membership de l'appelant ───
  const caller = await prisma.membreGroupe.findFirst({
    where: { id_user: authData.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true },
  });
  if (!caller) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // Seul l'admin ou le membre lui-même peut télécharger
  const isSelf = caller.id_membre_groupe === membreId;
  const isAdmin = caller.role === "ADMIN";
  if (!isSelf && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // ─── Données du membre cible ───
  const membre = await prisma.membreGroupe.findFirst({
    where: { id_membre_groupe: membreId, id_groupe: groupId },
    select: {
      user: { select: { nom: true, prenom: true, email: true, telephone: true } },
      groupe: { select: { nom: true, devise: true } },
    },
  });
  if (!membre) return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });

  // ─── Cycles ───
  const participations = await prisma.cycleParticipant.findMany({
    where: { id_membre_groupe: membreId, cycle: { id_groupe: groupId } },
    select: {
      cycle: {
        select: {
          id_cycle: true,
          nom_cycle: true,
          date_debut: true,
          date_fin: true,
          montant_cotisation: true,
          cotisations: {
            where: { id_membre_groupe: membreId },
            orderBy: { numero_tour: "asc" },
            select: {
              numero_tour: true,
              date_de_paiement: true,
              montant: true,
              montant_penalite: true,
              penalite_collectee: true,
            },
          },
          versements: {
            where: { id_beneficiaire: membreId },
            orderBy: { numero_tour: "asc" },
            select: {
              numero_tour: true,
              date_versement: true,
              montant_verse: true,
            },
          },
        },
      },
    },
  });

  const cycles = participations.map((p) => ({
    nom: p.cycle.nom_cycle,
    dateDebut: fmtDate(p.cycle.date_debut),
    dateFin: fmtDate(p.cycle.date_fin),
    montantCotisation: Number(p.cycle.montant_cotisation),
    cotisations: p.cycle.cotisations
      .filter((c) => Number(c.montant) > 0 || c.penalite_collectee)
      .map((c) => ({
        tour: c.numero_tour ?? 0,
        date: fmtDate(c.date_de_paiement),
        montant: Number(c.montant),
        penalite: c.penalite_collectee ? Number(c.montant_penalite ?? 0) : 0,
      })),
    versementsRecus: p.cycle.versements.map((v) => ({
      tour: v.numero_tour,
      date: fmtDate(v.date_versement),
      montant: Number(v.montant_verse),
    })),
  }));

  // ─── Rubriques ───
  const membresRubriques = await prisma.membreRubrique.findMany({
    where: {
      id_membre_groupe: membreId,
      rubrique: { id_groupe: groupId },
    },
    select: {
      rubrique: {
        select: {
          nom: true,
          montant_fixe: true,
          paiements: {
            where: { id_membre_groupe: membreId },
            orderBy: { date_paiement: "asc" },
            select: {
              date_paiement: true,
              montant_paye: true,
              note: true,
            },
          },
        },
      },
    },
  });

  const rubriques = membresRubriques.map((mr) => ({
    nom: mr.rubrique.nom,
    montantFixe: Number(mr.rubrique.montant_fixe),
    paiements: mr.rubrique.paiements.map((p) => ({
      date: fmtDate(p.date_paiement),
      montant: Number(p.montant_paye),
      note: p.note,
    })),
  }));

  // ─── Réunions ───
  const presences = await prisma.presenceReunion.findMany({
    where: {
      id_membre_groupe: membreId,
      reunion: { id_groupe: groupId, statut: "TERMINEE" },
    },
    orderBy: { reunion: { date_reunion: "desc" } },
    select: {
      statut_presence: true,
      amende_payee: true,
      reunion: {
        select: {
          titre: true,
          date_reunion: true,
          montant_amende: true,
        },
      },
    },
  });

  const reunions = presences.map((p) => ({
    titre: p.reunion.titre,
    date: fmtDate(p.reunion.date_reunion),
    statut: p.statut_presence,
    amende: Number(p.reunion.montant_amende ?? 0),
    amendePaye: p.amende_payee,
  }));

  // ─── Totaux ───
  const totalCotiseCycles = cycles.reduce(
    (acc, c) => acc + c.cotisations.reduce((a, co) => a + co.montant, 0),
    0,
  );
  const totalPenalitesCycles = cycles.reduce(
    (acc, c) => acc + c.cotisations.reduce((a, co) => a + co.penalite, 0),
    0,
  );
  const totalPotsRecus = cycles.reduce(
    (acc, c) => acc + c.versementsRecus.reduce((a, v) => a + v.montant, 0),
    0,
  );
  const totalCotiseRubriques = rubriques.reduce(
    (acc, r) => acc + r.paiements.reduce((a, p) => a + p.montant, 0),
    0,
  );
  const totalAmendesReunions = reunions.reduce(
    (acc, r) => acc + (r.statut === "ABSENT" || r.statut === "EN_RETARD" ? r.amende : 0),
    0,
  );

  const releveData: ReleveData = {
    membre: {
      prenom: membre.user.prenom,
      nom: membre.user.nom,
      email: membre.user.email,
      telephone: membre.user.telephone,
    },
    groupe: {
      nom: membre.groupe.nom,
      devise: membre.groupe.devise,
    },
    dateGeneration: fmtDate(new Date()),
    cycles,
    rubriques,
    reunions,
    totalCotiseCycles,
    totalPenalitesCycles,
    totalPotsRecus,
    totalCotiseRubriques,
    totalAmendesReunions,
  };

  // ─── Génération PDF ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(ReleveMembre, { data: releveData }) as any;
  const pdfBuffer = await renderToBuffer(element);

  const filename = `releve-${membre.user.prenom}-${membre.user.nom}-${membre.groupe.nom}.pdf`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_.]/g, "");

  // Convertir en ReadableStream pour contourner le problème de typage Buffer/BodyInit
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(pdfBuffer);
      controller.close();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
    },
  });
}
