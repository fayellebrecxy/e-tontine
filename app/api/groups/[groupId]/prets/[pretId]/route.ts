import { NextResponse } from "next/server";

import {
  adminAddAvaliste,
  adminAnalyzePret,
  adminConfirmAvaliste,
  adminSendToAvalistes,
  cancelPretDemande,
  disbursePret,
  getPretWithRelations,
  recordPretRepayment,
  respondAvaliste,
  saisieGarantiePret,
} from "@/lib/pret";
import { getGroupMembership, requireAdmin } from "@/lib/pret-auth";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ groupId: string; pretId: string }> },
) {
  const { groupId, pretId } = await ctx.params;
  const auth = await getGroupMembership(groupId);
  if ("error" in auth && auth.error) return auth.error;

  const pret = await getPretWithRelations(pretId, groupId);
  if (!pret) return NextResponse.json({ ok: false, error: "Introuvable." }, { status: 404 });

  return NextResponse.json({ ok: true, pret, isAdmin: auth.membership!.role === "ADMIN" });
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ groupId: string; pretId: string }> },
) {
  const { groupId, pretId } = await ctx.params;
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  if (!body?.action) {
    return NextResponse.json({ ok: false, error: "Action requise." }, { status: 400 });
  }

  switch (body.action) {
    case "cancel": {
      const auth = await getGroupMembership(groupId);
      if ("error" in auth && auth.error) return auth.error;
      const result = await cancelPretDemande({
        groupId,
        pretId,
        operatorMemberId: auth.membership!.id_membre_groupe,
        isAdmin: auth.membership!.role === "ADMIN",
      });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ ok: false, error: "Action inconnue." }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ groupId: string; pretId: string }> },
) {
  const { groupId, pretId } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.action) {
    return NextResponse.json({ ok: false, error: "Action requise." }, { status: 400 });
  }

  if (body.action === "respond_avaliste") {
    const auth = await getGroupMembership(groupId);
    if ("error" in auth && auth.error) return auth.error;
    const result = await respondAvaliste({
      groupId,
      pretId,
      avalisteMemberId: auth.membership!.id_membre_groupe,
      accept: Boolean(body.accept),
      motifRefus: body.motifRefus as string | undefined,
      dateContrat: body.dateContrat as string | undefined,
      signatureNom: body.signatureNom as string | undefined,
      acceptationSaisie: Boolean(body.acceptationSaisie),
    });
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  }

  const auth = await requireAdmin(groupId);
  if ("error" in auth && auth.error) return auth.error;
  const adminId = auth.membership!.id_membre_groupe;

  switch (body.action) {
    case "send_to_avalistes": {
      const result = await adminSendToAvalistes({ groupId, pretId, adminMemberId: adminId });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true });
    }
    case "confirm_avaliste": {
      const result = await adminConfirmAvaliste({
        groupId,
        pretId,
        adminMemberId: adminId,
        avalistePretId: body.avalistePretId as string,
      });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true });
    }
    case "analyze": {
      const result = await adminAnalyzePret({
        groupId,
        pretId,
        adminMemberId: adminId,
        decision: body.decision as "APPROUVE" | "REFUSE",
        montantApprouve: body.montantApprouve as number | undefined,
        dureeMoisApprouvee: body.dureeMoisApprouvee as number | undefined,
        tauxInteretMensuel: body.tauxInteretMensuel as number | undefined,
        notesAdmin: body.notesAdmin as string | undefined,
        motifRefus: body.motifRefus as string | undefined,
      });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true });
    }
    case "add_avaliste": {
      const result = await adminAddAvaliste({
        groupId,
        pretId,
        adminMemberId: adminId,
        avalisteMemberId: body.avalisteMemberId as string,
        montantEngagement: body.montantEngagement as number | undefined,
      });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true });
    }
    case "disburse": {
      const result = await disbursePret({ groupId, pretId, adminMemberId: adminId });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true, repartition: result.repartition });
    }
    case "repayment": {
      const result = await recordPretRepayment({
        groupId,
        pretId,
        adminMemberId: adminId,
        montant: body.montant as number,
        note: body.note as string | undefined,
      });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      return NextResponse.json({
        ok: true,
        capitalRestant: result.capitalRestant,
        interetsRestants: result.interetsRestants,
      });
    }
    case "saisie_garantie": {
      const result = await saisieGarantiePret({
        groupId,
        pretId,
        adminMemberId: adminId,
        avalisteMemberId: body.avalisteMemberId as string,
        montant: body.montant as number,
        motif: (body.motif as string) || "Saisie garantie",
      });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ ok: false, error: "Action inconnue." }, { status: 400 });
  }
}
