import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { whatsappReportSchema } from '@/lib/validation/schemas';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { isWhatsAppConfigured, sendWhatsAppMessage } from '@/lib/whatsapp/client';
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
  const limitResult = await rateLimit(`assessments:whatsapp:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: 'WhatsApp delivery is not configured yet.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = whatsappReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Enter a valid phone number with country code.', details: parsed.error.flatten() },
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

  const companyLine = data.company_name ? ` for ${data.company_name}` : '';
  const message = `Your Darix AI Readiness Report${companyLine} is ready.\n\nScore: ${result.score}/100 — ${result.level}\n\nView your full report: ${reportUrl}`;

  const sent = await sendWhatsAppMessage({ to: parsed.data.phone, text: message });
  if (!sent) {
    return NextResponse.json({ error: 'Could not send the WhatsApp message. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
