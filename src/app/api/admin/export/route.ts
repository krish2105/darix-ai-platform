import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/auth/is-admin';
import { toCsv } from '@/lib/csv';
import type { ReadinessResult } from '@/utils/scoring';

const exportTypes = ['leads', 'assessments'] as const;

// Offline analysis for an allowlisted admin — everything the /admin page
// already shows, minus the 100-row UI cap, as a CSV download instead of a
// scrollable list. No new personal-data exposure beyond what /admin
// already renders for the same admin.
export async function GET(request: NextRequest) {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get('type');
  if (!type || !exportTypes.includes(type as (typeof exportTypes)[number])) {
    return NextResponse.json({ error: 'type must be "leads" or "assessments".' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  if (type === 'leads') {
    const { data, error } = await admin
      .from('leads')
      .select('id, full_name, work_email, company_name, company_size, challenge, status, notes, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to export leads', error);
      return NextResponse.json({ error: 'Could not export leads.' }, { status: 500 });
    }

    const csv = toCsv(data ?? [], [
      'id',
      'full_name',
      'work_email',
      'company_name',
      'company_size',
      'challenge',
      'status',
      'notes',
      'created_at',
    ]);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="darix-leads.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  const { data, error } = await admin
    .from('assessments')
    .select('id, company_name, contact_name, contact_email, industry, company_size, tier, result, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to export assessments', error);
    return NextResponse.json({ error: 'Could not export assessments.' }, { status: 500 });
  }

  const rows = (data ?? []).map((a) => {
    const result = a.result as ReadinessResult;
    return {
      id: a.id,
      company_name: a.company_name,
      contact_name: a.contact_name,
      contact_email: a.contact_email,
      industry: a.industry,
      company_size: a.company_size,
      tier: a.tier,
      score: result?.score ?? '',
      level: result?.level ?? '',
      created_at: a.created_at,
    };
  });

  const csv = toCsv(rows, [
    'id',
    'company_name',
    'contact_name',
    'contact_email',
    'industry',
    'company_size',
    'tier',
    'score',
    'level',
    'created_at',
  ]);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="darix-assessments.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}
