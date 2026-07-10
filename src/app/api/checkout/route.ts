import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, isStripeConfigured } from '@/lib/stripe/client';
import { createTelrOrder, isTelrConfigured } from '@/lib/telr/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createCheckoutSchema } from '@/lib/validation/schemas';
import { pricingPlans } from '@/data/pricing';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// PAYMENT_PROVIDER selects the checkout backend without any client-side
// change — ScoreDashboard always POSTs here and follows the returned url.
// Defaults to Stripe; set to "telr" for the UAE-local gateway.
const activeProvider = () => (process.env.PAYMENT_PROVIDER === 'telr' ? 'telr' : 'stripe');

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limitResult = await rateLimit(`checkout:post:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  const provider = activeProvider();
  if ((provider === 'stripe' && !isStripeConfigured()) || (provider === 'telr' && !isTelrConfigured())) {
    return NextResponse.json(
      { error: 'Payments are not configured yet.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = createCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid checkout request.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { assessmentId, tier } = parsed.data;
  const plan = pricingPlans.find((p) => p.id === tier);
  if (!plan || !plan.checkoutAmountAed) {
    return NextResponse.json({ error: 'This plan is not available for checkout.' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: assessment, error } = await admin
    .from('assessments')
    .select('id, tier')
    .eq('id', assessmentId)
    .single();

  if (error || !assessment) {
    return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  if (provider === 'telr') {
    try {
      const confirmUrl = `${siteUrl}/api/checkout/telr/confirm?assessmentId=${encodeURIComponent(assessmentId)}&tier=${encodeURIComponent(tier)}`;
      const order = await createTelrOrder({
        cartId: `${assessmentId}-${Date.now()}`,
        amountAed: plan.checkoutAmountAed,
        description: plan.name,
        returnAuthorised: confirmUrl,
        returnDeclined: `${siteUrl}/report/${assessmentId}?upgrade_declined=1`,
        returnCancelled: `${siteUrl}/report/${assessmentId}?upgrade_cancelled=1`,
      });
      return NextResponse.json({ url: order.url });
    } catch (err) {
      console.error('Telr checkout failed', err);
      return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 });
    }
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'aed',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.checkoutAmountAed * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/report/${assessmentId}?upgraded=1`,
    cancel_url: `${siteUrl}/report/${assessmentId}?upgrade_cancelled=1`,
    metadata: { assessmentId, tier },
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
