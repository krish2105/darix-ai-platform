import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/translations';
import { localePath } from '@/lib/i18n/paths';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://darix.ai';

// Only public, indexable, static routes. /login, /dashboard, /admin, and
// /report/[id] are all noindex (see their generateMetadata/metadata
// exports) and deliberately excluded here too.
const routes: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/case-studies', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/resources', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/partners', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy-center', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/sub-processors', changeFrequency: 'monthly', priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Every route gets one sitemap entry per locale, each pointing back at
  // the others via alternates.languages — this is what makes the /ar/...
  // pages genuinely, separately indexable rather than invisible duplicates
  // of the English URL (the problem this whole restructure exists to fix).
  return routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localePath(locale, route.path)}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((altLocale) => [altLocale, `${siteUrl}${localePath(altLocale, route.path)}`])
        ),
      },
    }))
  );
}
