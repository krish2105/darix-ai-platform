import { NextRequest, NextResponse } from 'next/server';
import { createTabbyCheckoutSession, isTabbyConfigured, TabbyNotEligibleError } from '@/lib/tabby/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { tabbyCheckoutSchema } from '@/lib/validation/schemas';
import { pricingPlans } from '@/data/pricing';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// Tabby is offered only for the Business Consultation tier — see the scope
// note in src/lib/tabby/client.ts — so unlike /api/checkout this route
// doesn't take a `tier` param at all.
const BUSINESS_PLAN = pricingPlans.find((p) => p.id === 'business')!;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limitResult = await rateLimit(`checkout:tabby:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  if (!isTabbyConfigured()) {
    return NextResponse.json({ error: 'Pay-in-installments is not configured yet.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = tabbyCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid checkout request.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { assessmentId } = parsed.data;

  const admin = createAdminSupabaseClient();
  const { data: assessment, error } = await admin
    .from('assessments')
    .select('id, contact_email')
    .eq('id', assessmentId)
    .single();

  if (error || !assessment) {
    return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  // Tabby appends `payment_id` as a query param to whichever of these URLs
  // it redirects the buyer back to, so the confirm route below doesn't
  // need it templated in here.
  const confirmUrl = `${siteUrl}/api/checkout/tabby/confirm?assessmentId=${encodeURIComponent(assessmentId)}`;

  try {
    const session = await createTabbyCheckoutSession({
      amountAed: BUSINESS_PLAN.checkoutAmountAed!,
      description: BUSINESS_PLAN.name,
      referenceId: `${assessmentId}-${Date.now()}`,
      successUrl: confirmUrl,
      cancelUrl: `${siteUrl}/report/${assessmentId}?upgrade_cancelled=1`,
      failureUrl: `${siteUrl}/report/${assessmentId}?upgrade_declined=1`,
      buyerEmail: assessment.contact_email,
    });
    return NextResponse.json({ url: session.webUrl });
  } catch (err) {
    if (err instanceof TabbyNotEligibleError) {
      return NextResponse.json(
        { error: 'Pay-in-installments is not available for this purchase. Try another payment method.' },
        { status: 422 }
      );
    }
    console.error('Tabby checkout failed', err);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 });
  }
}
