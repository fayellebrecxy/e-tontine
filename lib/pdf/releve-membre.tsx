import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CotisationPDF = {
  tour: number;
  date: string;
  montant: number;
  penalite: number;
};

export type VersementPDF = {
  tour: number;
  date: string;
  montant: number;
};

export type CyclePDF = {
  nom: string;
  dateDebut: string;
  dateFin: string;
  montantCotisation: number;
  cotisations: CotisationPDF[];
  versementsRecus: VersementPDF[];
};

export type PaiementRubriquePDF = {
  date: string;
  montant: number;
  note?: string | null;
};

export type RubriquePDF = {
  nom: string;
  montantFixe: number;
  paiements: PaiementRubriquePDF[];
};

export type PresenceReunionPDF = {
  titre: string;
  date: string;
  statut: string;
  amende: number;
  amendePaye: boolean;
};

export type ReleveData = {
  membre: { prenom: string; nom: string; email: string; telephone: string };
  groupe: { nom: string; devise: string };
  dateGeneration: string;
  cycles: CyclePDF[];
  rubriques: RubriquePDF[];
  reunions: PresenceReunionPDF[];
  // Totaux
  totalCotiseCycles: number;
  totalPenalitesCycles: number;
  totalPotsRecus: number;
  totalCotiseRubriques: number;
  totalAmendesReunions: number;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const C = {
  primary: "#1d4ed8",
  green: "#16a34a",
  orange: "#d97706",
  red: "#dc2626",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray300: "#d1d5db",
  gray500: "#6b7280",
  gray700: "#374151",
  gray900: "#111827",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.gray900,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: C.white,
  },

  // En-tête
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.primary },
  headerSubtitle: { fontSize: 10, color: C.gray500, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerDate: { fontSize: 8, color: C.gray500 },

  // Carte membre
  memberCard: {
    backgroundColor: C.gray50,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  memberName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.gray900, marginBottom: 3 },
  memberInfo: { fontSize: 8, color: C.gray500 },

  // Sections
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.gray300,
  },
  subsectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.gray700,
    marginTop: 8,
    marginBottom: 4,
  },

  // Tableaux
  table: { width: "100%", marginBottom: 6 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.primary,
    borderRadius: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray100,
  },
  tableRowAlt: {
    backgroundColor: C.gray50,
  },
  tableCell: {
    fontSize: 8,
    color: C.gray700,
  },

  // Badges
  badgeGreen: {
    backgroundColor: "#dcfce7",
    color: C.green,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  badgeOrange: {
    backgroundColor: "#fef3c7",
    color: C.orange,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  badgeRed: {
    backgroundColor: "#fee2e2",
    color: C.red,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },

  // Récapitulatif
  recap: {
    marginTop: 16,
    backgroundColor: C.gray50,
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: C.gray300,
  },
  recapTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    marginBottom: 8,
  },
  recapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  recapItem: {
    width: "48%",
    backgroundColor: C.white,
    borderRadius: 3,
    padding: 6,
    borderWidth: 0.5,
    borderColor: C.gray300,
  },
  recapLabel: { fontSize: 7, color: C.gray500, marginBottom: 2 },
  recapValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.gray900 },

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
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.gray500 },

  // Vide
  emptyText: { fontSize: 8, color: C.gray500, fontStyle: "italic", marginVertical: 4 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, devise: string) =>
  `${n.toLocaleString("fr-FR")} ${devise}`;

const STATUT_LABELS: Record<string, string> = {
  PRESENT: "✓ Présent",
  ABSENT: "✗ Absent",
  EXCUSE: "~ Excusé",
  EN_RETARD: "⏰ En retard",
};

// ─── Composant principal ──────────────────────────────────────────────────────

