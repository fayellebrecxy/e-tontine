"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  HandCoins,
  Loader2,
  Plus,
  Settings,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PretRow = {
  id_pret: string;
  statut: string;
  montant_demande: string | number;
  montant_approuve: string | number | null;
  duree_mois_demandee: number;
  duree_mois_approuvee: number | null;
  montant_capital_restant: string | number;
  montant_interets_restant: string | number;
  date_demande: string;
  date_fin: string | null;
  emprunteur: { id_membre_groupe?: string; user: { nom: string; prenom: string } };
  avalistes: {
    id_avaliste_pret: string;
    statut: string;
    id_membre_groupe: string;
    membre: { user: { nom: string; prenom: string } };
  }[];
};

type GarantieRow = {
  id_avaliste_pret: string;
  statut: string;
  montant_engagement: string | number;
  contrat_texte: string | null;
  pret: PretRow;
};

const STATUT_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  EN_ATTENTE_ANALYSE: { label: "En analyse", variant: "secondary" },
  EN_ATTENTE_AVALISTES: { label: "Avalistes", variant: "secondary" },
  EN_ATTENTE_CONFIRMATION_AVALISTES: { label: "Confirmation avalistes", variant: "secondary" },
  APPROUVE: { label: "Approuvé", variant: "default" },
  EN_COURS: { label: "En cours", variant: "default" },
  EN_RETARD: { label: "En retard", variant: "destructive" },
  SOLDE: { label: "Soldé", variant: "outline" },
  SOLDE_PAR_GARANTIE: { label: "Soldé (garantie)", variant: "outline" },
  REFUSE: { label: "Refusé", variant: "destructive" },
  ANNULE: { label: "Annulé", variant: "outline" },
  DEFAUT: { label: "Défaut", variant: "destructive" },
};

function fmt(n: number | string, devise: string) {
  return `${Number(n).toLocaleString("fr-FR")} ${devise}`;
}

