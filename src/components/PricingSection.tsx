'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { pricingPlans } from '@/data/pricing';
import { SectionTitle } from './SectionTitle';
import { Button } from './Button';
import { staggerContainer, fadeIn } from '@/utils/animations';
import { Check } from 'lucide-react';

export const PricingSection = () => {
  return (
    <section className="py-24 bg-card relative border-t border-card-border" id="pricing">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle 
          title="Transparent Pricing for Every Stage"
          subtitle="From free initial baseline assessments to comprehensive enterprise transformation roadmaps."
        />

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-7xl mx-auto"
        >
          {pricingPlans.map((plan, i) => (
            <motion.div 
              key={plan.id}
              variants={fadeIn}
              className={`relative glass-card p-8 flex flex-col h-full ${plan.isPopular ? 'border-cyber-cyan shadow-[0_0_30px_rgba(34,211,238,0.15)] -translate-y-4' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-cyan text-deep-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-black text-foreground">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-sm text-muted-foreground">/ one-time</span>}
                </div>
              </div>

              <div className="flex-grow space-y-4 mb-8">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3 text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-electric-blue flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={plan.isPopular ? 'primary' : 'outline'} 
                className="w-full mt-auto"
              >
                {plan.price === 'AED 0' ? 'Start Free' : plan.price === 'Custom' ? 'Contact Us' : 'Choose Plan'}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
