import type { createAdminSupabaseClient } from '@/lib/supabase/admin';

// Tees a Gemini reply stream so the visitor's response is never buffered
// while the full text is still captured and persisted once streaming
// finishes — shared by both /api/chatbot/faq and /api/chatbot/advisor,
// which otherwise duplicate this exact tee-and-persist shape.
export function streamWithPersistedReply(
  stream: ReadableStream<Uint8Array>,
  admin: ReturnType<typeof createAdminSupabaseClient>,
  conversationId: string
): Response {
  const [forClient, forPersistence] = stream.tee();
  const decoder = new TextDecoder();

  (async () => {
    let full = '';
    const reader = forPersistence.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }
      await admin.from('chat_messages').insert({ conversation_id: conversationId, role: 'assistant', content: full });
    } catch (err) {
      console.error('Failed to persist chatbot assistant reply', err);
    }
  })();

  return new Response(forClient, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Conversation-Id': conversationId,
    },
  });
}
