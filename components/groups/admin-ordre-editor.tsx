"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, Shuffle, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export type ParticipantEditable = {
  id_membre_groupe: string;
  ordre: number;
  nom: string;
  verrouille: boolean; // pot déjà distribué
};

type Props = {
  groupId: string;
  cycleId: string;
  participants: ParticipantEditable[];
};

export function AdminOrdreEditor({ groupId, cycleId, participants }: Props) {
  const router = useRouter();
  const [liste, setListe] = React.useState<ParticipantEditable[]>(
    [...participants].sort((a, b) => a.ordre - b.ordre),
  );
  const [loading, setLoading] = React.useState<string | null>(null);
  const [modifie, setModifie] = React.useState(false);

  const call = async (body: object) => {
    const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}/ordre`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
  };

  // Monter / descendre un membre dans la liste locale
  const deplacer = (idx: number, direction: "haut" | "bas") => {
    const swapIdx = direction === "haut" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= liste.length) return;
    if (liste[idx].verrouille || liste[swapIdx].verrouille) {
      toast.error("Ce tour est verrouillé (pot déjà distribué).");
      return;
    }
    const newListe = [...liste];
    [newListe[idx], newListe[swapIdx]] = [newListe[swapIdx], newListe[idx]];
    // Réaffecter les ordres
    setListe(newListe.map((p, i) => ({ ...p, ordre: i + 1 })));
    setModifie(true);
  };

  // Tirage au sort (seulement les non-verrouillés)
  const tirage = () => {
    const verrous = liste.filter((p) => p.verrouille);
    let libres = liste.filter((p) => !p.verrouille);
    // Fisher-Yates
    for (let i = libres.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [libres[i], libres[j]] = [libres[j], libres[i]];
    }
    // Reconstruire
    const newListe: ParticipantEditable[] = [];
    let libreIdx = 0;
    for (let i = 0; i < liste.length; i++) {
      if (liste[i].verrouille) {
        newListe.push({ ...verrous.find((v) => v.ordre === i + 1)!, ordre: i + 1 });
      } else {
        newListe.push({ ...libres[libreIdx], ordre: i + 1 });
        libreIdx++;
      }
    }
    setListe(newListe);
    setModifie(true);
    toast.info("Ordre mélangé. Cliquez sur « Enregistrer » pour confirmer.");
  };

  // Sauvegarder : envoyer le nouvel ordre au serveur
  const sauvegarder = async () => {
    setLoading("save");
    try {
      await call({
        action: "manuel",
        nouvelOrdre: liste.map((p) => p.id_membre_groupe),
      });
      toast.success("Ordre de passage mis à jour !");
      setModifie(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  };

  const handleTirage = async () => {
    setLoading("tirage");
    try {
      tirage();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions globales */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTirage}
          disabled={!!loading}
          className="gap-1.5"
        >
          <Shuffle className="h-4 w-4" />
          Tirage au sort
        </Button>
        {modifie && (
          <Button
            type="button"
            size="sm"
            onClick={sauvegarder}
            disabled={!!loading}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading === "save" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer l&apos;ordre
          </Button>
        )}
        {modifie && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setListe([...participants].sort((a, b) => a.ordre - b.ordre));
              setModifie(false);
            }}
          >
            Annuler
          </Button>
        )}
        {!modifie && (
          <span className="text-xs text-gray-400">Utilisez les flèches ou le tirage au sort pour modifier l&apos;ordre.</span>
        )}
      </div>

      {/* Liste réordonnée */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left w-16">Tour</th>
              <th className="px-4 py-3 text-left">Bénéficiaire</th>
              <th className="px-4 py-3 text-right">Déplacer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {liste.map((p, idx) => (
              <tr key={p.id_membre_groupe} className={`${p.verrouille ? "bg-gray-50 opacity-70 dark:bg-gray-800/40" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
                <td className="px-4 py-2.5 font-bold text-gray-700 dark:text-gray-300">
                  #{p.ordre}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {p.verrouille && <Lock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                    <span className={`font-medium ${p.verrouille ? "text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
                      {p.nom}
                    </span>
                    {p.verrouille && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        Pot versé
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {!p.verrouille && (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={idx === 0 || liste[idx - 1].verrouille || !!loading}
                        onClick={() => deplacer(idx, "haut")}
                        title="Monter"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={idx === liste.length - 1 || liste[idx + 1].verrouille || !!loading}
                        onClick={() => deplacer(idx, "bas")}
                        title="Descendre"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {liste.some((p) => p.verrouille) && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Les tours marqués « Pot versé » sont verrouillés et ne peuvent pas être déplacés.
        </p>
      )}
    </div>
  );
}
