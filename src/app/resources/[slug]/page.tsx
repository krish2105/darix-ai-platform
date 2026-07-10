import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resources, getResourceBySlug } from '@/data/resources';
import { ResourceArticleContent } from '@/components/ResourceArticleContent';

export function generateStaticParams() {
  return resources.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getResourceBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Darix AI`,
    description: article.excerpt,
  };
}

export default async function ResourceArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getResourceBySlug(slug);
  if (!article) notFound();

  return <ResourceArticleContent article={article} />;
}
