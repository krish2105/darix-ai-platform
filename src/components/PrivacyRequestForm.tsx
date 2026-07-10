'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { TurnstileWidget } from './Turnstile';
import { dataRequestTypes, dataRequestSchema, type DataRequestInput } from '@/lib/validation/schemas';

const TURNSTILE_REQUIRED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

const requestTypeLabels: Record<(typeof dataRequestTypes)[number], string> = {
  access: 'Access — send me a copy of my data',
  erasure: 'Erasure — delete my data',
};

// Anonymous PDPL intake: for anyone without a Darix account (or requesting
// on behalf of someone else's submission) to reach the team within the
// PDPL's 30-day response window. Signed-in users should use the direct
// export/delete actions on their dashboard instead — those apply instantly.
export const PrivacyRequestForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DataRequestInput>({
    resolver: zodResolver(dataRequestSchema),
  });

  const onSubmit = async (values: DataRequestInput) => {
    setSubmitError(null);
    try {
      const res = await fetch('/api/privacy/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not submit your request. Please try again.');
      setIsSubmitted(true);
      reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit your request. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="glass-card p-8 text-center flex flex-col items-center">
        <div className="w-14 h-14 bg-emerald-success/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-success" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Request received</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          We&apos;ll respond within 30 days, as required under UAE PDPL. We may email you to verify your identity first.
        </p>
        <Button variant="outline" onClick={() => setIsSubmitted(false)}>
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 md:p-8 space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground/80">Full name</label>
          <input
            id="fullName"
            {...register('fullName')}
            type="text"
            className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
            placeholder="John Doe"
          />
          {errors.fullName && <p className="text-xs text-risk-red">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground/80">Email</label>
          <input
            id="email"
            {...register('email')}
            type="email"
            className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
            placeholder="you@company.com"
          />
          {errors.email && <p className="text-xs text-risk-red">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="requestType" className="text-sm font-medium text-foreground/80">Request type</label>
        <select
          id="requestType"
          {...register('requestType')}
          defaultValue=""
          className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors appearance-none"
        >
          <option value="" disabled>Select a request type</option>
          {dataRequestTypes.map((type) => (
            <option key={type} value={type}>{requestTypeLabels[type]}</option>
          ))}
        </select>
        {errors.requestType && <p className="text-xs text-risk-red">{errors.requestType.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="details" className="text-sm font-medium text-foreground/80">Details (optional)</label>
        <textarea
          id="details"
          {...register('details')}
          rows={4}
          className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors resize-none"
          placeholder="Anything that helps us find your data — e.g. the email you used for an assessment."
        ></textarea>
        {errors.details && <p className="text-xs text-risk-red">{errors.details.message}</p>}
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
        {isSubmitting ? 'Submitting…' : 'Submit request'}
      </Button>
    </form>
  );
};
