'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { staggerContainer, fadeIn } from '@/utils/animations';
import { BookOpen, FileCheck, Shield, Zap } from 'lucide-react';

export const ResearchSection = () => {
  const researchItems = [
    {
      title: 'AI Readiness Framework for Dubai SMEs',
      description: 'A comprehensive study on the unique challenges and opportunities for small and medium enterprises adopting AI in the UAE.',
      icon: <BookOpen className="w-5 h-5 text-electric-blue" />
    },
    {
      title: 'Responsible AI Governance Checklist',
      description: 'A 25-point compliance and ethical framework to ensure AI systems are transparent, fair, and secure.',
      icon: <Shield className="w-5 h-5 text-warning-amber" />
    },
    {
      title: 'AI Use-Case Prioritization Matrix',
      description: 'A quantitative model for scoring potential AI projects based on business value, implementation difficulty, and data readiness.',
      icon: <Zap className="w-5 h-5 text-cyber-cyan" />
    },
    {
      title: '90-Day AI Transformation Roadmap',
      description: 'An empirical blueprint for moving an organization from AI exploration to their first successful production pilot.',
      icon: <FileCheck className="w-5 h-5 text-emerald-success" />
    }
  ];

  return (
    <section className="py-24 bg-card border-y border-card-border relative overflow-hidden" id="research">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ai-violet/10 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <SectionTitle 
          title="Research-Driven AI Business Transformation"
          subtitle="Our methodology is built on rigorous academic research, global frameworks, and Dubai's digital strategy initiatives."
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
                    Read Paper <span>→</span>
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
