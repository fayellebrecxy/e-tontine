"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PiggyBank, UsersRound } from "lucide-react";
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

type CreateResponse = {
  ok?: boolean;
  created?: boolean;
  createdCount?: number;
  error?: string;
};

export function CreateEpargneAccountButton({
  groupId,
  memberId,
  label = "Ouvrir un compte",
  size = "sm",
}: {
  groupId: string;
  memberId: string;
  label?: string;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const createAccount = async () => {
    setPending(true);
    const res = await fetch(`/api/groups/${groupId}/epargne/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CREATE_ONE", memberId }),
    });
    setPending(false);

    const body = (await res.json().catch(() => null)) as CreateResponse | null;
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible d'ouvrir le compte épargne.");
      return;
    }

    toast.success(body.created ? "Compte épargne ouvert." : "Ce membre avait déjà un compte épargne.");
    router.refresh();
  };

  return (
    <Button type="button" size={size} onClick={createAccount} disabled={pending}>
      <PiggyBank className="mr-2 h-4 w-4" />
      {pending ? "Ouverture..." : label}
    </Button>
  );
}

export function CreateAllEpargneAccountsButton({
  groupId,
  membersWithoutAccountCount,
}: {
  groupId: string;
  membersWithoutAccountCount: number;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const createAll = async () => {
    if (membersWithoutAccountCount === 0) {
      toast.info("Tous les membres actifs ont déjà un compte épargne.");
      return;
    }

    setPending(true);
    const res = await fetch(`/api/groups/${groupId}/epargne/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CREATE_ALL" }),
    });
    setPending(false);

    const body = (await res.json().catch(() => null)) as CreateResponse | null;
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible d'ouvrir les comptes.");
      return;
    }

    toast.success(`${body.createdCount ?? 0} compte(s) épargne ouvert(s).`);
    router.refresh();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" disabled={pending}>
          <UsersRound className="mr-2 h-4 w-4" />
          {pending ? "Création..." : "Créer pour tous"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Créer un compte épargne pour tous ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action ouvre un compte uniquement aux membres actifs qui n'en ont pas encore. Les membres
            qui ont déjà un compte ne seront pas modifiés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={createAll} className="bg-emerald-600 hover:bg-emerald-700">
            Confirmer la création
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
