'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { Plus, Minus } from 'lucide-react';
import { staggerContainer, fadeIn } from '@/utils/animations';

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is an AI readiness assessment?",
      answer: "An AI readiness assessment is a structured diagnostic tool that evaluates an organization's maturity across strategy, data, infrastructure, talent, and governance to determine how prepared they are to adopt and scale artificial intelligence."
    },
    {
      question: "Who should use Dubai AI Readiness Index?",
      answer: "This platform is designed for C-level executives, department heads, SME founders, consultants, and digital transformation leaders in Dubai who want an objective measure of their AI capabilities."
    },
    {
      question: "Is this only for Dubai companies?",
      answer: "While the platform incorporates context relevant to the UAE and Dubai's digital strategy initiatives, the core assessment framework applies to any modern organization globally."
    },
    {
      question: "How is the AI readiness score calculated?",
      answer: "The score is calculated using a weighted algorithm across 8 dimensions. Each answer is scored from 0 to 5, resulting in a dimension percentage and an overall maturity level ranging from 'AI Explorer' to 'AI Leader'."
    },
    {
      question: "What happens after I complete the assessment?",
      answer: "You will receive an instant dashboard showing your score, dimension breakdown, top strengths, critical gaps, and a 90-day transformation roadmap. You can also export this as a PDF report or book a strategy call."
    },
    {
      question: "Does it replace AI consultants?",
      answer: "No. The tool serves as a starting point. It provides the diagnostic baseline and initial roadmap, which makes subsequent work with consultants, internal teams, and vendors much more efficient and focused."
    },
    {
      question: "Does the platform include AI governance?",
      answer: "Yes, AI Governance is one of the 8 core dimensions evaluated, ensuring that data privacy, compliance, and responsible AI practices are considered before scaling AI."
    }
  ];

  return (
    <section className="py-24 bg-card border-t border-card-border" id="faq">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle 
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about measuring AI readiness and business value."
        />

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-16"
        >
          {faqs.map((faq, i) => (
            <motion.div 
              key={i}
              variants={fadeIn}
              className="mb-4"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 glass-card hover:border-cyber-cyan/30 transition-all text-left"
              >
                <span className="text-foreground font-semibold pr-8">{faq.question}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openIndex === i ? 'bg-cyber-cyan text-deep-black' : 'bg-glass-panel text-muted-foreground'}`}>
                  {openIndex === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-2 text-muted-foreground text-sm leading-relaxed border-l-2 border-cyber-cyan ml-4 mt-2">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
