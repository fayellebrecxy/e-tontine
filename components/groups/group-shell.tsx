"use client";

import * as React from "react";

import { Button } from "../ui/button";
import { GroupNav } from "./group-nav";

export type GroupShellGroup = {
  id_groupe: string;
  nom: string;
  description?: string | null;
  devise?: string;
};

export type GroupShellMembership = {
  id_membre_groupe: string;
  role: "ADMIN" | "MEMBRE";
  statut_adhesion: "ACTIF" | "INACTIF" | "EN_ATTENTE";
  statut_visuel: string;
  date_adhesion: string;
  date_depart?: string | null;
};

type GroupSummaryBody = {
  ok?: boolean;
  groupe?: GroupShellGroup;
  membership?: GroupShellMembership;
};

function GroupShellSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="hidden h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900 lg:block" />
        <div className="min-h-64 min-w-0">
          {children ?? (
            <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
          )}
        </div>
      </div>
    </div>
  );
}

export function GroupShell({
  groupId,
  children,
  initialGroup = null,
  initialMembership = null,
}: {
  groupId: string;
  children: React.ReactNode;
  initialGroup?: GroupShellGroup | null;
  initialMembership?: GroupShellMembership | null;
}) {
  const [group, setGroup] = React.useState<GroupShellGroup | null>(initialGroup);
  const [membership, setMembership] = React.useState<GroupShellMembership | null>(
    initialMembership,
  );
  const [loading, setLoading] = React.useState(!initialMembership);
  const [pendingRejoin, setPendingRejoin] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const summaryRes = await fetch(`/api/groups/${groupId}`, { cache: "no-store" });
        const summaryBody = (await summaryRes.json().catch(() => null)) as
          | null
          | GroupSummaryBody;

        if (!isMounted) return;

        if (summaryRes.ok && summaryBody?.ok) {
          if (summaryBody.groupe) {
            setGroup(summaryBody.groupe);
          }
          if (summaryBody.membership) {
            setMembership(summaryBody.membership);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  const requestRejoin = () => {
    if (pendingRejoin || membership?.statut_adhesion !== "INACTIF") return;
    setPendingRejoin(true);

    fetch(`/api/groups/${groupId}/rejoin`, { method: "POST" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | null
          | { ok?: boolean; error?: string; pending?: boolean };

        if (!res.ok || !body?.ok) {
          return;
        }

        setMembership((current) =>
          current ? { ...current, statut_adhesion: "EN_ATTENTE" } : current,
        );
      })
      .finally(() => setPendingRejoin(false));
  };

  const isActive = membership?.statut_adhesion === "ACTIF";
  const isInactive = membership?.statut_adhesion === "INACTIF";
  const isPending = membership?.statut_adhesion === "EN_ATTENTE";

  if (loading && !membership) {
    return <GroupShellSkeleton />;
  }

  if (!loading && membership && !isActive) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {group?.nom ?? "Groupe"}
          </h1>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {isInactive ? (
              <p>Vous avez été exclu de ce groupe.</p>
            ) : isPending ? (
              <p>Votre demande de réintégration est en attente.</p>
            ) : (
              <p>Accès limité.</p>
            )}
          </div>
          {isInactive && (
            <Button
              type="button"
              className="mt-6 w-full"
              disabled={pendingRejoin}
              onClick={requestRejoin}
            >
              Demander à réintégrer
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!isActive) {
    return <GroupShellSkeleton />;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Groupe
            </p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
              {group?.nom}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {membership?.role === "ADMIN" ? "Administrateur" : "Membre"}
            </span>
            {group?.devise ? (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {group.devise}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <GroupNav groupId={groupId} isAdmin={membership?.role === "ADMIN"} />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
