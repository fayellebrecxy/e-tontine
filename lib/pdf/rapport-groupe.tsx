import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MembreCycleRapport = {
  nom: string;
  cotise: number;
  penalites: number;
  potRecu: boolean;
  montantPot: number;
};

export type CycleRapport = {
  nom: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  montantCotisation: number;
  totalCollecte: number;
  totalDistribue: number;
  totalPenalitesCollectees: number;
  soldesPenalites: number;
  membres: MembreCycleRapport[];
};

export type MembreRubriqueRapport = {
  nom: string;
  totalPaye: number;
};

export type RubriqueRapport = {
  nom: string;
  montantFixe: number;
  nbMembres: number;
  totalAttendu: number;
  totalCollecte: number;
  tauxRecouvrement: number;
  membres: MembreRubriqueRapport[];
};

export type RapportReunions = {
  totalReunions: number;
  reunionsTerminees: number;
  tauxPresenceMoyen: number;
  totalAmendesGenerees: number;
  totalAmendesPayees: number;
  totalRetire: number;
  solde: number;
};

export type RapportGroupeData = {
  groupe: { nom: string; devise: string; description?: string | null };
  dateGeneration: string;
  periodeDebut: string;
  periodeFin: string;
  nbMembresActifs: number;
  cycles: CycleRapport[];
  rubriques: RubriqueRapport[];
  reunions: RapportReunions;
  // Totaux globaux
  grandTotalCollecte: number;
  grandTotalDistribue: number;
  soldeCaissePenalites: number;
  soldeCaisseAmendes: number;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const C = {
  primary: "#1d4ed8",
  green: "#16a34a",
  orange: "#d97706",
  red: "#dc2626",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray500: "#6b7280",
  gray700: "#374151",
  gray900: "#111827",
  white: "#ffffff",
  blue50: "#eff6ff",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.gray900,
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 40,
    backgroundColor: C.white,
  },

  // En-tête
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  headerTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.primary },
  headerSub: { fontSize: 10, color: C.gray500, marginTop: 2 },
  headerRight: { alignItems: "flex-end", justifyContent: "flex-end" },
  headerMeta: { fontSize: 8, color: C.gray500 },

  // Résumé global (cards)
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  summaryLabel: { fontSize: 7, color: C.gray500, marginBottom: 3 },
  summaryValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },

  // Sections
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    backgroundColor: C.primary,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray200,
  },

  // Tableaux
  table: { width: "100%", marginBottom: 8 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.gray700,
    paddingVertical: 3,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray100,
  },
  tableRowAlt: { backgroundColor: C.gray50 },
  tableCell: { fontSize: 8, color: C.gray700 },

  // Stats inline (cycle / rubrique)
  statsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  statBox: {
    flex: 1,
    backgroundColor: C.blue50,
    borderRadius: 3,
    padding: 5,
    borderWidth: 0.5,
    borderColor: C.gray200,
  },
  statLabel: { fontSize: 6.5, color: C.gray500 },
  statValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.gray900, marginTop: 1 },

  // Pied de page
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.gray300,
    paddingTop: 5,
  },
  footerText: { fontSize: 7, color: C.gray500 },

  // Vide
  emptyText: { fontSize: 8, color: C.gray500, fontStyle: "italic", marginVertical: 3 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, devise: string) =>
  `${n.toLocaleString("fr-FR")} ${devise}`;

const pct = (n: number) => `${Math.round(n)}%`;

// ─── Composant ───────────────────────────────────────────────────────────────

