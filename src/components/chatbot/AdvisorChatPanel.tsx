'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { dimensions } from '@/data/questions';
import type { ReadinessResult } from '@/utils/scoring';
import { useChatSession } from './useChatSession';
import { ChatPanelBody } from './ChatPanelBody';

interface AdvisorChatPanelProps {
  assessmentId: string;
  result: ReadinessResult;
}

const dimensionTitle = (dimensionId: string) => dimensions.find((d) => d.id === dimensionId)?.title ?? dimensionId;

// Personalized post-assessment advisor (Mode B) — embedded on the
// report page, rendered only for the assessment's own signed-in owner
// (gated by the caller, src/app/[locale]/report/[id]/page.tsx, not here).
// Reasons only over this specific assessment's result via
// /api/chatbot/advisor — no vector search, just the user's own data.
export const AdvisorChatPanel = ({ assessmentId, result }: AdvisorChatPanelProps) => {
  const { t, locale } = useLanguage();

  const { messages, isLoading, error, sendMessage } = useChatSession({
    endpoint: '/api/chatbot/advisor',
    buildBody: (message, history, conversationId) => ({
      message,
      locale,
      history,
      assessmentId,
      conversationId: conversationId ?? undefined,
    }),
  });

  const gapDimension = result.gapDimensionIds?.[0];
  const promptStarters = [
    gapDimension ? t('chatbot.whyLowScore', { dimension: dimensionTitle(gapDimension) }) : null,
    t('chatbot.whatFirst'),
  ].filter((s): s is string => Boolean(s));

  return (
    <section className="container mx-auto px-4 md:px-6 py-12">
      <div className="max-w-3xl mx-auto glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border bg-glass-panel flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyber-cyan" />
          <h2 className="font-display font-bold text-sm text-foreground">{t('chatbot.advisorTitle')}</h2>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-4">
            {promptStarters.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => sendMessage(starter)}
                className="text-xs px-3 py-1.5 rounded-full bg-glass-panel border border-card-border text-foreground hover:border-cyber-cyan/50 transition-colors"
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        <div className="h-96">
          <ChatPanelBody
            messages={messages.length ? messages : [{ role: 'assistant', content: t('chatbot.advisorGreeting') }]}
            isLoading={isLoading}
            error={error}
            onSend={sendMessage}
            placeholder={t('chatbot.placeholder')}
            sendLabel={t('chatbot.send')}
            thinkingLabel={t('chatbot.thinking')}
          />
        </div>
      </div>
    </section>
  );
};
