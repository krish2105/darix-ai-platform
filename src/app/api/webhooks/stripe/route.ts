import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { EMAIL_FROM, getResendClient, isEmailConfigured } from '@/lib/email/resend';
import { paymentReceiptEmail } from '@/lib/email/templates';
import { pricingPlans } from '@/data/pricing';
import { captureServerEvent } from '@/lib/analytics/posthog-server';

// Needs the raw request body for Stripe signature verification, and the
// Node.js runtime for the Stripe SDK.
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const assessmentId = session.metadata?.assessmentId;
    const tier = session.metadata?.tier;

    if (!assessmentId || !tier) {
      console.error('Stripe webhook missing metadata', session.id);
      return NextResponse.json({ received: true });
    }

    const admin = createAdminSupabaseClient();
    const { data: assessment, error } = await admin
      .from('assessments')
      .update({ tier })
      .eq('id', assessmentId)
      .select('id, company_name, contact_email')
      .single();

    if (error || !assessment) {
      console.error('Failed to update assessment tier after payment', error);
      return NextResponse.json({ received: true });
    }

    const recipientEmail = session.customer_details?.email || assessment.contact_email;
    const plan = pricingPlans.find((p) => p.id === tier);

    if (recipientEmail && plan && isEmailConfigured()) {
      const resend = getResendClient();
      if (resend) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
        const receipt = paymentReceiptEmail({
          planName: plan.name,
          amountAed: plan.checkoutAmountAed ?? 0,
          reportUrl: `${siteUrl}/report/${assessmentId}`,
        });
        const { error: sendError } = await resend.emails.send({
          from: EMAIL_FROM,
          to: recipientEmail,
          subject: receipt.subject,
          html: receipt.html,
        });
        if (sendError) console.error('Failed to send payment receipt email', sendError);
      }
    }

    await captureServerEvent(assessmentId, 'payment_completed', {
      tier,
      amount_aed: plan?.checkoutAmountAed,
      assessment_id: assessmentId,
    });
  }

  return NextResponse.json({ received: true });
}
