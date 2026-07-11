import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { ensureOrganizationForUser } from '@/lib/organizations/ensure';
import { updateSharingSchema, type ShareExpiryOption } from '@/lib/validation/schemas';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DAY_MS = 24 * 60 * 60 * 1000;

const expiryToTimestamp = (expiry: ShareExpiryOption): string | null => {
  if (expiry === 'never') return null;
  const days: Record<Exclude<ShareExpiryOption, 'never'>, number> = { '1d': 1, '7d': 7, '30d': 30 };
  return new Date(Date.now() + days[expiry] * DAY_MS).toISOString();
};

// Lets an assessment's owner control the two independent ways a report can
// be seen by someone else: the public "anyone with the link" toggle/expiry
// (report/[id]/page.tsx checks share_enabled/share_expires_at for non-owner,
// non-teammate viewers) and whether it's shared with their whole
// organization (organization_id, checked via RLS's assessments_select_org_member).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = updateSharingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid update.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const organizationId = parsed.data.organizationShared
    ? await ensureOrganizationForUser(createAdminSupabaseClient(), user.id)
    : null;

  // Uses the session client, not the admin client — assessments_update_own
  // (supabase/migrations/0001_init.sql) already restricts updates to the
  // caller's own row, so RLS itself is the enforcement here, not just the
  // .eq('user_id', ...) filter below.
  const { data, error } = await sessionClient
    .from('assessments')
    .update({
      share_enabled: parsed.data.shareEnabled,
      share_expires_at: expiryToTimestamp(parsed.data.shareExpiry),
      organization_id: organizationId,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, share_enabled, share_expires_at, organization_id')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Could not update sharing settings.' }, { status: 404 });
  }

  return NextResponse.json({ assessment: data });
}
