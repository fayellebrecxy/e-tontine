"use client";

import * as React from "react";
import { Eye } from "lucide-react";

import { MemberRoleActions } from "@/components/groups/member-role-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const PAGE_SIZE = 10;

export function MembersTable({ groupId, currentUserId, canManage, members }: MembersTableProps) {
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<MemberRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageItems = members.slice(pageStart, pageStart + PAGE_SIZE);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Telephone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {pageItems.map((member) => {
              const isSelf = member.user.id_user === currentUserId;
              return (
                <tr key={member.id_membre_groupe} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {member.user.prenom} {member.user.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{member.user.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{member.user.telephone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        member.role === "ADMIN"
                          ? "bg-brand-50 text-brand-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
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
                      {canManage ? (
                        <MemberRoleActions
                          groupId={groupId}
                          memberId={member.id_membre_groupe}
                          currentRole={member.role}
                          isSelf={isSelf}
                          canManage={canManage}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Page {page} sur {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Precedent
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Suivant
          </Button>
        </div>
      </div>

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
