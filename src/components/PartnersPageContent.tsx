'use client';

import { Handshake, Building2, Users } from 'lucide-react';
import { PartnerInquiryForm } from '@/components/PartnerInquiryForm';
import { useLanguage } from '@/contexts/LanguageContext';

export const PartnersPageContent = () => {
  const { t } = useLanguage();

  const tracks = [
    { icon: Handshake, title: t('partnersPage.track1.title'), description: t('partnersPage.track1.desc') },
    { icon: Building2, title: t('partnersPage.track2.title'), description: t('partnersPage.track2.desc') },
    { icon: Users, title: t('partnersPage.track3.title'), description: t('partnersPage.track3.desc') },
  ];

  return (
    <section className="py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">{t('partnersPage.title')}</h1>
          <p className="text-muted-foreground leading-relaxed">{t('partnersPage.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          {tracks.map((track) => (
            <div key={track.title} className="glass-card p-6">
              <div className="w-11 h-11 rounded-xl bg-glass-panel border border-card-border flex items-center justify-center mb-4">
                <track.icon className="w-5 h-5 text-cyber-cyan" />
              </div>
              <h2 className="font-semibold text-foreground mb-2">{track.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{track.description}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-2 text-center">{t('partnersPage.applyTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-8 text-center">{t('partnersPage.applySubtitle')}</p>
          <PartnerInquiryForm />
        </div>
      </div>
    </section>
  );
};
