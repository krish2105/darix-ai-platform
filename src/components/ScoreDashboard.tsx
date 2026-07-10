'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { ReadinessResult } from '@/utils/scoring';
import { AnimatedCounter } from './AnimatedCounter';
import { Button } from './Button';
import { Download, RefreshCw, CheckCircle2, AlertTriangle, Lightbulb, Activity, Loader2, Mail, Send, Crown, PhoneCall, MessageCircle, CreditCard } from 'lucide-react';
import { pricingPlans } from '@/data/pricing';
import { trackEvent } from '@/lib/analytics/posthog-client';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeReadinessResult } from '@/lib/i18n/localizeResult';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type ReportTier = 'free' | 'pro' | 'business';

interface ScoreDashboardProps {
  result: ReadinessResult;
  assessmentId: string;
  tier?: ReportTier;
  onReset?: () => void;
}

export const ScoreDashboard: React.FC<ScoreDashboardProps> = ({ result, assessmentId, tier = 'free', onReset }) => {
  const { t, locale } = useLanguage();
  const localized = localizeReadinessResult(result, locale);
  const radarData = result.dimensionScores.map(d => ({
    subject: t(`dim.${d.dimensionId}.title`),
    A: d.percentage,
    fullMark: 100,
  }));

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/pdf?locale=${locale}`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'darix-ai-readiness-report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      trackEvent('report_pdf_downloaded', { assessment_id: assessmentId });
    } catch {
      setDownloadError(t('results.pdfError'));
    } finally {
      setIsDownloading(false);
    }
  };

  const [upgradingTier, setUpgradingTier] = useState<'pro' | 'business' | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const [isTabbyLoading, setIsTabbyLoading] = useState(false);
  const [tabbyError, setTabbyError] = useState<string | null>(null);

  const handleTabbyUpgrade = async () => {
    setIsTabbyLoading(true);
    setTabbyError(null);
    try {
      const res = await fetch('/api/checkout/tabby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || t('results.checkoutError'));
      trackEvent('checkout_started', { assessment_id: assessmentId, tier: 'business', provider: 'tabby' });
      window.location.assign(data.url);
    } catch (err) {
      setTabbyError(err instanceof Error ? err.message : t('results.checkoutError'));
      setIsTabbyLoading(false);
    }
  };

  // Derived from a browser-only URL query param. useSyncExternalStore (not
  // a mount effect) is what lets this read `window.location.search`
  // without a hydration mismatch: React renders the server snapshot
  // (false — no `window` on the server) during hydration, then re-checks
  // the real client snapshot right after mount.
  const showUpgradedBanner = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get('upgraded') === '1',
    () => false
  );

  const handleUpgrade = async (targetTier: 'pro' | 'business') => {
    setUpgradingTier(targetTier);
    setUpgradeError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, tier: targetTier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || t('results.checkoutError'));
      trackEvent('checkout_started', { assessment_id: assessmentId, tier: targetTier });
      window.location.assign(data.url);
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : t('results.checkoutError'));
      setUpgradingTier(null);
    }
  };

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEmailReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus('sending');
    setEmailError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('results.emailSendError'));
      setEmailStatus('sent');
    } catch (err) {
      setEmailStatus('error');
      setEmailError(err instanceof Error ? err.message : t('results.emailSendError'));
    }
  };

  const [showWhatsappForm, setShowWhatsappForm] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const handleWhatsappReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappStatus('sending');
    setWhatsappError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('results.whatsappSendError'));
      setWhatsappStatus('sent');
    } catch (err) {
      setWhatsappStatus('error');
      setWhatsappError(err instanceof Error ? err.message : t('results.whatsappSendError'));
    }
  };

  return (
    <section className="py-24 bg-background" id="dashboard">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-1 rounded-full bg-gradient-to-r from-electric-blue via-cyber-cyan to-ai-violet mb-6"
          >
            <div className="bg-background rounded-full px-6 py-2">
              <span className="text-sm font-semibold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-cyber-cyan">
                {t('results.badge')}
              </span>
            </div>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">{t('results.title')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('results.subtitle')}</p>
          {tier !== 'free' && (
            <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-dubai-gold/10 border border-dubai-gold/30 text-dubai-gold text-xs font-semibold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              {tier === 'pro' ? t('results.tierProfessional') : t('results.tierBusiness')}
            </div>
          )}
        </div>

        {showUpgradedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-10 flex items-center gap-3 rounded-lg border border-emerald-success/40 bg-emerald-success/10 p-4 text-sm text-emerald-success"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{t('results.paymentSuccess')}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Score Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-electric-blue/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <h3 className="text-lg text-muted-foreground font-medium uppercase tracking-wider mb-2">{t('results.overallScore')}</h3>
            <div className="relative w-48 h-48 flex items-center justify-center my-6">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                <motion.circle 
                  cx="96" cy="96" r="88" 
                  stroke="url(#scoreGradient)" 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray="553"
                  initial={{ strokeDashoffset: 553 }}
                  animate={{ strokeDashoffset: 553 - (553 * result.score) / 100 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-5xl font-display font-black text-foreground flex items-end">
                <AnimatedCounter value={result.score} />
                <span className="text-2xl text-muted-foreground mb-1 ml-1">/100</span>
              </div>
            </div>
            
            <h4 className="text-2xl font-bold text-cyber-cyan mb-2">{localized.level}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{localized.description}</p>
          </motion.div>

          {/* Radar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card p-8"
          >
            <h3 className="text-lg text-foreground font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-electric-blue" />
              {t('results.dimensionBreakdown')}
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.3} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#22D3EE' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Strengths & Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-8 border-t-2 border-emerald-success"
          >
            <h3 className="text-lg text-foreground font-semibold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-success" />
              {t('results.topStrengths')}
            </h3>
            <ul className="space-y-4">
              {localized.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-success mt-1.5 flex-shrink-0"></div>
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-8 border-t-2 border-risk-red"
          >
            <h3 className="text-lg text-foreground font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-risk-red" />
              {t('results.criticalGaps')}
            </h3>
            <ul className="space-y-4">
              {localized.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-risk-red mt-1.5 flex-shrink-0"></div>
                  {g}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Action Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 mb-10"
        >
          <h3 className="text-xl text-foreground font-bold mb-8 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-dubai-gold" />
            {t('results.roadmap')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {localized.roadmap.map((phase, i) => (
              <div key={i} className="bg-glass-panel border border-card-border rounded-xl p-6 relative">
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-card border border-card-border flex items-center justify-center text-xs font-bold text-cyber-cyan">
                  {i + 1}
                </div>
                <div className="text-cyber-cyan text-sm font-semibold mb-1">{phase.phase}</div>
                <div className="text-foreground font-medium mb-4">{phase.timeline}</div>
                <ul className="space-y-2">
                  {phase.actions.map((action, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-cyber-cyan mt-0.5">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upgrade / plan-specific CTA */}
        {tier === 'business' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t-2 border-t-dubai-gold"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-dubai-gold" /> {t('results.strategyCallIncluded')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('results.strategyCallDesc')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('results.scheduleCall')}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-8 mb-10"
          >
            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
              <Crown className="w-5 h-5 text-dubai-gold" />
              {tier === 'free' ? t('results.upgradeUnlock') : t('results.addCall')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {tier === 'free' ? t('results.upgradeFreeDesc') : t('results.upgradeProDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {tier === 'free' && (
                <Button
                  variant="secondary"
                  onClick={() => handleUpgrade('pro')}
                  disabled={upgradingTier !== null}
                  icon={upgradingTier === 'pro' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                >
                  {upgradingTier === 'pro'
                    ? t('results.redirecting')
                    : t('results.upgradeAedProfessional', { amount: pricingPlans.find((p) => p.id === 'pro')?.checkoutAmountAed ?? '' })}
                </Button>
              )}
              <Button
                onClick={() => handleUpgrade('business')}
                disabled={upgradingTier !== null}
                icon={upgradingTier === 'business' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
              >
                {upgradingTier === 'business'
                  ? t('results.redirecting')
                  : t('results.upgradeAedBusiness', { amount: pricingPlans.find((p) => p.id === 'business')?.checkoutAmountAed ?? '' })}
              </Button>
              <Button
                variant="outline"
                onClick={handleTabbyUpgrade}
                disabled={upgradingTier !== null || isTabbyLoading}
                icon={isTabbyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              >
                {isTabbyLoading ? t('results.redirecting') : t('results.payInInstallments')}
              </Button>
            </div>
            {upgradeError && (
              <p className="text-sm text-risk-red flex items-center gap-2 mt-4">
                <AlertTriangle className="w-4 h-4" /> {upgradeError}
              </p>
            )}
            {tabbyError && (
              <p className="text-sm text-risk-red flex items-center gap-2 mt-4">
                <AlertTriangle className="w-4 h-4" /> {tabbyError}
              </p>
            )}
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              data-testid="download-pdf-button"
              size="lg"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              icon={isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            >
              {isDownloading ? t('results.generatingPdf') : t('results.downloadPdf')}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowEmailForm((v) => !v)}
              icon={<Mail className="w-5 h-5" />}
            >
              {t('results.emailMe')}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowWhatsappForm((v) => !v)}
              icon={<MessageCircle className="w-5 h-5" />}
            >
              {t('results.whatsappMe')}
            </Button>
            {onReset && (
              <Button variant="outline" size="lg" onClick={onReset} icon={<RefreshCw className="w-5 h-5" />}>
                {t('results.retake')}
              </Button>
            )}
          </div>

          {downloadError && (
            <p className="text-sm text-risk-red flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {downloadError}
            </p>
          )}

          {showEmailForm && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleEmailReport}
              className="w-full max-w-md glass-card p-4 flex flex-col gap-3"
            >
              {emailStatus === 'sent' ? (
                <div className="flex items-center gap-2 text-emerald-success text-sm py-2 mx-auto">
                  <CheckCircle2 className="w-4 h-4" /> {t('results.reportSent')}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <input
                    type="email"
                    required
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="you@company.com"
                    className="flex-1 bg-glass-panel border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={emailStatus === 'sending'}
                    icon={emailStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  >
                    {emailStatus === 'sending' ? t('results.sending') : t('results.send')}
                  </Button>
                </div>
              )}
              {emailStatus === 'error' && (
                <p className="text-xs text-risk-red">{emailError}</p>
              )}
            </motion.form>
          )}

          {showWhatsappForm && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleWhatsappReport}
              className="w-full max-w-md glass-card p-4 flex flex-col gap-3"
            >
              {whatsappStatus === 'sent' ? (
                <div className="flex items-center gap-2 text-emerald-success text-sm py-2 mx-auto">
                  <CheckCircle2 className="w-4 h-4" /> {t('results.reportSentWhatsapp')}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <input
                    type="tel"
                    required
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(e.target.value)}
                    placeholder={t('results.whatsappPlaceholder')}
                    className="flex-1 bg-glass-panel border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={whatsappStatus === 'sending'}
                    icon={whatsappStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  >
                    {whatsappStatus === 'sending' ? t('results.sending') : t('results.send')}
                  </Button>
                </div>
              )}
              {whatsappStatus === 'error' && (
                <p className="text-xs text-risk-red">{whatsappError}</p>
              )}
            </motion.form>
          )}
        </motion.div>

      </div>
    </section>
  );
};

