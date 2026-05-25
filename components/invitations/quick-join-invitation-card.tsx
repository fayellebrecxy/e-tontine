"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  code: string;
};

export function QuickJoinInvitationCard({ code }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const joinNow = () => {
    startTransition(async () => {
      const res = await fetch(`/api/invitations/${encodeURIComponent(code)}/join`, {
        method: "POST",
      });

      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; error?: string; code?: string; pending?: boolean; already_member?: boolean };

      if (!res.ok || !body?.ok) {
        if (res.status === 409 && body?.code === "PROFILE_INCOMPLETE") {
          toast.error("Votre profil est incomplet. Merci de remplir le formulaire ci-dessous.");
          return;
        }

        toast.error(body?.error ?? "Impossible de rejoindre le groupe.");
        return;
      }

      if (body.pending) {
        toast.success("Demande envoyee. Un admin doit valider votre retour.");
        return;
      }

      if (body.already_member) {
        toast.info("Vous etes deja membre du groupe.");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      toast.success("Vous avez rejoint le groupe.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rejoindre le groupe</CardTitle>
        <CardDescription>Votre profil est complet. Rejoignez le groupe en un clic.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={joinNow} disabled={pending}>
          {pending ? "Connexion..." : "Rejoindre maintenant"}
        </Button>
      </CardContent>
    </Card>
  );
}