export function ReleveMembre({ data }: { data: ReleveData }) {
  const { membre, groupe, dateGeneration, cycles, rubriques, reunions } = data;

  return (
    <Document
      title={`Relevé de compte — ${membre.prenom} ${membre.nom}`}
      author="e-Tontine"
      subject={`Groupe : ${groupe.nom}`}
    >
      <Page size="A4" style={styles.page}>
        {/* ─── En-tête ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Relevé de compte</Text>
            <Text style={styles.headerSubtitle}>Groupe : {groupe.nom}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>Généré le {dateGeneration}</Text>
            <Text style={styles.headerDate}>Devise : {groupe.devise}</Text>
          </View>
        </View>

        {/* ─── Carte membre ─── */}
        <View style={styles.memberCard}>
          <Text style={styles.memberName}>{membre.prenom} {membre.nom}</Text>
          <Text style={styles.memberInfo}>{membre.email}  •  {membre.telephone}</Text>
        </View>

        {/* ─── Cycles ─── */}
        <Text style={styles.sectionTitle}>Cycles de tontine</Text>
        {cycles.length === 0 ? (
          <Text style={styles.emptyText}>Aucun cycle pour ce membre.</Text>
        ) : (
          cycles.map((cycle, ci) => (
            <View key={ci}>
              <Text style={styles.subsectionTitle}>
                {cycle.nom}  ({cycle.dateDebut} → {cycle.dateFin})
                {"  "}Cotisation : {fmt(cycle.montantCotisation, groupe.devise)}
              </Text>

              {/* Tableau des cotisations */}
              {cycle.cotisations.length > 0 ? (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Tour</Text>
                    <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Date</Text>
                    <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Montant payé</Text>
                    <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Pénalité</Text>
                  </View>
                  {cycle.cotisations.map((c, i) => (
                    <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                      <Text style={[styles.tableCell, { width: "10%" }]}>{c.tour}</Text>
                      <Text style={[styles.tableCell, { width: "30%" }]}>{c.date}</Text>
                      <Text style={[styles.tableCell, { width: "30%", color: C.green }]}>
                        {c.montant > 0 ? `+${fmt(c.montant, groupe.devise)}` : "—"}
                      </Text>
                      <Text style={[styles.tableCell, { width: "30%", color: c.penalite > 0 ? C.red : C.gray500 }]}>
                        {c.penalite > 0 ? fmt(c.penalite, groupe.devise) : "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Aucune cotisation enregistrée.</Text>
              )}

              {/* Versements reçus */}
              {cycle.versementsRecus.length > 0 && (
                <View>
                  <Text style={[styles.subsectionTitle, { color: C.green }]}>
                    Pot reçu :
                  </Text>
                  {cycle.versementsRecus.map((v, i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: "15%" }]}>Tour {v.tour}</Text>
                      <Text style={[styles.tableCell, { width: "40%" }]}>{v.date}</Text>
                      <Text style={[styles.tableCell, { width: "45%", color: C.green, fontFamily: "Helvetica-Bold" }]}>
                        {fmt(v.montant, groupe.devise)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        {/* ─── Rubriques ─── */}
        <Text style={styles.sectionTitle}>Rubriques de cotisation</Text>
        {rubriques.length === 0 ? (
          <Text style={styles.emptyText}>Aucune rubrique pour ce membre.</Text>
        ) : (
          rubriques.map((r, ri) => (
            <View key={ri}>
              <Text style={styles.subsectionTitle}>
                {r.nom}  —  Montant dû : {fmt(r.montantFixe, groupe.devise)}
                {"  "}Payé : {fmt(r.paiements.reduce((a, p) => a + p.montant, 0), groupe.devise)}
              </Text>
              {r.paiements.length > 0 ? (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: "35%" }]}>Date</Text>
                    <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Montant</Text>
                    <Text style={[styles.tableHeaderCell, { width: "35%" }]}>Note</Text>
                  </View>
                  {r.paiements.map((p, i) => (
                    <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                      <Text style={[styles.tableCell, { width: "35%" }]}>{p.date}</Text>
                      <Text style={[styles.tableCell, { width: "30%", color: C.green }]}>
                        +{fmt(p.montant, groupe.devise)}
                      </Text>
                      <Text style={[styles.tableCell, { width: "35%", color: C.gray500 }]}>
                        {p.note ?? "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Aucun paiement enregistré.</Text>
              )}
            </View>
          ))
        )}

        {/* ─── Réunions ─── */}
        <Text style={styles.sectionTitle}>Présences aux réunions</Text>
        {reunions.length === 0 ? (
          <Text style={styles.emptyText}>Aucune réunion enregistrée.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "35%" }]}>Réunion</Text>
              <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Statut</Text>
              <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Amende</Text>
            </View>
            {reunions.map((r, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: "35%" }]}>{r.titre}</Text>
                <Text style={[styles.tableCell, { width: "25%" }]}>{r.date}</Text>
                <Text style={[styles.tableCell, { width: "20%", color: r.statut === "PRESENT" ? C.green : r.statut === "EXCUSE" ? C.orange : C.red }]}>
                  {STATUT_LABELS[r.statut] ?? r.statut}
                </Text>
                <Text style={[styles.tableCell, { width: "20%", color: r.amende > 0 && !r.amendePaye ? C.red : C.gray500 }]}>
                  {r.amende > 0
                    ? `${fmt(r.amende, groupe.devise)}${r.amendePaye ? " ✓" : " !"}`
                    : "—"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── Récapitulatif financier ─── */}
        <View style={styles.recap}>
          <Text style={styles.recapTitle}>Récapitulatif financier</Text>
          <View style={styles.recapGrid}>
            <View style={styles.recapItem}>
              <Text style={styles.recapLabel}>Total cotisé (cycles)</Text>
              <Text style={[styles.recapValue, { color: C.primary }]}>
                {fmt(data.totalCotiseCycles, groupe.devise)}
              </Text>
            </View>
            <View style={styles.recapItem}>
              <Text style={styles.recapLabel}>Pot(s) reçu(s)</Text>
              <Text style={[styles.recapValue, { color: C.green }]}>
                {fmt(data.totalPotsRecus, groupe.devise)}
              </Text>
            </View>
            <View style={styles.recapItem}>
              <Text style={styles.recapLabel}>Pénalités de cycle</Text>
              <Text style={[styles.recapValue, { color: data.totalPenalitesCycles > 0 ? C.red : C.gray500 }]}>
                {fmt(data.totalPenalitesCycles, groupe.devise)}
              </Text>
            </View>
            <View style={styles.recapItem}>
              <Text style={styles.recapLabel}>Total cotisé (rubriques)</Text>
              <Text style={[styles.recapValue, { color: C.primary }]}>
                {fmt(data.totalCotiseRubriques, groupe.devise)}
              </Text>
            </View>
            <View style={styles.recapItem}>
              <Text style={styles.recapLabel}>Amendes réunions</Text>
              <Text style={[styles.recapValue, { color: data.totalAmendesReunions > 0 ? C.orange : C.gray500 }]}>
                {fmt(data.totalAmendesReunions, groupe.devise)}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Pied de page ─── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {membre.prenom} {membre.nom} — {groupe.nom}
          </Text>
          <Text style={styles.footerText}>
            Document généré par e-Tontine • {dateGeneration}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
