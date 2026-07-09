'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { staggerContainer, fadeIn } from '@/utils/animations';

export const SolutionSection = () => {
  const steps = [
    {
      num: '01',
      title: 'Assess',
      description: 'Answer structured questions across strategy, data, tech, people, process, governance, and ROI.',
      color: 'from-electric-blue to-cyber-cyan'
    },
    {
      num: '02',
      title: 'Score',
      description: 'Receive a clear AI readiness score from 0 to 100 with an objective maturity classification.',
      color: 'from-cyber-cyan to-emerald-success'
    },
    {
      num: '03',
      title: 'Diagnose',
      description: 'Identify your organization’s core strengths, hidden weaknesses, risks, and high-impact opportunities.',
      color: 'from-emerald-success to-warning-amber'
    },
    {
      num: '04',
      title: 'Transform',
      description: 'Get a practical, step-by-step AI adoption roadmap with recommended next steps and quick wins.',
      color: 'from-warning-amber to-ai-violet'
    }
  ];

  return (
    <section className="py-24 relative bg-card border-y border-card-border" id="solution">
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent -translate-y-1/2 hidden lg:block"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <SectionTitle 
          title="A Structured AI Readiness System for Modern Businesses"
          subtitle="Stop guessing. Start measuring. Follow a proven path to AI transformation."
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