export function RapportGroupe({ data }: { data: RapportGroupeData }) {
  const { groupe, cycles, rubriques, reunions } = data;

  return (
    <Document
      title={`Rapport financier — ${groupe.nom}`}
      author="e-Tontine"
      subject="Rapport financier du groupe"
    >
      <Page size="A4" style={s.page}>
        {/* ─── En-tête ─── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Rapport financier</Text>
            <Text style={s.headerSub}>Groupe : {groupe.nom}</Text>
            {groupe.description ? (
              <Text style={[s.headerMeta, { marginTop: 2 }]}>{groupe.description}</Text>
            ) : null}
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerMeta}>Généré le {data.dateGeneration}</Text>
            <Text style={s.headerMeta}>Période : {data.periodeDebut} → {data.periodeFin}</Text>
            <Text style={s.headerMeta}>Membres actifs : {data.nbMembresActifs}</Text>
            <Text style={s.headerMeta}>Devise : {groupe.devise}</Text>
          </View>
        </View>

        {/* ─── Résumé global ─── */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { borderColor: "#bfdbfe" }]}>
            <Text style={s.summaryLabel}>Total collecté (cycles + rubriques)</Text>
            <Text style={[s.summaryValue, { color: C.primary }]}>
              {fmt(data.grandTotalCollecte, groupe.devise)}
            </Text>
          </View>
          <View style={[s.summaryCard, { borderColor: "#bbf7d0" }]}>
            <Text style={s.summaryLabel}>Total distribué (pots versés)</Text>
            <Text style={[s.summaryValue, { color: C.green }]}>
              {fmt(data.grandTotalDistribue, groupe.devise)}
            </Text>
          </View>
          <View style={[s.summaryCard, { borderColor: "#fecaca" }]}>
            <Text style={s.summaryLabel}>Solde caisse pénalités</Text>
            <Text style={[s.summaryValue, { color: C.red }]}>
              {fmt(data.soldeCaissePenalites, groupe.devise)}
            </Text>
          </View>
          <View style={[s.summaryCard, { borderColor: "#fed7aa" }]}>
            <Text style={s.summaryLabel}>Solde caisse amendes réunions</Text>
            <Text style={[s.summaryValue, { color: C.orange }]}>
              {fmt(data.soldeCaisseAmendes, groupe.devise)}
            </Text>
          </View>
        </View>

        {/* ─── CYCLES ─── */}
        <Text style={s.sectionTitle}>Cycles de tontine</Text>
        {cycles.length === 0 ? (
          <Text style={s.emptyText}>Aucun cycle sur la période.</Text>
        ) : (
          cycles.map((cycle, ci) => (
            <View key={ci}>
              <Text style={s.subsectionTitle}>
                {cycle.nom}  ({cycle.dateDebut} → {cycle.dateFin})  —  Statut : {cycle.statut}
              </Text>

              {/* Stats cycle */}
              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>Cotisation/tour</Text>
                  <Text style={s.statValue}>{fmt(cycle.montantCotisation, groupe.devise)}</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>Total collecté</Text>
                  <Text style={[s.statValue, { color: C.primary }]}>{fmt(cycle.totalCollecte, groupe.devise)}</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>Total distribué</Text>
                  <Text style={[s.statValue, { color: C.green }]}>{fmt(cycle.totalDistribue, groupe.devise)}</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>Pénalités collectées</Text>
                  <Text style={[s.statValue, { color: C.red }]}>{fmt(cycle.totalPenalitesCollectees, groupe.devise)}</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>Solde pénalités</Text>
                  <Text style={[s.statValue, { color: C.orange }]}>{fmt(cycle.soldesPenalites, groupe.devise)}</Text>
                </View>
              </View>

              {/* Tableau membres */}
              {cycle.membres.length > 0 && (
                <View style={s.table}>
                  <View style={s.tableHeader}>
                    <Text style={[s.tableHeaderCell, { width: "35%" }]}>Membre</Text>
                    <Text style={[s.tableHeaderCell, { width: "20%" }]}>Cotisé</Text>
                    <Text style={[s.tableHeaderCell, { width: "20%" }]}>Pénalités</Text>
                    <Text style={[s.tableHeaderCell, { width: "25%" }]}>Pot reçu</Text>
                  </View>
                  {cycle.membres.map((m, i) => (
                    <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                      <Text style={[s.tableCell, { width: "35%" }]}>{m.nom}</Text>
                      <Text style={[s.tableCell, { width: "20%", color: C.primary }]}>
                        {fmt(m.cotise, groupe.devise)}
                      </Text>
                      <Text style={[s.tableCell, { width: "20%", color: m.penalites > 0 ? C.red : C.gray500 }]}>
                        {m.penalites > 0 ? fmt(m.penalites, groupe.devise) : "—"}
                      </Text>
                      <Text style={[s.tableCell, { width: "25%", color: m.potRecu ? C.green : C.gray500 }]}>
                        {m.potRecu ? `✓ ${fmt(m.montantPot, groupe.devise)}` : "En attente"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        {/* ─── RUBRIQUES ─── */}
        <Text style={s.sectionTitle}>Rubriques de cotisation</Text>
        {rubriques.length === 0 ? (
          <Text style={s.emptyText}>Aucune rubrique sur la période.</Text>
        ) : (
          rubriques.map((r, ri) => (
            <View key={ri}>
              <Text style={s.subsectionTitle}>
                {r.nom}  —  Montant dû : {fmt(r.montantFixe, groupe.devise)} × {r.nbMembres} membres
              </Text>

              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>Total attendu</Text>
                  <Text style={s.statValue}>{fmt(r.totalAttendu, groupe.devise)}</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>Total collecté</Text>
                  <Text style={[s.statValue, { color: C.green }]}>{fmt(r.totalCollecte, groupe.devise)}</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>Taux recouvrement</Text>
                  <Text style={[s.statValue, { color: r.tauxRecouvrement >= 80 ? C.green : r.tauxRecouvrement >= 50 ? C.orange : C.red }]}>
                    {pct(r.tauxRecouvrement)}
                  </Text>
                </View>
              </View>

              {r.membres.length > 0 && (
                <View style={s.table}>
                  <View style={s.tableHeader}>
                    <Text style={[s.tableHeaderCell, { width: "60%" }]}>Membre</Text>
                    <Text style={[s.tableHeaderCell, { width: "40%" }]}>Montant versé</Text>
                  </View>
                  {r.membres.map((m, i) => (
                    <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                      <Text style={[s.tableCell, { width: "60%" }]}>{m.nom}</Text>
                      <Text style={[s.tableCell, { width: "40%", color: m.totalPaye > 0 ? C.green : C.gray500 }]}>
                        {m.totalPaye > 0 ? fmt(m.totalPaye, groupe.devise) : "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        {/* ─── RÉUNIONS ─── */}
        <Text style={s.sectionTitle}>Réunions</Text>
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Réunions planifiées</Text>
            <Text style={s.statValue}>{reunions.totalReunions}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Réunions tenues</Text>
            <Text style={[s.statValue, { color: C.green }]}>{reunions.reunionsTerminees}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Taux présence moyen</Text>
            <Text style={[s.statValue, { color: reunions.tauxPresenceMoyen >= 75 ? C.green : C.orange }]}>
              {pct(reunions.tauxPresenceMoyen)}
            </Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Amendes générées</Text>
            <Text style={[s.statValue, { color: C.red }]}>{fmt(reunions.totalAmendesGenerees, groupe.devise)}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Amendes payées</Text>
            <Text style={[s.statValue, { color: C.orange }]}>{fmt(reunions.totalAmendesPayees, groupe.devise)}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Retraits effectués</Text>
            <Text style={s.statValue}>{fmt(reunions.totalRetire, groupe.devise)}</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: "#fef3c7", borderColor: "#fcd34d" }]}>
            <Text style={s.statLabel}>Solde caisse amendes</Text>
            <Text style={[s.statValue, { color: C.orange }]}>{fmt(reunions.solde, groupe.devise)}</Text>
          </View>
        </View>

        {/* ─── Pied de page ─── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Rapport financier — {groupe.nom}</Text>
          <Text style={s.footerText}>Généré par e-Tontine • {data.dateGeneration}</Text>
        </View>
      </Page>
    </Document>
  );
}
