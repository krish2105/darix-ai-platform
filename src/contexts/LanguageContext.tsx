'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dictionaries, localeDirection, type Locale } from '@/lib/i18n/translations';

const STORAGE_KEY = 'darix:locale';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const applyDocumentDirection = (locale: Locale) => {
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDirection[locale];
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Read the persisted preference once on mount. The inline script in
  // layout.tsx already set `lang`/`dir` on <html> before hydration to
  // avoid a flash of the wrong direction — this just syncs React state
  // to match what's already on the page.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyDocumentDirection(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[locale];
      let value = dict[key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        for (const [varKey, varValue] of Object.entries(vars)) {
          value = value.replace(`{${varKey}}`, String(varValue));
        }
      }
      return value;
    },
    [locale]
  );

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
