import { NextRequest, NextResponse } from 'next/server';
import { checkTelrOrder } from '@/lib/telr/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { EMAIL_FROM, getResendClient, isEmailConfigured } from '@/lib/email/resend';
import { paymentReceiptEmail } from '@/lib/email/templates';
import { pricingPlans } from '@/data/pricing';
import { captureServerEvent } from '@/lib/analytics/posthog-server';

// Telr redirects the shopper's browser here after the "authorised" step of
// its hosted payment page, appending its own order reference param. That
// redirect alone is not proof of payment (a shopper could hit this URL
// without paying), so this route calls back to Telr server-to-server to
// confirm the order's real status before unlocking anything — playing the
// same role the signed Stripe webhook event plays for the Stripe flow.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const assessmentId = searchParams.get('assessmentId');
  const tier = searchParams.get('tier');
  const orderRef =
    searchParams.get('OrderRef') || searchParams.get('order_ref') || searchParams.get('ref');

  if (!assessmentId) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const declinedUrl = new URL(`/report/${assessmentId}`, request.url);
  declinedUrl.searchParams.set('upgrade_declined', '1');

  if (!tier || !orderRef) {
    return NextResponse.redirect(declinedUrl);
  }

  try {
    const status = await checkTelrOrder(orderRef);
    if (!status.paid) {
      return NextResponse.redirect(declinedUrl);
    }

    const admin = createAdminSupabaseClient();
    const { data: assessment, error } = await admin
      .from('assessments')
      .update({ tier })
      .eq('id', assessmentId)
      .select('id, company_name, contact_email')
      .single();

    if (error || !assessment) {
      console.error('Failed to update assessment tier after Telr payment', error);
      return NextResponse.redirect(declinedUrl);
    }

    const plan = pricingPlans.find((p) => p.id === tier);
    if (assessment.contact_email && plan && isEmailConfigured()) {
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
          to: assessment.contact_email,
          subject: receipt.subject,
          html: receipt.html,
        });
        if (sendError) console.error('Failed to send Telr payment receipt email', sendError);
      }
    }

    await captureServerEvent(assessmentId, 'payment_completed', {
      tier,
      amount_aed: plan?.checkoutAmountAed,
      assessment_id: assessmentId,
      provider: 'telr',
    });

    const successUrl = new URL(`/report/${assessmentId}`, request.url);
    successUrl.searchParams.set('upgraded', '1');
    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error('Telr order confirmation failed', err);
    return NextResponse.redirect(declinedUrl);
  }
}
