import { ImageResponse } from 'next/og';
import { getAssessmentForReport, isShareExpired } from '@/lib/reports/getAssessment';

export const alt = 'Darix AI — AI Readiness Report';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same dark gradient/wordmark shell as the site-wide src/app/opengraph-image.tsx,
// with the actual score/level/company name laid over it — turns every
// completed assessment into a shareable "My Dubai AI Readiness Score" card
// instead of a generic site preview. Colors match the PDF report
// (src/lib/pdf/ReadinessReportDocument.tsx COLORS) for visual consistency
// across every artifact a user might share.
const COLORS = {
  electricBlue: '#38BDF8',
  violet: '#8B5CF6',
  muted: '#94A3B8',
  ink: '#F8FAFC',
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assessment = await getAssessmentForReport(id);

  // Social-media crawlers fetching this image never carry a session cookie
  // (they're anonymous, like any other non-owner visitor), so a
  // revoked/expired public link should fall back to the generic card below
  // exactly as it would for any other non-owner — same gate as
  // report/[id]/page.tsx, just without an owner/teammate bypass since
  // there's no session here to check.
  const shareable = assessment && assessment.share_enabled && !isShareExpired(assessment);
  const score = shareable ? assessment.result?.score : undefined;
  const level = shareable ? assessment.result?.level : undefined;
  const companyName = shareable ? assessment.company_name : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #030712 0%, #07111F 60%, #111827 100%)',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${COLORS.electricBlue}, ${COLORS.violet})`,
              display: 'flex',
            }}
          />
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: COLORS.ink, letterSpacing: 1 }}>
            DARIX AI
          </div>
        </div>

        {typeof score === 'number' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ display: 'flex', fontSize: 180, fontWeight: 800, color: COLORS.electricBlue, lineHeight: 1 }}>
                {score}
              </div>
              <div style={{ display: 'flex', fontSize: 48, fontWeight: 600, color: COLORS.muted }}>/ 100</div>
            </div>
            {level ? (
              <div
                style={{
                  display: 'flex',
                  fontSize: 40,
                  fontWeight: 700,
                  color: COLORS.violet,
                  marginTop: 8,
                }}
              >
                {level}
              </div>
            ) : null}
            <div style={{ display: 'flex', fontSize: 28, color: COLORS.muted, marginTop: 28, textAlign: 'center', maxWidth: 900 }}>
              {companyName ? `${companyName}'s ` : "This organization's "}
              AI Readiness Score — Dubai AI Readiness Index
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', fontSize: 34, color: COLORS.muted, textAlign: 'center', maxWidth: 900 }}>
            Dubai AI Readiness Index — Free AI Readiness Assessment for Businesses
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
