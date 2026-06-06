"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Member = {
  id_membre_groupe: string;
  name: string;
  email: string;
};

type StatutPresence = "PRESENT" | "ABSENT" | "EXCUSE" | "EN_RETARD";

type Presence = {
  id_presence: string;
  id_membre_groupe: string;
  statut_presence: StatutPresence;
  amende_payee: boolean;
  note_absence: string | null;
};

type Props = {
  groupId: string;
  reunionId: string;
  membres: Member[];
  presencesInitiales: Presence[];
  montantAmende: number;
  devise: string;
  statut: "PLANIFIEE" | "TERMINEE" | "ANNULEE";
  compteRenduInitial: string | null;
};

const STATUT_CONFIG: Record<StatutPresence, { label: string; selected: string; unselected: string }> = {
  PRESENT:   { label: "✅ Présent",   selected: "bg-emerald-500 text-white border-emerald-500", unselected: "bg-white text-gray-500 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300" },
  ABSENT:    { label: "❌ Absent",    selected: "bg-rose-500 text-white border-rose-500",       unselected: "bg-white text-gray-500 border-gray-200 hover:bg-rose-50 hover:border-rose-300" },
  EXCUSE:    { label: "🟡 Excusé",   selected: "bg-amber-500 text-white border-amber-500",     unselected: "bg-white text-gray-500 border-gray-200 hover:bg-amber-50 hover:border-amber-300" },
  EN_RETARD: { label: "⏰ En retard", selected: "bg-orange-500 text-white border-orange-500",  unselected: "bg-white text-gray-500 border-gray-200 hover:bg-orange-50 hover:border-orange-300" },
};

const STATUT_ORDER: StatutPresence[] = ["PRESENT", "ABSENT", "EXCUSE", "EN_RETARD"];

