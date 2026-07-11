import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAssessmentForReport } from '@/lib/reports/getAssessment';
import { ScoreDashboard } from '@/components/ScoreDashboard';
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

  return (
    <ScoreDashboard
      result={assessment.result as ReadinessResult}
      assessmentId={assessment.id}
      tier={assessment.tier ?? 'free'}
    />
  );
}
