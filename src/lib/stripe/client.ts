import Stripe from 'stripe';

let client: Stripe | null = null;

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

// Lazily constructed so a missing key doesn't crash module import (e.g. at
// build time, or in environments that never touch checkout).
export const getStripeClient = (): Stripe | null => {
  if (client) return client;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  client = new Stripe(secretKey);
  return client;
};
