"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type CloseCycleButtonProps = {
  groupId: string;
  cycleId: string;
};

export function CloseCycleButton({ groupId, cycleId }: CloseCycleButtonProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const closeCycle = async () => {
    if (pending) return;

    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir clôturer ce cycle ?\n\nCette action mettra fin au cycle immédiatement. Les paiements déjà enregistrés seront conservés.",
    );
    if (!confirmed) return;

    setPending(true);

    const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}`, {
      method: "PATCH",
    });

    const body = (await res.json().catch(() => null)) as
      | null
      | { ok?: boolean; error?: string };

    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible de cloturer le cycle.");
      setPending(false);
      return;
    }

    toast.success("✅ Cycle clôturé avec succès.");
    setPending(false);
    router.refresh();
  };

  return (
    <Button type="button" variant="destructive" size="sm" onClick={closeCycle} disabled={pending}>
      {pending ? "Clôture en cours…" : "Clôturer le cycle"}
    </Button>
  );
}
