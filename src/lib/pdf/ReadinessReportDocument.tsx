import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReadinessResult } from '@/utils/scoring';
import { translate, type Locale } from '@/lib/i18n/translations';
import { localizeReadinessResult } from '@/lib/i18n/localizeResult';
import { ARABIC_FONT_FAMILY, registerArabicFont } from './fonts';

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

const barColor = (pct: number) => {
  if (pct >= 75) return COLORS.emerald;
  if (pct >= 50) return COLORS.gold;
  return COLORS.red;
};

export interface ReadinessReportDocumentProps {
  result: ReadinessResult;
  companyName?: string | null;
  generatedAt: Date;
  locale?: Locale;
}

export const ReadinessReportDocument = ({
  result,
  companyName,
  generatedAt,
  locale = 'en',
}: ReadinessReportDocumentProps) => {
  const isArabic = locale === 'ar';
  if (isArabic) registerArabicFont();

  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const localized = localizeReadinessResult(result, locale);
  const fontFamily = isArabic ? ARABIC_FONT_FAMILY : 'Helvetica';
  const boldFontFamily = isArabic ? ARABIC_FONT_FAMILY : 'Helvetica-Bold';
  const textAlign = isArabic ? 'right' : 'left';

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, color: COLORS.ink, fontFamily },
    headerRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottom: `2 solid ${COLORS.electricBlue}`,
      paddingBottom: 16,
      marginBottom: 20,
    },
    brand: { fontSize: 18, fontFamily: boldFontFamily, color: COLORS.ink, textAlign },
    brandSub: { fontSize: 8, color: COLORS.muted, marginTop: 2, textTransform: isArabic ? 'none' : 'uppercase', letterSpacing: isArabic ? 0 : 1, textAlign },
    companyName: { fontSize: 11, color: COLORS.muted, marginTop: 4, textAlign },
    scoreBox: { alignItems: isArabic ? 'flex-start' : 'flex-end' },
    scoreValue: { fontSize: 28, fontFamily: boldFontFamily, color: COLORS.electricBlue },
    scoreLevel: { fontSize: 11, fontFamily: boldFontFamily, color: COLORS.violet, marginTop: 2 },
    sectionTitle: {
      fontSize: 13,
      fontFamily: boldFontFamily,
      marginTop: 18,
      marginBottom: 8,
      color: COLORS.ink,
      textAlign,
    },
    paragraph: { fontSize: 10, lineHeight: 1.5, color: '#334155', textAlign },
    dimensionRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    dimensionLabel: { width: 160, fontSize: 9, color: COLORS.ink, textAlign },
    barTrack: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginRight: isArabic ? 0 : 8, marginLeft: isArabic ? 8 : 0 },
    barFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.cyberCyan },
    dimensionPct: { width: 32, fontSize: 9, textAlign: isArabic ? 'left' : 'right', color: COLORS.muted },
    twoCol: { flexDirection: isArabic ? 'row-reverse' : 'row', gap: 16, marginTop: 4 },
    col: { flex: 1 },
    listItem: { fontSize: 9.5, lineHeight: 1.5, marginBottom: 5, color: '#334155', textAlign },
    roadmapCard: {
      flex: 1,
      border: `1 solid ${COLORS.border}`,
      borderRadius: 6,
      padding: 10,
      backgroundColor: COLORS.panel,
    },
    roadmapPhase: { fontSize: 10, fontFamily: boldFontFamily, color: COLORS.cyberCyan, textAlign },
    roadmapTimeline: { fontSize: 9, color: COLORS.ink, marginBottom: 6, textAlign },
    footer: {
      position: 'absolute',
      bottom: 24,
      left: 40,
      right: 40,
      fontSize: 8,
      color: COLORS.muted,
      borderTop: `1 solid ${COLORS.border}`,
      paddingTop: 8,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
    },
  });

  return (
    <Document title="AI Readiness Report" author="Darix AI">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>DARIX AI</Text>
            <Text style={styles.brandSub}>{t('pdf.subtitle')}</Text>
            <Text style={styles.companyName}>{companyName || t('pdf.preparedFor')}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{result.score}/100</Text>
            <Text style={styles.scoreLevel}>{localized.level}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('pdf.executiveSummary')}</Text>
        <Text style={styles.paragraph}>{localized.description}</Text>

        <Text style={styles.sectionTitle}>{t('pdf.dimensionBreakdown')}</Text>
        {result.dimensionScores.map((d) => (
          <View key={d.dimensionId} style={styles.dimensionRow}>
            <Text style={styles.dimensionLabel}>{t(`dim.${d.dimensionId}.title`)}</Text>
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
            <Text style={styles.sectionTitle}>{t('pdf.topStrengths')}</Text>
            {localized.strengths.map((s, i) => (
              <Text key={i} style={styles.listItem}>
                • {s}
              </Text>
            ))}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>{t('pdf.criticalGaps')}</Text>
            {localized.gaps.map((g, i) => (
              <Text key={i} style={styles.listItem}>
                • {g}
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('pdf.recommendedPilots')}</Text>
        {localized.recommendedPilots.map((p, i) => (
          <Text key={i} style={styles.listItem}>
            • {p}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>{t('pdf.roadmapTitle')}</Text>
        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 10 }}>
          {localized.roadmap.map((phase, i) => (
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
          <Text>{t('pdf.generated')} {generatedAt.toLocaleDateString(isArabic ? 'ar-AE' : 'en-AE', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          <Text>{t('pdf.footerLocation')}</Text>
        </View>
      </Page>
    </Document>
  );
};
