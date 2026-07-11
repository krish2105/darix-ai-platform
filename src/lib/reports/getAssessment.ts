import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { ReadinessResult } from '@/utils/scoring';

// Shared by the report page (src/app/report/[id]/page.tsx) and its dynamic
// OG share image (src/app/report/[id]/opengraph-image.tsx) — both need the
// exact same "does this id look like a UUID, and does a row exist" check
// before touching the service-role client. Possession of the id is the
// access control for this read (see supabase/migrations/0001_init.sql), so
// this intentionally never checks auth.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ReportAssessment {
  id: string;
  company_name: string | null;
  result: ReadinessResult;
  tier: 'free' | 'pro' | 'business';
}

export async function getAssessmentForReport(id: string): Promise<ReportAssessment | null> {
  if (!UUID_RE.test(id)) return null;
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('assessments')
    .select('id, company_name, result, tier')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as ReportAssessment;
}
