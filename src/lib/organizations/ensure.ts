import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy org creation: most users never need a team, so no organization is
// created at signup. The first time a user does something that needs one —
// sharing an assessment with their team, or inviting a teammate — one is
// created on the fly and the caller becomes its owner. Always called with
// the admin client: organizations/organization_members have no
// anon/authenticated insert policy (see supabase/migrations/0009_sharing_and_teams.sql).
export async function ensureOrganizationForUser(
  admin: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: existing } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.organization_id as string;

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ created_by: userId, name: 'My Team' })
    .select('id')
    .single();
  if (orgError || !org) {
    throw new Error('Could not create organization');
  }

  const { error: memberError } = await admin
    .from('organization_members')
    .insert({ organization_id: org.id, user_id: userId, role: 'owner' });
  if (memberError) {
    throw new Error('Could not add owner membership');
  }

  return org.id as string;
}
