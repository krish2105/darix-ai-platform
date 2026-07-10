'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { staggerContainer, fadeIn } from '@/utils/animations';
import { BookOpen, FileCheck, Shield, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ResearchSection = () => {
  const { t } = useLanguage();
  const researchItems = [
    { title: t('research.item1.title'), description: t('research.item1.desc'), icon: <BookOpen className="w-5 h-5 text-electric-blue" /> },
    { title: t('research.item2.title'), description: t('research.item2.desc'), icon: <Shield className="w-5 h-5 text-warning-amber" /> },
    { title: t('research.item3.title'), description: t('research.item3.desc'), icon: <Zap className="w-5 h-5 text-cyber-cyan" /> },
    { title: t('research.item4.title'), description: t('research.item4.desc'), icon: <FileCheck className="w-5 h-5 text-emerald-success" /> }
  ];

  return (
    <section className="py-24 bg-card border-y border-card-border relative overflow-hidden" id="research">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ai-violet/10 via-transparent to-transparent pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <SectionTitle
          title={t('research.title')}
          subtitle={t('research.subtitle')}
        />

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 max-w-5xl mx-auto"
        >
          {researchItems.map((item, i) => (
            <motion.div 
              key={i}
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
              className="glass-card p-8 flex gap-6 group hover:border-cyber-cyan/30 transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-background border border-card-border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-cyber-cyan tracking-wider uppercase flex items-center gap-1 group-hover:gap-2 transition-all cursor-pointer">
                    {t('research.readPaper')} <span>→</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
