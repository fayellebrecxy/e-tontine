"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

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

function buildInviteLink(code: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/invitations/${encodeURIComponent(code)}`;
}

export function GenerateInvitationCard({ groupId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [inviteCode, setInviteCode] = React.useState("");
  const [inviteLink, setInviteLink] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const linkInputRef = React.useRef<HTMLInputElement>(null);

  const applyInvitation = (invitation: InvitationResponse) => {
    setInviteCode(invitation.code);
    setInviteLink(invitation.lien || buildInviteLink(invitation.code));
    setLoadError(null);
  };

  React.useEffect(() => {
    let active = true;

    const loadCurrentInvitation = async () => {
      setLoading(true);
      setLoadError(null);

      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/invitations`, {
        credentials: "same-origin",
      });
      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; error?: string; invitation?: InvitationResponse };

      if (!active) return;

      if (!res.ok || !body?.ok || !body.invitation?.code) {
        const message = body?.error ?? "Erreur lors du chargement du lien d'invitation.";
        setLoadError(message);
      } else {
        applyInvitation(body.invitation);
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
        credentials: "same-origin",
      });

      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; error?: string; invitation?: InvitationResponse };

      if (!res.ok || !body?.ok || !body.invitation?.code) {
        toast.error(body?.error ?? "Erreur lors de la génération du lien d'invitation.");
        return;
      }

      applyInvitation(body.invitation);
      router.refresh();
    });
  };

  const copyLink = async () => {
    const link =
      inviteLink ||
      (inviteCode ? buildInviteLink(inviteCode) : "") ||
      linkInputRef.current?.value.trim() ||
      "";

    if (!link) {
      toast.error("Aucun lien d'invitation disponible. Réinitialisez le lien puis réessayez.");
      return;
    }

    const copiedOk = await copyTextToClipboard(link, linkInputRef.current);
    if (copiedOk) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }

    linkInputRef.current?.focus();
    linkInputRef.current?.select();
  };

  const selectLink = () => {
    linkInputRef.current?.focus();
    linkInputRef.current?.select();
  };

  const displayLink =
    inviteLink || (inviteCode ? buildInviteLink(inviteCode) : "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>
          Partagez un lien d&apos;invitation permanent, puis réinitialisez-le si nécessaire.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {loadError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={resetInvitation} disabled={pending || loading}>
            {pending ? "Réinitialisation..." : "Réinitialiser le lien"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={copyLink}
            disabled={loading || (!displayLink && !inviteCode)}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copié !" : "Copier le lien"}
          </Button>
        </div>

        <Input
          ref={linkInputRef}
          value={displayLink}
          readOnly
          onFocus={selectLink}
          onClick={selectLink}
          className="cursor-text font-mono text-xs sm:text-sm"
          placeholder={loading ? "Chargement du lien..." : "Le lien d'invitation apparaîtra ici."}
        />
        <p className="text-xs text-muted-foreground">
          Cliquez dans le champ pour sélectionner le lien, ou utilisez le bouton « Copier le lien ».
        </p>
      </CardContent>
    </Card>
  );
}
