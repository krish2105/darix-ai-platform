export const isTurnstileConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

// Verifies a Turnstile token server-side. Returns true (and skips the
// network call) when Turnstile isn't configured, so bot protection being
// unset never blocks a real submission — it's an additive layer on top of
// the existing rate limiting, not a hard dependency.
export const verifyTurnstileToken = async (
  token: string | undefined,
  remoteIp?: string
): Promise<boolean> => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data: TurnstileVerifyResponse = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verification request failed', err);
    return false;
  }
};
