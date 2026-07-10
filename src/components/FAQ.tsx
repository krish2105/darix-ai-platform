'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { Plus, Minus } from 'lucide-react';
import { staggerContainer, fadeIn } from '@/utils/animations';
import { useLanguage } from '@/contexts/LanguageContext';

export const FAQ = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    question: t(`faq.q${n}`),
    answer: t(`faq.a${n}`),
  }));

  return (
    <section className="py-24 bg-card border-t border-card-border" id="faq">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title={t('faq.title')}
          subtitle={t('faq.subtitle')}
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
