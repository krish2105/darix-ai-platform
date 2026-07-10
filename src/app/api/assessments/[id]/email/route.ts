import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { emailReportSchema } from '@/lib/validation/schemas';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { EMAIL_FROM, getResendClient, isEmailConfigured } from '@/lib/email/resend';
import { reportReadyEmail } from '@/lib/email/templates';
import type { ReadinessResult } from '@/utils/scoring';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const ip = getClientIp(request);
  const limitResult = rateLimit(`assessments:email:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'Email delivery is not configured yet.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = emailReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Enter a valid email address.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('assessments')
    .select('company_name, result')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const result = data.result as ReadinessResult;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const reportUrl = `${siteUrl}/report/${id}`;

  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json(
      { error: 'Email delivery is not configured yet.' },
      { status: 503 }
    );
  }

  const email = reportReadyEmail({
    companyName: data.company_name,
    score: result.score,
    level: result.level,
    reportUrl,
  });

  const { error: sendError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: parsed.data.email,
    subject: email.subject,
    html: email.html,
  });

  if (sendError) {
    console.error('Failed to send report email', sendError);
    return NextResponse.json({ error: 'Could not send the email. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
