import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// PDPL right to erasure: permanently deletes every assessment tied to the
// signed-in user's account, then deletes the account itself. This is a
// genuine delete (not just detaching user_id) since the assessment rows
// themselves — company name, contact info, answers — are the personal data
// PDPL erasure applies to. Order matters: the assessments are removed
// first, while user_id still identifies them, then the auth account.
export async function POST() {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to delete your account.' }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  const { error: deleteAssessmentsError } = await admin
    .from('assessments')
    .delete()
    .eq('user_id', user.id);

  if (deleteAssessmentsError) {
    console.error('Failed to delete account assessments', deleteAssessmentsError);
    return NextResponse.json({ error: 'Could not delete your data. Please try again.' }, { status: 500 });
  }

  // chat_conversations.user_id is ON DELETE CASCADE from auth.users, so
  // this would also happen implicitly when the auth user is deleted below
  // (chat_messages cascades again from chat_conversations) — deleted
  // explicitly here anyway so the intent is visible in this file rather
  // than relying on an FK behavior a future reader can't see.
  const { error: deleteConversationsError } = await admin
    .from('chat_conversations')
    .delete()
    .eq('user_id', user.id);

  if (deleteConversationsError) {
    console.error('Failed to delete chatbot conversations', deleteConversationsError);
    return NextResponse.json({ error: 'Could not delete your data. Please try again.' }, { status: 500 });
  }

  // organization_members.user_id is also ON DELETE CASCADE from auth.users
  // (supabase/migrations/0009_sharing_and_teams.sql) — deleting the auth
  // user below removes their team membership row too. Unlike
  // chat_conversations, there's no separate personal-data table to clean up
  // here: the membership row holds no PII beyond the FK itself.
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    console.error('Failed to delete auth account', deleteUserError);
    return NextResponse.json(
      { error: 'Your assessments were deleted, but we could not remove your account. Please contact us to finish this.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
