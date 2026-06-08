"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  groupId: string;
  reunionId: string;
  titre: string;
  canDelete: boolean;
  canCancel: boolean;
};

export function DeleteReunionButton({ groupId, reunionId, titre, canDelete, canCancel }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    const res = await fetch(`/api/groups/${groupId}/reunions/${reunionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "ANNULEE" }),
    });
    setCancelling(false);
    const body = await res.json().catch(() => null) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) { toast.error(body?.error ?? "Impossible d'annuler."); return; }
    toast.success("Réunion annulée. Elle reste visible dans l'historique.");
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/groups/${groupId}/reunions/${reunionId}`, {
      method: "DELETE",
    });
    setDeleting(false);
    const body = await res.json().catch(() => null) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) { toast.error(body?.error ?? "Impossible de supprimer."); return; }
    toast.success("🗑 Réunion supprimée.");
    router.push(`/dashboard/groups/${groupId}/reunions`);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-50">
              <Ban className="h-4 w-4 mr-1" />
              Annuler la réunion
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler cette réunion ?</AlertDialogTitle>
              <AlertDialogDescription>
                La réunion <strong>"{titre}"</strong> sera marquée comme annulée et restera
                consultable dans l'historique des réunions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Retour</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={cancelling}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {cancelling ? "Annulation…" : "Oui, annuler"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600">
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
              <AlertDialogDescription>
                À utiliser seulement si la réunion <strong>"{titre}"</strong> a été créée par erreur.
                Elle disparaîtra complètement et ne sera pas visible dans l'historique.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Retour</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {deleting ? "Suppression…" : "Oui, supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
