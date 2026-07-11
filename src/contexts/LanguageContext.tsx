'use client';

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { locales, translate, type Locale } from '@/lib/i18n/translations';
import { localePath } from '@/lib/i18n/paths';

// The URL is the single source of truth for the active locale (see
// src/proxy.ts and src/app/[locale]/layout.tsx) — this is no longer a
// localStorage-backed client preference. `locale` arrives as a prop from
// the server layout (already validated there), so every consumer of
// useLanguage() renders with the locale the visitor's URL actually
// requested, which is what makes /ar/... a real, independently indexable
// page instead of a client-side-only toggle over the same English URL.
const LOCALE_PREFIX_RE = new RegExp(`^/(${locales.join('|')})(?=/|$)`);

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      const withoutPrefix = pathname.replace(LOCALE_PREFIX_RE, '') || '/';
      router.push(localePath(next, withoutPrefix));
    },
    [locale, pathname, router]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
