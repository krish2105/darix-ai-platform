import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { isGeminiConfigured, streamGeminiChat, type ChatHistoryMessage } from '@/lib/gemini/client';
import { buildAdvisorSystemPrompt } from '@/lib/chatbot/prompt';
import { streamWithPersistedReply } from '@/lib/chatbot/persist-stream';
import { isLocale, defaultLocale } from '@/lib/i18n/translations';
import type { ReadinessResult } from '@/utils/scoring';

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  locale: z.string(),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(20)
    .default([]),
  assessmentId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { message, history, assessmentId } = parsed.data;
  const locale = isLocale(parsed.data.locale) ? parsed.data.locale : defaultLocale;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to use the advisor.' }, { status: 401 });
  }

  const limitResult = await rateLimit(`chatbot:advisor:${user.id}`, { limit: 20, windowMs: 60_000 });
  if (!limitResult.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'The assistant is temporarily unavailable.' }, { status: 503 });
  }

  // Session client, not the admin client used by the shareable report
  // link/PDF/email flows — RLS (assessments_select_own) double-enforces
  // that this is genuinely the caller's own assessment, since the
  // advisor is explicitly "your own data," not "whoever has the link."
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('result')
    .eq('id', assessmentId)
    .eq('user_id', user.id)
    .single();
  if (assessmentError || !assessment) {
    return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
  }

  const systemPrompt = buildAdvisorSystemPrompt(assessment.result as ReadinessResult, locale);
  const stream = await streamGeminiChat({ systemPrompt, history: history as ChatHistoryMessage[], userMessage: message });
  if (!stream) {
    return NextResponse.json({ error: 'The assistant is temporarily unavailable.' }, { status: 503 });
  }

  const admin = createAdminSupabaseClient();
  let conversationId = parsed.data.conversationId;
  try {
    if (!conversationId) {
      const { data: conversation, error: convError } = await admin
        .from('chat_conversations')
        .insert({ user_id: user.id, mode: 'advisor', assessment_id: assessmentId })
        .select('id')
        .single();
      if (convError || !conversation) throw convError ?? new Error('insert failed');
      conversationId = conversation.id;
    }
    await admin.from('chat_messages').insert({ conversation_id: conversationId, role: 'user', content: message });
  } catch (err) {
    console.error('Failed to persist advisor conversation/message', err);
  }

  if (!conversationId) {
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }

  return streamWithPersistedReply(stream, admin, conversationId);
}
