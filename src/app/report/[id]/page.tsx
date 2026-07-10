import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { ScoreDashboard } from '@/components/ScoreDashboard';
import type { ReadinessResult } from '@/utils/scoring';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getAssessment(id: string) {
  if (!UUID_RE.test(id)) return null;
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('assessments')
    .select('id, company_name, result')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) return { title: 'Report not found | Darix AI' };
  const result = assessment.result as ReadinessResult;
  return {
    title: `AI Readiness Report (${result.score}/100) | Darix AI`,
    description: `${assessment.company_name || 'This organization'}'s AI readiness score is ${result.score}/100 (${result.level}).`,
    robots: { index: false, follow: false },
  };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const assessment = await getAssessment(id);

  if (!assessment) notFound();

  return <ScoreDashboard result={assessment.result as ReadinessResult} assessmentId={assessment.id} />;
}
