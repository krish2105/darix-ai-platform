'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackEvent } from '@/lib/analytics/posthog-client';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12.05 2C6.502 2 2 6.477 2 11.99c0 1.995.588 3.85 1.598 5.408L2 22l4.72-1.55a10.06 10.06 0 0 0 5.33 1.529h.005c5.548 0 10.05-4.477 10.05-9.99C22.105 6.477 17.603 2 12.05 2zm0 18.16h-.004a8.15 8.15 0 0 1-4.166-1.14l-.299-.177-3.099 1.018 1.032-3.01-.195-.309a8.13 8.13 0 0 1-1.257-4.354c0-4.503 3.673-8.167 8.192-8.167 2.19 0 4.248.852 5.795 2.396a8.116 8.116 0 0 1 2.397 5.777c0 4.504-3.674 8.167-8.196 8.167z" />
  </svg>
);

// Click-to-chat WhatsApp Business CTA — no API integration needed, just a
// wa.me deep link with a prefilled message. Hidden entirely when no number
// is configured, matching the graceful-degradation pattern used by
// Turnstile/Stripe/PostHog elsewhere in the app.
export const WhatsAppButton = () => {
  const { t } = useLanguage();
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (!phoneNumber) return null;

  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(t('whatsapp.defaultMessage'))}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp.chatWithUs')}
      onClick={() => trackEvent('whatsapp_chat_clicked')}
      className="fixed bottom-6 end-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-[0_0_24px_rgba(37,211,102,0.5)] transition-shadow"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <WhatsAppIcon className="w-7 h-7" />
    </motion.a>
  );
};
