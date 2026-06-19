"use client";

import * as React from "react";

import { Crown, Landmark, PanelLeftClose, PanelLeftOpen, ShieldAlert } from "lucide-react";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-border-light bg-surface-container-lowest p-5 shadow-card">
        <div className="h-5 w-48 animate-pulse rounded bg-surface-container-high" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-surface-container" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="hidden h-64 animate-pulse rounded-2xl bg-surface-container-lowest lg:block" />
        <div className="min-h-64 min-w-0">
          {children ?? <div className="h-64 animate-pulse rounded-2xl bg-surface-container-lowest" />}
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
  // Menu du groupe fermé par défaut → le contenu occupe toute la largeur.
  const [navOpen, setNavOpen] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const summaryRes = await fetch(`/api/groups/${groupId}`, { cache: "no-store" });
        const summaryBody = (await summaryRes.json().catch(() => null)) as null | GroupSummaryBody;

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
        const body = (await res.json().catch(() => null)) as null | {
          ok?: boolean;
          error?: string;
          pending?: boolean;
        };

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
        <div className="w-full max-w-md rounded-2xl border border-border-light bg-surface-container-lowest p-6 text-center shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-heading text-xl font-bold text-text-main">
            {group?.nom ?? "Groupe"}
          </h1>
          <div className="mt-3 font-sans text-sm leading-6 text-on-surface-variant">
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
    <div className="space-y-4">
      <header className="overflow-hidden rounded-2xl border border-border-light bg-surface-container-lowest shadow-card">
        <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_auto]">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-sans text-xs font-semibold uppercase tracking-wide text-text-muted">
                Groupe
              </p>
              <h1 className="mt-1 truncate font-heading text-xl font-bold tracking-tight text-text-main sm:text-2xl">
                {group?.nom}
              </h1>
              {group?.description ? (
                <p className="mt-2 max-w-3xl font-sans text-sm leading-6 text-on-surface-variant">
                  {group.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              aria-expanded={navOpen}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-light bg-surface-container-low px-3 py-1.5 font-sans text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            >
              {navOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              <span className="hidden sm:inline">{navOpen ? "Masquer le menu" : "Menu du groupe"}</span>
              <span className="sm:hidden">Menu</span>
            </button>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
              <Crown className="mr-1 h-3.5 w-3.5" />
              {membership?.role === "ADMIN" ? "Administrateur" : "Membre"}
            </Badge>
            {group?.devise ? (
              <Badge variant="outline" className="border-border-light bg-surface-container-low text-on-surface-variant">
                {group.devise}
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      <div className={navOpen ? "grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]" : "block"}>
        {navOpen ? (
          <aside className="rounded-2xl border border-border-light bg-surface-container-lowest p-3 shadow-card lg:sticky lg:top-20 lg:self-start">
            <GroupNav groupId={groupId} isAdmin={membership?.role === "ADMIN"} />
          </aside>
        ) : null}
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
