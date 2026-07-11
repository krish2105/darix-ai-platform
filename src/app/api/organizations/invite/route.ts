import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { ensureOrganizationForUser } from '@/lib/organizations/ensure';
import { inviteTeammateSchema } from '@/lib/validation/schemas';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// Invites a teammate to the caller's organization — lazily creating one
// (and making the caller its owner) if they don't have one yet. Only the
// org's owner can invite: a caller who is already a 'member' of someone
// else's org is blocked below, same as the UI (InviteTeammateForm only
// renders the form for an owner-role caller).
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limitResult = await rateLimit(`organizations:invite:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
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

  const parsed = inviteTeammateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid invite.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.email.toLowerCase() === user.email?.toLowerCase()) {
    return NextResponse.json({ error: "You can't invite yourself." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const organizationId = await ensureOrganizationForUser(admin, user.id);

  const { data: callerMembership } = await admin
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (callerMembership?.role !== 'owner') {
    return NextResponse.json(
      { error: 'Only the team owner can invite teammates.' },
      { status: 403 }
    );
  }

  const { data: existingUserId } = await admin.rpc('get_user_id_by_email', {
    lookup_email: parsed.data.email,
  });

  if (existingUserId) {
    const { data: alreadyOnATeam } = await admin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', existingUserId)
      .maybeSingle();

    if (alreadyOnATeam) {
      return NextResponse.json(
        { error: 'This person is already part of a team.' },
        { status: 409 }
      );
    }

    const { error: memberError } = await admin
      .from('organization_members')
      .insert({ organization_id: organizationId, user_id: existingUserId, role: 'member' });

    if (memberError) {
      console.error('Failed to add teammate', memberError);
      return NextResponse.json({ error: 'Could not add this teammate.' }, { status: 500 });
    }

    return NextResponse.json({ status: 'joined' }, { status: 201 });
  }

  const { error: inviteError } = await admin
    .from('organization_invites')
    .upsert(
      { organization_id: organizationId, email: parsed.data.email, invited_by: user.id },
      { onConflict: 'organization_id,email' }
    );

  if (inviteError) {
    console.error('Failed to record invite', inviteError);
    return NextResponse.json({ error: 'Could not send this invite.' }, { status: 500 });
  }

  // Best-effort: sends Supabase's own invite email so the invitee can create
  // an account. Non-blocking — the pending row above is what actually gets
  // consumed on signup (src/app/auth/callback/route.ts), so a delivery
  // failure here shouldn't fail the whole request.
  try {
    await admin.auth.admin.inviteUserByEmail(parsed.data.email);
  } catch (err) {
    console.error('Failed to send invite email', err);
  }

  return NextResponse.json({ status: 'invited' }, { status: 201 });
}
