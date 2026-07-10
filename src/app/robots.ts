import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://darix.ai';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login', '/dashboard', '/admin', '/report/', '/auth/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
