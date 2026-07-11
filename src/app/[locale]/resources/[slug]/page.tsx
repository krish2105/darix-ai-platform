import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resources, getResourceBySlug } from '@/data/resources';
import { ResourceArticleContent } from '@/components/ResourceArticleContent';
import { defaultLocale, isLocale } from '@/lib/i18n/translations';
import { localeAlternates } from '@/lib/i18n/paths';

export function generateStaticParams() {
  return resources.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const article = getResourceBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Darix AI`,
    description: article.excerpt,
    alternates: localeAlternates(locale, `/resources/${slug}`),
  };
}

export default async function ResourceArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const article = getResourceBySlug(slug);
  if (!article) notFound();

  return <ResourceArticleContent article={article} />;
}
