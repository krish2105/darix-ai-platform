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
  user_id: string | null;
  company_name: string | null;
  result: ReadinessResult;
  tier: 'free' | 'pro' | 'business';
  share_enabled: boolean;
  share_expires_at: string | null;
  organization_id: string | null;
}

export async function getAssessmentForReport(id: string): Promise<ReportAssessment | null> {
  if (!UUID_RE.test(id)) return null;
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('assessments')
    .select('id, user_id, company_name, result, tier, share_enabled, share_expires_at, organization_id')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as ReportAssessment;
}

// True once a share_expires_at deadline has passed. Null means "no expiry".
export function isShareExpired(assessment: Pick<ReportAssessment, 'share_expires_at'>): boolean {
  return Boolean(assessment.share_expires_at && new Date(assessment.share_expires_at).getTime() < Date.now());
}
