'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { caseStudies } from '@/data/caseStudies';
import { SectionTitle } from './SectionTitle';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export const CaseStudies = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % caseStudies.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? caseStudies.length - 1 : prev - 1));
  };

  const study = caseStudies[currentIndex];

  return (
    <section className="py-24 bg-background" id="case-studies">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle 
          title="Real-World Business Impact"
          subtitle="See how organizations in Dubai are transforming their operations with actionable AI roadmaps."
        />

        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 z-20">
            <button onClick={prevSlide} aria-label="Previous case study" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-cyber-cyan transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 z-20">
            <button onClick={nextSlide} aria-label="Next case study" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-cyber-cyan transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2"
              >
                {/* Left side: Context */}
                <div className="p-8 md:p-12 bg-card border-r border-card-border">
                  <div className="inline-block px-3 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-[#0369A1] dark:text-electric-blue text-xs font-bold uppercase tracking-wider mb-6">
                    Case Study
                  </div>
                  <h3 className="text-3xl font-display font-bold text-foreground mb-8">{study.title}</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-2">The Challenge</h4>
                      <p className="text-foreground/90">{study.challenge}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Readiness Gap</h4>
                      <p className="text-foreground/90">{study.readinessGap}</p>
                    </div>
                  </div>
                </div>

                {/* Right side: Solution & Result */}
                <div className="p-8 md:p-12 bg-gradient-to-br from-ai-navy/30 to-deep-black">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm text-cyber-cyan uppercase tracking-wider font-semibold mb-2">AI Solution</h4>
                      <p className="text-foreground text-lg font-medium">{study.aiSolution}</p>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-glass-panel border border-card-border border-l-4 border-l-emerald-success">
                      <h4 className="text-sm text-[#047857] dark:text-emerald-success uppercase tracking-wider font-semibold mb-2">Business Value</h4>
                      <p className="text-foreground font-bold text-xl">{study.businessValue}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-card-border">
                      <div>
                        <span className="block text-xs text-muted-foreground mb-1">Timeline</span>
                        <span className="text-foreground font-medium">{study.timeline}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground mb-1">Tools</span>
                        <div className="flex gap-2">
                          {study.toolsUsed.map((tool, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-glass-panel rounded text-foreground">{tool}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Pagination Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {caseStudies.map((study, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Show case study: ${study.title}`}
                aria-current={i === currentIndex}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-cyber-cyan' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
