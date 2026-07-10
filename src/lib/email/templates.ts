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

export const leadAlertEmail = (lead: {
  fullName: string;
  workEmail: string;
  companyName: string;
  companySize: string;
  challenge: string;
}) => ({
  subject: `New lead: ${lead.companyName}`,
  html: layout(
    'New contact form submission',
    `
    <table role="presentation" width="100%" style="font-size:14px;color:#334155;">
      <tr><td style="padding:4px 0;font-weight:600;width:120px;">Name</td><td>${escapeHtml(lead.fullName)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Email</td><td>${escapeHtml(lead.workEmail)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Company</td><td>${escapeHtml(lead.companyName)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Size</td><td>${escapeHtml(lead.companySize)}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:#334155;"><strong>Main AI challenge:</strong><br/>${escapeHtml(lead.challenge)}</p>
    `
  ),
});

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