function StatutBadge({ statut }: { statut: string }) {
  const cfg = STATUT_LABELS[statut] ?? { label: statut, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function PretsDashboard({
  groupId,
  devise,
  isAdmin,
  memberId,
  initialBank,
  initialPrets,
  initialGaranties,
  initialEligibility,
  initialParametres,
  members,
}: {
  groupId: string;
  devise: string;
  isAdmin: boolean;
  memberId: string;
  initialBank: { total: number; disponible: number; caisseInterets: number; pretsEnCours: number };
  initialPrets: PretRow[];
  initialGaranties: GarantieRow[];
  initialEligibility: {
    eligible: boolean;
    reasons: string[];
    soldeEpargne: number;
    ancienneteJours: number;
    ancienneteMinJours: number;
  };
  initialParametres: { anciennete_min_jours: number; plafond_pct_banque: number };
  members: { id_membre_groupe: string; label: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [montant, setMontant] = React.useState("");
  const [duree, setDuree] = React.useState("3");
  const [motif, setMotif] = React.useState("");
  const [avalisteIds, setAvalisteIds] = React.useState<string[]>([]);
  const [redistMontant, setRedistMontant] = React.useState("");

  const pendingGaranties = initialGaranties.filter((g) => g.statut === "EN_ATTENTE");

  const adminPendingPrets = initialPrets.filter((p) =>
    ["EN_ATTENTE_ANALYSE", "EN_ATTENTE_AVALISTES", "EN_ATTENTE_CONFIRMATION_AVALISTES", "APPROUVE"].includes(
      p.statut,
    ),
  );

  function toggleAvaliste(id: string) {
    setAvalisteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function submitDemande(e: React.FormEvent) {
    e.preventDefault();
    if (avalisteIds.length === 0) {
      toast.error("Au moins un avaliste est requis.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/prets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montantDemande: Number(montant),
          dureeMoisDemandee: Number(duree),
          motif: motif || undefined,
          avalisteIds,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success("Demande de prêt envoyée.");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function redistribuerInterets(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/prets/interets/redistribuer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant: Number(redistMontant) }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success("Redistribution enregistrée.");
      setRedistMontant("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const autresMembres = members.filter((m) => m.id_membre_groupe !== memberId);
  const partSuggestion =
    members.length > 0 ? Math.floor(Number(redistMontant || 0) / members.length) : 0;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm dark:border-blue-900/50 dark:bg-slate-950">
        <div className="border-b border-blue-100 bg-blue-50 px-5 py-4 dark:border-blue-900/50 dark:bg-blue-950/30">
          <div className="flex items-center gap-2">
            <Banknote className="size-5 text-blue-700" />
            <div>
              <h1 className="text-xl font-bold text-slate-950 dark:text-white">Prêts — Banque du groupe</h1>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Somme des épargnes actives — visible par tous les membres.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-slate-500">Banque totale</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{fmt(initialBank.total, devise)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-slate-500">Disponible</p>
            <p className="mt-1 text-2xl font-bold">{fmt(initialBank.disponible, devise)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-slate-500">Prêts en cours (capital)</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{fmt(initialBank.pretsEnCours, devise)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-slate-500">Caisse intérêts</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{fmt(initialBank.caisseInterets, devise)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-slate-50 p-4 text-sm dark:bg-slate-900/40">
        <p className="font-medium text-slate-800 dark:text-slate-200">
          Règles du groupe (configurées par l&apos;admin)
        </p>
        <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
          <li>
            Ancienneté minimum :{" "}
            <strong>
              {initialParametres.anciennete_min_jours === 0
                ? "aucune"
                : `${initialParametres.anciennete_min_jours} jours`}
            </strong>
            {initialParametres.anciennete_min_jours > 0 && (
              <> — vous : {initialEligibility.ancienneteJours} jours</>
            )}
          </li>
          <li>
            Plafond par demande : <strong>{initialParametres.plafond_pct_banque} %</strong> de la banque
            disponible
          </li>
        </ul>
      </section>

      {pendingGaranties.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="size-5 text-amber-700" />
            <h2 className="font-semibold">Demandes de garantie (avaliste)</h2>
          </div>
          <div className="space-y-3">
            {pendingGaranties.map((g) => (
              <div
                key={g.id_avaliste_pret}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 dark:bg-slate-950"
              >
                <div>
                  <p className="font-medium">
                    Prêt de {g.pret.emprunteur.user.prenom} {g.pret.emprunteur.user.nom} —{" "}
                    {fmt(g.pret.montant_approuve ?? g.pret.montant_demande, devise)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Remplissez le contrat de garantie (date, signature, acceptation de saisie).
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/groups/${groupId}/prets/${g.pret.id_pret}`}>
                    Remplir le contrat
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {isAdmin && adminPendingPrets.length > 0 && (
        <section className="rounded-lg border border-violet-200 bg-violet-50/30 p-5 dark:border-violet-900/50">
          <h2 className="mb-3 font-semibold">Admin — demandes à traiter</h2>
          <div className="space-y-2">
            {adminPendingPrets.map((pret) => (
              <Link
                key={pret.id_pret}
                href={`/dashboard/groups/${groupId}/prets/${pret.id_pret}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3 transition hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900/50"
              >
                <div>
                  <p className="font-medium">
                    {pret.emprunteur.user.prenom} {pret.emprunteur.user.nom}
                  </p>
                  <p className="text-sm text-slate-500">
                    {fmt(pret.montant_demande, devise)} · {pret.duree_mois_demandee} mois
                  </p>
                </div>
                <StatutBadge statut={pret.statut} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border bg-white p-5 shadow-sm dark:bg-slate-950">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <HandCoins className="size-5" />
              <h2 className="text-lg font-semibold">Prêts du groupe</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Liste complète visible par tous les membres — journal et traçabilité inclus.
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} disabled={!initialEligibility.eligible}>
              <Plus className="mr-1 size-4" /> Nouvelle demande
            </Button>
          )}
        </div>

        {!initialEligibility.eligible && (
          <div className="mb-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <ul className="list-inside list-disc">
              {initialEligibility.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {initialEligibility.eligible && (
          <p className="mb-4 text-sm text-slate-600">
            Votre épargne : <strong>{fmt(initialEligibility.soldeEpargne, devise)}</strong> — le montant emprunté
            doit être supérieur à cette somme.
          </p>
        )}

        {showForm && (
          <form onSubmit={submitDemande} className="mb-6 grid gap-4 rounded-lg border p-4 md:grid-cols-2">
            <div>
              <Label htmlFor="montant">Montant demandé ({devise})</Label>
              <Input
                id="montant"
                type="number"
                min={1}
                required
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="duree">Durée (mois)</Label>
              <Input
                id="duree"
                type="number"
                min={1}
                required
                value={duree}
                onChange={(e) => setDuree(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="motif">Motif (optionnel)</Label>
              <Textarea id="motif" value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} />
            </div>
            <div className="md:col-span-2">
              <Label>Avalistes (au moins un requis)</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {autresMembres.map((m) => (
                  <label
                    key={m.id_membre_groupe}
                    className="flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={avalisteIds.includes(m.id_membre_groupe)}
                      onChange={() => toggleAvaliste(m.id_membre_groupe)}
                      className="size-4"
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
                Soumettre
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {initialPrets.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun prêt pour le moment.</p>
          ) : (
            initialPrets.map((pret) => (
                <Link
                  key={pret.id_pret}
                  href={`/dashboard/groups/${groupId}/prets/${pret.id_pret}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <div>
                    <p className="font-medium">
                      {pret.emprunteur.user.prenom} {pret.emprunteur.user.nom}
                    </p>
                    <p className="text-sm text-slate-500">
                      {fmt(pret.montant_approuve ?? pret.montant_demande, devise)} ·{" "}
                      {pret.duree_mois_approuvee ?? pret.duree_mois_demandee} mois ·{" "}
                      {new Date(pret.date_demande).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <StatutBadge statut={pret.statut} />
                </Link>
            ))
          )}
        </div>
      </section>

      {initialGaranties.filter((g) => !["EN_ATTENTE", "PROPOSE"].includes(g.statut)).length > 0 && (
        <section className="rounded-lg border p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Shield className="size-5" /> Mes garanties
          </h2>
          <div className="space-y-2">
            {initialGaranties
              .filter((g) => !["EN_ATTENTE", "PROPOSE"].includes(g.statut))
              .map((g) => (
                <div key={g.id_avaliste_pret} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {g.pret.emprunteur.user.prenom} {g.pret.emprunteur.user.nom} —{" "}
                      {fmt(g.pret.montant_approuve ?? g.pret.montant_demande, devise)}
                    </span>
                    <Badge
                      variant={
                        g.statut === "ACCEPTE"
                          ? "default"
                          : g.statut === "CONTRAT_SOUMIS"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {g.statut === "ACCEPTE"
                        ? "Confirmé"
                        : g.statut === "CONTRAT_SOUMIS"
                          ? "Contrat soumis"
                          : "Refusé"}
                    </Badge>
                  </div>
                  {g.contrat_texte && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{g.contrat_texte}</p>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-violet-200 bg-violet-50/30 p-5 dark:border-violet-900/50">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Administration</h2>
              <p className="mt-1 text-sm text-slate-600">
                Ancienneté : {initialParametres.anciennete_min_jours} j · Plafond :{" "}
                {initialParametres.plafond_pct_banque} % banque
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/groups/${groupId}/prets/parametres`}>
                <Settings className="mr-1 size-4" />
                Configurer les règles
              </Link>
            </Button>
          </div>

          <h3 className="mb-3 text-sm font-semibold">Caisse intérêts</h3>
          <form onSubmit={redistribuerInterets} className="flex flex-wrap items-end gap-3">
            <div>
              <Label>Montant à redistribuer</Label>
              <Input
                type="number"
                min={1}
                max={initialBank.caisseInterets}
                value={redistMontant}
                onChange={(e) => setRedistMontant(e.target.value)}
                className="w-48"
              />
            </div>
            {partSuggestion > 0 && (
              <p className="text-sm text-slate-600">
                Suggestion équitable : ~{fmt(partSuggestion, devise)} / membre ({members.length} membres)
              </p>
            )}
            <Button type="submit" disabled={loading || !redistMontant}>
              Redistribuer vers épargnes
            </Button>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            L&apos;ancienneté minimum, le plafond et le modèle de contrat avaliste se modifient dans{" "}
            <Link href={`/dashboard/groups/${groupId}/prets/parametres`} className="underline">
              Paramètres prêts
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}
