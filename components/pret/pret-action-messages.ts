export function pretActionSuccessMessage(body: Record<string, unknown>): string {
  switch (body.action) {
    case "send_to_avalistes":
      return "Demande envoyée aux avalistes. Ils peuvent remplir leur contrat de garantie.";
    case "confirm_avaliste":
      return "Contrat avaliste confirmé par l'administrateur.";
    case "add_avaliste":
      return "Avaliste ajouté à la demande de prêt.";
    case "analyze":
      return body.decision === "REFUSE"
        ? "Demande refusée. L'emprunteur a été notifié."
        : "Prêt approuvé. Vous pouvez maintenant verser les fonds à l'emprunteur.";
    case "disburse":
      return "Prêt versé à l'emprunteur. La banque du groupe a été débitée et tous les membres ont été notifiés.";
    case "repayment": {
      const montant = Number(body.montant);
      const label = Number.isFinite(montant)
        ? `${montant.toLocaleString("fr-FR")} FCFA`
        : "le montant saisi";
      return `Remboursement de ${label} enregistré. Tous les membres ont été notifiés.`;
    }
    case "respond_avaliste":
      return body.accept
        ? "Contrat de garantie soumis. En attente de confirmation par l'administrateur."
        : "Refus de garantie enregistré. L'emprunteur et l'admin ont été notifiés.";
    case "saisie_garantie": {
      const montant = Number(body.montant);
      const label = Number.isFinite(montant)
        ? `${montant.toLocaleString("fr-FR")} FCFA`
        : "le montant saisi";
      return `Saisie de ${label} sur la garantie de l'avaliste enregistrée.`;
    }
    default:
      return "Opération enregistrée.";
  }
}
