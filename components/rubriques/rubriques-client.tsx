"use client";

import * as React from "react";
import { Plus, Trash2, Banknote, History, WalletCards, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createRubrique, deleteRubrique } from "@/lib/actions/rubriques";
import { RubriqueAssistant } from "./rubrique-assistant";
import { PaiementForm } from "./paiement-form";
import { RetraitForm } from "./retrait-form";
import { VersementPotForm } from "./versement-pot-form";
import { RubriqueDetails } from "./rubrique-details";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Props = {
  groupId: string;
  rubriques: any[];
  members: any[];
  isAdmin: boolean;
  adminId: string;
  activeCycles: any[];
};

export function RubriquesClient({
  groupId,
  rubriques,
  members,
  isAdmin,
  adminId,
  activeCycles,
}: Props) {
  const [showAssistant, setShowAssistant] = React.useState(false);
  const [showPaiement, setShowPaiement] = React.useState<string | null>(null);
  const [showDetails, setShowDetails] = React.useState<string | null>(null);
  const [showRetrait, setShowRetrait] = React.useState(false);
  const [showVersementPot, setShowVersementPot] = React.useState(false);

  // Calculs globaux pour la caisse des rubriques
  const totalCollecteRubriques = rubriques.reduce((sum, r) => 
    sum + r.paiements.reduce((s: number, p: any) => s + parseFloat(p.montant_paye), 0), 0);
  
  const totalRetraitRubriques = rubriques.reduce((sum, r) => 
    sum + r.retraits.reduce((s: number, ret: any) => s + parseFloat(ret.montant), 0), 0);
  
  const soldeGlobalRubriques = totalCollecteRubriques - totalRetraitRubriques;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-brand-50 border-brand-100">
          <CardHeader className="py-3 px-4">
            <CardDescription className="text-brand-600 font-semibold uppercase text-xs">Fonds Collectés</CardDescription>
            <CardTitle className="text-2xl">{totalCollecteRubriques.toLocaleString()} XAF</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardHeader className="py-3 px-4">
            <CardDescription className="text-red-600 font-semibold uppercase text-xs">Total Retraits</CardDescription>
            <CardTitle className="text-2xl">{totalRetraitRubriques.toLocaleString()} XAF</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardHeader className="py-3 px-4">
            <CardDescription className="text-green-600 font-semibold uppercase text-xs">Solde Disponible</CardDescription>
            <CardTitle className="text-2xl">{soldeGlobalRubriques.toLocaleString()} XAF</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Rubriques de cotisation</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => setShowRetrait(true)} variant="outline">
              <History className="mr-2 h-4 w-4" />
              Retrait
            </Button>
            <Button onClick={() => setShowVersementPot(true)} variant="outline">
              <WalletCards className="mr-2 h-4 w-4" />
              Versement Pot
            </Button>
            <Button onClick={() => setShowAssistant(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle rubrique
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rubriques.map((rubrique) => (
          <Card key={rubrique.id_rubrique}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{rubrique.nom}</CardTitle>
                  <CardDescription>
                    {rubrique.type_montant === "FIXE"
                      ? `${rubrique.montant_fixe} XAF`
                      : "Montant variable"}
                  </CardDescription>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDetails(rubrique.id_rubrique)}
                    >
                      <Eye className="h-4 w-4 text-brand-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRubrique(rubrique.id_rubrique, groupId)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant={rubrique.est_obligatoire ? "default" : "secondary"}>
                  {rubrique.est_obligatoire ? "Obligatoire" : "Facultative"}
                </Badge>
                {rubrique.duree && <Badge variant="outline">{rubrique.duree}</Badge>}
              </div>
              
              {rubrique.date_limite && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Calendar className="h-3 w-3" />
                  Échéance : {format(new Date(rubrique.date_limite), "PPP", { locale: fr })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaiement(rubrique.id_rubrique)}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Payer
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowDetails(rubrique.id_rubrique)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {rubriques.length === 0 && (
          <p className="col-span-full py-10 text-center text-gray-500">
            Aucune rubrique de cotisation créée.
          </p>
        )}
      </div>

      {showAssistant && (
        <RubriqueAssistant
          groupId={groupId}
          members={members}
          onClose={() => setShowAssistant(false)}
        />
      )}

      {showPaiement && (
        <PaiementForm
          rubriqueId={showPaiement}
          groupId={groupId}
          members={members.filter((m) =>
            rubriques
              .find((r) => r.id_rubrique === showPaiement)
              ?.membres_concernes.some((mc: any) => mc.id_membre_groupe === m.id_membre_groupe)
          )}
          onClose={() => setShowPaiement(null)}
        />
      )}

      {showRetrait && (
        <RetraitForm
          groupId={groupId}
          adminId={adminId}
          rubriques={rubriques}
          onClose={() => setShowRetrait(false)}
        />
      )}

      {showVersementPot && (
        <VersementPotForm
          groupId={groupId}
          adminId={adminId}
          cycles={activeCycles}
          onClose={() => setShowVersementPot(false)}
        />
      )}

      {showDetails && (
        <RubriqueDetails
          rubrique={rubriques.find((r) => r.id_rubrique === showDetails)}
          onClose={() => setShowDetails(null)}
        />
      )}
    </div>
  );
}
