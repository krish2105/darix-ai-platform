import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { dataRequestSchema } from '@/lib/validation/schemas';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';

// PDPL access/erasure request intake for people without a Darix account to
// self-serve through (anonymous quiz-takers, contact-form leads). Logged
// straight into public.data_requests for the team to action within the
// PDPL's 30-day response window — see supabase/migrations/0002_data_requests.sql.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limitResult = rateLimit(`privacy:request:${ip}`, { limit: 5, windowMs: 60_000 });
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

  const parsed = dataRequestSchema.safeParse(body);
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

  const { fullName, email, requestType, details } = parsed.data;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('data_requests').insert({
    full_name: fullName,
    email,
    request_type: requestType,
    details: details || null,
  });

  if (error) {
    console.error('Failed to save data request', error);
    return NextResponse.json(
      { error: 'Could not submit your request. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
