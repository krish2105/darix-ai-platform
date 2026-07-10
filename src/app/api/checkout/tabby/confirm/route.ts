import { NextRequest, NextResponse } from 'next/server';
import { captureTabbyPayment, retrieveTabbyPayment } from '@/lib/tabby/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { EMAIL_FROM, getResendClient, isEmailConfigured } from '@/lib/email/resend';
import { paymentReceiptEmail } from '@/lib/email/templates';
import { pricingPlans } from '@/data/pricing';
import { captureServerEvent } from '@/lib/analytics/posthog-server';
import { alertTeamOnWhatsApp } from '@/lib/whatsapp/client';

const BUSINESS_PLAN = pricingPlans.find((p) => p.id === 'business')!;

// Tabby redirects the shopper's browser here after checkout, appending its
// own payment_id param. Same as the Telr confirm route: that redirect
// alone is not proof of payment, so this calls back to Tabby
// server-to-server to verify the payment is actually authorized, then
// explicitly captures it, before unlocking the Business tier.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const assessmentId = searchParams.get('assessmentId');
  const paymentId = searchParams.get('payment_id') || searchParams.get('id');

  if (!assessmentId) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const declinedUrl = new URL(`/report/${assessmentId}`, request.url);
  declinedUrl.searchParams.set('upgrade_declined', '1');

  if (!paymentId) {
    return NextResponse.redirect(declinedUrl);
  }

  try {
    const payment = await retrieveTabbyPayment(paymentId);
    if (!payment.authorized) {
      return NextResponse.redirect(declinedUrl);
    }

    const captured = await captureTabbyPayment(paymentId, BUSINESS_PLAN.checkoutAmountAed!);
    if (!captured) {
      return NextResponse.redirect(declinedUrl);
    }

    const admin = createAdminSupabaseClient();
    const { data: assessment, error } = await admin
      .from('assessments')
      .update({ tier: 'business' })
      .eq('id', assessmentId)
      .select('id, company_name, contact_email')
      .single();

    if (error || !assessment) {
      console.error('Failed to update assessment tier after Tabby payment', error);
      return NextResponse.redirect(declinedUrl);
    }

    if (assessment.contact_email && isEmailConfigured()) {
      const resend = getResendClient();
      if (resend) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
        const receipt = paymentReceiptEmail({
          planName: BUSINESS_PLAN.name,
          amountAed: BUSINESS_PLAN.checkoutAmountAed ?? 0,
          reportUrl: `${siteUrl}/report/${assessmentId}`,
        });
        const { error: sendError } = await resend.emails.send({
          from: EMAIL_FROM,
          to: assessment.contact_email,
          subject: receipt.subject,
          html: receipt.html,
        });
        if (sendError) console.error('Failed to send Tabby payment receipt email', sendError);
      }
    }

    await captureServerEvent(assessmentId, 'payment_completed', {
      tier: 'business',
      amount_aed: BUSINESS_PLAN.checkoutAmountAed,
      assessment_id: assessmentId,
      provider: 'tabby',
    });

    await alertTeamOnWhatsApp(
      `New Business Consultation purchase (Tabby, pay-in-installments) — ${assessment.company_name ?? 'unknown company'}. Report: ${assessmentId}`
    ).catch((err) => console.error('Business purchase WhatsApp alert failed', err));

    const successUrl = new URL(`/report/${assessmentId}`, request.url);
    successUrl.searchParams.set('upgraded', '1');
    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error('Tabby payment confirmation failed', err);
    return NextResponse.redirect(declinedUrl);
  }
}
