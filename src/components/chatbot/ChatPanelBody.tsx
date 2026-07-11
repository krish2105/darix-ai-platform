'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { ChatMessage } from './useChatSession';

interface ChatPanelBodyProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  placeholder: string;
  sendLabel: string;
  thinkingLabel: string;
}

// Shared message-list + input UI for both chat surfaces (FaqChatWidget,
// AdvisorChatPanel) — the state machine lives in useChatSession, this is
// purely presentational so the two surfaces render identically.
export const ChatPanelBody = ({
  messages,
  isLoading,
  error,
  onSend,
  placeholder,
  sendLabel,
  thinkingLabel,
}: ChatPanelBodyProps) => {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isLoading) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'bg-cyber-cyan text-deep-black'
                  : 'bg-glass-panel border border-card-border text-foreground'
              }`}
            >
              {message.content || (isLoading && i === messages.length - 1 ? thinkingLabel : '')}
            </div>
          </div>
        ))}
        {error && <p className="text-xs text-risk-red">{error}</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-card-border p-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 bg-glass-panel border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label={sendLabel}
          disabled={isLoading || !draft.trim()}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyber-cyan text-deep-black disabled:opacity-40 transition-opacity"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
