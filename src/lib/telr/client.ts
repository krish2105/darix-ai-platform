// Telr Hosted Payment Page integration — the UAE-market alternative to
// Stripe (better local card/wallet acceptance). Field names here follow
// Telr's published order.json integration guide as of this writing;
// verify against a live Telr sandbox account before taking this to
// production, the same way Stripe was run in test mode first.
//
// https://telr.com/support/knowledge-base/hosted-payment-page-integration-guide/

const TELR_ORDER_ENDPOINT = 'https://secure.telr.com/gateway/order.json';

export const isTelrConfigured = () =>
  Boolean(process.env.TELR_STORE_ID && process.env.TELR_AUTH_KEY);

interface CreateTelrOrderParams {
  cartId: string;
  amountAed: number;
  description: string;
  returnAuthorised: string;
  returnDeclined: string;
  returnCancelled: string;
}

interface TelrOrderResult {
  ref: string;
  url: string;
}

// Telr's sandbox/test mode is toggled per-order (not per-account), via
// order.test = "1". Defaults to test mode unless explicitly disabled, so a
// misconfigured production deploy fails safe into "no real charge" rather
// than the reverse.
const isTestMode = () => process.env.TELR_TEST_MODE !== '0';

export const createTelrOrder = async (
  params: CreateTelrOrderParams
): Promise<TelrOrderResult> => {
  const storeId = process.env.TELR_STORE_ID;
  const authKey = process.env.TELR_AUTH_KEY;
  if (!storeId || !authKey) {
    throw new Error('Telr is not configured (TELR_STORE_ID / TELR_AUTH_KEY missing).');
  }

  const res = await fetch(TELR_ORDER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'create',
      store: storeId,
      authkey: authKey,
      order: {
        cartid: params.cartId,
        test: isTestMode() ? '1' : '0',
        amount: params.amountAed.toFixed(2),
        currency: 'AED',
        description: params.description,
      },
      return: {
        authorised: params.returnAuthorised,
        declined: params.returnDeclined,
        cancelled: params.returnCancelled,
      },
    }),
  });

  const data = await res.json();

  if (!res.ok || data?.error || !data?.order?.ref || !data?.order?.url) {
    console.error('Telr order creation failed', data);
    throw new Error(data?.error?.message || 'Could not start Telr checkout.');
  }

  return { ref: data.order.ref, url: data.order.url };
};

interface TelrOrderStatus {
  paid: boolean;
  statusCode: number | null;
  statusText: string | null;
}

// Telr's own redirect back to our "authorised" return URL is not proof of
// payment on its own (a shopper can hit that URL without paying) — this
// server-to-server check call is the actual source of truth, playing the
// same role Stripe's signed webhook event plays for the Stripe flow.
export const checkTelrOrder = async (orderRef: string): Promise<TelrOrderStatus> => {
  const storeId = process.env.TELR_STORE_ID;
  const authKey = process.env.TELR_AUTH_KEY;
  if (!storeId || !authKey) {
    throw new Error('Telr is not configured (TELR_STORE_ID / TELR_AUTH_KEY missing).');
  }

  const res = await fetch(TELR_ORDER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'check',
      store: storeId,
      authkey: authKey,
      order: { ref: orderRef },
    }),
  });

  const data = await res.json();
  const statusCode = data?.order?.status?.code ?? null;
  const statusText = data?.order?.status?.text ?? null;

  // Status code 3 = "Paid" in Telr's order status codes.
  return { paid: statusCode === 3, statusCode, statusText };
};
