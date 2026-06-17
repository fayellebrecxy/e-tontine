"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
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

export const CANCELLABLE_PRET_STATUTS = [
  "EN_ATTENTE_ANALYSE",
  "EN_ATTENTE_AVALISTES",
  "EN_ATTENTE_CONFIRMATION_AVALISTES",
  "APPROUVE",
] as const;

export function PretCancelButton({
  groupId,
  pretId,
  size = "sm",
  redirectAfter = false,
  onSuccess,
}: {
  groupId: string;
  pretId: string;
  size?: "sm" | "default";
  redirectAfter?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function cancelDemande() {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/prets/${pretId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Impossible d'annuler la demande.");
      }

      toast.success("Demande de prêt annulée.");
      setOpen(false);
      onSuccess?.();

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
          variant="outline"
          size={size}
          className="text-rose-700 hover:text-rose-800"
          onClick={(e) => e.stopPropagation()}
        >
          <XCircle className="mr-1 size-4" />
          Annuler
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler cette demande de prêt ?</AlertDialogTitle>
          <AlertDialogDescription>
            La demande sera retirée du circuit de traitement. Les avalistes et l&apos;administrateur
            seront notifiés. Vous pourrez ensuite la supprimer définitivement.
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
              void cancelDemande();
            }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                Annulation…
              </>
            ) : (
              "Oui, annuler"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
