import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// Cheap liveness/readiness probe for uptime monitors and post-deploy sanity
// checks — no auth, no rate limit (monitoring tools poll this frequently
// from fixed IPs). Reports whether Supabase is configured/reachable rather
// than crashing, mirroring the isSupabaseConfigured() graceful-degradation
// pattern used everywhere else in this codebase.
export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null;
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!isConfigured) {
    return NextResponse.json(
      { status: 'degraded', database: 'not_configured', commit, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }

  try {
    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from('assessments')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    if (error) throw error;

    return NextResponse.json(
      { status: 'ok', database: 'ok', commit, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (err) {
    console.error('Health check: database unreachable', err);
    return NextResponse.json(
      { status: 'error', database: 'unreachable', commit, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
