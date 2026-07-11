import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// PDPL right to access/portability: lets a signed-in user download every
// assessment tied to their account as a single JSON file. Anonymous
// assessments (no user_id) aren't reachable this way since there's no
// account to prove ownership through — those go via the /privacy-center
// request form instead.
export async function GET() {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to export your data.' }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { data: assessments, error } = await admin
    .from('assessments')
    .select('id, company_name, contact_name, contact_email, answers, result, tier, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to export account data', error);
    return NextResponse.json({ error: 'Could not export your data. Please try again.' }, { status: 500 });
  }

  const { data: conversations, error: conversationsError } = await admin
    .from('chat_conversations')
    .select('id, mode, assessment_id, created_at, chat_messages(role, content, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (conversationsError) {
    console.error('Failed to export chatbot conversations', conversationsError);
    return NextResponse.json({ error: 'Could not export your data. Please try again.' }, { status: 500 });
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at },
    assessments,
    chatbotConversations: conversations,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="darix-my-data.json"',
      'Cache-Control': 'private, no-store',
    },
  });
}
