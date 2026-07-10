'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { staggerContainer, fadeIn } from '@/utils/animations';
import { Search, PenTool, Rocket, Network, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const FrameworkSection = () => {
  const { t } = useLanguage();
  const stages = [
    { title: t('framework.stage1.title'), description: t('framework.stage1.desc'), icon: <Search className="w-6 h-6 text-electric-blue" /> },
    { title: t('framework.stage2.title'), description: t('framework.stage2.desc'), icon: <PenTool className="w-6 h-6 text-cyber-cyan" /> },
    { title: t('framework.stage3.title'), description: t('framework.stage3.desc'), icon: <Rocket className="w-6 h-6 text-emerald-success" /> },
    { title: t('framework.stage4.title'), description: t('framework.stage4.desc'), icon: <Network className="w-6 h-6 text-ai-violet" /> },
    { title: t('framework.stage5.title'), description: t('framework.stage5.desc'), icon: <ShieldCheck className="w-6 h-6 text-dubai-gold" /> }
  ];

  return (
    <section className="py-24 bg-background overflow-hidden" id="framework">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title={t('framework.title')}
          subtitle={t('framework.subtitle')}
        />

        <div className="relative mt-20 max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-glass-panel -translate-y-1/2 hidden md:block"></div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-5 gap-8"
          >
            {stages.map((stage, i) => (
              <motion.div 
                key={i} 
                variants={fadeIn} 
                className="relative group flex flex-col items-center text-center"
              >
                {/* Node */}
                <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 group-hover:border-cyber-cyan transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                  {stage.icon}
                  {/* Glowing center indicator */}
                  <div className="absolute inset-0 rounded-full border border-white/20 scale-75 opacity-0 group-hover:scale-95 group-hover:opacity-100 transition-all duration-500"></div>
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-bold text-foreground mb-2">{stage.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">{stage.description}</p>
                
                {/* Mobile Connector */}
                {i !== stages.length - 1 && (
                  <div className="w-[2px] h-12 bg-glass-panel my-4 md:hidden"></div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
