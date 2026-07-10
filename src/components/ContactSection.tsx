'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SectionTitle } from './SectionTitle';
import { Button } from './Button';
import { Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { fadeIn } from '@/utils/animations';
import { companySizeOptions, contactSchema, type ContactInput } from '@/lib/validation/schemas';
import { trackEvent } from '@/lib/analytics/posthog-client';
import { TurnstileWidget } from './Turnstile';
import { useLanguage } from '@/contexts/LanguageContext';

const TURNSTILE_REQUIRED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export const ContactSection = () => {
  const { t } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (values: ContactInput) => {
    setSubmitError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('contact.genericError'));
      setIsSubmitted(true);
      trackEvent('contact_submitted', { company_size: values.companySize });
      reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('contact.genericError'));
    }
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden" id="contact">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-electric-blue/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-ai-violet/10 rounded-full blur-[100px]"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-6xl mx-auto glass-card p-8 md:p-16 border-t-4 border-t-electric-blue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left side: Text */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
                {t('contact.titleBefore')} <br />
                <span className="text-gradient">{t('contact.titleAccent')}</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t('contact.subtitle')}
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-glass-panel border border-card-border flex items-center justify-center flex-shrink-0">
                    <span className="text-cyber-cyan font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">{t('contact.step1Title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('contact.step1Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-glass-panel border border-card-border flex items-center justify-center flex-shrink-0">
                    <span className="text-cyber-cyan font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">{t('contact.step2Title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('contact.step2Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-glass-panel border border-card-border flex items-center justify-center flex-shrink-0">
                    <span className="text-cyber-cyan font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">{t('contact.step3Title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('contact.step3Desc')}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right side: Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {!isSubmitted ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium text-foreground/80">{t('contact.fullName')}</label>
                      <input id="fullName" {...register('fullName')} type="text" className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors" placeholder="John Doe" />
                      {errors.fullName && <p className="text-xs text-risk-red">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="workEmail" className="text-sm font-medium text-foreground/80">{t('contact.workEmail')}</label>
                      <input id="workEmail" {...register('workEmail')} type="email" className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors" placeholder="john@company.com" />
                      {errors.workEmail && <p className="text-xs text-risk-red">{errors.workEmail.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="companyName" className="text-sm font-medium text-foreground/80">{t('contact.companyName')}</label>
                      <input id="companyName" {...register('companyName')} type="text" className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors" placeholder="Acme Corp" />
                      {errors.companyName && <p className="text-xs text-risk-red">{errors.companyName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="companySize" className="text-sm font-medium text-foreground/80">{t('contact.companySize')}</label>
                      <select id="companySize" {...register('companySize')} defaultValue="" className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors appearance-none">
                        <option value="" disabled>{t('contact.selectSize')}</option>
                        {companySizeOptions.map((size) => (
                          <option key={size} value={size}>{size} {t('contact.employees')}</option>
                        ))}
                      </select>
                      {errors.companySize && <p className="text-xs text-risk-red">{errors.companySize.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="challenge" className="text-sm font-medium text-foreground/80">{t('contact.mainChallenge')}</label>
                    <textarea id="challenge" {...register('challenge')} rows={4} className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors resize-none" placeholder={t('contact.challengePlaceholder')}></textarea>
                    {errors.challenge && <p className="text-xs text-risk-red">{errors.challenge.message}</p>}
                  </div>

                  {submitError && (
                    <div className="flex items-start gap-3 rounded-lg border border-risk-red/40 bg-risk-red/10 p-4 text-sm text-risk-red">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />

                  <Button
                    type="submit"
                    data-testid="contact-submit-button"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting || (TURNSTILE_REQUIRED && !turnstileToken)}
                    icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  >
                    {isSubmitting ? t('contact.submitting') : t('contact.submit')}
                  </Button>
                </form>
              ) : (
                <div data-testid="contact-success" className="h-full flex flex-col items-center justify-center text-center p-8 bg-glass-panel border border-card-border rounded-xl">
                  <div className="w-16 h-16 bg-emerald-success/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-success" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{t('contact.successTitle')}</h3>
                  <p className="text-muted-foreground mb-8">
                    {t('contact.successDesc')}
                  </p>
                  <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                    {t('contact.submitAnother')}
                  </Button>
                </div>
              )}
            </motion.div>
            
          </div>
        </div>
      </div>
    </section>
  );
};
