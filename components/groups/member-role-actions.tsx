"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type MemberRoleActionsProps = {
  groupId: string;
  memberId: string;
  currentRole: "ADMIN" | "MEMBRE";
  isSelf: boolean;
  canManage: boolean;
};

export function MemberRoleActions({
  groupId,
  memberId,
  currentRole,
  isSelf,
  canManage,
}: MemberRoleActionsProps) {
  const router = useRouter();
  const [pendingRole, setPendingRole] = React.useState<"ADMIN" | "MEMBRE" | null>(null);

  const updateRole = (role: "ADMIN" | "MEMBRE") => {
    if (!canManage || isSelf || role === currentRole) return;

    setPendingRole(role);
    fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | null
          | { ok?: boolean; error?: string };

        if (!res.ok) {
          toast.error(body?.error ?? "Erreur lors de la mise a jour du role.");
          return;
        }

        toast.success("Role mis a jour.");
        router.refresh();
      })
      .finally(() => setPendingRole(null));
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={currentRole === "ADMIN" ? "default" : "outline"}
        disabled={!canManage || isSelf || pendingRole !== null}
        onClick={() => updateRole("ADMIN")}
      >
        Admin
      </Button>
      <Button
        type="button"
        size="sm"
        variant={currentRole === "MEMBRE" ? "default" : "outline"}
        disabled={!canManage || isSelf || pendingRole !== null}
        onClick={() => updateRole("MEMBRE")}
      >
        Membre
      </Button>
      {isSelf ? (
        <span className="text-xs text-muted-foreground">Vous</span>
      ) : null}
    </div>
  );
}
