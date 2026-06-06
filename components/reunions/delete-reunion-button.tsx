"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
};

export function DeleteReunionButton({ groupId, reunionId, titre }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/groups/${groupId}/reunions/${reunionId}`, {
      method: "DELETE",
    });
    setDeleting(false);
    const body = await res.json().catch(() => null) as null | { ok?: boolean };
    if (!res.ok || !body?.ok) { toast.error("Impossible de supprimer."); return; }
    toast.success("🗑 Réunion supprimée.");
    router.push(`/dashboard/groups/${groupId}/reunions`);
    router.refresh();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600">
          <Trash2 className="h-4 w-4 mr-1" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette réunion ?</AlertDialogTitle>
          <AlertDialogDescription>
            La réunion <strong>"{titre}"</strong> et toutes les présences associées seront
            définitivement supprimées. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
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
  );
}
