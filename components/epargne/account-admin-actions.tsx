"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
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

type AccountStatus = "ACTIF" | "BLOQUE" | "CLOTURE";

export function EpargneAccountAdminActions({
  groupId,
  accountId,
  status,
  movementsCount,
  canDelete,
  compact = false,
}: {
  groupId: string;
  accountId: string;
  status: AccountStatus;
  movementsCount: number;
  canDelete: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  const updateStatus = async (action: "CLOTURER" | "REOUVRIR") => {
    setPending(action);
    const res = await fetch(`/api/groups/${groupId}/epargne/accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPending(null);

    const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible de modifier le compte.");
      return;
    }

    toast.success(action === "CLOTURER" ? "Compte clôturé." : "Compte réactivé.");
    router.refresh();
  };

  const deleteAccount = async () => {
    setPending("SUPPRIMER");
    const res = await fetch(`/api/groups/${groupId}/epargne/accounts/${accountId}`, {
      method: "DELETE",
    });
    setPending(null);

    const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible de supprimer le compte.");
      return;
    }

    toast.success("Compte épargne supprimé.");
    router.push(`/dashboard/groups/${groupId}/epargne`);
    router.refresh();
  };

  if (status === "CLOTURE") {
    return (
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        variant="outline"
        disabled={pending === "REOUVRIR"}
        onClick={() => updateStatus("REOUVRIR")}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        {pending === "REOUVRIR" ? "Réactivation..." : "Réactiver"}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" size={compact ? "sm" : "default"} variant="outline">
            <Archive className="mr-2 h-4 w-4" />
            Clôturer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clôturer ce compte épargne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte restera consultable avec tout son historique, mais aucun dépôt ni retrait ne pourra
              être enregistré tant qu'il sera clôturé. Le solde doit être à zéro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => updateStatus("CLOTURER")}
              disabled={pending === "CLOTURER"}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {pending === "CLOTURER" ? "Clôture..." : "Clôturer le compte"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {canDelete && movementsCount === 0 ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              size={compact ? "sm" : "default"}
              variant="outline"
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce compte vide ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est réservée aux comptes créés par erreur, sans solde et sans mouvement. Dès qu'un
                historique existe, le compte doit être clôturé au lieu d'être supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAccount}
                disabled={pending === "SUPPRIMER"}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {pending === "SUPPRIMER" ? "Suppression..." : "Supprimer définitivement"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
