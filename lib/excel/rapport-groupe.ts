import * as XLSX from "xlsx";
import type { RapportGroupeData } from "@/lib/pdf/rapport-groupe";

export function genererExcelRapport(data: RapportGroupeData): Buffer {
  const wb = XLSX.utils.book_new();
  const { groupe, cycles, rubriques, reunions } = data;
  const D = groupe.devise;

  // ─── Feuille 1 : Résumé global ───────────────────────────────────────────
  const resumeRows = [
    ["RAPPORT FINANCIER DU GROUPE", "", "", ""],
    ["Groupe", groupe.nom, "", ""],
    ["Période", `${data.periodeDebut} → ${data.periodeFin}`, "", ""],
    ["Membres actifs", data.nbMembresActifs, "", ""],
    ["Date de génération", data.dateGeneration, "", ""],
    ["Devise", D, "", ""],
    ["", "", "", ""],
    ["RÉSUMÉ FINANCIER GLOBAL", "", "", ""],
    ["Indicateur", `Montant (${D})`, "", ""],
    ["Total collecté (cycles + rubriques)", data.grandTotalCollecte, "", ""],
    ["Total distribué (pots versés)", data.grandTotalDistribue, "", ""],
    ["Solde caisse pénalités cycles", data.soldeCaissePenalites, "", ""],
    ["Solde caisse amendes réunions", data.soldeCaisseAmendes, "", ""],
  ];
  const wsResume = XLSX.utils.aoa_to_sheet(resumeRows);
  wsResume["!cols"] = [{ wch: 40 }, { wch: 20 }, { wch: 5 }, { wch: 5 }];
  XLSX.utils.book_append_sheet(wb, wsResume, "Résumé");

  // ─── Feuille 2 : Cycles ───────────────────────────────────────────────────
  const cycleRows: (string | number)[][] = [
    ["Cycle", "Période", "Statut", "Cotisation/tour", "Total collecté", "Total distribué", "Pénalités collectées", "Solde pénalités"],
  ];
  for (const c of cycles) {
    cycleRows.push([
      c.nom,
      `${c.dateDebut} → ${c.dateFin}`,
      c.statut,
      c.montantCotisation,
      c.totalCollecte,
      c.totalDistribue,
      c.totalPenalitesCollectees,
      c.soldesPenalites,
    ]);
  }
  const wsCycles = XLSX.utils.aoa_to_sheet(cycleRows);
  wsCycles["!cols"] = [{ wch: 25 }, { wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsCycles, "Cycles");

  // ─── Feuille 3 : Détail membres/cycles ───────────────────────────────────
  const membreCycleRows: (string | number)[][] = [
    ["Cycle", "Membre", `Cotisé (${D})`, `Pénalités (${D})`, "Pot reçu", `Montant pot (${D})`],
  ];
  for (const c of cycles) {
    for (const m of c.membres) {
      membreCycleRows.push([
        c.nom,
        m.nom,
        m.cotise,
        m.penalites,
        m.potRecu ? "Oui" : "Non",
        m.montantPot,
      ]);
    }
  }
  const wsMembresCycles = XLSX.utils.aoa_to_sheet(membreCycleRows);
  wsMembresCycles["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsMembresCycles, "Membres - Cycles");

  // ─── Feuille 4 : Rubriques ────────────────────────────────────────────────
  const rubriqueRows: (string | number)[][] = [
    ["Rubrique", `Montant dû (${D})`, "Nb membres", `Total attendu (${D})`, `Total collecté (${D})`, "Taux recouvrement (%)"],
  ];
  for (const r of rubriques) {
    rubriqueRows.push([
      r.nom,
      r.montantFixe,
      r.nbMembres,
      r.totalAttendu,
      r.totalCollecte,
      Math.round(r.tauxRecouvrement),
    ]);
  }
  const wsRubriques = XLSX.utils.aoa_to_sheet(rubriqueRows);
  wsRubriques["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsRubriques, "Rubriques");

  // ─── Feuille 5 : Détail membres/rubriques ────────────────────────────────
  const membreRubriqueRows: (string | number)[][] = [
    ["Rubrique", "Membre", `Montant versé (${D})`],
  ];
  for (const r of rubriques) {
    for (const m of r.membres) {
      membreRubriqueRows.push([r.nom, m.nom, m.totalPaye]);
    }
  }
  const wsMembresRubriques = XLSX.utils.aoa_to_sheet(membreRubriqueRows);
  wsMembresRubriques["!cols"] = [{ wch: 28 }, { wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsMembresRubriques, "Membres - Rubriques");

  // ─── Feuille 6 : Réunions ─────────────────────────────────────────────────
  const reunionRows: (string | number)[][] = [
    ["Indicateur", "Valeur"],
    ["Réunions planifiées", reunions.totalReunions],
    ["Réunions tenues", reunions.reunionsTerminees],
    ["Taux de présence moyen (%)", Math.round(reunions.tauxPresenceMoyen)],
    [`Amendes générées (${D})`, reunions.totalAmendesGenerees],
    [`Amendes payées (${D})`, reunions.totalAmendesPayees],
    [`Retraits effectués (${D})`, reunions.totalRetire],
    [`Solde caisse amendes (${D})`, reunions.solde],
  ];
  const wsReunions = XLSX.utils.aoa_to_sheet(reunionRows);
  wsReunions["!cols"] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsReunions, "Réunions");

  // ─── Génération du buffer ─────────────────────────────────────────────────
  const wbOut = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return wbOut;
}
