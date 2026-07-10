'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { fadeIn } from '@/utils/animations';
import { Link2, GraduationCap, MapPin, Briefcase } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const FounderSection = () => {
  const { t } = useLanguage();
  const skills = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => t(`founder.skill${n}`));

  return (
    <section className="py-24 bg-background relative" id="founder">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-5xl mx-auto glass-card overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-5">
            
            {/* Left side: Photo/Profile */}
            <div className="md:col-span-2 bg-gradient-to-br from-ai-navy to-deep-black p-8 md:p-12 flex flex-col justify-center items-center text-center border-r border-card-border relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-48 h-48 bg-electric-blue/20 rounded-full blur-[60px]"></div>
              
              <div className="w-32 h-32 rounded-full bg-background border-2 border-cyber-cyan/50 p-1 mb-6 relative z-10">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-ai-violet/40 to-electric-blue/40 flex items-center justify-center">
                  <GraduationCap className="w-12 h-12 text-foreground/80" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-2 relative z-10">{t('founder.role')}</h3>
              <p className="text-cyber-cyan font-medium mb-4 relative z-10">{t('founder.field')}</p>

              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-8 relative z-10">
                <MapPin className="w-4 h-4" />
                <span>{t('founder.location')}</span>
              </div>

              <Button variant="outline" className="w-full relative z-10" icon={<Link2 className="w-4 h-4" />} onClick={() => window.open('https://www.linkedin.com/in/krishnamathurmay/', '_blank')}>
                {t('founder.linkedin')}
              </Button>
            </div>

            {/* Right side: Bio & Skills */}
            <div className="md:col-span-3 p-8 md:p-12">
              <h2 className="text-3xl font-display font-bold text-foreground mb-6">
                {t('founder.headlineBefore')} <span className="text-gradient">{t('founder.headlineAccent')}</span> {t('founder.headlineAfter')}
              </h2>

              <div className="space-y-4 text-muted-foreground leading-relaxed mb-10 text-sm md:text-base">
                <p>{t('founder.bio1')}</p>
                <p>{t('founder.bio2')}</p>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-foreground font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-electric-blue" />
                  {t('founder.competencies')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-glass-panel border border-card-border rounded-full text-xs text-foreground/80 hover:bg-glass-panel hover:border-cyber-cyan/30 transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-card-border">
                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-cyber-cyan" onClick={() => window.open('https://github.com/krish2105', '_blank')}>
                  {t('founder.github')} →
                </Button>
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </section>
  );
};
