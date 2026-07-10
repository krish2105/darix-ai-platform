'use client';

import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { resources } from '@/data/resources';
import { useLanguage } from '@/contexts/LanguageContext';

export const ResourcesPageContent = () => {
  const { t } = useLanguage();

  return (
    <section className="py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">{t('resourcesPage.title')}</h1>
          <p className="text-muted-foreground leading-relaxed">{t('resourcesPage.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {resources.map((article) => (
            <Link
              key={article.slug}
              href={`/resources/${article.slug}`}
              className="glass-card p-6 flex flex-col gap-4 hover:border-cyber-cyan/50 transition-colors group"
            >
              <span className="inline-block w-fit px-3 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-[#0369A1] dark:text-electric-blue text-xs font-bold uppercase tracking-wider">
                {article.category}
              </span>
              <h2 className="text-lg font-display font-bold text-foreground leading-snug group-hover:text-cyber-cyan transition-colors">
                {article.title}
              </h2>
              <p className="text-sm text-muted-foreground flex-1">{article.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-card-border">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {article.readTimeMinutes} {t('resourcesPage.minRead')}
                </span>
                <span className="flex items-center gap-1 text-cyber-cyan group-hover:translate-x-1 transition-transform">
                  {t('resourcesPage.read')} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
