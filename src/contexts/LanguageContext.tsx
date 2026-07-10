'use client';

import React, { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import { localeDirection, translate, type Locale } from '@/lib/i18n/translations';

const STORAGE_KEY = 'darix:locale';

const readStoredLocale = (): Locale => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'ar' || stored === 'en' ? stored : 'en';
};

// Tiny external store for the persisted locale preference. Reading it via
// useSyncExternalStore (instead of a mount effect calling setState) avoids
// both a hydration mismatch and a visible flash of English before flipping
// to the stored language: React renders getServerSnapshot() ('en' — no
// window/localStorage on the server) during hydration to exactly match the
// server HTML, then re-checks getSnapshot() immediately after mount. This
// module-level store, not React state, is the single source of truth for
// `locale`; setLocale below persists a change and notifies subscribers.
let cachedLocale: Locale | null = null;
const listeners = new Set<() => void>();

const getSnapshot = (): Locale => {
  if (cachedLocale === null) cachedLocale = readStoredLocale();
  return cachedLocale;
};

const getServerSnapshot = (): Locale => 'en';

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const commitLocale = (next: Locale) => {
  cachedLocale = next;
  window.localStorage.setItem(STORAGE_KEY, next);
  document.documentElement.lang = next;
  document.documentElement.dir = localeDirection[next];
  listeners.forEach((listener) => listener());
};

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((next: Locale) => {
    commitLocale(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
