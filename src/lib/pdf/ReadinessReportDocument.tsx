import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReadinessResult } from '@/utils/scoring';

const COLORS = {
  ink: '#0F172A',
  muted: '#64748B',
  electricBlue: '#38BDF8',
  cyberCyan: '#22D3EE',
  violet: '#8B5CF6',
  gold: '#D4AF37',
  emerald: '#10B981',
  red: '#EF4444',
  border: '#E2E8F0',
  panel: '#F8FAFC',
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: COLORS.ink, fontFamily: 'Helvetica' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: `2 solid ${COLORS.electricBlue}`,
    paddingBottom: 16,
    marginBottom: 20,
  },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.ink },
  brandSub: { fontSize: 8, color: COLORS.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  companyName: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  scoreBox: { alignItems: 'flex-end' },
  scoreValue: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: COLORS.electricBlue },
  scoreLevel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.violet, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 18,
    marginBottom: 8,
    color: COLORS.ink,
  },
  paragraph: { fontSize: 10, lineHeight: 1.5, color: '#334155' },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dimensionLabel: { width: 160, fontSize: 9, color: COLORS.ink },
  barTrack: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginRight: 8 },
  barFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.cyberCyan },
  dimensionPct: { width: 32, fontSize: 9, textAlign: 'right', color: COLORS.muted },
  twoCol: { flexDirection: 'row', gap: 16, marginTop: 4 },
  col: { flex: 1 },
  listItem: { fontSize: 9.5, lineHeight: 1.5, marginBottom: 5, color: '#334155' },
  roadmapCard: {
    flex: 1,
    border: `1 solid ${COLORS.border}`,
    borderRadius: 6,
    padding: 10,
    backgroundColor: COLORS.panel,
  },
  roadmapPhase: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.cyberCyan },
  roadmapTimeline: { fontSize: 9, color: COLORS.ink, marginBottom: 6 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COLORS.muted,
    borderTop: `1 solid ${COLORS.border}`,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const dimensionLabels: Record<string, string> = {
  strategy: 'AI Strategy',
  data: 'Data Maturity',
  tech: 'Technology Infrastructure',
  process: 'Process Automation',
  people: 'People & Skills',
  governance: 'AI Governance',
  usecases: 'Use Case Potential',
  roi: 'ROI & Business Value',
};

const barColor = (pct: number) => {
  if (pct >= 75) return COLORS.emerald;
  if (pct >= 50) return COLORS.gold;
  return COLORS.red;
};

export interface ReadinessReportDocumentProps {
  result: ReadinessResult;
  companyName?: string | null;
  generatedAt: Date;
}

export const ReadinessReportDocument = ({
  result,
  companyName,
  generatedAt,
}: ReadinessReportDocumentProps) => (
  <Document title="AI Readiness Report" author="Darix AI">
    <Page size="A4" style={styles.page}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>DARIX AI</Text>
          <Text style={styles.brandSub}>Dubai AI Readiness Index — AI Readiness Report</Text>
          <Text style={styles.companyName}>{companyName || 'Prepared for your organization'}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{result.score}/100</Text>
          <Text style={styles.scoreLevel}>{result.level}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Executive Summary</Text>
      <Text style={styles.paragraph}>{result.description}</Text>

      <Text style={styles.sectionTitle}>Dimension Breakdown</Text>
      {result.dimensionScores.map((d) => (
        <View key={d.dimensionId} style={styles.dimensionRow}>
          <Text style={styles.dimensionLabel}>{dimensionLabels[d.dimensionId] ?? d.dimensionId}</Text>
          <View style={styles.barTrack}>
            <View
              style={{
                ...styles.barFill,
                width: `${Math.max(2, d.percentage)}%`,
                backgroundColor: barColor(d.percentage),
              }}
            />
          </View>
          <Text style={styles.dimensionPct}>{d.percentage}%</Text>
        </View>
      ))}

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Top Strengths</Text>
          {result.strengths.map((s, i) => (
            <Text key={i} style={styles.listItem}>
              • {s}
            </Text>
          ))}
        </View>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Critical Gaps</Text>
          {result.gaps.map((g, i) => (
            <Text key={i} style={styles.listItem}>
              • {g}
            </Text>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recommended Pilots</Text>
      {result.recommendedPilots.map((p, i) => (
        <Text key={i} style={styles.listItem}>
          • {p}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>90-Day Transformation Roadmap</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {result.roadmap.map((phase, i) => (
          <View key={i} style={styles.roadmapCard}>
            <Text style={styles.roadmapPhase}>{phase.phase}</Text>
            <Text style={styles.roadmapTimeline}>{phase.timeline}</Text>
            {phase.actions.map((action, j) => (
              <Text key={j} style={styles.listItem}>
                • {action}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer} fixed>
        <Text>Generated {generatedAt.toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        <Text>darix.ai — Dubai, United Arab Emirates</Text>
      </View>
    </Page>
  </Document>
);