export function ReunionDetailAdmin({
  groupId,
  reunionId,
  membres,
  presencesInitiales,
  montantAmende,
  devise,
  statut,
  compteRenduInitial,
}: Props) {
  const router = useRouter();

  const [presences, setPresences] = React.useState<Record<string, StatutPresence>>(() => {
    const init: Record<string, StatutPresence> = {};
    membres.forEach((m) => {
      const existing = presencesInitiales.find((p) => p.id_membre_groupe === m.id_membre_groupe);
      init[m.id_membre_groupe] = existing?.statut_presence ?? "PRESENT";
    });
    return init;
  });

  const [submittingPresences, setSubmittingPresences] = React.useState(false);
  const [compteRendu, setCompteRendu] = React.useState(compteRenduInitial ?? "");
  const [submittingCR, setSubmittingCR] = React.useState(false);
  const [pendingAmendeId, setPendingAmendeId] = React.useState<string | null>(null);

  const absentsCount = Object.values(presences).filter((s) => s === "ABSENT" || s === "EN_RETARD").length;
  const totalAmendePrevisionnelle = absentsCount * montantAmende;

  const handleSetStatut = (memberId: string, s: StatutPresence) => {
    setPresences((prev) => ({ ...prev, [memberId]: s }));
  };

  const submitPresences = async () => {
    setSubmittingPresences(true);
    const res = await fetch(`/api/groups/${groupId}/reunions/${reunionId}/presences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presences: Object.entries(presences).map(([id, s]) => ({
          id_membre_groupe: id,
          statut_presence: s,
        })),
      }),
    });
    setSubmittingPresences(false);

    const body = await res.json().catch(() => null) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Erreur lors de l'enregistrement.");
      return;
    }
    toast.success("✅ Présences enregistrées !");
    router.refresh();
  };

  const publishCompteRendu = async () => {
    if (!compteRendu.trim()) { toast.error("Le compte-rendu est vide."); return; }
    setSubmittingCR(true);
    const res = await fetch(`/api/groups/${groupId}/reunions/${reunionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compte_rendu: compteRendu.trim() }),
    });
    setSubmittingCR(false);
    const body = await res.json().catch(() => null) as null | { ok?: boolean };
    if (!res.ok || !body?.ok) { toast.error("Impossible de publier."); return; }
    toast.success("📝 Compte-rendu publié !");
    router.refresh();
  };

  const markAmendePaid = async (presenceId: string) => {
    setPendingAmendeId(presenceId);
    const res = await fetch(
      `/api/groups/${groupId}/reunions/${reunionId}/amendes/${presenceId}`,
      { method: "PATCH" },
    );
    setPendingAmendeId(null);
    const body = await res.json().catch(() => null) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) { toast.error(body?.error ?? "Erreur."); return; }
    toast.success("✅ Amende marquée comme payée !");
    router.refresh();
  };

  const totalCollecte = presencesInitiales
    .filter((p) => (p.statut_presence === "ABSENT" || p.statut_presence === "EN_RETARD") && p.amende_payee)
    .length * montantAmende;

  // Tous les membres absents/en retard (ont une amende potentielle)
  const amendesAvecAmende = presencesInitiales.filter(
    (p) => p.statut_presence === "ABSENT" || p.statut_presence === "EN_RETARD",
  );

  // Parmi eux : ceux dont l'amende n'est pas encore payée
  const amendesEnAttente = amendesAvecAmende.filter(
    (p) => !p.amende_payee && montantAmende > 0,
  );

  return (
    <div className="space-y-6">
      {/* ─── Section présences ─── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">
            📋 Enregistrement des présences
          </h2>
          {statut === "PLANIFIEE" && montantAmende > 0 && absentsCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 border border-amber-200">
              {absentsCount} absent(s) / retard → {totalAmendePrevisionnelle.toLocaleString("fr-FR")} {devise} d'amendes
            </span>
          )}
        </div>

        {statut === "ANNULEE" && (
          <p className="text-sm text-rose-600 font-medium">❌ Cette réunion a été annulée.</p>
        )}

        {statut !== "PLANIFIEE" && presencesInitiales.length === 0 && statut !== "ANNULEE" && (
          <p className="text-sm text-muted-foreground italic">Aucune présence enregistrée.</p>
        )}

        <div className="space-y-3">
          {membres.map((membre) => {
            const statutActuel = presences[membre.id_membre_groupe] ?? "PRESENT";
            const isLocked = statut === "TERMINEE" || statut === "ANNULEE";

            return (
              <div
                key={membre.id_membre_groupe}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 space-y-2"
              >
                {/* Nom du membre */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{membre.name}</p>
                    <p className="text-xs text-muted-foreground">{membre.email}</p>
                  </div>
                  {isLocked && (
                    <Badge
                      variant="secondary"
                      className={STATUT_CONFIG[statutActuel].selected + " text-xs"}
                    >
                      {STATUT_CONFIG[statutActuel].label}
                    </Badge>
                  )}
                </div>

                {/* Boutons de statut */}
                {!isLocked && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {STATUT_ORDER.map((opt) => {
                      const config = STATUT_CONFIG[opt];
                      const isSelected = statutActuel === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSetStatut(membre.id_membre_groupe, opt)}
                          className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all duration-150 ${
                            isSelected ? config.selected : config.unselected
                          }`}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {statut === "PLANIFIEE" && membres.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              onClick={submitPresences}
              disabled={submittingPresences}
              size="lg"
              className="gap-2 font-semibold"
            >
              {submittingPresences ? "Enregistrement en cours…" : "✅ Enregistrer les présences"}
            </Button>
            <p className="text-xs text-muted-foreground">
              La réunion passera automatiquement au statut <strong>Terminée</strong>.
            </p>
          </div>
        )}
      </div>

      {/* ─── Section amendes ─── */}
      {statut === "TERMINEE" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:bg-amber-900/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-amber-900 dark:text-amber-200 text-base">
              💰 Amendes d'absence
            </h2>
            {montantAmende > 0 && amendesAvecAmende.length > 0 && (
              <div className="flex gap-4 text-xs font-medium">
                <span className="text-emerald-700">
                  Collecté : <strong>{totalCollecte.toLocaleString("fr-FR")} {devise}</strong>
                </span>
                <span className="text-amber-700">
                  En attente : <strong>{(amendesEnAttente.length * montantAmende).toLocaleString("fr-FR")} {devise}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Cas 1 : aucune amende configurée */}
          {montantAmende === 0 && (
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-500">
              ℹ️ Aucune amende n'a été définie pour cette réunion.
            </div>
          )}

          {/* Cas 2 : amende configurée mais tous les membres étaient présents */}
          {montantAmende > 0 && amendesAvecAmende.length === 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
              ✅ Tous les membres étaient présents — aucune amende attribuée.
            </div>
          )}

          {/* Cas 3 : il y a des membres absents/en retard */}
          {montantAmende > 0 && amendesAvecAmende.length > 0 && (
            <>
              {amendesEnAttente.length === 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
                  ✅ Toutes les amendes ont été payées.
                </div>
              )}
              <div className="space-y-2">
                {amendesAvecAmende.map((presence) => {
                  const membre = membres.find((m) => m.id_membre_groupe === presence.id_membre_groupe);
                  return (
                    <div
                      key={presence.id_presence}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                        presence.amende_payee
                          ? "border-emerald-200 bg-white dark:bg-gray-900"
                          : "border-amber-200 bg-white dark:bg-gray-900"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {membre?.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {presence.statut_presence === "EN_RETARD" ? "⏰ En retard" : "❌ Absent"}{" "}
                          — Amende : <strong>{montantAmende.toLocaleString("fr-FR")} {devise}</strong>
                        </p>
                        {presence.note_absence && (
                          <p className="text-xs italic text-gray-400 mt-0.5">
                            Motif : {presence.note_absence}
                          </p>
                        )}
                      </div>
                      {presence.amende_payee ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">
                          ✅ Payée
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => markAmendePaid(presence.id_presence)}
                          disabled={pendingAmendeId === presence.id_presence}
                          className="border-amber-300 text-amber-800 hover:bg-amber-50 font-medium"
                        >
                          {pendingAmendeId === presence.id_presence ? "…" : "Marquer comme payée"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Section compte-rendu ─── */}
      {statut === "TERMINEE" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-base">📝 Compte-rendu</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Une fois publié, tous les membres pourront le consulter.
            </p>
          </div>
          <textarea
            value={compteRendu}
            onChange={(e) => setCompteRendu(e.target.value)}
            rows={6}
            placeholder="Résumé de la réunion, décisions prises, points importants, prochaines étapes…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="button"
            onClick={publishCompteRendu}
            disabled={submittingCR}
            className="gap-2"
          >
            {submittingCR ? "Publication en cours…" : "📢 Publier le compte-rendu"}
          </Button>
        </div>
      )}
    </div>
  );
}
