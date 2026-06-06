"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Props = {
  groupId: string;
  devise: string;
};

export function CreateReunionSheet({ groupId, devise }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [titre, setTitre] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dateReunion, setDateReunion] = React.useState("");
  const [heureReunion, setHeureReunion] = React.useState("18:00");
  const [lieu, setLieu] = React.useState("");
  const [typeReunion, setTypeReunion] = React.useState<"ORDINAIRE" | "EXTRAORDINAIRE" | "URGENCE">("ORDINAIRE");
  const [montantAmende, setMontantAmende] = React.useState("");

  const reset = () => {
    setTitre("");
    setDescription("");
    setDateReunion("");
    setHeureReunion("18:00");
    setLieu("");
    setTypeReunion("ORDINAIRE");
    setMontantAmende("");
  };

  const submit = async () => {
    if (!titre.trim()) { toast.error("Le titre est requis."); return; }
    if (!dateReunion) { toast.error("La date est requise."); return; }

    const dateISO = `${dateReunion}T${heureReunion}:00.000Z`;
    const amende = montantAmende ? Number(montantAmende) : 0;

    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}/reunions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titre: titre.trim(),
        description: description.trim() || undefined,
        date_reunion: dateISO,
        lieu: lieu.trim() || undefined,
        type_reunion: typeReunion,
        montant_amende: amende > 0 ? amende : undefined,
      }),
    });

    const body = await res.json().catch(() => null) as null | { ok?: boolean; error?: string };
    setSubmitting(false);

    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible de planifier la réunion.");
      return;
    }

    toast.success(`✅ Réunion "${titre.trim()}" planifiée avec succès !`);
    reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <CalendarPlus className="h-4 w-4" />
          Planifier une réunion
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>📅 Planifier une réunion</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Réunion mensuelle de juin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de réunion</Label>
            <select
              id="type"
              value={typeReunion}
              onChange={(e) => setTypeReunion(e.target.value as typeof typeReunion)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ORDINAIRE">Ordinaire</option>
              <option value="EXTRAORDINAIRE">Extraordinaire</option>
              <option value="URGENCE">Urgence</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={dateReunion}
                onChange={(e) => setDateReunion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heure">Heure *</Label>
              <Input
                id="heure"
                type="time"
                value={heureReunion}
                onChange={(e) => setHeureReunion(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lieu">Lieu</Label>
            <Input
              id="lieu"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              placeholder="Ex : Chez Jean-Pierre / Salle paroissiale"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description / Ordre du jour</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Points à aborder lors de la réunion..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
            <Label htmlFor="amende" className="text-amber-800 font-medium">
              💰 Amende d'absence (optionnel)
            </Label>
            <p className="text-xs text-amber-700">
              Montant appliqué aux membres absents non excusés. Laissez 0 si aucune amende.
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="amende"
                type="number"
                min={0}
                step="100"
                value={montantAmende}
                onChange={(e) => setMontantAmende(e.target.value)}
                placeholder="0"
                className="w-32"
              />
              <span className="text-sm font-medium text-amber-800">{devise}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { reset(); setOpen(false); }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Planification…" : "✅ Planifier"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
