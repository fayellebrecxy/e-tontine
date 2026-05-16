"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  groupId: string;
};

type InvitationResponse = {
  id_invitation: string | null;
  code: string;
  date_creation: string | null;
  id_groupe: string;
  lien: string;
};

export function GenerateInvitationCard({ groupId }: Props) {
  const [pending, startTransition] = React.useTransition();
  const [loading, setLoading] = React.useState(true);
  const [inviteLink, setInviteLink] = React.useState("");

  React.useEffect(() => {
    let active = true;

    const loadCurrentInvitation = async () => {
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/invitations`);
      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; error?: string; invitation?: InvitationResponse };

      if (!active) return;

      if (!res.ok || !body?.ok || !body.invitation?.lien) {
        toast.error(body?.error ?? "Erreur lors du chargement du lien d’invitation.");
      } else {
        setInviteLink(body.invitation.lien);
      }

      setLoading(false);
    };

    void loadCurrentInvitation();
    return () => {
      active = false;
    };
  }, [groupId]);

  const resetInvitation = () => {
    startTransition(async () => {
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/invitations`, {
        method: "POST",
      });

      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; error?: string; invitation?: InvitationResponse };

      if (!res.ok || !body?.ok || !body.invitation?.lien) {
        toast.error(body?.error ?? "Erreur lors de la génération du lien d’invitation.");
        return;
      }

      setInviteLink(body.invitation.lien);
      toast.success("Lien d’invitation réinitialisé.");
    });
  };

  const copyLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Lien copié.");
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>
          Partagez un lien d’invitation permanent, puis réinitialisez-le si nécessaire.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={resetInvitation} disabled={pending || loading}>
            {pending ? "Réinitialisation..." : "Réinitialiser le lien"}
          </Button>
          <Button type="button" variant="outline" onClick={copyLink} disabled={!inviteLink || loading}>
            Copier
          </Button>
        </div>

        <Input
          value={inviteLink}
          readOnly
          placeholder={loading ? "Chargement du lien..." : "Le lien d’invitation apparaîtra ici."}
        />
      </CardContent>
    </Card>
  );
}
