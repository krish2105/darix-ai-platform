const layout = (title: string, bodyHtml: string) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
            <tr>
              <td style="background:linear-gradient(90deg,#38BDF8,#8B5CF6);padding:20px 32px;">
                <span style="color:#ffffff;font-weight:700;font-size:18px;letter-spacing:0.04em;">DARIX AI</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#0F172A;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
                <p style="margin:0;font-size:12px;color:#64748B;">Dubai AI Readiness Index &middot; Dubai, United Arab Emirates</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const p = (text: string) => `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">${text}</p>`;

export const leadConfirmationEmail = (fullName: string) => ({
  subject: 'We received your AI Readiness Review request',
  html: layout(
    'Thanks for reaching out',
    `${p(`Hi ${escapeHtml(fullName)},`)}${p(
      "We've received your request for an AI Readiness Review. A member of our team will review your details and reach out within 1-2 business days to schedule your consultation."
    )}${p("In the meantime, feel free to explore your free assessment results if you haven't already.")}`
  ),
});

const jurisdictionLabels: Record<string, string> = {
  mainland: 'UAE Mainland',
  difc: 'DIFC',
  adgm: 'ADGM',
  other: 'Other / Unknown',
};

export const leadAlertEmail = (lead: {
  fullName: string;
  workEmail: string;
  companyName: string;
  companySize: string;
  businessJurisdiction?: string;
  challenge: string;
}) => {
  const jurisdiction = lead.businessJurisdiction ? jurisdictionLabels[lead.businessJurisdiction] : null;
  // DIFC/ADGM run their own data-protection regimes, separate from
  // Federal PDPL — see docs/ROPA.md §0. Flag it visibly rather than
  // burying it in a table row, since it's a go/no-go signal, not just
  // context, until that regime scoping is confirmed with counsel.
  const jurisdictionWarning =
    lead.businessJurisdiction === 'difc' || lead.businessJurisdiction === 'adgm'
      ? `<p style="margin:16px 0 0;padding:12px 16px;background:#FEF3C7;border-radius:8px;font-size:13px;color:#92400E;"><strong>Note:</strong> this lead is registered in ${escapeHtml(jurisdiction!)}, which runs its own data protection regime separate from Federal PDPL. Confirm regime applicability with counsel (docs/ROPA.md §0) before progressing.</p>`
      : '';

  return {
    subject: `New lead: ${lead.companyName}`,
    html: layout(
      'New contact form submission',
      `
    <table role="presentation" width="100%" style="font-size:14px;color:#334155;">
      <tr><td style="padding:4px 0;font-weight:600;width:160px;">Name</td><td>${escapeHtml(lead.fullName)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Email</td><td>${escapeHtml(lead.workEmail)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Company</td><td>${escapeHtml(lead.companyName)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Size</td><td>${escapeHtml(lead.companySize)}</td></tr>
      ${jurisdiction ? `<tr><td style="padding:4px 0;font-weight:600;">Jurisdiction</td><td>${escapeHtml(jurisdiction)}</td></tr>` : ''}
    </table>
    ${jurisdictionWarning}
    <p style="margin:16px 0 0;font-size:14px;color:#334155;"><strong>Main AI challenge:</strong><br/>${escapeHtml(lead.challenge)}</p>
    `
    ),
  };
};

export const reportReadyEmail = ({
  companyName,
  score,
  level,
  reportUrl,
}: {
  companyName: string | null;
  score: number;
  level: string;
  reportUrl: string;
}) => ({
  subject: 'Your AI Readiness Report is ready',
  html: layout(
    'Your report is ready',
    `${p(
      `${companyName ? escapeHtml(companyName) + "'s" : 'Your'} AI Readiness score is <strong>${score}/100</strong> (${escapeHtml(level)}).`
    )}${p('View your full dashboard and download the PDF report using the link below.')}
    <a href="${reportUrl}" style="display:inline-block;background:#22D3EE;color:#030712;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px;font-size:14px;">View My Report</a>`
  ),
});

export const paymentReceiptEmail = ({
  planName,
  amountAed,
  reportUrl,
}: {
  planName: string;
  amountAed: number;
  reportUrl: string;
}) => ({
  subject: `Receipt: ${planName} (AED ${amountAed})`,
  html: layout(
    'Payment received',
    `${p(`Thank you for purchasing the <strong>${escapeHtml(planName)}</strong> report.`)}
    <table role="presentation" width="100%" style="font-size:14px;color:#334155;margin-bottom:16px;">
      <tr><td style="padding:4px 0;font-weight:600;width:120px;">Plan</td><td>${escapeHtml(planName)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Amount</td><td>AED ${amountAed}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Currency</td><td>AED (United Arab Emirates Dirham)</td></tr>
    </table>
    ${p('Your upgraded report is ready — view it using the link below.')}
    <a href="${reportUrl}" style="display:inline-block;background:#22D3EE;color:#030712;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px;font-size:14px;">View My Report</a>`
  ),
});

export const reassessmentReminderEmail = ({ score, level, assessUrl }: { score: number; level: string; assessUrl: string }) => ({
  subject: 'How has your AI readiness changed?',
  html: layout(
    'Time for a check-in',
    `${p(
      `Your last AI Readiness Assessment scored <strong>${score}/100</strong> (${escapeHtml(level)}). A lot can change in a quarter — new tools adopted, data cleaned up, a pilot that shipped (or didn't).`
    )}${p('Retake the free assessment to see how your score has moved and get an updated roadmap.')}
    <a href="${assessUrl}" style="display:inline-block;background:#22D3EE;color:#030712;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px;font-size:14px;">Retake My Assessment</a>`
  ),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
