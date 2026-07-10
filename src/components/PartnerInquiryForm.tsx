'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { TurnstileWidget } from './Turnstile';
import { partnerTypes, partnerInquirySchema, type PartnerInquiryInput } from '@/lib/validation/schemas';

const TURNSTILE_REQUIRED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

const partnerTypeLabels: Record<(typeof partnerTypes)[number], string> = {
  consultancy: 'Consultancy / advisory firm',
  systems_integrator: 'Systems integrator',
  referral: 'Referral partner',
  other: 'Other',
};

export const PartnerInquiryForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartnerInquiryInput>({
    resolver: zodResolver(partnerInquirySchema),
  });

  const onSubmit = async (values: PartnerInquiryInput) => {
    setSubmitError(null);
    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not submit your application. Please try again.');
      setIsSubmitted(true);
      reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit your application. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="glass-card p-8 text-center flex flex-col items-center">
        <div className="w-14 h-14 bg-emerald-success/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-success" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Application received</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Thanks for your interest — our team will reach out within a few business days.
        </p>
        <Button variant="outline" onClick={() => setIsSubmitted(false)}>
          Submit another application
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 md:p-8 space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="organizationName" className="text-sm font-medium text-foreground/80">Organization name</label>
          <input
            id="organizationName"
            {...register('organizationName')}
            type="text"
            className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
            placeholder="Acme Consulting"
          />
          {errors.organizationName && <p className="text-xs text-risk-red">{errors.organizationName.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="partnerType" className="text-sm font-medium text-foreground/80">Partner type</label>
          <select
            id="partnerType"
            {...register('partnerType')}
            defaultValue=""
            className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors appearance-none"
          >
            <option value="" disabled>Select a type</option>
            {partnerTypes.map((type) => (
              <option key={type} value={type}>{partnerTypeLabels[type]}</option>
            ))}
          </select>
          {errors.partnerType && <p className="text-xs text-risk-red">{errors.partnerType.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="contactName" className="text-sm font-medium text-foreground/80">Your name</label>
          <input
            id="contactName"
            {...register('contactName')}
            type="text"
            className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
            placeholder="John Doe"
          />
          {errors.contactName && <p className="text-xs text-risk-red">{errors.contactName.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="contactEmail" className="text-sm font-medium text-foreground/80">Work email</label>
          <input
            id="contactEmail"
            {...register('contactEmail')}
            type="email"
            className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
            placeholder="john@acme-consulting.com"
          />
          {errors.contactEmail && <p className="text-xs text-risk-red">{errors.contactEmail.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-foreground/80">Tell us about your practice (optional)</label>
        <textarea
          id="message"
          {...register('message')}
          rows={4}
          className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors resize-none"
          placeholder="Who you typically work with, and how you'd like to partner."
        ></textarea>
        {errors.message && <p className="text-xs text-risk-red">{errors.message.message}</p>}
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
        className="w-full"
        size="lg"
        disabled={isSubmitting || (TURNSTILE_REQUIRED && !turnstileToken)}
        icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      >
        {isSubmitting ? 'Submitting…' : 'Apply to partner'}
      </Button>
    </form>
  );
};
