'use client';

import React from 'react';
import Link from 'next/link';
import { BrainCircuit, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { localePath } from '@/lib/i18n/paths';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t, locale } = useLanguage();

  return (
    <footer className="bg-card border-t border-card-border pt-20 pb-10 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-cyber-cyan/30 to-transparent"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          <div className="flex flex-col gap-6">
            <a href="#" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-electric-blue to-ai-violet flex items-center justify-center">
                <BrainCircuit className="text-foreground w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-wide text-foreground">DARIX AI</span>
            </a>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.linkedin.com/in/krishnamathurmay/" target="_blank" rel="noopener noreferrer" aria-label="Darix AI on LinkedIn" className="text-muted-foreground hover:text-cyber-cyan transition-colors"><LinkedinIcon className="w-5 h-5" /></a>
              <a href="https://github.com/krish2105" target="_blank" rel="noopener noreferrer" aria-label="Darix AI on GitHub" className="text-muted-foreground hover:text-cyber-cyan transition-colors"><GithubIcon className="w-5 h-5" /></a>
              <a href="mailto:hello@darix.ai" aria-label="Email Darix AI" className="text-muted-foreground hover:text-cyber-cyan transition-colors"><Mail className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-6 uppercase tracking-wider text-sm">{t('footer.product')}</h4>
            <ul className="flex flex-col gap-4">
              <li><a href="#assessment" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.readinessAssessment')}</a></li>
              <li><a href="#dashboard" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.executiveDashboard')}</a></li>
              <li><a href="#framework" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.maturityFramework')}</a></li>
              <li><a href="#pricing" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.pricingPlans')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-6 uppercase tracking-wider text-sm">{t('footer.resources')}</h4>
            <ul className="flex flex-col gap-4">
              <li><a href="#industries" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.industryUseCases')}</a></li>
              <li><Link href={localePath(locale, '/case-studies')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.caseStudies')}</Link></li>
              <li><Link href={localePath(locale, '/resources')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.researchPapers')}</Link></li>
              <li><a href="#faq" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.faq')}</a></li>
              <li><Link href={localePath(locale, '/partners')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.partners')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-6 uppercase tracking-wider text-sm">{t('footer.contact')}</h4>
            <ul className="flex flex-col gap-4">
              <li className="text-muted-foreground text-sm">{t('footer.location')}</li>
              <li><a href="mailto:hello@darix.ai" className="text-muted-foreground hover:text-cyber-cyan text-sm transition-colors">hello@darix.ai</a></li>
              <li className="mt-4">
                <a href="#contact" className="inline-flex items-center text-sm font-medium text-[#0369A1] dark:text-electric-blue hover:text-foreground transition-colors group">
                  {t('footer.bookConsultation')}
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-card-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © {currentYear} DARIX AI (Dubai AI Readiness Index). {t('footer.allRightsReserved')}
          </p>
          <div className="flex gap-6">
            <Link href={localePath(locale, '/privacy')} className="text-muted-foreground hover:text-foreground text-xs transition-colors">{t('footer.privacyPolicy')}</Link>
            <Link href={localePath(locale, '/terms')} className="text-muted-foreground hover:text-foreground text-xs transition-colors">{t('footer.termsOfService')}</Link>
            <Link href={localePath(locale, '/privacy-center')} className="text-muted-foreground hover:text-foreground text-xs transition-colors">{t('footer.privacyCenter')}</Link>
            <Link href={localePath(locale, '/sub-processors')} className="text-muted-foreground hover:text-foreground text-xs transition-colors">{t('footer.subProcessors')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
