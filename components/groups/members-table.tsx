"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { MemberRoleActions } from "@/components/groups/member-role-actions";
import { DownloadReleveButton } from "@/components/groups/download-releve-button";

const STATUT_VISUEL_CONFIG = {
  VERT:   { dot: "bg-emerald-500", label: "À jour",    title: "Membre à jour — aucune pénalité ni amende en attente" },
  ORANGE: { dot: "bg-rose-500",    label: "En retard", title: "Membre en retard" }, // ORANGE traité comme ROUGE
  ROUGE:  { dot: "bg-rose-500",    label: "En retard", title: "Membre en retard sur ses paiements" },
};

function StatutBadge({ statut }: { statut: "VERT" | "ORANGE" | "ROUGE" }) {
  // ORANGE est traité comme ROUGE (2 statuts seulement)
  const key = statut === "ORANGE" ? "ROUGE" : statut;
  const config = STATUT_VISUEL_CONFIG[key] ?? STATUT_VISUEL_CONFIG.VERT;
  return (
    <span
      title={config.title}
      className={`inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full ${config.dot}`}
    />
  );
}
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type MemberRow = {
  id_membre_groupe: string;
  role: "ADMIN" | "MEMBRE";
  statut_adhesion: string;
  statut_visuel: string;
  date_adhesion: string | Date;
  user: {
    id_user: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    photo_de_profil?: string | null;
  };
};

type MembersTableProps = {
  groupId: string;
  currentUserId: string;
  canManage: boolean;
  members: MemberRow[];
};

export function MembersTable({ groupId, currentUserId, canManage, members }: MembersTableProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<MemberRow | null>(null);
  const [pendingRemoval, setPendingRemoval] = React.useState(false);
  const [pendingApproval, setPendingApproval] = React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = React.useState<string | null>(null);

  const doRemove = (memberId: string, isSelfLeave = false) => {
    if (pendingRemoval) return;
    setPendingRemoval(true);

    fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: "DELETE",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | null
          | { ok?: boolean; error?: string };

        if (!res.ok) {
          toast.error(body?.error ?? "Erreur lors de la suppression du membre.");
          return;
        }

        if (isSelfLeave) {
          toast.success("Vous avez quitté le groupe.");
          router.push("/dashboard");
        } else {
          toast.success("Membre retiré du groupe.");
          router.refresh();
        }
      })
      .finally(() => {
        setPendingRemoval(false);
        setConfirmLeave(false);
        setConfirmRemoveId(null);
      });
  };

  const handleRemove = (memberId: string) => setConfirmRemoveId(memberId);
  const handleLeave = () => setConfirmLeave(true);

  const handleApprove = (memberId: string) => {
    if (pendingApproval) return;
    setPendingApproval(true);

    fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut_adhesion: "ACTIF" }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | null
          | { ok?: boolean; error?: string };

        if (!res.ok) {
          toast.error(body?.error ?? "Erreur lors de la validation.");
          return;
        }

        toast.success("Membre reintegre.");
        router.refresh();
      })
      .finally(() => setPendingApproval(false));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border-light bg-surface-container-lowest shadow-card">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-border-light bg-surface-container-low text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Nom</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Telephone</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {members.map((member) => {
              const isSelf = member.user.id_user === currentUserId;
              const canExclude = canManage && !isSelf && member.statut_adhesion !== "INACTIF";
              const canLeave = canManage && isSelf && member.statut_adhesion === "ACTIF";
              const isPending = member.statut_adhesion === "EN_ATTENTE";
              const statutVisuel = (member.statut_visuel === "ORANGE" ? "ROUGE" : member.statut_visuel) as "VERT" | "ROUGE";
              return (
                <tr key={member.id_membre_groupe} className="transition-colors hover:bg-surface-container-low">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatutBadge statut={statutVisuel} />
                      <div className="font-sans font-medium text-text-main">
                        {member.user.prenom} {member.user.nom}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{member.user.email}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{member.user.telephone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        member.role === "ADMIN"
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {member.statut_adhesion}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelected(member)}
                        aria-label="Voir les details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {/* Relevé PDF : admin pour tous, membre uniquement pour lui-même */}
                      {(canManage || isSelf) && (
                        <DownloadReleveButton
                          groupId={groupId}
                          membreId={member.id_membre_groupe}
                          membreNom={`${member.user.prenom} ${member.user.nom}`}
                          variant="icon"
                        />
                      )}
                      {canManage ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <MemberRoleActions
                            groupId={groupId}
                            memberId={member.id_membre_groupe}
                            currentRole={member.role}
                            isSelf={isSelf}
                            canManage={canManage}
                          />
                          {isPending ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={!canManage || isSelf || pendingApproval}
                              onClick={() => handleApprove(member.id_membre_groupe)}
                            >
                              Valider
                            </Button>
                          ) : null}
                          {canLeave ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              disabled={pendingRemoval}
                              onClick={handleLeave}
                            >
                              Quitter
                            </Button>
                          ) : null}
                          {canExclude ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={pendingRemoval}
                              onClick={() => handleRemove(member.id_membre_groupe)}
                            >
                              Exclure
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation — quitter le groupe (soi-même) */}
      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter le groupe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de quitter ce groupe. Cette action vous retirera de la liste
              des membres actifs. Assurez-vous qu'un autre administrateur prendra le relais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingRemoval}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={pendingRemoval}
              onClick={() => {
                const self = members.find((m) => m.user.id_user === currentUserId);
                if (self) doRemove(self.id_membre_groupe, true);
              }}
            >
              Quitter le groupe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation — exclure un autre membre */}
      <AlertDialog
        open={Boolean(confirmRemoveId)}
        onOpenChange={(open: boolean) => !open && setConfirmRemoveId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const target = members.find((m) => m.id_membre_groupe === confirmRemoveId);
                return target
                  ? `Vous êtes sur le point de retirer ${target.user.prenom} ${target.user.nom} du groupe.`
                  : "Ce membre sera retiré du groupe.";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingRemoval}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={pendingRemoval}
              onClick={() => {
                if (confirmRemoveId) doRemove(confirmRemoveId, false);
              }}
            >
              Retirer du groupe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => (!open ? setSelected(null) : null)}>
        <DialogContent className="fixed right-0 top-0 h-full w-full max-w-md translate-x-0 translate-y-0 rounded-none border-l bg-white p-6 sm:rounded-none">
          {selected ? (
            <DialogHeader>
              <DialogTitle>Details du membre</DialogTitle>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div>
                  <p className="text-xs uppercase text-gray-400">Nom complet</p>
                  <p className="font-medium text-gray-900">
                    {selected.user.prenom} {selected.user.nom}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Email</p>
                  <p>{selected.user.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Telephone</p>
                  <p>{selected.user.telephone}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Role</p>
                  <p>{selected.role}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Statut</p>
                  <p>{selected.statut_adhesion}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Date adhesion</p>
                  <p>
                    {typeof selected.date_adhesion === "string"
                      ? new Date(selected.date_adhesion).toLocaleDateString("fr-FR")
                      : selected.date_adhesion.toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </DialogHeader>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
