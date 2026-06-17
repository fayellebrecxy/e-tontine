"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Mouvement = {
  id_mouvement: string;
  type_mouvement: string;
  montant: number;
  details: string | null;
  date_operation: string;
  operateur?: { user: { prenom: string; nom: string } } | null;
};

type PretDetail = {
  id_pret: string;
  statut: string;
  montant_demande: number;
  montant_approuve: number | null;
  duree_mois_demandee: number;
  duree_mois_approuvee: number | null;
  taux_interet_mensuel: number | null;
  montant_capital_restant: number;
  montant_interets_restant: number;
  montant_interets_total: number;
  montant_garantie_emprunteur: number;
  motif: string | null;
  motif_refus: string | null;
  notes_admin: string | null;
  date_demande: string;
  date_approbation: string | null;
  date_decaissement: string | null;
  date_fin: string | null;
  emprunteur: { id_membre_groupe: string; user: { prenom: string; nom: string } };
  avalistes: {
    id_avaliste_pret: string;
    statut: string;
    montant_engagement: number;
    contrat_texte: string | null;
    motif_refus: string | null;
    date_reponse: string | null;
    date_contrat: string | null;
    date_confirmation_admin: string | null;
    signature_nom: string | null;
    acceptation_saisie: boolean;
    membre: { id_membre_groupe: string; user: { prenom: string; nom: string } };
  }[];
  mouvements: Mouvement[];
};

const AVALISTE_LABELS: Record<string, string> = {
  PROPOSE: "Proposé (en attente envoi)",
  EN_ATTENTE: "En attente de contrat",
  CONTRAT_SOUMIS: "Contrat soumis",
  ACCEPTE: "Confirmé",
  REFUSE: "Refusé",
};

function fmt(n: number, devise: string) {
  return `${n.toLocaleString("fr-FR")} ${devise}`;
}

const TYPE_LABELS: Record<string, string> = {
  DEMANDE_SOUMISE: "Demande soumise",
  AVALISTE_PROPOSE: "Avaliste proposé",
  ENVOI_DEMANDE_AVALISTES: "Envoi aux avalistes",
  CONTRAT_AVALISTE_SOUMIS: "Contrat avaliste soumis",
  CONFIRMATION_AVALISTE_ADMIN: "Confirmation admin avaliste",
  AVALISTE_ACCEPTE: "Avaliste accepté",
  AVALISTE_REFUSE: "Avaliste refusé",
  ANALYSE_ADMIN: "Analyse admin",
  APPROBATION: "Approbation",
  REFUS: "Refus",
  DECAISSEMENT: "Décaissement",
  REMBOURSEMENT_CAPITAL: "Remboursement capital",
  REMBOURSEMENT_INTERET: "Remboursement intérêts",
  PASSAGE_EN_RETARD: "Passage en retard",
  SAISIE_GARANTIE: "Saisie garantie",
  ANNULATION: "Annulation",
  REDISTRIBUTION_INTERETS: "Redistribution intérêts",
};

