import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// Handles the redirect from Supabase's email confirmation / magic link,
// exchanging the one-time code for a session cookie.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;

    // Auto-joins a team the user was invited to before they had an account
    // (src/app/api/organizations/invite/route.ts inserts the pending row).
    // Best-effort and non-blocking — a failure here shouldn't stop the
    // user from landing in their new session.
    if (user?.email) {
      try {
        const admin = createAdminSupabaseClient();
        const { data: invite } = await admin
          .from('organization_invites')
          .select('id, organization_id')
          .eq('email', user.email)
          .maybeSingle();

        if (invite) {
          // Lightweight team accounts assume one org per user (see
          // ensureOrganizationForUser) — skip joining if this account
          // somehow already belongs to one, rather than creating a second,
          // ambiguous membership.
          const { data: existingMembership } = await admin
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (!existingMembership) {
            await admin
              .from('organization_members')
              .insert({ organization_id: invite.organization_id, user_id: user.id, role: 'member' });
          }
          await admin.from('organization_invites').delete().eq('id', invite.id);
        }
      } catch (err) {
        console.error('Failed to auto-join pending team invite', err);
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
