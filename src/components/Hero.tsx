'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { fadeIn, staggerContainer } from '@/utils/animations';
import { Activity, ShieldAlert, TrendingUp, Database, CheckCircle2 } from 'lucide-react';
import { FloatingWindows } from './FloatingWindows';
import { NeuralNetwork } from './NeuralNetwork';
import { useLanguage } from '@/contexts/LanguageContext';

export const Hero = () => {
  const { t } = useLanguage();
  const kpis = [
    { label: t('hero.kpi.score'), icon: <Activity className="w-5 h-5 text-electric-blue" /> },
    { label: t('hero.kpi.automation'), icon: <TrendingUp className="w-5 h-5 text-cyber-cyan" /> },
    { label: t('hero.kpi.governance'), icon: <ShieldAlert className="w-5 h-5 text-warning-amber" /> },
    { label: t('hero.kpi.data'), icon: <Database className="w-5 h-5 text-ai-violet" /> },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Sleek Modern Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyber-cyan/10 via-background to-background dark:from-cyber-cyan/20 dark:via-background dark:to-background"></div>
        <div className="absolute right-0 top-1/4 w-[800px] h-[800px] bg-electric-blue/5 dark:bg-electric-blue/10 rounded-full blur-[120px] opacity-70 animate-pulse-slow"></div>
        <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-ai-violet/5 dark:bg-ai-violet/10 rounded-full blur-[100px] opacity-50"></div>
        {/* Subtle Grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xKSIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        <NeuralNetwork />
        <FloatingWindows />
      </div>
      
      {/* Content Overlay */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Text */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center space-x-2 bg-glass-panel px-3 py-1.5 rounded-full border border-cyber-cyan/30 mb-8 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-cyber-cyan animate-pulse"></span>
              <span className="text-xs font-semibold text-cyber-cyan tracking-wider uppercase">{t('hero.badge')}</span>
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6 text-foreground">
              {t('hero.titleBefore')} <span className="text-gradient">{t('hero.titleAccent')}</span> {t('hero.titleAfter')}
            </motion.h1>

            <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              {t('hero.subtitle')}
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('hero.ctaPrimary')}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('hero.ctaSecondary')}
              </Button>
            </motion.div>

            <motion.div variants={fadeIn} className="mt-8 flex items-center gap-4 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-success" />
                <span>{t('hero.freeAssessment')}</span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right Column - Glass Panels */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hidden lg:grid grid-cols-2 gap-4 relative"
          >
            {kpis.map((kpi, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-card p-6 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-glass-panel flex items-center justify-center border border-card-border">
                  {kpi.icon}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">{kpi.label}</div>
                  <div className="w-full h-1.5 bg-card-border rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.random() * 40 + 40}%` }}
                      transition={{ duration: 1.5, delay: 1 + index * 0.2 }}
                      className="h-full bg-gradient-to-r from-electric-blue to-ai-violet"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Floating abstract decorative element */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-ai-violet/20 rounded-full blur-[100px]"></div>
          </motion.div>
          
        </div>
      </div>
      
      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none"></div>
    </section>
  );
};
