import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAssessmentForReport } from '@/lib/reports/getAssessment';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ScoreDashboard } from '@/components/ScoreDashboard';
import { AdvisorChatPanel } from '@/components/chatbot/AdvisorChatPanel';
import type { ReadinessResult } from '@/utils/scoring';

interface ReportPageProps {
  params: Promise<{ id: string }>;
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
  const { id } = await params;
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

  return (
    <>
      <ScoreDashboard
        result={assessment.result as ReadinessResult}
        assessmentId={assessment.id}
        tier={assessment.tier ?? 'free'}
      />
      {isOwner && <AdvisorChatPanel assessmentId={assessment.id} result={assessment.result as ReadinessResult} />}
    </>
  );
}
