"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileMoneyPayButton } from "@/components/payments/mobile-money-checkout";

type Props = {
  groupId: string;
  reunionId: string;
  statut: "PLANIFIEE" | "TERMINEE" | "ANNULEE";
  myPresence: {
    id_presence: string;
    statut_presence: "PRESENT" | "ABSENT" | "EXCUSE" | "DEMANDE_EXCUSE" | "EN_RETARD";
    amende_payee: boolean;
    note_absence: string | null;
  } | null;
  montantAmende: number;
  devise: string;
  dateReunion: string;
  memberTelephone?: string;
};

const PRESENCE_DISPLAY: Record<string, { label: string; badgeClass: string }> = {
  PRESENT: { label: "✅ Présent(e)", badgeClass: "bg-emerald-100 text-emerald-700" },
  ABSENT: { label: "❌ Absent(e)", badgeClass: "bg-rose-100 text-rose-700" },
  EXCUSE: { label: "🟡 Excusé(e)", badgeClass: "bg-amber-100 text-amber-700" },
  DEMANDE_EXCUSE: { label: "🟠 Excuse demandée", badgeClass: "bg-orange-100 text-orange-700" },
  EN_RETARD: { label: "⏰ En retard", badgeClass: "bg-orange-100 text-orange-700" },
};

export function ReunionDetailMembre({
  groupId,
  reunionId,
  statut,
  myPresence,
  montantAmende,
  devise,
  dateReunion,
  memberTelephone,
}: Props) {
  const router = useRouter();
  const [showExcuseForm, setShowExcuseForm] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const isUpcoming = new Date(dateReunion) > new Date() && statut === "PLANIFIEE";
  const alreadyExcused = myPresence?.statut_presence === "EXCUSE" || myPresence?.statut_presence === "DEMANDE_EXCUSE";

  const sendExcuse = async () => {
    if (!note.trim() || note.trim().length < 5) {
      toast.error("Veuillez expliquer la raison de votre absence (min. 5 caractères).");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}/reunions/${reunionId}/presences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_absence: note.trim() }),
    });
    setSubmitting(false);
    const body = await res.json().catch(() => null) as null | { ok?: boolean; error?: string };
    if (!res.ok || !body?.ok) { toast.error(body?.error ?? "Erreur."); return; }
    toast.success("🟡 Votre excuse a été envoyée à l'administrateur.");
    setShowExcuseForm(false);
    setNote("");
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-white">Ma présence</h2>

      {/* Présence non encore enregistrée */}
      {!myPresence && statut === "TERMINEE" && (
        <p className="text-sm text-muted-foreground italic">
          Votre présence n'a pas été enregistrée pour cette réunion.
        </p>
      )}

      {/* Statut de présence */}
      {myPresence && (
        <div className="space-y-3">
          {/* Badge de présence */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Mon statut :</span>
            <Badge
              variant="secondary"
              className={`font-semibold ${PRESENCE_DISPLAY[myPresence.statut_presence]?.badgeClass}`}
            >
              {PRESENCE_DISPLAY[myPresence.statut_presence]?.label}
            </Badge>
          </div>

          {myPresence.note_absence && (
            <p className="text-sm text-gray-500 italic">
              Motif enregistré : <span className="not-italic text-gray-700">"{myPresence.note_absence}"</span>
            </p>
          )}

          {/* Amende — visible seulement si absent ou en retard */}
          {(myPresence.statut_presence === "ABSENT" || myPresence.statut_presence === "EN_RETARD") && (
            montantAmende > 0 ? (
              myPresence.amende_payee ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-1">
                  <p className="text-sm font-semibold text-emerald-700">✅ Amende payée</p>
                  <p className="text-xs text-emerald-600">
                    Votre amende de{" "}
                    <strong>{montantAmende.toLocaleString("fr-FR")} {devise}</strong>{" "}
                    a bien été enregistrée comme payée.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-rose-700">⚠️ Amende en attente de paiement</p>
                    <p className="text-xs text-rose-600">
                      Vous avez une amende de{" "}
                      <strong>{montantAmende.toLocaleString("fr-FR")} {devise}</strong>{" "}
                      à régler.
                    </p>
                  </div>
                  <MobileMoneyPayButton
                    groupId={groupId}
                    contextType="AMENDE_REUNION"
                    contextId={myPresence.id_presence}
                    metadata={{ reunionId }}
                    montant={montantAmende}
                    montantLabel={`${montantAmende.toLocaleString("fr-FR")} ${devise}`}
                    defaultTelephone={memberTelephone}
                    onSuccess={() => router.refresh()}
                    buttonSize="sm"
                  >
                    Payer mon amende
                  </MobileMoneyPayButton>
                </div>
              )
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-500">
                  ℹ️ Aucune amende n'a été définie pour cette réunion.
                </p>
              </div>
            )
          )}

          {/* Message si présent, excusé ou en attente : pas d'amende appliquée pour l'instant */}
          {(myPresence.statut_presence === "PRESENT"
            || myPresence.statut_presence === "EXCUSE"
            || myPresence.statut_presence === "DEMANDE_EXCUSE") && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-700 font-medium">
                {myPresence.statut_presence === "PRESENT"
                  ? "✅ Vous étiez présent(e) — aucune amende."
                  : myPresence.statut_presence === "EXCUSE"
                    ? "🟡 Vous avez été excusé(e) — aucune amende."
                    : "🟠 Votre demande d'excuse est en attente de validation."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bouton pour signaler une excuse (avant la réunion) */}
      {isUpcoming && !alreadyExcused && (
        <div className="space-y-2">
          {!showExcuseForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowExcuseForm(true)}
            >
              🟡 Signaler mon absence à l'avance
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Raison de votre absence :</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Ex : Voyage professionnel, urgence familiale…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowExcuseForm(false); setNote(""); }}
                >
                  Annuler
                </Button>
                <Button type="button" size="sm" onClick={sendExcuse} disabled={submitting}>
                  {submitting ? "Envoi…" : "📤 Envoyer"}
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Votre administrateur sera notifié. Il décidera du statut final.
          </p>
        </div>
      )}

      {alreadyExcused && statut === "PLANIFIEE" && (
        <p className="text-sm text-amber-600 font-medium">
          🟠 Vous avez déjà signalé votre absence. L'administrateur doit encore décider du statut final.
        </p>
      )}
    </div>
  );
}
