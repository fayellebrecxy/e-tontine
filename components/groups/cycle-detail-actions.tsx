"use client";

import * as React from "react";
import {
  Banknote,
  ClipboardList,
  Eye,
  History,
  ListChecks,
  Pencil,
  Receipt,
  Users,
  Wallet,
  ArrowUpDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type PanelKey = "overview" | "edit" | "payment" | "distribution" | "history" | "allCotisations" | "participants" | "myPayments" | "ordrePassage";

type Panel = {
  key: PanelKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  adminOnly?: boolean;
};

type CycleDetailActionsProps = {
  isAdmin: boolean;
  overview: React.ReactNode;
  edit?: React.ReactNode;
  payment?: React.ReactNode;
  distribution?: React.ReactNode;
  history?: React.ReactNode;
  allCotisations?: React.ReactNode;
  participants: React.ReactNode;
  myPayments?: React.ReactNode;
  ordrePassage?: React.ReactNode;
  closeAction?: React.ReactNode;
  deleteAction?: React.ReactNode;
  backAction: React.ReactNode;
};

export function CycleDetailActions({
  isAdmin,
  overview,
  edit,
  payment,
  distribution,
  history,
  allCotisations,
  participants,
  myPayments,
  ordrePassage,
  closeAction,
  deleteAction,
  backAction,
}: CycleDetailActionsProps) {
  const panels = React.useMemo<Panel[]>(
    () => [
      { key: "overview", label: "Aperçu", icon: Eye, content: overview },
      { key: "ordrePassage", label: "Ordre de passage", icon: ArrowUpDown, content: ordrePassage },
      { key: "edit", label: "Modifier", icon: Pencil, content: edit, adminOnly: true },
      { key: "payment", label: "Cotisation", icon: Banknote, content: payment, adminOnly: true },
      { key: "distribution", label: "Verser pot", icon: Wallet, content: distribution, adminOnly: true },
      { key: "history", label: "Historique", icon: History, content: history, adminOnly: true },
      { key: "allCotisations", label: "Versements membres", icon: ListChecks, content: allCotisations, adminOnly: true },
      { key: "participants", label: "Participants", icon: Users, content: participants },
      { key: "myPayments", label: "Mes versements", icon: Receipt, content: myPayments },
    ],
    [allCotisations, distribution, edit, history, myPayments, ordrePassage, overview, participants, payment],
  );

  const visiblePanels = panels.filter((panel) => panel.content && (!panel.adminOnly || isAdmin));
  const [activePanel, setActivePanel] = React.useState<PanelKey>("overview");
  const active = visiblePanels.find((panel) => panel.key === activePanel) ?? visiblePanels[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {visiblePanels.map((panel) => {
          const Icon = panel.icon;

          return (
            <Button
              key={panel.key}
              type="button"
              variant={active?.key === panel.key ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setActivePanel(panel.key)}
            >
              <Icon className="h-4 w-4" />
              {panel.label}
            </Button>
          );
        })}
        {isAdmin ? closeAction : null}
        {isAdmin ? deleteAction : null}
        <div className="ml-auto">{backAction}</div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{active?.label}</h2>
        </div>
        {active?.content}
      </div>
    </div>
  );
}
