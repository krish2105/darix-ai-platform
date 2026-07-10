import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { contactSchema } from '@/lib/validation/schemas';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { EMAIL_FROM, TEAM_ALERT_EMAIL, getResendClient, isEmailConfigured } from '@/lib/email/resend';
import { leadAlertEmail, leadConfirmationEmail } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limitResult = rateLimit(`contact:post:${ip}`, { limit: 5, windowMs: 60_000 });
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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please check the form for errors.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const lead = parsed.data;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('leads').insert({
    full_name: lead.fullName,
    work_email: lead.workEmail,
    company_name: lead.companyName,
    company_size: lead.companySize,
    challenge: lead.challenge,
  });

  if (error) {
    console.error('Failed to save lead', error);
    return NextResponse.json(
      { error: 'Could not submit your request. Please try again.' },
      { status: 500 }
    );
  }

  // The lead is saved — that's the part that matters. Email notifications
  // are best-effort on top of it: a Resend outage shouldn't turn a
  // successfully captured lead into a user-facing error.
  if (isEmailConfigured()) {
    const resend = getResendClient();
    if (resend) {
      const confirmation = leadConfirmationEmail(lead.fullName);
      const alert = leadAlertEmail(lead);

      const emailPromises = [
        resend.emails.send({
          from: EMAIL_FROM,
          to: lead.workEmail,
          subject: confirmation.subject,
          html: confirmation.html,
        }),
      ];

      if (TEAM_ALERT_EMAIL) {
        emailPromises.push(
          resend.emails.send({
            from: EMAIL_FROM,
            to: TEAM_ALERT_EMAIL,
            subject: alert.subject,
            html: alert.html,
          })
        );
      }

      await Promise.allSettled(emailPromises).then((results) => {
        results.forEach((r) => {
          if (r.status === 'rejected') console.error('Lead email failed to send', r.reason);
        });
      });
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
