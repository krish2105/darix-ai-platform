import { createClient } from '@supabase/supabase-js';

// Service-role client: bypasses Row Level Security entirely. Server-only —
// never import this from a Client Component or expose the key to the
// browser. Used for: saving anonymous quiz submissions, fetching a single
// assessment by id for the shareable report/PDF/email flows, and the
// contact-form lead inserts.
export const createAdminSupabaseClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
