// Tabby (BNPL) checkout integration — offered alongside Stripe/Telr as a
// "pay in 4 interest-free installments" option for the AED 1,999 Business
// Consultation tier specifically (the only tier priced high enough that
// installments are a meaningful purchase decision). Unlike Stripe/Telr,
// Tabby is additive rather than a PAYMENT_PROVIDER switch — the regular
// checkout still works when Tabby is unconfigured.
//
// Field names follow Tabby's published Checkout API guide as of this
// writing; verify against a live Tabby test merchant account before going
// to production, the same "confirm in the real environment" caveat as the
// Telr integration (src/lib/telr/client.ts).
// https://docs.tabby.ai/

const TABBY_API_BASE = 'https://api.tabby.ai/api/v2';

export const isTabbyConfigured = () =>
  Boolean(process.env.TABBY_SECRET_KEY && process.env.TABBY_MERCHANT_CODE);

interface CreateTabbyCheckoutParams {
  amountAed: number;
  description: string;
  referenceId: string;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  buyerEmail?: string | null;
}

interface TabbyCheckoutResult {
  paymentId: string;
  webUrl: string;
}

// Thrown specifically when Tabby's own risk/eligibility check declines the
// session (status "rejected") — a real, expected outcome (not every buyer
// qualifies for BNPL), distinct from a network/config failure. Callers
// should show "try a card instead" rather than a generic error for this.
export class TabbyNotEligibleError extends Error {
  constructor() {
    super('Tabby has declined this checkout for the buyer.');
    this.name = 'TabbyNotEligibleError';
  }
}

export const createTabbyCheckoutSession = async (
  params: CreateTabbyCheckoutParams
): Promise<TabbyCheckoutResult> => {
  const secretKey = process.env.TABBY_SECRET_KEY;
  const merchantCode = process.env.TABBY_MERCHANT_CODE;
  if (!secretKey || !merchantCode) {
    throw new Error('Tabby is not configured (TABBY_SECRET_KEY / TABBY_MERCHANT_CODE missing).');
  }

  const amount = params.amountAed.toFixed(2);

  const res = await fetch(`${TABBY_API_BASE}/checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment: {
        amount,
        currency: 'AED',
        description: params.description,
        buyer: params.buyerEmail ? { email: params.buyerEmail } : undefined,
        order: {
          reference_id: params.referenceId,
          items: [
            {
              title: params.description,
              quantity: 1,
              unit_price: amount,
              category: 'consulting_services',
            },
          ],
        },
      },
      lang: 'en',
      merchant_code: merchantCode,
      merchant_urls: {
        success: params.successUrl,
        cancel: params.cancelUrl,
        failure: params.failureUrl,
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Tabby checkout session creation failed', data);
    throw new Error(data?.error || 'Could not start Tabby checkout.');
  }

  if (data?.status === 'rejected') {
    throw new TabbyNotEligibleError();
  }

  const webUrl = data?.configuration?.available_products?.installments?.[0]?.web_url;
  if (!webUrl || !data?.id) {
    console.error('Tabby checkout session missing installments web_url', data);
    throw new Error('Could not start Tabby checkout.');
  }

  return { paymentId: data.id, webUrl };
};

interface TabbyPaymentStatus {
  status: string;
  authorized: boolean;
  amountAed: number;
}

// Tabby's own redirect back to our success URL is not proof of payment on
// its own — this server-to-server lookup is the actual source of truth,
// the same role Telr's "check" call and Stripe's signed webhook event play
// for their respective flows.
export const retrieveTabbyPayment = async (paymentId: string): Promise<TabbyPaymentStatus> => {
  const secretKey = process.env.TABBY_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Tabby is not configured (TABBY_SECRET_KEY missing).');
  }

  const res = await fetch(`${TABBY_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();

  if (!res.ok) {
    console.error('Tabby payment lookup failed', data);
    throw new Error('Could not verify Tabby payment.');
  }

  return {
    status: data?.status ?? 'unknown',
    authorized: data?.status === 'AUTHORIZED' || data?.status === 'CLOSED',
    amountAed: Number(data?.amount ?? 0),
  };
};

// Tabby's simplest integration mode requires an explicit capture after
// authorization before funds actually settle (mirrors "auth then capture"
// card processing) — a service purchase like this consultation is
// considered "delivered" immediately, so it's captured right after
// confirming authorization rather than deferred to a fulfillment event.
export const captureTabbyPayment = async (paymentId: string, amountAed: number): Promise<boolean> => {
  const secretKey = process.env.TABBY_SECRET_KEY;
  if (!secretKey) return false;

  try {
    const res = await fetch(`${TABBY_API_BASE}/payments/${encodeURIComponent(paymentId)}/captures`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amountAed.toFixed(2) }),
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      console.error('Tabby payment capture failed', res.status, errorBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Tabby payment capture threw', err);
    return false;
  }
};
