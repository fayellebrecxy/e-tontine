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
  statut_adhesion: string;
  user: {
    nom: string;
    prenom: string;
  };
};

type EditCycleFormProps = {
  groupId: string;
  cycleId: string;
  canManage: boolean;
  initialCycle: {
    nom_cycle: string;
    date_debut: string;
    date_fin: string;
    duree_tour_de_gain: number;
    montant_cotisation: number;
    penalites_activees: boolean;
    mode_penalite: "FIXE" | "POURCENTAGE" | "PROGRESSIVE" | null;
    valeur_penalite: number | null;
  };
  initialOrder: string[];
};

type MembersApiBody = {
  ok?: boolean;
  members?: MemberItem[];
};

function toDateInputValue(date: string) {
  return new Date(date).toISOString().slice(0, 10);
}

export function EditCycleForm({
  groupId,
  cycleId,
  canManage,
  initialCycle,
  initialOrder,
}: EditCycleFormProps) {
  const router = useRouter();
  const [members, setMembers] = React.useState<MemberItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [nomCycle, setNomCycle] = React.useState(initialCycle.nom_cycle);
  const [dateDebut, setDateDebut] = React.useState(toDateInputValue(initialCycle.date_debut));
  const [dateFin, setDateFin] = React.useState(toDateInputValue(initialCycle.date_fin));
  const [dureeTour, setDureeTour] = React.useState(String(initialCycle.duree_tour_de_gain));
  const [montant, setMontant] = React.useState(String(initialCycle.montant_cotisation));
  const [penaltyActive, setPenaltyActive] = React.useState(initialCycle.penalites_activees);
  const [penaltyType, setPenaltyType] = React.useState<"FIXE" | "POURCENTAGE" | "PROGRESSIVE">(
    initialCycle.mode_penalite ?? "FIXE",
  );
  const [penaltyValue, setPenaltyValue] = React.useState(
    initialCycle.valeur_penalite ? String(initialCycle.valeur_penalite) : "",
  );
  const [order, setOrder] = React.useState<string[]>(initialOrder);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const res = await fetch(`/api/groups/${groupId}/members`, { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as null | MembersApiBody;

      if (!isMounted) return;

      if (res.ok && body?.ok && body.members) {
        const actifs = body.members.filter((member) => member.statut_adhesion === "ACTIF");
        setMembers(actifs);
        setOrder((current) => {
          const activeIds = new Set(actifs.map((member) => member.id_membre_groupe));
          const preserved = current.filter((id) => activeIds.has(id));
          const missing = actifs
            .map((member) => member.id_membre_groupe)
            .filter((id) => !preserved.includes(id));
          return [...preserved, ...missing];
        });
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

  const submit = async () => {
    if (!canManage || submitting) return;

    const duree = Number(dureeTour);
    const montantValue = Number(montant);
    const penaltyValueNumber = Number(penaltyValue);

    if (!nomCycle.trim() || nomCycle.trim().length < 2) {
      toast.error("Le nom du cycle est requis.");
      return;
    }

    if (!dateDebut || !dateFin) {
      toast.error("Les dates de debut et de fin sont requises.");
      return;
    }

    if (new Date(dateFin) <= new Date(dateDebut)) {
      toast.error("La date de fin doit etre apres la date de debut.");
      return;
    }

    if (!Number.isInteger(duree) || duree <= 0) {
      toast.error("La duree du tour doit etre un entier positif.");
      return;
    }

    if (!Number.isFinite(montantValue) || montantValue <= 0) {
      toast.error("Le montant de la cotisation est requis.");
      return;
    }

    if (order.length === 0) {
      toast.error("Selectionnez au moins un participant.");
      return;
    }

    if (penaltyActive && (!Number.isFinite(penaltyValueNumber) || penaltyValueNumber <= 0)) {
      toast.error("La valeur de la penalite est requise.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_cycle: nomCycle.trim(),
          date_debut: dateDebut,
          date_fin: dateFin,
          duree_tour_de_gain: duree,
          montant_cotisation: montantValue,
          participants: order,
          penalty_active: penaltyActive,
          penalty_type: penaltyActive ? penaltyType : null,
          penalty_value: penaltyActive ? penaltyValueNumber : null,
        }),
      });

      const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

      if (!res.ok || !body?.ok) {
        toast.error(body?.error ?? "Impossible de mettre a jour le cycle.");
        return;
      }

      toast.success("Cycle mis a jour.");
      router.refresh();
    } catch {
      toast.error("Erreur reseau. Reessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCycle = async () => {
    if (!canManage || deleting || submitting) return;

    const confirmed = window.confirm(
      "Supprimer ce cycle et toutes ses donnees associees (participants, cotisations, penalites) ?",
    );
    if (!confirmed) return;

    const confirmationText = window.prompt('Tapez "SUPPRIMER" pour confirmer.');
    if (confirmationText !== "SUPPRIMER") {
      toast.error("Suppression annulee.");
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}`, {
        method: "DELETE",
      });

      const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

      if (!res.ok || !body?.ok) {
        toast.error(body?.error ?? "Impossible de supprimer le cycle.");
        return;
      }

      toast.success("Cycle supprime.");
      router.push(`/dashboard/groups/${groupId}/cycles`);
      router.refresh();
    } catch {
      toast.error("Erreur reseau. Reessayez.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifier le cycle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-nom-cycle">Nom du cycle</Label>
          <Input
            id="edit-nom-cycle"
            value={nomCycle}
            onChange={(event) => setNomCycle(event.target.value)}
            disabled={!canManage}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-date-debut">Date de debut</Label>
            <Input
              id="edit-date-debut"
              type="date"
              value={dateDebut}
              onChange={(event) => setDateDebut(event.target.value)}
              disabled={!canManage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-date-fin">Date de fin</Label>
            <Input
              id="edit-date-fin"
              type="date"
              value={dateFin}
              onChange={(event) => setDateFin(event.target.value)}
              disabled={!canManage}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-duree-tour">Duree du tour (jours)</Label>
            <Input
              id="edit-duree-tour"
              type="number"
              min={1}
              value={dureeTour}
              onChange={(event) => setDureeTour(event.target.value)}
              disabled={!canManage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-montant-cotisation">Montant de la cotisation</Label>
            <Input
              id="edit-montant-cotisation"
              type="number"
              min={0}
              step="0.01"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
              disabled={!canManage}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <label className="flex items-center justify-between gap-3 text-sm font-medium text-gray-900">
            <span>Activer les penalites de retard</span>
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
                <Label htmlFor="edit-mode-penalite">Mode de calcul</Label>
                <select
                  id="edit-mode-penalite"
                  value={penaltyType}
                  onChange={(event) =>
                    setPenaltyType(event.target.value as "FIXE" | "POURCENTAGE" | "PROGRESSIVE")
                  }
                  disabled={!canManage}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="FIXE">Montant fixe</option>
                  <option value="POURCENTAGE">Pourcentage de la cotisation</option>
                  <option value="PROGRESSIVE">Montant par jour de retard</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-valeur-penalite">
                  {penaltyType === "POURCENTAGE" ? "Pourcentage" : "Montant"}
                </Label>
                <Input
                  id="edit-valeur-penalite"
                  type="number"
                  min={0}
                  step="0.01"
                  value={penaltyValue}
                  onChange={(event) => setPenaltyValue(event.target.value)}
                  disabled={!canManage}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Participants actifs</Label>
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
            {order.length} selectionnes / {members.length} actifs
          </p>
        </div>

        {order.length ? (
          <div className="space-y-2">
            <Label>Ordre des beneficiaires</Label>
            <div className="space-y-2">
              {order.map((id, index) => {
                const member = members.find((item) => item.id_membre_groupe === id);
                if (!member) return null;

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {index + 1}. {member.user.prenom} {member.user.nom}
                      </p>
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

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={submit} disabled={!canManage || loading || submitting}>
            {submitting ? "Mise a jour..." : "Mettre a jour"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={deleteCycle}
            disabled={!canManage || loading || submitting || deleting}
          >
            {deleting ? "Suppression..." : "Supprimer le cycle"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