export function PretDetailClient({
  groupId,
  devise,
  isAdmin,
  currentMemberId,
  pret,
  members,
}: {
  groupId: string;
  devise: string;
  isAdmin: boolean;
  currentMemberId: string;
  pret: PretDetail;
  members: { id_membre_groupe: string; label: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [montantApprouve, setMontantApprouve] = React.useState(
    String(pret.montant_approuve ?? pret.montant_demande),
  );
  const [duree, setDuree] = React.useState(String(pret.duree_mois_approuvee ?? pret.duree_mois_demandee));
  const [taux, setTaux] = React.useState(String(pret.taux_interet_mensuel ?? "3"));
  const [notes, setNotes] = React.useState("");
  const [motifRefus, setMotifRefus] = React.useState("");
  const [repayment, setRepayment] = React.useState("");
  const [avalisteId, setAvalisteId] = React.useState("");
  const [saisieMontant, setSaisieMontant] = React.useState("");
  const [saisieAvaliste, setSaisieAvaliste] = React.useState("");

  const [contratDate, setContratDate] = React.useState(
    new Date().toISOString().slice(0, 10),
  );
  const [contratSignature, setContratSignature] = React.useState("");
  const [contratSaisie, setContratSaisie] = React.useState(false);
  const [refusMotif, setRefusMotif] = React.useState("");

  const myAvaliste = pret.avalistes.find((a) => a.membre.id_membre_groupe === currentMemberId);
  const proposesCount = pret.avalistes.filter((a) => a.statut === "PROPOSE").length;
  const pendingContracts = pret.avalistes.filter((a) => a.statut === "CONTRAT_SOUMIS").length;
  const allAvalistesReady =
    pret.avalistes.length > 0 &&
    pret.avalistes.every((a) => a.statut === "ACCEPTE" || a.statut === "REFUSE") &&
    pret.avalistes.some((a) => a.statut === "ACCEPTE");

  async function apiAction(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/prets/${pret.id_pret}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success("Opération enregistrée.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const canSendToAvalistes = isAdmin && pret.statut === "EN_ATTENTE_ANALYSE" && proposesCount > 0;
  const canConfirmAvalistes =
    isAdmin &&
    ["EN_ATTENTE_AVALISTES", "EN_ATTENTE_CONFIRMATION_AVALISTES"].includes(pret.statut);
  const canAnalyze = isAdmin && pret.statut === "EN_ATTENTE_ANALYSE" && allAvalistesReady;
  const canDisburse = isAdmin && pret.statut === "APPROUVE";
  const canRepay = isAdmin && ["EN_COURS", "EN_RETARD"].includes(pret.statut);
  const canFillContrat = myAvaliste?.statut === "EN_ATTENTE";

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/groups/${groupId}/prets`}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" /> Retour aux prêts
      </Link>

      <section className="rounded-lg border bg-white p-5 shadow-sm dark:bg-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">
              Prêt — {pret.emprunteur.user.prenom} {pret.emprunteur.user.nom}
            </h1>
            <p className="text-sm text-slate-500">
              Demandé le {new Date(pret.date_demande).toLocaleString("fr-FR")}
            </p>
          </div>
          <Badge>{pret.statut.replace(/_/g, " ")}</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded border p-3">
            <p className="text-xs text-slate-500">Montant demandé</p>
            <p className="font-bold">{fmt(Number(pret.montant_demande), devise)}</p>
          </div>
          {pret.montant_approuve != null && (
            <div className="rounded border p-3">
              <p className="text-xs text-slate-500">Montant approuvé</p>
              <p className="font-bold text-emerald-700">{fmt(Number(pret.montant_approuve), devise)}</p>
            </div>
          )}
          <div className="rounded border p-3">
            <p className="text-xs text-slate-500">Capital restant</p>
            <p className="font-bold">{fmt(Number(pret.montant_capital_restant), devise)}</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs text-slate-500">Intérêts restants</p>
            <p className="font-bold">{fmt(Number(pret.montant_interets_restant), devise)}</p>
          </div>
        </div>

        {pret.motif && <p className="mt-3 text-sm"><strong>Motif :</strong> {pret.motif}</p>}
        {pret.motif_refus && <p className="mt-2 text-sm text-rose-700"><strong>Refus :</strong> {pret.motif_refus}</p>}
        {pret.notes_admin && <p className="mt-2 text-sm text-slate-600"><strong>Notes admin :</strong> {pret.notes_admin}</p>}
      </section>

      {pret.avalistes.length > 0 && (
        <section className="rounded-lg border p-5">
          <h2 className="mb-3 font-semibold">Avalistes — traçabilité</h2>
          <div className="space-y-3">
            {pret.avalistes.map((a) => (
              <div key={a.id_avaliste_pret} className="rounded border p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">
                    {a.membre.user.prenom} {a.membre.user.nom}
                  </span>
                  <Badge
                    variant={
                      a.statut === "ACCEPTE"
                        ? "default"
                        : a.statut === "REFUSE"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {AVALISTE_LABELS[a.statut] ?? a.statut}
                  </Badge>
                </div>
                {a.date_reponse && (
                  <p className="text-xs text-slate-500">
                    Réponse le {new Date(a.date_reponse).toLocaleString("fr-FR")}
                  </p>
                )}
                {a.date_contrat && (
                  <p className="text-xs text-slate-500">
                    Date contrat : {new Date(a.date_contrat).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {a.signature_nom && (
                  <p className="text-xs text-slate-500">Signature : {a.signature_nom}</p>
                )}
                {a.date_confirmation_admin && (
                  <p className="text-xs text-emerald-700">
                    Confirmé par admin le{" "}
                    {new Date(a.date_confirmation_admin).toLocaleString("fr-FR")}
                  </p>
                )}
                {a.montant_engagement > 0 && (
                  <p className="text-xs text-slate-600">
                    Engagement : {fmt(a.montant_engagement, devise)}
                  </p>
                )}
                {a.motif_refus && <p className="text-rose-700">Motif refus : {a.motif_refus}</p>}
                {a.contrat_texte && (
                  <p className="mt-2 rounded bg-slate-50 p-2 text-xs dark:bg-slate-900">{a.contrat_texte}</p>
                )}
                {canConfirmAvalistes && a.statut === "CONTRAT_SOUMIS" && (
                  <Button
                    size="sm"
                    className="mt-2"
                    disabled={loading}
                    onClick={() =>
                      apiAction({ action: "confirm_avaliste", avalistePretId: a.id_avaliste_pret })
                    }
                  >
                    Confirmer ce contrat
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {canSendToAvalistes && (
        <section className="rounded-lg border border-blue-200 bg-blue-50/30 p-5">
          <h2 className="mb-2 font-semibold">Étape 1 — Envoyer aux avalistes</h2>
          <p className="mb-3 text-sm text-slate-600">
            {proposesCount} avaliste(s) proposé(s) par l&apos;emprunteur. Envoyez la demande pour qu&apos;ils
            remplissent leur contrat de garantie.
          </p>
          <Button disabled={loading} onClick={() => apiAction({ action: "send_to_avalistes" })}>
            {loading ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            Envoyer la demande aux avalistes
          </Button>
        </section>
      )}

      {canConfirmAvalistes && pendingContracts > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50/30 p-5">
          <h2 className="mb-2 font-semibold">Étape 2 — Confirmer les contrats avalistes</h2>
          <p className="text-sm text-slate-600">
            {pendingContracts} contrat(s) en attente de votre confirmation ci-dessus.
          </p>
        </section>
      )}

      {canFillContrat && myAvaliste && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-5">
          <h2 className="mb-3 font-semibold">Contrat de garantie (avaliste)</h2>
          <p className="mb-4 text-sm text-slate-600">
            Prêt de {pret.emprunteur.user.prenom} {pret.emprunteur.user.nom} —{" "}
            {fmt(pret.montant_demande, devise)} sur {pret.duree_mois_demandee} mois.
            Votre acceptation sera tracée et ne pourra être niée.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Date du contrat</Label>
              <Input
                type="date"
                value={contratDate}
                onChange={(e) => setContratDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Signature (nom complet)</Label>
              <Input
                value={contratSignature}
                onChange={(e) => setContratSignature(e.target.value)}
                placeholder="Votre nom et prénom"
              />
            </div>
            <div className="flex items-start gap-2 md:col-span-2">
              <Checkbox
                id="saisie"
                checked={contratSaisie}
                onCheckedChange={(v) => setContratSaisie(Boolean(v))}
              />
              <Label htmlFor="saisie" className="text-sm leading-snug">
                J&apos;accepte que mes fonds d&apos;épargne puissent être saisis en cas de défaut de
                l&apos;emprunteur, dans la limite de mon solde disponible.
              </Label>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={loading || !contratSaisie || contratSignature.trim().length < 3}
              onClick={() =>
                apiAction({
                  action: "respond_avaliste",
                  accept: true,
                  dateContrat: contratDate,
                  signatureNom: contratSignature.trim(),
                  acceptationSaisie: true,
                })
              }
            >
              Soumettre le contrat
            </Button>
            <Input
              placeholder="Motif de refus (si refus)"
              value={refusMotif}
              onChange={(e) => setRefusMotif(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => {
                if (!refusMotif.trim()) {
                  toast.error("Motif de refus obligatoire.");
                  return;
                }
                apiAction({
                  action: "respond_avaliste",
                  accept: false,
                  motifRefus: refusMotif.trim(),
                });
              }}
            >
              Refuser
            </Button>
          </div>
        </section>
      )}

      {isAdmin && pret.statut === "EN_ATTENTE_ANALYSE" && !allAvalistesReady && proposesCount === 0 && (
        <section className="rounded-lg border p-5">
          <h2 className="mb-2 font-semibold">Ajouter un avaliste</h2>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded border px-3 py-2 text-sm"
              value={avalisteId}
              onChange={(e) => setAvalisteId(e.target.value)}
            >
              <option value="">Choisir un membre…</option>
              {members
                .filter((m) => m.id_membre_groupe !== pret.emprunteur.id_membre_groupe)
                .map((m) => (
                  <option key={m.id_membre_groupe} value={m.id_membre_groupe}>
                    {m.label}
                  </option>
                ))}
            </select>
            <Button
              variant="outline"
              disabled={!avalisteId || loading}
              onClick={() => apiAction({ action: "add_avaliste", avalisteMemberId: avalisteId })}
            >
              Ajouter avaliste
            </Button>
          </div>
        </section>
      )}

      {canAnalyze && (
        <section className="rounded-lg border border-violet-200 bg-violet-50/30 p-5">
          <h2 className="mb-4 font-semibold">Étape 3 — Approuver le prêt</h2>
          <p className="mb-4 text-sm text-slate-600">
            Tous les avalistes sont confirmés. Définissez le montant, la durée et les intérêts.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Montant approuvé</Label>
              <Input type="number" value={montantApprouve} onChange={(e) => setMontantApprouve(e.target.value)} />
            </div>
            <div>
              <Label>Durée (mois)</Label>
              <Input type="number" value={duree} onChange={(e) => setDuree(e.target.value)} />
            </div>
            <div>
              <Label>Taux mensuel (%)</Label>
              <Input type="number" step="0.1" value={taux} onChange={(e) => setTaux(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={loading}
              onClick={() =>
                apiAction({
                  action: "analyze",
                  decision: "APPROUVE",
                  montantApprouve: Number(montantApprouve),
                  dureeMoisApprouvee: Number(duree),
                  tauxInteretMensuel: Number(taux),
                  notesAdmin: notes,
                })
              }
            >
              Approuver et notifier l&apos;emprunteur
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => {
                if (!motifRefus.trim()) {
                  toast.error("Motif de refus obligatoire.");
                  return;
                }
                apiAction({ action: "analyze", decision: "REFUSE", motifRefus, notesAdmin: notes });
              }}
            >
              Refuser la demande
            </Button>
          </div>
          <Input
            className="mt-3"
            placeholder="Motif de refus"
            value={motifRefus}
            onChange={(e) => setMotifRefus(e.target.value)}
          />
        </section>
      )}

      {canDisburse && (
        <section className="rounded-lg border p-5">
          <h2 className="mb-2 font-semibold">Décaissement</h2>
          <p className="mb-3 text-sm text-slate-600">
            Action séparée : l&apos;argent sera prélevé proportionnellement sur la banque. Tous les membres seront notifiés.
          </p>
          <Button disabled={loading} onClick={() => apiAction({ action: "disburse" })}>
            {loading ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            Verser le prêt
          </Button>
        </section>
      )}

      {canRepay && (
        <section className="rounded-lg border p-5">
          <h2 className="mb-3 font-semibold">Enregistrer un remboursement</h2>
          <div className="flex flex-wrap gap-2">
            <Input
              type="number"
              placeholder="Montant"
              value={repayment}
              onChange={(e) => setRepayment(e.target.value)}
              className="w-40"
            />
            <Button
              disabled={loading || !repayment}
              onClick={() => apiAction({ action: "repayment", montant: Number(repayment) })}
            >
              Enregistrer
            </Button>
          </div>
        </section>
      )}

      {isAdmin && ["EN_COURS", "EN_RETARD", "DEFAUT"].includes(pret.statut) && (
        <section className="rounded-lg border border-rose-200 p-5">
          <h2 className="mb-3 font-semibold text-rose-800">Saisie garantie (défaut)</h2>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded border px-3 py-2 text-sm"
              value={saisieAvaliste}
              onChange={(e) => setSaisieAvaliste(e.target.value)}
            >
              <option value="">Avaliste…</option>
              {pret.avalistes
                .filter((a) => a.statut === "ACCEPTE")
                .map((a) => (
                  <option key={a.id_avaliste_pret} value={a.membre.id_membre_groupe}>
                    {a.membre.user.prenom} {a.membre.user.nom}
                  </option>
                ))}
            </select>
            <Input
              type="number"
              placeholder="Montant"
              value={saisieMontant}
              onChange={(e) => setSaisieMontant(e.target.value)}
              className="w-32"
            />
            <Button
              variant="destructive"
              disabled={!saisieAvaliste || !saisieMontant || loading}
              onClick={() =>
                apiAction({
                  action: "saisie_garantie",
                  avalisteMemberId: saisieAvaliste,
                  montant: Number(saisieMontant),
                  motif: "Saisie manuelle garantie — défaut emprunteur",
                })
              }
            >
              Débiter avaliste
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-lg border p-5">
        <h2 className="mb-3 font-semibold">Journal — historique complet</h2>
        <div className="space-y-2">
          {pret.mouvements.map((m) => (
            <div key={m.id_mouvement} className="flex flex-wrap justify-between gap-2 rounded border px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{TYPE_LABELS[m.type_mouvement] ?? m.type_mouvement}</span>
                {m.details && <p className="text-xs text-slate-500">{m.details}</p>}
              </div>
              <div className="text-right text-xs text-slate-500">
                {m.montant > 0 && <p>{fmt(m.montant, devise)}</p>}
                <p>{new Date(m.date_operation).toLocaleString("fr-FR")}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
