'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { pricingPlans } from '@/data/pricing';
import { SectionTitle } from './SectionTitle';
import { Button } from './Button';
import { staggerContainer, fadeIn } from '@/utils/animations';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { LAST_ASSESSMENT_ID_KEY } from '@/lib/storage-keys';
import { trackEvent } from '@/lib/analytics/posthog-client';
import { useLanguage } from '@/contexts/LanguageContext';

const planFeatureCounts: Record<string, number> = { free: 4, pro: 6, business: 5, enterprise: 6 };

export const PricingSection = () => {
  const { t } = useLanguage();
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handlePlanClick = async (plan: (typeof pricingPlans)[number]) => {
    setNotice(null);

    if (plan.price === 'AED 0') {
      document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (plan.price === 'Custom' || !plan.checkoutAmountAed) {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const assessmentId = window.localStorage.getItem(LAST_ASSESSMENT_ID_KEY);
    if (!assessmentId) {
      setNotice(t('pricing.completeFirst'));
      document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setPendingPlanId(plan.id);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, tier: plan.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout.');
      trackEvent('checkout_started', { assessment_id: assessmentId, tier: plan.id, source: 'pricing_section' });
      window.location.assign(data.url);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not start checkout. Please try again.');
      setPendingPlanId(null);
    }
  };

  return (
    <section className="py-24 bg-card relative border-t border-card-border" id="pricing">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title={t('pricing.title')}
          subtitle={t('pricing.subtitle')}
        />

        {notice && (
          <div className="max-w-xl mx-auto mb-8 flex items-start gap-3 rounded-lg border border-warning-amber/40 bg-warning-amber/10 p-4 text-sm text-warning-amber">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-7xl mx-auto"
        >
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={fadeIn}
              className={`relative glass-card p-8 flex flex-col h-full ${plan.isPopular ? 'border-cyber-cyan shadow-[0_0_30px_rgba(34,211,238,0.15)] -translate-y-4' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-cyan text-deep-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {t('pricing.popular')}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2">{t(`plan.${plan.id}.name`)}</h3>
                <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">{t(`plan.${plan.id}.description`)}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-black text-foreground">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-sm text-muted-foreground">{t('pricing.perOneTime')}</span>}
                </div>
              </div>

              <div className="flex-grow space-y-4 mb-8">
                {Array.from({ length: planFeatureCounts[plan.id] ?? plan.features.length }).map((_, j) => (
                  <div key={j} className="flex items-start gap-3 text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-electric-blue flex-shrink-0 mt-0.5" />
                    <span>{t(`plan.${plan.id}.feature${j + 1}`)}</span>
                  </div>
                ))}
              </div>

              <Button
                variant={plan.isPopular ? 'primary' : 'outline'}
                className="w-full mt-auto"
                disabled={pendingPlanId !== null}
                onClick={() => handlePlanClick(plan)}
                icon={pendingPlanId === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {pendingPlanId === plan.id
                  ? t('pricing.redirecting')
                  : plan.price === 'AED 0'
                    ? t('pricing.startFree')
                    : plan.price === 'Custom'
                      ? t('pricing.contactUs')
                      : t('pricing.requestPlan')}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
