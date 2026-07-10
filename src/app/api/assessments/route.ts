import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAssessmentSchema } from '@/lib/validation/schemas';
import { calculateReadiness } from '@/utils/scoring';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limitResult = await rateLimit(`assessments:post:${ip}`, { limit: 10, windowMs: 60_000 });
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

  const parsed = createAssessmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid assessment data.', details: parsed.error.flatten() },
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

  const { answers, companyName, contactName, contactEmail } = parsed.data;

  // The score is always recomputed server-side from the raw answers — we
  // never trust a client-supplied result, since that's the number a user
  // could otherwise tamper with before it's persisted.
  const result = calculateReadiness(answers);

  // If the request carries a valid Supabase session, associate the
  // assessment with that user so it shows up in their dashboard history.
  // Anonymous completions are still saved (per the product's "free score
  // without login" flow) — just without a user_id.
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('assessments')
    .insert({
      user_id: user?.id ?? null,
      company_name: companyName || null,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      answers,
      result,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Failed to save assessment', error);
    return NextResponse.json(
      { error: 'Could not save your assessment. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id, result }, { status: 201 });
}
