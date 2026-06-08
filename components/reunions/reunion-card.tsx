"use client";

import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type ReunionCardProps = {
  reunion: {
    id_reunion: string;
    titre: string;
    date_reunion: string | Date;
    lieu?: string | null;
    type_reunion: "ORDINAIRE" | "EXTRAORDINAIRE" | "URGENCE";
    statut: "PLANIFIEE" | "TERMINEE" | "ANNULEE";
    montant_amende?: string | number | null;
    presences: { statut_presence: string; amende_payee?: boolean }[];
  };
  groupId: string;
  isAdmin: boolean;
  devise: string;
};

const TYPE_LABELS = {
  ORDINAIRE: { label: "Ordinaire", className: "bg-blue-100 text-blue-700" },
  EXTRAORDINAIRE: { label: "Extraordinaire", className: "bg-purple-100 text-purple-700" },
  URGENCE: { label: "Urgence", className: "bg-red-100 text-red-700" },
};

const STATUT_LABELS = {
  PLANIFIEE: { label: "Planifiée", className: "bg-emerald-100 text-emerald-700" },
  TERMINEE: { label: "Terminée", className: "bg-gray-100 text-gray-600" },
  ANNULEE: { label: "Annulée", className: "bg-rose-100 text-rose-700" },
};

export function ReunionCard({ reunion, groupId, isAdmin, devise }: ReunionCardProps) {
  const date = new Date(reunion.date_reunion);
  const isPast = date < new Date();
  const isToday = date.toDateString() === new Date().toDateString();

  const typeInfo = TYPE_LABELS[reunion.type_reunion];
  const statutInfo = STATUT_LABELS[reunion.statut];

  // Ma présence (membre)
  const myPresence = !isAdmin && reunion.presences[0];
  const PRESENCE_LABELS: Record<string, { label: string; className: string }> = {
    PRESENT: { label: "✅ Présent", className: "text-emerald-600" },
    ABSENT: { label: "❌ Absent", className: "text-rose-600" },
    EXCUSE: { label: "🟡 Excusé", className: "text-amber-600" },
    DEMANDE_EXCUSE: { label: "🟠 Excuse demandée", className: "text-orange-600" },
    EN_RETARD: { label: "⏰ En retard", className: "text-orange-600" },
  };

  return (
    <Link
      href={`/dashboard/groups/${groupId}/reunions/${reunion.id_reunion}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Badge variant="secondary" className={typeInfo.className + " text-[11px]"}>
              {typeInfo.label}
            </Badge>
            <Badge variant="secondary" className={statutInfo.className + " text-[11px]"}>
              {statutInfo.label}
            </Badge>
            {isToday && reunion.statut === "PLANIFIEE" && (
              <Badge variant="secondary" className="bg-brand-100 text-brand-700 text-[11px] animate-pulse">
                Aujourd'hui !
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{reunion.titre}</h3>

          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {date.toLocaleDateString("fr-FR", {
                weekday: "short", day: "2-digit", month: "short", year: "numeric",
              })}{" "}
              à{" "}
              {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {reunion.lieu && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {reunion.lieu}
              </span>
            )}
          </div>

          {isAdmin && reunion.presences.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" />
              {reunion.presences.filter((p) => p.statut_presence === "PRESENT").length} présents sur{" "}
              {reunion.presences.length}
            </div>
          )}

          {!isAdmin && myPresence && (
            <p className={`mt-2 text-xs font-medium ${PRESENCE_LABELS[myPresence.statut_presence]?.className ?? "text-gray-500"}`}>
              Ma présence :{" "}
              {PRESENCE_LABELS[myPresence.statut_presence]?.label ?? myPresence.statut_presence}
              {myPresence.statut_presence === "ABSENT" && reunion.montant_amende && !myPresence.amende_payee && (
                <span className="ml-2 text-rose-600">
                  — Amende : {Number(reunion.montant_amende).toLocaleString("fr-FR")} {devise} ⚠️
                </span>
              )}
            </p>
          )}

          {!isAdmin && !myPresence && reunion.statut === "PLANIFIEE" && (
            <p className="mt-2 text-xs text-gray-400 italic">Présence non encore enregistrée</p>
          )}
        </div>

        <span className="text-xs text-gray-400 whitespace-nowrap">
          {isPast && reunion.statut === "PLANIFIEE" ? "⏳ En attente" : ""}
        </span>
      </div>
    </Link>
  );
}
