import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/translations';
import { localePath } from '@/lib/i18n/paths';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://darix.ai';

// Gated/noindex routes, mirrored across every locale (e.g. /login and
// /ar/login both need to be disallowed — the default locale's unprefixed
// path and every other locale's prefixed one).
const gatedPaths = ['/login', '/dashboard', '/admin', '/report/'];

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/api/', '/auth/', ...locales.flatMap((locale) => gatedPaths.map((path) => localePath(locale, path)))];

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow,
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
