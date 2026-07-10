import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Session-aware client, respects RLS as the signed-in (or anonymous) user.
// Use in Server Components, Route Handlers, and Server Actions that need
// to know "who is making this request."
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — middleware handles
            // refreshing the session cookie in that case, so this is safe
            // to swallow.
          }
        },
      },
    }
  );
};
