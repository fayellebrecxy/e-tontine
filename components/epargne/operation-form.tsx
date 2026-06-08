"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BanknoteArrowDown, BanknoteArrowUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OperationType = "DEPOT" | "RETRAIT";

export function OperationEpargneForm({
  groupId,
  accountId,
  devise,
}: {
  groupId: string;
  accountId: string;
  devise: string;
}) {
  const router = useRouter();
  const [type, setType] = React.useState<OperationType>("DEPOT");
  const [montant, setMontant] = React.useState("");
  const [motif, setMotif] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(montant);

    setPending(true);
    const res = await fetch(`/api/groups/${groupId}/epargne/accounts/${accountId}/operations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, montant: amount, motif }),
    });
    setPending(false);

    const body = await res.json().catch(() => null) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible d'enregistrer l'opération.");
      return;
    }

    toast.success(type === "DEPOT" ? "Dépôt enregistré." : "Retrait enregistré.");
    setMontant("");
    setMotif("");
    router.refresh();
  };

  return (
    <form id="operation-epargne" onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Enregistrer un dépôt ou un retrait</h2>
          <p className="text-xs text-slate-500">
            Sélectionnez l'opération, saisissez le montant reçu ou remis, puis ajoutez un motif.
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1 text-sm dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setType("DEPOT")}
            className={`flex items-center justify-center gap-1 rounded px-3 py-2 font-medium transition ${
              type === "DEPOT" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-white dark:text-slate-300"
            }`}
          >
            <BanknoteArrowDown className="h-4 w-4" />
            Dépôt
          </button>
          <button
            type="button"
            onClick={() => setType("RETRAIT")}
            className={`flex items-center justify-center gap-1 rounded px-3 py-2 font-medium transition ${
              type === "RETRAIT" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:bg-white dark:text-slate-300"
            }`}
          >
            <BanknoteArrowUp className="h-4 w-4" />
            Retrait
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor="montant-epargne">
            Montant ({devise})
          </label>
          <Input
            id="montant-epargne"
            type="number"
            min={1}
            step="1"
            value={montant}
            onChange={(event) => setMontant(event.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor="motif-epargne">
            Motif
          </label>
          <Input
            id="motif-epargne"
            value={motif}
            onChange={(event) => setMotif(event.target.value)}
            placeholder="Ex : dépôt reçu en espèces"
          />
        </div>
        <Button type="submit" disabled={pending} className="self-end">
          {pending ? "Enregistrement..." : type === "DEPOT" ? "Enregistrer le dépôt" : "Enregistrer le retrait"}
        </Button>
      </div>
    </form>
  );
}
