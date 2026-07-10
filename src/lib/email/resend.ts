import { Resend } from 'resend';

let client: Resend | null = null;

// Lazily constructed so a missing RESEND_API_KEY doesn't crash routes that
// don't need email (or module import at build time) — callers check
// isEmailConfigured() and degrade gracefully instead.
export const getResendClient = (): Resend | null => {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  client = new Resend(apiKey);
  return client;
};

export const isEmailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Darix AI <onboarding@resend.dev>';
export const TEAM_ALERT_EMAIL = process.env.TEAM_ALERT_EMAIL ?? '';
