import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { EMAIL_FROM, getResendClient, isEmailConfigured } from '@/lib/email/resend';
import { reassessmentReminderEmail } from '@/lib/email/templates';
import type { ReadinessResult } from '@/utils/scoring';

// Intended to be triggered by Vercel Cron (see vercel.json — daily
// cadence, which fits the free Hobby plan's once-per-day cap). Finds
// signed-in users whose most recent assessment is 90+ days old and who
// haven't been reminded in the last 80 days, and sends a "retake your
// assessment" email. This is the scheduler/infra half of a re-assessment
// nurture touch — it deliberately does NOT attempt the WhatsApp channel,
// since that needs a Meta-approved message template (an external
// business step, not something this route can complete on its own); it
// reuses the existing Resend email integration instead, which needs no
// external approval.
const REASSESSMENT_INTERVAL_DAYS = 90;
const REMINDER_COOLDOWN_DAYS = 80;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron is not configured.' }, { status: 503 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: 'Email delivery is not configured.' }, { status: 503 });
  }
  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json({ error: 'Email delivery is not configured.' }, { status: 503 });
  }

  const admin = createAdminSupabaseClient();

  // Latest assessment per signed-in user, computed in-memory rather than
  // via SQL GROUP BY — same pragmatic approach as /api/benchmarks, fine
  // at the data volumes this product has today.
  const { data: rows, error } = await admin
    .from('assessments')
    .select('user_id, result, created_at')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load assessments for reassessment reminder', error);
    return NextResponse.json({ error: 'Could not load assessments.' }, { status: 500 });
  }

  const latestByUser = new Map<string, { result: ReadinessResult; created_at: string }>();
  for (const row of rows ?? []) {
    const userId = row.user_id as string;
    if (!latestByUser.has(userId)) {
      latestByUser.set(userId, { result: row.result as ReadinessResult, created_at: row.created_at });
    }
  }

  const now = Date.now();
  const dueUserIds = [...latestByUser.entries()].filter(
    ([, latest]) => now - new Date(latest.created_at).getTime() >= REASSESSMENT_INTERVAL_DAYS * DAY_MS
  );

  const { data: reminderRows } = await admin
    .from('reassessment_reminders')
    .select('user_id, last_sent_at')
    .in(
      'user_id',
      dueUserIds.map(([userId]) => userId)
    );
  const lastSentByUser = new Map((reminderRows ?? []).map((r) => [r.user_id as string, r.last_sent_at as string]));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  let sent = 0;
  let skipped = 0;

  for (const [userId, latest] of dueUserIds) {
    const lastSentAt = lastSentByUser.get(userId);
    if (lastSentAt && now - new Date(lastSentAt).getTime() < REMINDER_COOLDOWN_DAYS * DAY_MS) {
      skipped++;
      continue;
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (userError || !email) {
      skipped++;
      continue;
    }

    const template = reassessmentReminderEmail({
      score: latest.result.score,
      level: latest.result.level,
      assessUrl: `${siteUrl}/#assessment`,
    });
    const { error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (sendError) {
      console.error('Failed to send reassessment reminder', userId, sendError);
      skipped++;
      continue;
    }

    await admin.from('reassessment_reminders').upsert({ user_id: userId, last_sent_at: new Date().toISOString() });
    sent++;
  }

  return NextResponse.json({ evaluated: dueUserIds.length, sent, skipped });
}
