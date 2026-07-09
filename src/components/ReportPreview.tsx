'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { Button } from './Button';
import { FileText, Download } from 'lucide-react';
import { fadeIn } from '@/utils/animations';

export const ReportPreview = () => {
  return (
    <section className="py-24 bg-background overflow-hidden relative" id="report">
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-96 h-96 bg-electric-blue/10 rounded-full blur-[120px]"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/80 border border-card-border mb-6">
              <FileText className="w-4 h-4 text-cyber-cyan" />
              <span className="text-xs font-semibold text-cyber-cyan uppercase">Instant AI Readiness Report</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Get Your Comprehensive <br className="hidden md:block"/> Executive Report
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Transform your assessment results into a board-ready PDF document. The report includes detailed gap analysis, risk factors, high-ROI use cases, and a step-by-step transformation roadmap.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                'Executive summary & overall score',
                'Dimension-by-dimension breakdown',
                'Strategic opportunities & quick wins',
                'Governance & risk checklist',
                '30/60/90-day action plan'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-glass-panel border border-card-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-cyber-cyan"></div>
                  </div>
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
            
            <Button size="lg" icon={<Download className="w-5 h-5" />}>
              Generate My Report
            </Button>
          </motion.div>

          {/* 3D PDF Mockup Illusion */}
          <motion.div 
            initial={{ opacity: 0, x: 50, rotateY: 15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: -5 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative perspective-1000"
          >
            <div className="relative transform-style-3d group">
              {/* Main Report Page */}
              <div className="w-full max-w-md mx-auto aspect-[1/1.4] bg-white rounded-lg shadow-[20px_20px_60px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.2)] border border-white/20 p-8 relative z-20 group-hover:rotate-y-0 transition-transform duration-700 ease-out">
                {/* Mock content */}
                <div className="w-full flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                  <div>
                    <div className="text-xl font-bold text-gray-800">AI Readiness Report</div>
                    <div className="text-sm text-gray-500">Acme Corp Ltd.</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">Overall Score: 78%</div>
                    <div className="text-xs text-gray-500">AI Innovator</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="text-sm font-bold text-gray-800">Executive Summary</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Your organization demonstrates a strong technical foundation and high data maturity. The primary gap exists in AI governance frameworks and workforce upskilling. Immediate focus should be on establishing an AI ethics committee and deploying a high-ROI pilot in customer operations.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-800">Priority Roadmap (90 Days)</h4>
                  <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div>
                      <div className="text-xs font-bold text-gray-800 mb-0.5">Data Infrastructure Audit</div>
                      <div className="text-[10px] text-gray-500">Consolidate fragmented data lakes across departments.</div>
                    </div>
                  </div>
                  <div className="w-full p-3 bg-green-50 rounded-lg border border-green-100 flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-green-500 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div>
                      <div className="text-xs font-bold text-gray-800 mb-0.5">Pilot: Support Automation</div>
                      <div className="text-[10px] text-gray-500">Implement RAG-based internal knowledge retrieval.</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stacked background pages */}
              <div className="absolute top-4 -right-4 w-full max-w-md mx-auto aspect-[1/1.4] bg-white/80 rounded-lg border border-white/20 -z-10 blur-sm"></div>
              <div className="absolute top-8 -right-8 w-full max-w-md mx-auto aspect-[1/1.4] bg-glass-panel0 rounded-lg border border-card-border -z-20 blur-md"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
