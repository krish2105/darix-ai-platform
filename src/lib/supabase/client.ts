import { createBrowserClient } from '@supabase/ssr';

// Auth genuinely doesn't work without Supabase configured — login,
// sign-out, and the dashboard's self-service export/delete all
// legitimately need it and are fine failing loudly if it's missing,
// the same way checkout fails loudly without Stripe/Telr configured.
// This check exists for call sites like AuthNavLink (rendered in the
// site-wide Navbar, on every page) where a missing config should degrade
// to "show a generic logged-out state" rather than crash the entire page.
export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
