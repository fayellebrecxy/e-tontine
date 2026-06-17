"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";

export function PretDeleteButton({
  groupId,
  pretId,
  size = "sm",
  redirectAfter = true,
}: {
  groupId: string;
  pretId: string;
  size?: "sm" | "default";
  redirectAfter?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function deleteDemande() {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/prets/${pretId}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Impossible de supprimer la demande.");
      }

      toast.success("Demande supprimée.");
      setOpen(false);

      if (redirectAfter) {
        router.push(`/dashboard/groups/${groupId}/prets`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={size}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="mr-1 size-4" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer définitivement cette demande ?</AlertDialogTitle>
          <AlertDialogDescription>
            La demande annulée sera effacée de la liste. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Retour</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            className="bg-rose-600 hover:bg-rose-700"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              void deleteDemande();
            }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                Suppression…
              </>
            ) : (
              "Oui, supprimer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
