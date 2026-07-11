'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChatSession } from './useChatSession';
import { ChatPanelBody } from './ChatPanelBody';
import { TurnstileWidget } from '@/components/Turnstile';

// Public, site-wide FAQ/marketing chatbot (Mode A) — floating widget in
// the same visual family as WhatsAppButton.tsx (fixed bottom-right,
// spring entrance), offset above it so the two never overlap. Hidden
// entirely when NEXT_PUBLIC_CHATBOT_ENABLED isn't set — the server
// route re-checks isGeminiConfigured() regardless, so this flag is only
// ever a UX nicety, never the real gate.
export const FaqChatWidget = () => {
  const { t, locale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();

  const { messages, isLoading, error, sendMessage } = useChatSession({
    endpoint: '/api/chatbot/faq',
    buildBody: (message, history, conversationId) => ({
      message,
      locale,
      history,
      isFirstMessage: history.length === 0,
      turnstileToken,
      conversationId: conversationId ?? undefined,
    }),
  });

  if (!process.env.NEXT_PUBLIC_CHATBOT_ENABLED) return null;

  return (
    <>
      <motion.button
        type="button"
        aria-label={isOpen ? t('chatbot.closeLabel') : t('chatbot.openLabel')}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-24 end-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-cyber-cyan text-deep-black shadow-lg hover:shadow-[0_0_24px_rgba(34,211,238,0.5)] transition-shadow"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[168px] end-6 z-40 w-[calc(100vw-3rem)] max-w-sm h-[28rem] max-h-[70vh] rounded-2xl border border-card-border bg-background shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-card-border bg-glass-panel">
              <h2 className="font-display font-bold text-sm text-foreground">{t('chatbot.faqTitle')}</h2>
            </div>
            <TurnstileWidget size="invisible" onVerify={setTurnstileToken} />
            <ChatPanelBody
              messages={messages.length ? messages : [{ role: 'assistant', content: t('chatbot.faqGreeting') }]}
              isLoading={isLoading}
              error={error}
              onSend={sendMessage}
              placeholder={t('chatbot.placeholder')}
              sendLabel={t('chatbot.send')}
              thinkingLabel={t('chatbot.thinking')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
