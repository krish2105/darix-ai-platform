import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { partnerInquirySchema } from '@/lib/validation/schemas';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limitResult = await rateLimit(`partners:apply:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = partnerInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please check the form for errors.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const turnstileToken = typeof body === 'object' && body !== null && 'turnstileToken' in body
    ? (body as { turnstileToken?: string }).turnstileToken
    : undefined;
  const isHuman = await verifyTurnstileToken(turnstileToken, ip);
  if (!isHuman) {
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 403 });
  }

  const { organizationName, contactName, contactEmail, partnerType, message } = parsed.data;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('partner_inquiries').insert({
    organization_name: organizationName,
    contact_name: contactName,
    contact_email: contactEmail,
    partner_type: partnerType,
    message: message || null,
  });

  if (error) {
    console.error('Failed to save partner inquiry', error);
    return NextResponse.json(
      { error: 'Could not submit your application. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
