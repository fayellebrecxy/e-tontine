"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type DeleteCycleButtonProps = {
  groupId: string;
  cycleId: string;
  cycleName: string;
};

export function DeleteCycleButton({ groupId, cycleId, cycleName }: DeleteCycleButtonProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const deleteCycle = async () => {
    if (pending) return;

    const confirmed = window.confirm(
      `Supprimer le cycle "${cycleName}" et toutes ses données associées ?`,
    );
    if (!confirmed) return;

    const confirmationText = window.prompt('Tapez "SUPPRIMER" pour confirmer.');
    if (confirmationText !== "SUPPRIMER") {
      toast.error("Suppression annulée.");
      return;
    }

    try {
      setPending(true);
      const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

      if (!res.ok || !body?.ok) {
        toast.error(body?.error ?? "Impossible de supprimer le cycle.");
        return;
      }

      toast.success("Cycle supprimé.");
      router.push(`/dashboard/groups/${groupId}/cycles`);
      router.refresh();
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      className="gap-1.5"
      onClick={deleteCycle}
      disabled={pending}
    >
      {pending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Supprimer
    </Button>
  );
}
