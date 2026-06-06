import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RapportGroupe } from "@/lib/pdf/rapport-groupe";
import type { RapportGroupeData } from "@/lib/pdf/rapport-groupe";
import { genererExcelRapport } from "@/lib/excel/rapport-groupe";

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const statutCycle = (dateDebut: Date, dateFin: Date) => {
  const now = new Date();
  if (now < dateDebut) return "À venir";
  if (now > dateFin) return "Terminé";
  return "En cours";
};

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;
  const format = request.nextUrl.searchParams.get("format") ?? "pdf";

  // ─── Auth ───
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Missing env." }, { status: 500 });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Admin seulement
  const caller = await prisma.membreGroupe.findFirst({
    where: {
      id_user: authData.user.id,
      id_groupe: groupId,
      statut_adhesion: "ACTIF",
      role: "ADMIN",
    },
    select: { id_membre_groupe: true },
  });
  if (!caller) return NextResponse.json({ error: "Accès réservé aux admins." }, { status: 403 });

  // ─── Groupe ───
  const groupe = await prisma.groupes.findUnique({
    where: { id_groupe: groupId },
    select: { nom: true, devise: true, description: true },
  });
  if (!groupe) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });

  const nbMembresActifs = await prisma.membreGroupe.count({
    where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
  });

  // ─── Cycles ───
  const cyclesDB = await prisma.cycleTontine.findMany({
    where: { id_groupe: groupId },
    orderBy: { date_debut: "asc" },
    select: {
      id_cycle: true,
      nom_cycle: true,
      date_debut: true,
      date_fin: true,
      montant_cotisation: true,
      cotisations: {
        select: {
          id_membre_groupe: true,
          montant: true,
          montant_penalite: true,
          penalite_appliquee: true,
          membre_groupe: {
            select: { user: { select: { nom: true, prenom: true } } },
          },
        },
      },
      versements: {
        select: {
          id_beneficiaire: true,
          montant_verse: true,
          beneficiaire: {
            select: { user: { select: { nom: true, prenom: true } } },
          },
        },
      },
    },
  });

  // Retraits pénalités (liés aux cycles du groupe)
  const cycleIds = cyclesDB.map((c) => c.id_cycle);
  const retraitsPenalites = await prisma.retraitPenalite.findMany({
    where: { id_cycle: { in: cycleIds } },
    select: { montant: true },
  });
  const totalRetraitsPenalites = retraitsPenalites.reduce((a, r) => a + Number(r.montant), 0);

  const cycles = cyclesDB.map((c) => {
    const totalCollecte = c.cotisations
      .filter((co) => Number(co.montant) > 0)
      .reduce((a, co) => a + Number(co.montant), 0);

    const totalDistribue = c.versements.reduce((a, v) => a + Number(v.montant_verse), 0);

    // Pénalités collectées = cotisations avec montant_penalite > 0 ET montant > 0 (payées)
    const totalPenalitesCollectees = c.cotisations
      .filter((co) => Number(co.montant) > 0 && Number(co.montant_penalite ?? 0) > 0)
      .reduce((a, co) => a + Number(co.montant_penalite ?? 0), 0);

    // Regrouper par membre
    const membreMap = new Map<string, { nom: string; cotise: number; penalites: number }>();
    for (const co of c.cotisations.filter((co) => Number(co.montant) > 0)) {
      const nom = `${co.membre_groupe.user.prenom} ${co.membre_groupe.user.nom}`;
      const existing = membreMap.get(co.id_membre_groupe) ?? { nom, cotise: 0, penalites: 0 };
      existing.cotise += Number(co.montant);
      existing.penalites += Number(co.montant_penalite ?? 0);
      membreMap.set(co.id_membre_groupe, existing);
    }
    // Ajouter membres sans paiement mais bénéficiaires
    for (const v of c.versements) {
      if (!membreMap.has(v.id_beneficiaire)) {
        membreMap.set(v.id_beneficiaire, {
          nom: `${v.beneficiaire.user.prenom} ${v.beneficiaire.user.nom}`,
          cotise: 0,
          penalites: 0,
        });
      }
    }

    const membres = Array.from(membreMap.entries()).map(([membreId, m]) => {
      const versement = c.versements.find((v) => v.id_beneficiaire === membreId);
      return {
        nom: m.nom,
        cotise: m.cotise,
        penalites: m.penalites,
        potRecu: !!versement,
        montantPot: versement ? Number(versement.montant_verse) : 0,
      };
    });

    return {
      nom: c.nom_cycle,
      dateDebut: fmtDate(c.date_debut),
      dateFin: fmtDate(c.date_fin),
      statut: statutCycle(c.date_debut, c.date_fin),
      montantCotisation: Number(c.montant_cotisation),
      totalCollecte,
      totalDistribue,
      totalPenalitesCollectees,
      soldesPenalites: totalPenalitesCollectees,
      membres,
    };
  });

  const totalPenalitesGlobal = cycles.reduce((a, c) => a + c.totalPenalitesCollectees, 0);
  const soldeCaissePenalites = totalPenalitesGlobal - totalRetraitsPenalites;

  // ─── Rubriques ───
  const rubriquesDB = await prisma.rubriqueCotisation.findMany({
    where: { id_groupe: groupId },
    select: { id_rubrique: true, nom: true, montant_fixe: true },
  });

  const membresRubriquesDB = await prisma.membreRubrique.findMany({
    where: { rubrique: { id_groupe: groupId } },
    select: {
      id_rubrique: true,
      id_membre_groupe: true,
      membre: { select: { user: { select: { nom: true, prenom: true } } } },
    },
  });

  const paiementsRubriquesDB = await prisma.paiementRubrique.findMany({
    where: { rubrique: { id_groupe: groupId } },
    select: { id_rubrique: true, id_membre_groupe: true, montant_paye: true },
  });

  const rubriques = rubriquesDB.map((r) => {
    const membres_concernes = membresRubriquesDB.filter((mr) => mr.id_rubrique === r.id_rubrique);
    const paiementsRubrique = paiementsRubriquesDB.filter((p) => p.id_rubrique === r.id_rubrique);

    const nbMembres = membres_concernes.length;
    const totalAttendu = Number(r.montant_fixe) * nbMembres;

    const membres = membres_concernes.map((mr) => {
      const totalPaye = paiementsRubrique
        .filter((p) => p.id_membre_groupe === mr.id_membre_groupe)
        .reduce((a, p) => a + Number(p.montant_paye), 0);
      return {
        nom: `${mr.membre.user.prenom} ${mr.membre.user.nom}`,
        totalPaye,
      };
    });

    const totalCollecte = membres.reduce((a, m) => a + m.totalPaye, 0);
    const tauxRecouvrement = totalAttendu > 0 ? (totalCollecte / totalAttendu) * 100 : 0;

    return {
      nom: r.nom,
      montantFixe: Number(r.montant_fixe),
      nbMembres,
      totalAttendu,
      totalCollecte,
      tauxRecouvrement,
      membres,
    };
  });

  // ─── Réunions ───
  const reunionsDB = await prisma.reunion.findMany({
    where: { id_groupe: groupId },
    select: {
      statut: true,
      montant_amende: true,
      presences: {
        select: { statut_presence: true, amende_payee: true },
      },
    },
  });

  const retraitsAmendes = await prisma.retraitAmendeReunion.findMany({
    where: { id_groupe: groupId },
    select: { montant: true },
  });

  const totalReunions = reunionsDB.length;
  const reunionsTerminees = reunionsDB.filter((r) => r.statut === "TERMINEE").length;
  let totalPresents = 0, totalPresences = 0, totalAmendesGenerees = 0, totalAmendesPayees = 0;

  for (const r of reunionsDB) {
    if (r.statut !== "TERMINEE") continue;
    const montantAmende = Number(r.montant_amende ?? 0);
    for (const p of r.presences) {
      totalPresences++;
      if (p.statut_presence === "PRESENT") totalPresents++;
      if ((p.statut_presence === "ABSENT" || p.statut_presence === "EN_RETARD") && montantAmende > 0) {
        totalAmendesGenerees += montantAmende;
        if (p.amende_payee) totalAmendesPayees += montantAmende;
      }
    }
  }

  const tauxPresenceMoyen = totalPresences > 0 ? (totalPresents / totalPresences) * 100 : 0;
  const totalRetire = retraitsAmendes.reduce((a, r) => a + Number(r.montant), 0);
  const soldeCaisseAmendes = totalAmendesPayees - totalRetire;

  // ─── Totaux globaux ───
  const grandTotalCollecte =
    cycles.reduce((a, c) => a + c.totalCollecte, 0) +
    rubriques.reduce((a, r) => a + r.totalCollecte, 0) +
    totalAmendesPayees;
  const grandTotalDistribue = cycles.reduce((a, c) => a + c.totalDistribue, 0);

  const toutesLesDates = cyclesDB.map((c) => c.date_debut);
  const periodeDebut =
    toutesLesDates.length > 0
      ? fmtDate(toutesLesDates.reduce((a, b) => (a < b ? a : b)))
      : fmtDate(new Date());

  const reportData: RapportGroupeData = {
    groupe: { nom: groupe.nom, devise: groupe.devise, description: groupe.description },
    dateGeneration: fmtDate(new Date()),
    periodeDebut,
    periodeFin: fmtDate(new Date()),
    nbMembresActifs,
    cycles,
    rubriques,
    reunions: {
      totalReunions,
      reunionsTerminees,
      tauxPresenceMoyen,
      totalAmendesGenerees,
      totalAmendesPayees,
      totalRetire,
      solde: soldeCaisseAmendes,
    },
    grandTotalCollecte,
    grandTotalDistribue,
    soldeCaissePenalites,
    soldeCaisseAmendes,
  };

  const slugNom = groupe.nom.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // ─── PDF ───
  if (format === "pdf") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(RapportGroupe, { data: reportData }) as any;
    const pdfBuffer = await renderToBuffer(element);
    const stream = new ReadableStream({
      start(controller) { controller.enqueue(pdfBuffer); controller.close(); },
    });
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rapport-${slugNom}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  }

  // ─── Excel ───
  const excelBuffer = genererExcelRapport(reportData);
  const excelStream = new ReadableStream({
    start(controller) { controller.enqueue(excelBuffer); controller.close(); },
  });
  return new NextResponse(excelStream, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rapport-${slugNom}.xlsx"`,
      "Content-Length": String(excelBuffer.byteLength),
    },
  });
}
