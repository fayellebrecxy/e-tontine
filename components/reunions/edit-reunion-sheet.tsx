"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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
  reunionId: string;
  devise: string;
  initial: {
    titre: string;
    description: string | null;
    date_reunion: string; // ISO string
    lieu: string | null;
    type_reunion: "ORDINAIRE" | "EXTRAORDINAIRE" | "URGENCE";
    montant_amende: number | null;
  };
};

export function EditReunionSheet({ groupId, reunionId, devise, initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Préparer date et heure séparées depuis l'ISO string
  const initDate = new Date(initial.date_reunion);
  const toLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const toLocalTimeStr = (d: Date) => {
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${min}`;
  };

  const [titre, setTitre] = React.useState(initial.titre);
  const [description, setDescription] = React.useState(initial.description ?? "");
  const [dateReunion, setDateReunion] = React.useState(toLocalDateStr(initDate));
  const [heureReunion, setHeureReunion] = React.useState(toLocalTimeStr(initDate));
  const [lieu, setLieu] = React.useState(initial.lieu ?? "");
  const [typeReunion, setTypeReunion] = React.useState<"ORDINAIRE" | "EXTRAORDINAIRE" | "URGENCE">(initial.type_reunion);
  const [montantAmende, setMontantAmende] = React.useState(initial.montant_amende?.toString() ?? "");

  const submit = async () => {
    if (!titre.trim()) { toast.error("Le titre est requis."); return; }
    if (!dateReunion || !heureReunion) { toast.error("La date et l'heure sont requises."); return; }

    // Construire la date en heure locale → UTC
    const [y, mo, d] = dateReunion.split("-").map(Number);
    const [h, min] = heureReunion.split(":").map(Number);
    const dateObj = new Date(y, mo - 1, d, h, min);
    if (dateObj.getTime() <= Date.now()) {
      toast.error("La date de la réunion doit être dans le futur.");
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}/reunions/${reunionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titre: titre.trim(),
        description: description.trim() || null,
        date_reunion: dateObj.toISOString(),
        lieu: lieu.trim() || null,
        type_reunion: typeReunion,
        montant_amende: montantAmende ? Number(montantAmende) : null,
      }),
    });
    setSubmitting(false);

    const body = await res.json().catch(() => null) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible de modifier la réunion.");
      return;
    }

    toast.success("✅ Réunion modifiée avec succès !");
    setOpen(false);
    router.refresh();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-4 w-4" />
          Modifier
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>✏️ Modifier la réunion</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-titre">Titre *</Label>
            <Input
              id="edit-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre de la réunion"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-type">Type de réunion</Label>
            <select
              id="edit-type"
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
              <Label htmlFor="edit-date">Date *</Label>
              <Input
                id="edit-date"
                type="date"
                value={dateReunion}
                onChange={(e) => setDateReunion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-heure">Heure *</Label>
              <Input
                id="edit-heure"
                type="time"
                value={heureReunion}
                onChange={(e) => setHeureReunion(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-lieu">Lieu</Label>
            <Input
              id="edit-lieu"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              placeholder="Lieu de la réunion"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Ordre du jour / Description</Label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Points à aborder…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
            <Label htmlFor="edit-amende" className="text-amber-800 font-medium">
              💰 Amende d'absence ({devise})
            </Label>
            <Input
              id="edit-amende"
              type="number"
              min={0}
              step="100"
              value={montantAmende}
              onChange={(e) => setMontantAmende(e.target.value)}
              placeholder="0 = aucune amende"
              className="w-40"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Modification…" : "✅ Enregistrer"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
