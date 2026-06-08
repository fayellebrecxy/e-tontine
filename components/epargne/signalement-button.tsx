"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
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

export function SignalementEpargneButton({
  groupId,
  movementId,
}: {
  groupId: string;
  movementId: string;
}) {
  const router = useRouter();
  const [motif, setMotif] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const submit = async () => {
    setPending(true);
    const res = await fetch(`/api/groups/${groupId}/epargne/mouvements/${movementId}/signalements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motif }),
    });
    setPending(false);

    const body = await res.json().catch(() => null) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible de signaler cette opération.");
      return;
    }

    toast.success("Signalement envoyé aux administrateurs.");
    setMotif("");
    setOpen(false);
    router.refresh();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="text-amber-700 hover:bg-amber-50">
          <Flag className="mr-1 h-4 w-4" />
          Signaler
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Signaler une anomalie ?</AlertDialogTitle>
          <AlertDialogDescription>
            Expliquez ce qui ne correspond pas : montant, date, motif ou opération inconnue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <textarea
          value={motif}
          onChange={(event) => setMotif(event.target.value)}
          rows={4}
          placeholder="Ex : je n'ai pas effectué ce retrait..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={submit} disabled={pending} className="bg-amber-600 hover:bg-amber-700">
            {pending ? "Envoi..." : "Envoyer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
