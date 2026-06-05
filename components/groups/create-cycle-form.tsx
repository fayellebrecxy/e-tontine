"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MemberItem = {
  id_membre_groupe: string;
  role: "ADMIN" | "MEMBRE";
  statut_adhesion: string;
  user: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
};

type MembersApiBody = {
  ok?: boolean;
  members?: MemberItem[];
};

type CreateCycleFormProps = {
  groupId: string;
  canManage: boolean;
  onSuccess?: () => void;
};

export function CreateCycleForm({ groupId, canManage, onSuccess }: CreateCycleFormProps) {
  const router = useRouter();
  const [members, setMembers] = React.useState<MemberItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [nomCycle, setNomCycle] = React.useState("");
  const [dureeTour, setDureeTour] = React.useState("30");
  const [montant, setMontant] = React.useState("");
  const [penaltyActive, setPenaltyActive] = React.useState(false);
  const [penaltyType, setPenaltyType] = React.useState<"FIXE" | "POURCENTAGE" | "PROGRESSIVE">(
    "FIXE",
  );
  const [penaltyValue, setPenaltyValue] = React.useState("");
  const [order, setOrder] = React.useState<string[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const res = await fetch(`/api/groups/${groupId}/members`, { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as null | MembersApiBody;

      if (!isMounted) return;

      if (res.ok && body?.ok && body.members) {
        const actifs = body.members.filter((member) => member.statut_adhesion === "ACTIF");
        setMembers(actifs);
        setOrder(actifs.map((member) => member.id_membre_groupe));
      }

      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  const toggleMember = (id: string) => {
    setOrder((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    setOrder((current) => {
      if (current.length === members.length) {
        return [];
      }
      return members.map((member) => member.id_membre_groupe);
    });
  };

  const moveInOrder = (id: string, direction: -1 | 1) => {
    setOrder((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const shuffleOrder = () => {
    setOrder((current) => {
      const next = [...current];
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  };

  const submit = async () => {
    if (!canManage) return;

    const duree = Number(dureeTour);
    const montantValue = Number(montant);

    if (!nomCycle.trim() || nomCycle.trim().length < 2) {
      toast.error("Le nom du cycle est requis (minimum 2 caractères).");
      return;
    }

    if (!Number.isInteger(duree) || duree <= 0) {
      toast.error("La durée du tour doit être un nombre entier positif (ex. : 30 jours).");
      return;
    }

    if (!Number.isFinite(montantValue) || montantValue <= 0) {
      toast.error("Le montant de la cotisation doit être un nombre positif.");
      return;
    }

    if (order.length === 0) {
      toast.error("Sélectionnez au moins un participant pour ce cycle.");
      return;
    }

    const penaltyValueNumber = Number(penaltyValue);
    if (penaltyActive && (!Number.isFinite(penaltyValueNumber) || penaltyValueNumber <= 0)) {
      toast.error("Veuillez saisir une valeur de pénalité valide et positive.");
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}/cycles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom_cycle: nomCycle.trim(),
        duree_tour_de_gain: duree,
        montant_cotisation: montantValue,
        participants: order,
        penalty_active: penaltyActive,
        penalty_type: penaltyActive ? penaltyType : undefined,
        penalty_value: penaltyActive ? penaltyValueNumber : undefined,
      }),
    });

    const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible de demarrer le cycle.");
      setSubmitting(false);
      return;
    }

    toast.success(`✅ Cycle "${nomCycle.trim()}" démarré avec succès !`);
    setSubmitting(false);
    router.refresh();
    onSuccess?.();
    // Réinitialiser le formulaire
    setNomCycle("");
    setMontant("");
    setOrder(members.map((m) => m.id_membre_groupe));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Démarrer un nouveau cycle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canManage ? <p className="text-sm text-muted-foreground">Seul l'administrateur peut créer un cycle.</p> : null}
        {canManage ? (
          <p className="text-sm text-muted-foreground">
            Un cycle définit une période de collecte où chaque membre cotise à chaque tour. Le pot est remis au bénéficiaire du tour en cours, selon l'ordre défini ci-dessous.
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="nom-cycle">Nom du cycle</Label>
          <Input
            id="nom-cycle"
            value={nomCycle}
            onChange={(event) => setNomCycle(event.target.value)}
            placeholder="Ex. : Cycle Juin 2025"
            disabled={!canManage}
          />
          <p className="text-xs text-muted-foreground">Donnez un nom clair pour identifier ce cycle facilement.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="duree-tour">Durée d'un tour (en jours)</Label>
            <Input
              id="duree-tour"
              type="number"
              min={1}
              value={dureeTour}
              onChange={(event) => setDureeTour(event.target.value)}
              disabled={!canManage}
            />
            <p className="text-xs text-muted-foreground">Tous les membres cotisent pendant ce nombre de jours avant que le pot passe au suivant.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="montant-cotisation">Montant de la cotisation</Label>
            <Input
              id="montant-cotisation"
              type="number"
              min={0}
              step="0.01"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
              disabled={!canManage}
            />
            <p className="text-xs text-muted-foreground">Montant que chaque membre doit verser à chaque tour.</p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <label className="flex items-center justify-between gap-3 text-sm font-medium text-gray-900">
            <span>Activer les pénalités de retard</span>
            <input
              type="checkbox"
              checked={penaltyActive}
              onChange={(event) => setPenaltyActive(event.target.checked)}
              disabled={!canManage}
            />
          </label>

          {penaltyActive ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mode-penalite">Mode de calcul</Label>
                <select
                  id="mode-penalite"
                  value={penaltyType}
                  onChange={(event) =>
                    setPenaltyType(event.target.value as "FIXE" | "POURCENTAGE" | "PROGRESSIVE")
                  }
                  disabled={!canManage}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="FIXE">Montant fixe (ex. : 500 XAF appliqué une fois)</option>
                  <option value="POURCENTAGE">Pourcentage de la cotisation (ex. : 5%)</option>
                  <option value="PROGRESSIVE">Montant par jour de retard (ex. : 100 XAF/jour)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valeur-penalite">
                  {penaltyType === "POURCENTAGE" ? "Taux (en %)" : penaltyType === "PROGRESSIVE" ? "Montant par jour (XAF)" : "Montant fixe (XAF)"}
                </Label>
                <Input
                  id="valeur-penalite"
                  type="number"
                  min={0}
                  step="0.01"
                  value={penaltyValue}
                  onChange={(event) => setPenaltyValue(event.target.value)}
                  placeholder={
                    penaltyType === "FIXE"
                      ? "Ex. 1000"
                      : penaltyType === "POURCENTAGE"
                        ? "Ex. 5"
                        : "Ex. 100"
                  }
                  disabled={!canManage}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Participants du cycle</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleAll}
              disabled={!canManage}
            >
              {order.length === members.length ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
          </div>
          {loading ? (
            <p className="text-xs text-muted-foreground">Chargement...</p>
          ) : members.length ? (
            <div className="space-y-2">
              {members.map((member) => {
                const checked = order.includes(member.id_membre_groupe);
                return (
                  <label
                    key={member.id_membre_groupe}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700">
                      {member.user.prenom} {member.user.nom}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMember(member.id_membre_groupe)}
                      disabled={!canManage}
                    />
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Aucun membre actif.</p>
          )}
          <p className="text-xs text-muted-foreground">
            {order.length} sélectionné(s) sur {members.length} membre(s) actif(s). Seuls les membres sélectionnés participeront à ce cycle.
          </p>
        </div>

        {order.length ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ordre de bénéfice (qui reçoit le pot en premier ?)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={shuffleOrder}
                disabled={!canManage}
              >
                🎲 Tirage au sort
              </Button>
            </div>
            <div className="space-y-2">
              {order.map((id, index) => {
                const member = members.find((item) => item.id_membre_groupe === id);
                if (!member) return null;

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {index + 1}. {member.user.prenom} {member.user.nom}
                      </p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => moveInOrder(id, -1)}
                        disabled={!canManage || index === 0}
                      >
                        Monter
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => moveInOrder(id, 1)}
                        disabled={!canManage || index === order.length - 1}
                      >
                        Descendre
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          ⚠️ Une fois démarré, le cycle commence immédiatement. La date de fin est calculée automatiquement selon la durée et le nombre de participants.
        </p>
        <Button type="button" onClick={submit} disabled={!canManage || submitting}>
          {submitting ? "Démarrage en cours…" : "🚀 Démarrer le cycle"}
        </Button>
      </CardContent>
    </Card>
  );
}
