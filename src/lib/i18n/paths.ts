import { defaultLocale, locales, type Locale } from './translations';

// Single source of truth for "what is this internal path's URL in locale X."
// The default locale (English) is never prefixed — src/proxy.ts rewrites
// unprefixed requests to it internally and canonicalizes away an explicit
// /en/* URL — so every other locale (currently just 'ar') gets a leading
// /<locale> segment and English does not. Used by every internal <Link>/
// router.push/redirect call so navigation stays within the current locale,
// and by sitemap.ts/robots.ts/metadata alternates to build the other
// locale's URL for hreflang.
export const localePath = (locale: Locale, path: string): string => {
  const normalized = path === '/' ? '' : path;
  if (locale === defaultLocale) return normalized || '/';
  return `/${locale}${normalized}`;
};

// Metadata `alternates` block for a page available at the same logical
// path in every locale — the hreflang cross-links that tell search engines
// /ar/case-studies and /case-studies are translations of each other rather
// than duplicate or unrelated content. `x-default` points at the default
// locale, the conventional fallback for a visitor whose language isn't
// explicitly listed.
export const localeAlternates = (locale: Locale, path: string) => ({
  canonical: localePath(locale, path),
  languages: {
    ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])),
    'x-default': localePath(defaultLocale, path),
  },
});
