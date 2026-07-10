'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageToggle = () => {
  const { locale, setLocale, t } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      aria-label={t('nav.switchLanguage')}
      className="flex items-center gap-1.5 px-3 h-10 rounded-full bg-glass-panel border border-card-border text-foreground hover:border-cyber-cyan/50 transition-colors text-sm font-semibold"
    >
      <Languages className="w-4 h-4" />
      {locale === 'en' ? 'العربية' : 'English'}
    </button>
  );
};
