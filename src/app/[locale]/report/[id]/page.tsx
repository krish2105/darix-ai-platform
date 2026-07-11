import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAssessmentForReport, isShareExpired } from '@/lib/reports/getAssessment';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ScoreDashboard } from '@/components/ScoreDashboard';
import { AdvisorChatPanel } from '@/components/chatbot/AdvisorChatPanel';
import { SharingPanel } from '@/components/SharingPanel';
import type { ReadinessResult } from '@/utils/scoring';

interface ReportPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { id } = await params;
  const assessment = await getAssessmentForReport(id);
  if (!assessment) return { title: 'Report not found | Darix AI' };
  const result = assessment.result;
  return {
    title: `AI Readiness Report (${result.score}/100) | Darix AI`,
    description: `${assessment.company_name || 'This organization'}'s AI readiness score is ${result.score}/100 (${result.level}).`,
    robots: { index: false, follow: false },
  };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id, locale } = await params;
  const assessment = await getAssessmentForReport(id);

  if (!assessment) notFound();

  // /report/[id] is intentionally reachable by anyone with the link
  // (getAssessmentForReport uses the service-role client — see that
  // file's comment), so the personalized advisor must only render for
  // the assessment's actual owner, never for a non-owner who received a
  // shared link — gaps/scores are sensitive business data.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = Boolean(user && assessment.user_id && user.id === assessment.user_id);

  // A teammate the owner has shared this assessment with via their
  // organization (see SharingPanel) — a separate distribution channel from
  // the public link toggle below, so it isn't subject to share_enabled/
  // share_expires_at. RLS (assessments_select_org_member) only lets this
  // query return a row if the caller is actually a member of the same org.
  let isOrgMember = false;
  if (user && assessment.organization_id) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', assessment.organization_id)
      .eq('user_id', user.id)
      .maybeSingle();
    isOrgMember = Boolean(membership);
  }

  const isTeamViewer = isOwner || isOrgMember;

  // Non-owner, non-teammate viewers are the "anyone with the link" audience
  // — the only ones the owner's public-link toggle/expiry actually governs.
  if (!isTeamViewer && (!assessment.share_enabled || isShareExpired(assessment))) {
    notFound();
  }

  return (
    <>
      <ScoreDashboard
        result={assessment.result as ReadinessResult}
        assessmentId={assessment.id}
        tier={assessment.tier ?? 'free'}
      />
      {isTeamViewer && (
        <AdvisorChatPanel assessmentId={assessment.id} result={assessment.result as ReadinessResult} />
      )}
      {isOwner && (
        <SharingPanel
          assessmentId={assessment.id}
          shareEnabled={assessment.share_enabled}
          shareExpiresAt={assessment.share_expires_at}
          organizationShared={Boolean(assessment.organization_id)}
          reportUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://darix.ai'}/${locale}/report/${assessment.id}`}
        />
      )}
    </>
  );
}
