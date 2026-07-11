'use client';

import { useCallback, useRef, useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatSessionArgs {
  endpoint: string;
  // Builds the request body for a given message + running history. Kept
  // as a caller-supplied function (rather than a fixed shape) since the
  // FAQ route (src/app/api/chatbot/faq/route.ts) and the advisor route
  // (src/app/api/chatbot/advisor/route.ts) need different extra fields
  // (turnstileToken/isFirstMessage vs. assessmentId).
  buildBody: (message: string, history: ChatMessage[], conversationId: string | null) => unknown;
}

// Shared streaming-chat state machine for both chat surfaces (the public
// FaqChatWidget and the signed-in-only AdvisorChatPanel) — the only
// difference between them is which endpoint/body shape they use, handled
// by the caller via `endpoint`/`buildBody`, not duplicated per-component.
export function useChatSession({ endpoint, buildBody }: UseChatSessionArgs) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      const history = messages;
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }, { role: 'assistant', content: '' }]);
      setIsLoading(true);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(trimmed, history, conversationIdRef.current)),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || 'The assistant is temporarily unavailable.');
        }

        const nextConversationId = res.headers.get('X-Conversation-Id');
        if (nextConversationId) conversationIdRef.current = nextConversationId;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + chunk };
            return next;
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, buildBody, messages, isLoading]
  );

  return { messages, isLoading, error, sendMessage, hasSentAnyMessage: messages.length > 0 };
}
