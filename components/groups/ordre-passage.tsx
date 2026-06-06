"use client";

import * as React from "react";
import { ArrowLeftRight, Clock, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export type ParticipantOrdre = {
  id_membre_groupe: string;
  ordre: number;
  nom: string;
  potRecu: boolean;   // un versement existe pour ce tour
  estMoi: boolean;
};

type Props = {
  groupId: string;
  cycleId: string;
  participants: ParticipantOrdre[];
  tourActuel: number;      // prochain tour non distribué
  monId: string;           // id_membre_groupe du connecté
  isAdmin: boolean;
  cycleTermine: boolean;
};

type DemandeEnCours = {
  id_demande: string;
  statut: string;
  tour_demandeur: number;
  tour_cible: number;
  demandeur: { id_membre_groupe: string; nom: string };
  cible: { id_membre_groupe: string; nom: string };
};

export function OrdrePassage({ groupId, cycleId, participants, tourActuel, monId, isAdmin, cycleTermine }: Props) {
  const router = useRouter();
  const [demandeEnCours, setDemandeEnCours] = React.useState<DemandeEnCours | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const [cibleChoisie, setCibleChoisie] = React.useState<ParticipantOrdre | null>(null);

  // Charger mes demandes actives
  React.useEffect(() => {
    fetch(`/api/groups/${groupId}/cycles/${cycleId}/echanges`)
      .then((r) => r.json())
      .then((data: { echanges?: DemandeEnCours[] }) => {
        const active = (data.echanges ?? []).find(
          (e) => (e.statut === "EN_ATTENTE" || e.statut === "ACCEPTEE_MEMBRES") &&
            (e.demandeur.id_membre_groupe === monId || e.cible.id_membre_groupe === monId),
        );
        setDemandeEnCours(active ?? null);
      })
      .catch(() => null);
  }, [groupId, cycleId, monId]);

  const demanderEchange = async (cible: ParticipantOrdre) => {
    setLoadingId(cible.id_membre_groupe);
    try {
      const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}/echanges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cible: cible.id_membre_groupe, note: note || undefined }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return; }
      toast.success(`Demande d'échange envoyée à ${cible.nom} !`);
      setCibleChoisie(null);
      setNote("");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const repondre = async (id_demande: string, action: string) => {
    setLoadingId(id_demande);
    try {
      const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}/echanges/${id_demande}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return; }
      toast.success(action === "accepter_cible" ? "Échange accepté !" : "Échange refusé.");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const sorted = [...participants].sort((a, b) => a.ordre - b.ordre);

  return (
    <div className="space-y-4">
      {/* ─── Bandeau demande en cours (pour la cible) ─── */}
      {demandeEnCours && demandeEnCours.statut === "EN_ATTENTE" && demandeEnCours.cible.id_membre_groupe === monId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
            📨 Demande d&apos;échange reçue
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            <strong>{demandeEnCours.demandeur.nom}</strong> vous propose d&apos;échanger vos tours :
            tour <strong>{demandeEnCours.tour_cible}</strong> (votre tour) ↔ tour <strong>{demandeEnCours.tour_demandeur}</strong> (son tour).
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => repondre(demandeEnCours.id_demande, "accepter_cible")}
              disabled={loadingId === demandeEnCours.id_demande} className="bg-green-600 hover:bg-green-700 text-white">
              ✓ Accepter
            </Button>
            <Button size="sm" variant="outline" onClick={() => repondre(demandeEnCours.id_demande, "refuser_cible")}
              disabled={loadingId === demandeEnCours.id_demande}>
              ✗ Refuser
            </Button>
          </div>
        </div>
      )}

      {demandeEnCours && demandeEnCours.statut === "EN_ATTENTE" && demandeEnCours.demandeur.id_membre_groupe === monId && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ⏳ Demande d&apos;échange en attente de réponse de <strong>{demandeEnCours.cible.nom}</strong>
            {" "}(tour {demandeEnCours.tour_demandeur} ↔ tour {demandeEnCours.tour_cible})
          </p>
        </div>
      )}

      {demandeEnCours && demandeEnCours.statut === "ACCEPTEE_MEMBRES" && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            ✅ Les deux membres ont accepté — en attente de validation par l&apos;administrateur.
          </p>
        </div>
      )}

      {/* ─── Formulaire demande d'échange (si cible choisie) ─── */}
      {cibleChoisie && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Demander à échanger avec <strong>{cibleChoisie.nom}</strong>
            {" "}(tour {cibleChoisie.ordre} ↔ votre tour {participants.find((p) => p.estMoi)?.ordre ?? "?"})
          </p>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            rows={2}
            placeholder="Note (optionnel) — ex : raison de l'échange"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => demanderEchange(cibleChoisie)} disabled={!!loadingId}>
              Envoyer la demande
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCibleChoisie(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* ─── Liste des tours ─── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left w-16">Tour</th>
              <th className="px-4 py-3 text-left">Bénéficiaire</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Statut</th>
              {!cycleTermine && !isAdmin && <th className="px-4 py-3 text-right">Échange</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((p) => {
              const isPasse = p.potRecu;
              const isActuel = p.ordre === tourActuel && !isPasse;
              const monTour = p.estMoi;
              const peutEchanger =
                !cycleTermine &&
                !isAdmin &&
                !monTour &&
                !p.potRecu &&
                !demandeEnCours &&
                !cibleChoisie;
              const monParticipant = participants.find((q) => q.estMoi);
              const monTourDistribue = monParticipant?.potRecu ?? false;
              const canRequest = peutEchanger && !monTourDistribue;

              return (
                <tr
                  key={p.id_membre_groupe}
                  className={`transition ${
                    monTour ? "bg-brand-50 dark:bg-brand-900/20" : isActuel ? "bg-emerald-50 dark:bg-emerald-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">
                    #{p.ordre}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isPasse ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : isActuel ? (
                        <Circle className="h-4 w-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`font-medium ${monTour ? "text-brand-600 dark:text-brand-400" : "text-gray-900 dark:text-gray-100"}`}>
                        {p.nom}
                        {monTour && <span className="ml-1 text-xs text-brand-500">(vous)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {isPasse ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">✓ Pot versé</span>
                    ) : isActuel ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">🔵 Tour actuel</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">⏳ À venir</span>
                    )}
                  </td>
                  {!cycleTermine && !isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {canRequest && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-xs text-blue-600 hover:bg-blue-50"
                          onClick={() => setCibleChoisie(p)}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          Échanger
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
