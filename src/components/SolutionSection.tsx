'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { staggerContainer, fadeIn } from '@/utils/animations';
import { useLanguage } from '@/contexts/LanguageContext';

export const SolutionSection = () => {
  const { t } = useLanguage();
  const steps = [
    { num: '01', title: t('solution.step1.title'), description: t('solution.step1.desc'), color: 'from-electric-blue to-cyber-cyan' },
    { num: '02', title: t('solution.step2.title'), description: t('solution.step2.desc'), color: 'from-cyber-cyan to-emerald-success' },
    { num: '03', title: t('solution.step3.title'), description: t('solution.step3.desc'), color: 'from-emerald-success to-warning-amber' },
    { num: '04', title: t('solution.step4.title'), description: t('solution.step4.desc'), color: 'from-warning-amber to-ai-violet' }
  ];

  return (
    <section className="py-24 relative bg-card border-y border-card-border" id="solution">
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent -translate-y-1/2 hidden lg:block"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <SectionTitle
          title={t('solution.title')}
          subtitle={t('solution.subtitle')}
        />

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20 relative"
        >
          {steps.map((step, i) => (
            <motion.div key={i} variants={fadeIn} className="relative group">
              {/* Connector line for mobile/tablet */}
              {i !== steps.length - 1 && (
                <div className="absolute top-8 left-16 w-[calc(100%-4rem)] h-[1px] bg-glass-panel hidden md:block lg:hidden"></div>
              )}
              
              <div className="glass-card p-8 h-full border-t-2 border-t-transparent hover:border-t-cyber-cyan transition-colors">
                <div className={`text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br ${step.color} opacity-30 group-hover:opacity-100 transition-opacity mb-6`}>
                  {step.num}
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
