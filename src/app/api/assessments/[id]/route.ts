import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  // Reads by id use the service-role client and bypass RLS: possession of
  // the assessment's (unguessable, v4) UUID is the access control for this
  // shareable-report-link flow, same trust model as a typical share URL.
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('assessments')
    .select('id, company_name, contact_name, result, tier, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    companyName: data.company_name,
    contactName: data.contact_name,
    result: data.result,
    tier: data.tier,
    createdAt: data.created_at,
  });
}
