"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function PretParametresForm({
  groupId,
  initial,
}: {
  groupId: string;
  initial: {
    anciennete_min_jours: number;
    plafond_pct_banque: number;
    modele_contrat_avaliste: string;
    refus_sans_epargne: boolean;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState(initial);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/prets/parametres`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success("Paramètres enregistrés.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/dashboard/groups/${groupId}/prets`}
        className="inline-flex items-center gap-1 text-sm text-slate-600"
      >
        <ArrowLeft className="size-4" /> Retour
      </Link>
      <h1 className="text-xl font-bold">Paramètres des prêts</h1>
      <p className="text-sm text-slate-600">
        Ces règles s&apos;appliquent à tout le groupe. Seul l&apos;administrateur peut les modifier.
      </p>

      <div>
        <Label>Ancienneté minimum (jours)</Label>
        <Input
          type="number"
          min={0}
          value={form.anciennete_min_jours}
          onChange={(e) => setForm({ ...form, anciennete_min_jours: Number(e.target.value) })}
        />
        <p className="mt-1 text-xs text-slate-500">
          Nombre de jours depuis l&apos;adhésion au groupe avant de pouvoir demander un prêt. Mettez{" "}
          <strong>0</strong> pour ne pas exiger d&apos;ancienneté.
        </p>
      </div>

      <div>
        <Label>Plafond prêt (% de la banque)</Label>
        <Input
          type="number"
          min={1}
          max={100}
          value={form.plafond_pct_banque}
          onChange={(e) => setForm({ ...form, plafond_pct_banque: Number(e.target.value) })}
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.refus_sans_epargne}
          onCheckedChange={(v) => setForm({ ...form, refus_sans_epargne: v })}
        />
        <Label>Exiger avalistes si épargne = 0</Label>
      </div>

      <div>
        <Label>Modèle contrat avaliste</Label>
        <Textarea
          rows={6}
          value={form.modele_contrat_avaliste}
          onChange={(e) => setForm({ ...form, modele_contrat_avaliste: e.target.value })}
        />
        <p className="mt-1 text-xs text-slate-500">
          Variables : {"{{avaliste_nom}}"}, {"{{emprunteur_nom}}"}, {"{{montant}}"}, {"{{duree}}"}, {"{{taux}}"}, {"{{date_fin}}"}
        </p>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
        Enregistrer
      </Button>
    </form>
  );
}
