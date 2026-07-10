// WhatsApp Business (Meta Cloud API) send helper — the automated half of
// Phase 6's click-to-chat button, which only ever opened a pre-filled
// compose window and never sent anything programmatically. Graceful no-op
// when unconfigured, same pattern as Stripe/Telr/Sentry: callers should
// treat a false return as "message not sent" and not block on it (a
// WhatsApp confirmation is a bonus, never the only way a user gets their
// result — email/PDF/download already cover that).
//
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

const GRAPH_API_VERSION = 'v20.0';

export const isWhatsAppConfigured = () =>
  Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

interface SendWhatsAppMessageParams {
  to: string;
  text: string;
}

// `to` should be in international format without a leading "+" (e.g.
// 971501234567), matching what Meta's Cloud API expects and what the
// existing NEXT_PUBLIC_WHATSAPP_NUMBER click-to-chat button already uses.
export const sendWhatsAppMessage = async ({ to, text }: SendWhatsAppMessageParams): Promise<boolean> => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return false;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text, preview_url: true },
        }),
      }
    );

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      console.error('WhatsApp message send failed', res.status, errorBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('WhatsApp message send threw', err);
    return false;
  }
};

// Best-effort internal alert (e.g. "a Business tier consultation was just
// purchased") to the team's own WhatsApp number — separate from
// TEAM_ALERT_EMAIL, which already covers the email channel for the same
// kind of notification. Silently skipped when either the API or the team
// number isn't configured.
export const alertTeamOnWhatsApp = async (text: string): Promise<void> => {
  const teamNumber = process.env.TEAM_WHATSAPP_NUMBER;
  if (!teamNumber || !isWhatsAppConfigured()) return;
  await sendWhatsAppMessage({ to: teamNumber, text });
};
