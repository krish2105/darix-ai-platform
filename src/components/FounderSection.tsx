'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { Button } from './Button';
import { fadeIn } from '@/utils/animations';
import { Link2, GraduationCap, MapPin, Briefcase } from 'lucide-react';

export const FounderSection = () => {
  const skills = [
    'AI Strategy', 'Business Analytics', 'Digital Transformation', 
    'AI Governance', 'Prompt Engineering', 'Market Research', 
    'SaaS Product Thinking', 'Business Model Design', 'Data-Driven Decisions'
  ];

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
              
              <h3 className="text-2xl font-bold text-foreground mb-2 relative z-10">Master's Student</h3>
              <p className="text-cyber-cyan font-medium mb-4 relative z-10">AI Business Strategy</p>
              
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-8 relative z-10">
                <MapPin className="w-4 h-4" />
                <span>Dubai, United Arab Emirates</span>
              </div>
              
              <Button variant="outline" className="w-full relative z-10" icon={<Link2 className="w-4 h-4" />}>
                Connect on LinkedIn
              </Button>
            </div>

            {/* Right side: Bio & Skills */}
            <div className="md:col-span-3 p-8 md:p-12">
              <h2 className="text-3xl font-display font-bold text-foreground mb-6">
                Bridging the Gap Between <span className="text-gradient">AI Capabilities</span> and Business Value
              </h2>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed mb-10 text-sm md:text-base">
                <p>
                  I am a Master’s student in AI Business based in Dubai, focused on the intersection of artificial intelligence, business strategy, digital transformation, and responsible AI.
                </p>
                <p>
                  DARIX AI was built from the realization that while many organizations want to adopt AI, very few know where their data, teams, and processes actually stand. My research and practical work aims to provide actionable, quantitative frameworks to measure AI readiness and drive real business impact.
                </p>
              </div>

              <div>
                <h4 className="text-sm uppercase tracking-wider text-foreground font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-electric-blue" />
                  Core Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-glass-panel border border-card-border rounded-full text-xs text-foreground/80 hover:bg-glass-panel hover:border-cyber-cyan/30 transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-card-border">
                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-cyber-cyan">
                  View Academic Research Projects →
                </Button>
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </section>
  );
};
