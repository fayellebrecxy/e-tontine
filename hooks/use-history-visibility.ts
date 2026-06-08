"use client";

import * as React from "react";
import { toast } from "sonner";

type HistoryVisibilityResponse = {
  ok?: boolean;
  hiddenTargetIds?: string[];
  error?: string;
};

export function useHistoryVisibility(scope: string) {
  const [hiddenTargetIds, setHiddenTargetIds] = React.useState<Set<string>>(() => new Set());
  const [loading, setLoading] = React.useState(true);
  const [pendingTargetId, setPendingTargetId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history-visibility?scope=${encodeURIComponent(scope)}`, {
        cache: "no-store",
      });
      const body = (await res.json().catch(() => null)) as HistoryVisibilityResponse | null;

      if (res.ok && body?.ok && body.hiddenTargetIds) {
        setHiddenTargetIds(new Set(body.hiddenTargetIds));
      }
    } finally {
      setLoading(false);
    }
  }, [scope]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const setHidden = React.useCallback(
    async (targetId: string, hidden: boolean, options?: { successMessage?: string }) => {
      if (pendingTargetId) return false;
      setPendingTargetId(targetId);

      const previous = hiddenTargetIds;
      const next = new Set(hiddenTargetIds);

      if (hidden) {
        next.add(targetId);
      } else {
        next.delete(targetId);
      }

      setHiddenTargetIds(next);

      try {
        const res = await fetch("/api/history-visibility", {
          method: hidden ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope, targetId }),
        });
        const body = (await res.json().catch(() => null)) as HistoryVisibilityResponse | null;

        if (!res.ok || !body?.ok) {
          setHiddenTargetIds(previous);
          toast.error(body?.error ?? "Impossible de mettre à jour l'affichage.");
          return false;
        }

        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        return true;
      } catch {
        setHiddenTargetIds(previous);
        toast.error("Impossible de mettre à jour l'affichage.");
        return false;
      } finally {
        setPendingTargetId(null);
      }
    },
    [hiddenTargetIds, pendingTargetId, scope],
  );

  const restoreAll = React.useCallback(
    async (successMessage = "Historique réaffiché.") => {
      if (pendingTargetId) return false;
      setPendingTargetId("__all__");

      const previous = hiddenTargetIds;
      setHiddenTargetIds(new Set());

      try {
        const res = await fetch("/api/history-visibility", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope, clearScope: true }),
        });
        const body = (await res.json().catch(() => null)) as HistoryVisibilityResponse | null;

        if (!res.ok || !body?.ok) {
          setHiddenTargetIds(previous);
          toast.error(body?.error ?? "Impossible de réafficher l'historique.");
          return false;
        }

        toast.success(successMessage);
        return true;
      } catch {
        setHiddenTargetIds(previous);
        toast.error("Impossible de réafficher l'historique.");
        return false;
      } finally {
        setPendingTargetId(null);
      }
    },
    [hiddenTargetIds, pendingTargetId, scope],
  );

  return {
    hiddenTargetIds,
    loading,
    pendingTargetId,
    isHidden: React.useCallback(
      (targetId: string) => hiddenTargetIds.has(targetId),
      [hiddenTargetIds],
    ),
    hide: React.useCallback(
      (targetId: string, successMessage = "Historique masqué.") =>
        setHidden(targetId, true, { successMessage }),
      [setHidden],
    ),
    restore: React.useCallback(
      (targetId: string, successMessage = "Historique réaffiché.") =>
        setHidden(targetId, false, { successMessage }),
      [setHidden],
    ),
    restoreAll,
    refresh,
  };
}
