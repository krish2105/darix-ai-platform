import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';
import { getGeminiEmbedding, isGeminiConfigured, streamGeminiChat, type ChatHistoryMessage } from '@/lib/gemini/client';
import { buildFaqSystemPrompt, type RetrievedChunk } from '@/lib/chatbot/prompt';
import { streamWithPersistedReply } from '@/lib/chatbot/persist-stream';
import { isLocale, defaultLocale } from '@/lib/i18n/translations';

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  locale: z.string(),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(20)
    .default([]),
  isFirstMessage: z.boolean().default(false),
  turnstileToken: z.string().optional(),
  conversationId: z.string().uuid().optional(),
});

const MATCH_COUNT = 5;

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { message, history, isFirstMessage, turnstileToken } = parsed.data;
  const locale = isLocale(parsed.data.locale) ? parsed.data.locale : defaultLocale;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ip = getClientIp(request);
  const rateLimitKey = user ? `chatbot:faq:${user.id}` : `chatbot:faq:${ip}`;
  const limitResult = await rateLimit(rateLimitKey, { limit: 10, windowMs: 60_000 });
  if (!limitResult.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  // Signed-in visitors carry a stronger identity signal (a real, rate-
  // limited account) than an anonymous IP, so Turnstile only gates
  // anonymous sessions — and only their first message, not every one, to
  // avoid re-challenging mid-conversation (tokens are single-use, so
  // "once per session" is tracked client-side via isFirstMessage rather
  // than requiring a fresh token every send).
  if (!user && isFirstMessage) {
    const isHuman = await verifyTurnstileToken(turnstileToken, ip);
    if (!isHuman) {
      return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 403 });
    }
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'The assistant is temporarily unavailable.' }, { status: 503 });
  }

  const queryEmbedding = await getGeminiEmbedding(message);
  let chunks: RetrievedChunk[] = [];
  if (queryEmbedding) {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_locale: locale,
      match_count: MATCH_COUNT,
    });
    if (error) {
      console.error('match_knowledge_chunks failed', error);
    } else {
      chunks = (data ?? []).map((row: { title: string; content: string }) => ({
        title: row.title,
        content: row.content,
      }));
    }
  }

  const systemPrompt = buildFaqSystemPrompt(chunks, locale);
  const stream = await streamGeminiChat({ systemPrompt, history: history as ChatHistoryMessage[], userMessage: message });
  if (!stream) {
    return NextResponse.json({ error: 'The assistant is temporarily unavailable.' }, { status: 503 });
  }

  // Best-effort persistence for signed-in users only — a failure here
  // must never break the chat response itself, same philosophy as the
  // WhatsApp lead alert in src/app/api/contact/route.ts.
  if (user) {
    let conversationId = parsed.data.conversationId;
    const admin = createAdminSupabaseClient();
    try {
      if (!conversationId) {
        const { data: conversation, error: convError } = await admin
          .from('chat_conversations')
          .insert({ user_id: user.id, mode: 'faq' })
          .select('id')
          .single();
        if (convError || !conversation) throw convError ?? new Error('insert failed');
        conversationId = conversation.id;
      }
      await admin.from('chat_messages').insert({ conversation_id: conversationId, role: 'user', content: message });
    } catch (err) {
      console.error('Failed to persist chatbot conversation/message', err);
    }

    if (conversationId) {
      return streamWithPersistedReply(stream, admin, conversationId);
    }
  }

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
