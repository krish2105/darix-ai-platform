'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react';
import { localizeResource, type Resource } from '@/data/resources';
import { useLanguage } from '@/contexts/LanguageContext';

export const ResourceArticleContent = ({ article }: { article: Resource }) => {
  const { t, locale } = useLanguage();
  const { title, sections } = localizeResource(article, locale);

  return (
    <article className="py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t('resourcesPage.allResources')}
          </Link>

          <span className="inline-block px-3 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-[#0369A1] dark:text-electric-blue text-xs font-bold uppercase tracking-wider mb-4">
            {article.category}
          </span>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6 text-balance">
            {title}
          </h1>
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-12">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.publishedAt).toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-AE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {article.readTimeMinutes} {t('resourcesPage.minRead')}
            </span>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-xl font-display font-bold text-foreground mb-3">{section.heading}</h2>
                <div className="space-y-4">
                  {section.body.map((paragraph, i) => (
                    <p key={i} className="text-foreground/90 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-card-border">
            <Link
              href="/#assessment"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyber-cyan text-deep-black font-medium hover:bg-electric-blue transition-colors"
            >
              {t('resourcesPage.cta')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};
