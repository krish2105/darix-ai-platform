'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { staggerContainer, fadeIn } from '@/utils/animations';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const FeaturesSection = () => {
  const { t } = useLanguage();
  const features = [
    t('features.item1'), t('features.item2'), t('features.item3'), t('features.item4'), t('features.item5'),
    t('features.item6'), t('features.item7'), t('features.item8'), t('features.item9'), t('features.item10'),
  ];

  return (
    <section className="py-24 bg-card relative" id="features">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <SectionTitle
          title={t('features.title')}
        />

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-16"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeIn}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-panel p-6 flex flex-col items-center text-center group cursor-pointer hover:bg-glass-panel hover:border-cyber-cyan/30 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-background border border-card-border flex items-center justify-center mb-4 group-hover:border-cyber-cyan/50 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-cyber-cyan opacity-50 group-hover:opacity-100" />
              </div>
              <h3 className="text-sm font-semibold text-foreground/90">{feature}</h3>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
