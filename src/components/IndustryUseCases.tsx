'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { industries } from '@/data/industries';
import { SectionTitle } from './SectionTitle';
import { Building2, Lightbulb, TrendingUp, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from './Button';

export const IndustryUseCases = () => {
  const [activeIndustry, setActiveIndustry] = useState(industries[0]);

  return (
    <section className="py-24 bg-card border-y border-card-border" id="industries">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle 
          title="AI Readiness by Industry"
          subtitle="Explore high-value AI applications and readiness requirements for your specific sector."
        />

        <div className="flex flex-col lg:flex-row gap-8 mt-16">
          {/* Industry Selector */}
          <div className="w-full lg:w-1/3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setActiveIndustry(industry)}
                className={cn(
                  "flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-left px-6 py-4 rounded-xl transition-all duration-300 font-medium whitespace-nowrap lg:whitespace-normal flex justify-between items-center",
                  activeIndustry.id === industry.id
                    ? "bg-gradient-to-r from-electric-blue/20 to-ai-violet/20 border border-electric-blue/30 text-foreground shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                    : "bg-glass-panel border border-card-border text-muted-foreground hover:bg-glass-panel hover:text-foreground"
                )}
              >
                <span>{industry.name}</span>
                {activeIndustry.id === industry.id && <ArrowRight className="w-4 h-4 text-electric-blue hidden lg:block" />}
              </button>
            ))}
          </div>

          {/* Industry Content */}
          <div className="w-full lg:w-2/3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndustry.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-8 md:p-10"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-blue to-ai-violet flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-foreground">{activeIndustry.name}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2 font-semibold">The Challenge</h4>
                    <p className="text-foreground leading-relaxed">{activeIndustry.problem}</p>
                  </div>
                  <div>
                    <h4 className="text-sm uppercase tracking-wider text-[#0369A1] dark:text-electric-blue mb-2 font-semibold flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> AI Solution
                    </h4>
                    <p className="text-foreground leading-relaxed">{activeIndustry.aiSolution}</p>
                  </div>
                </div>

                <div className="bg-background/50 border border-card-border rounded-xl p-6 mb-8">
                  <h4 className="text-sm uppercase tracking-wider text-[#047857] dark:text-emerald-success mb-3 font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Business Impact
                  </h4>
                  <p className="text-lg text-foreground/90">{activeIndustry.impact}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-card-border pt-8">
                  <div>
                    <span className="block text-xs text-muted-foreground uppercase mb-1">Recommended Pilot</span>
                    <span className="font-medium text-[#0369A1] dark:text-electric-blue">{activeIndustry.firstPilot}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      Risk Level <ShieldAlert className="w-3 h-3 text-warning-amber" />
                    </span>
                    <span className="font-medium text-foreground">{activeIndustry.risk}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground uppercase mb-1">Implementation Diff.</span>
                    <span className="font-medium text-foreground">{activeIndustry.difficulty}</span>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
