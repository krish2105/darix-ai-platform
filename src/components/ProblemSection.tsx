'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { Target, ServerCrash, GitPullRequest, Users, TrendingDown, Scale } from 'lucide-react';
import { staggerContainer, fadeIn } from '@/utils/animations';
import { useLanguage } from '@/contexts/LanguageContext';

export const ProblemSection = () => {
  const { t } = useLanguage();
  const problems = [
    { title: t('problem.item1.title'), description: t('problem.item1.desc'), icon: <Target className="w-6 h-6 text-warning-amber" /> },
    { title: t('problem.item2.title'), description: t('problem.item2.desc'), icon: <ServerCrash className="w-6 h-6 text-risk-red" /> },
    { title: t('problem.item3.title'), description: t('problem.item3.desc'), icon: <GitPullRequest className="w-6 h-6 text-ai-violet" /> },
    { title: t('problem.item4.title'), description: t('problem.item4.desc'), icon: <Scale className="w-6 h-6 text-cyber-cyan" /> },
    { title: t('problem.item5.title'), description: t('problem.item5.desc'), icon: <Users className="w-6 h-6 text-electric-blue" /> },
    { title: t('problem.item6.title'), description: t('problem.item6.desc'), icon: <TrendingDown className="w-6 h-6 text-muted-foreground" /> }
  ];

  return (
    <section className="py-24 relative bg-background overflow-hidden" id="problem">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <SectionTitle
          title={t('problem.title')}
          subtitle={t('problem.subtitle')}
        />

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16"
        >
          {problems.map((item, i) => (
            <motion.div 
              key={i} 
              variants={fadeIn}
              whileHover={{ y: -5 }}
              className="glass-card p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-glass-panel rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500 ease-out"></div>
              <div className="w-12 h-12 rounded-xl bg-card border border-card-border flex items-center justify-center mb-6 shadow-inner relative z-10">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground relative z-10">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed relative z-10">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
