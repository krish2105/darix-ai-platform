'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dimensions } from '@/data/questions';
import { industries } from '@/data/industries';
import { ReadinessResult } from '@/utils/scoring';
import { companySizeOptions } from '@/lib/validation/schemas';
import { Button } from './Button';
import { SectionTitle } from './SectionTitle';
import { ScoreDashboard } from './ScoreDashboard';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertTriangle, Loader2, X } from 'lucide-react';
import { LAST_ASSESSMENT_ID_KEY, ASSESSMENT_DRAFT_KEY } from '@/lib/storage-keys';
import { trackEvent } from '@/lib/analytics/posthog-client';
import { TurnstileWidget } from './Turnstile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHasMounted } from '@/hooks/useHasMounted';

const TURNSTILE_REQUIRED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

interface AssessmentDraft {
  answers: Record<string, number>;
  currentDimIndex: number;
  industry: string;
  companySize: string;
}

const readDraft = (): AssessmentDraft | null => {
  try {
    const raw = window.localStorage.getItem(ASSESSMENT_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<AssessmentDraft>;
    if (!draft.answers || Object.keys(draft.answers).length === 0) return null;
    return {
      answers: draft.answers,
      currentDimIndex: typeof draft.currentDimIndex === 'number' ? draft.currentDimIndex : 0,
      industry: draft.industry ?? '',
      companySize: draft.companySize ?? '',
    };
  } catch {
    // Corrupt JSON or storage unavailable (private browsing) — start fresh.
    return null;
  }
};

const clearDraft = () => {
  try {
    window.localStorage.removeItem(ASSESSMENT_DRAFT_KEY);
  } catch {
    // Non-critical — nothing to clean up if storage isn't available.
  }
};

// The actual form + all its state. Kept separate from ReadinessAssessment
// below so draft restoration can use lazy useState initializers (which run
// once, synchronously, when this component instance is created) instead of
// setState-in-an-effect: ReadinessAssessment mounts this with a key that
// changes once the page is actually hydrated, forcing a fresh instance —
// and therefore a fresh read of localStorage — right after mount, with no
// setState call inside an effect body at all.
const AssessmentForm = () => {
  const { t } = useLanguage();
  // Each a lazy initializer — React guarantees these run exactly once, on
  // this instance's first render, never again on subsequent re-renders.
  const [currentDimIndex, setCurrentDimIndex] = useState(() => readDraft()?.currentDimIndex ?? 0);
  const [answers, setAnswers] = useState<Record<string, number>>(() => readDraft()?.answers ?? {});
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [industry, setIndustry] = useState(() => readDraft()?.industry ?? '');
  const [companySize, setCompanySize] = useState(() => readDraft()?.companySize ?? '');
  const [draftRestored, setDraftRestored] = useState(() => Boolean(readDraft()));

  const currentDim = dimensions[currentDimIndex];
  const hasStartedRef = useRef(draftRestored);

  // Persists on every change so a refresh or accidental tab close never
  // loses progress — cleared on successful submit or an explicit retake.
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    try {
      window.localStorage.setItem(
        ASSESSMENT_DRAFT_KEY,
        JSON.stringify({ answers, currentDimIndex, industry, companySize })
      );
    } catch {
      // Non-critical — the assessment still works without draft persistence.
    }
  }, [answers, currentDimIndex, industry, companySize]);

  const startOver = () => {
    clearDraft();
    setAnswers({});
    setCurrentDimIndex(0);
    setIndustry('');
    setCompanySize('');
    setDraftRestored(false);
  };

  const handleAnswer = (qId: string, value: number) => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      trackEvent('assessment_started');
    }
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const isCurrentDimComplete = () => {
    return currentDim.questions.every(q => answers[q.id] !== undefined);
  };

  const submitAssessment = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          turnstileToken,
          industry: industry || undefined,
          companySize: companySize || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to save assessment');
      const data: { id: string; result: ReadinessResult } = await res.json();
      setResult(data.result);
      setAssessmentId(data.id);
      setIsComplete(true);
      clearDraft();
      try {
        window.localStorage.setItem(LAST_ASSESSMENT_ID_KEY, data.id);
      } catch {
        // localStorage can throw in private-browsing/blocked-storage modes — non-critical, skip silently.
      }
      trackEvent('assessment_completed', { assessment_id: data.id, score: data.result.score, level: data.result.level });
    } catch {
      setSaveError(t('assessment.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentDimIndex < dimensions.length - 1) {
      setCurrentDimIndex(prev => prev + 1);
    } else {
      submitAssessment();
    }
  };

  const handlePrev = () => {
    if (currentDimIndex > 0) {
      setCurrentDimIndex(prev => prev - 1);
    }
  };

  if (isComplete && result && assessmentId) {
    return (
      <ScoreDashboard
        result={result}
        assessmentId={assessmentId}
        onReset={() => {
          clearDraft();
          setAnswers({});
          setCurrentDimIndex(0);
          setIsComplete(false);
          setResult(null);
          setAssessmentId(null);
        }}
      />
    );
  }

  const progress = ((currentDimIndex) / dimensions.length) * 100;

  return (
    <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title={t('assessment.title')}
          subtitle={t('assessment.subtitle')}
        />

        <div className="max-w-4xl mx-auto mt-12">
          {draftRestored && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-cyber-cyan/30 bg-cyber-cyan/10 px-4 py-3 text-sm text-foreground">
              <span>{t('assessment.draftRestored')}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={startOver}
                  className="text-cyber-cyan hover:text-electric-blue font-medium underline underline-offset-2"
                >
                  {t('assessment.startOver')}
                </button>
                <button
                  type="button"
                  aria-label={t('assessment.dismissBanner')}
                  onClick={() => setDraftRestored(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2 font-medium">
              <span>{t('assessment.dimensionProgress', { current: currentDimIndex + 1, total: dimensions.length })}</span>
              <span>{t('assessment.percentComplete', { percent: Math.round(progress) })}</span>
            </div>
            <div className="w-full h-2 bg-glass-panel rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-electric-blue to-ai-violet"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="glass-card p-6 md:p-10 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-ai-violet/10 rounded-full blur-[100px] pointer-events-none"></div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentDim.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 border-b border-card-border pb-6">
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">{t(`dim.${currentDim.id}.title`)}</h3>
                  <p className="text-muted-foreground">{t(`dim.${currentDim.id}.desc`)}</p>
                </div>

                <div className="space-y-8">
                  {currentDim.questions.map((q, idx) => (
                    <div key={q.id} className="space-y-4">
                      <p className="text-lg font-medium text-foreground/90">{idx + 1}. {t(`q.${q.id}`)}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-4">
                        {[0, 1, 2, 3, 4, 5].map((val) => {
                          const isSelected = answers[q.id] === val;
                          return (
                            <button
                              key={val}
                              data-testid={`answer-${q.id}-${val}`}
                              onClick={() => handleAnswer(q.id, val)}
                              className={`
                                relative p-3 rounded-lg border text-center transition-all duration-200
                                ${isSelected 
                                  ? 'bg-cyber-cyan/20 border-cyber-cyan text-foreground shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                                  : 'bg-glass-panel border-card-border text-muted-foreground hover:bg-glass-panel hover:border-white/20'
                                }
                              `}
                            >
                              <span className="block text-xl font-bold mb-1">{val}</span>
                              <span className="text-[10px] uppercase tracking-wider block">
                                {val === 0 ? t('assessment.none') : val === 5 ? t('assessment.high') : t('assessment.med')}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-cyber-cyan" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {saveError && (
              <div className="mt-8 flex items-start gap-3 rounded-lg border border-risk-red/40 bg-risk-red/10 p-4 text-sm text-risk-red">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            {currentDimIndex === dimensions.length - 1 && (
              <div className="mt-8 pt-6 border-t border-card-border grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="assessment-industry" className="text-sm font-medium text-foreground/80">
                    {t('assessment.industryLabel')}
                  </label>
                  <select
                    id="assessment-industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors appearance-none"
                  >
                    <option value="">{t('assessment.selectIndustry')}</option>
                    {industries.map((ind) => (
                      <option key={ind.id} value={ind.id}>{t(`industry.${ind.id}.name`)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="assessment-company-size" className="text-sm font-medium text-foreground/80">
                    {t('assessment.companySizeLabel')}
                  </label>
                  <select
                    id="assessment-company-size"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors appearance-none"
                  >
                    <option value="">{t('contact.selectSize')}</option>
                    {companySizeOptions.map((size) => (
                      <option key={size} value={size}>{size} {t('contact.employees')}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {currentDimIndex === dimensions.length - 1 && (
              <div className="mt-8 flex justify-center">
                <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-card-border flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentDimIndex === 0 || isSaving}
                className={currentDimIndex === 0 ? 'invisible' : ''}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                {t('assessment.previous')}
              </Button>

              <Button
                data-testid="assessment-next-button"
                onClick={handleNext}
                disabled={
                  !isCurrentDimComplete() ||
                  isSaving ||
                  (currentDimIndex === dimensions.length - 1 && TURNSTILE_REQUIRED && !turnstileToken)
                }
                variant={currentDimIndex === dimensions.length - 1 ? 'primary' : 'secondary'}
                className={!isCurrentDimComplete() ? 'opacity-50' : ''}
                icon={
                  isSaving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : currentDimIndex !== dimensions.length - 1
                      ? <ChevronRight className="w-4 h-4" />
                      : undefined
                }
              >
                {isSaving
                  ? t('assessment.saving')
                  : currentDimIndex === dimensions.length - 1
                    ? (saveError ? t('assessment.retry') : t('assessment.seeResults'))
                    : t('assessment.nextDimension')}
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
};

export const ReadinessAssessment = () => {
  // false during SSR and the client's first hydration pass, true right
  // after — see useHasMounted's own comment for why this, and not
  // useState+useEffect, is the safe way to do this. AssessmentForm (not
  // this wrapper) unmounts and remounts as a fresh instance once real
  // `window` access is available, so its lazy useState initializers
  // re-run and pick up localStorage — no setState call inside an effect
  // anywhere. The id="assessment" section lives out here, not inside
  // AssessmentForm, specifically so that remount doesn't detach the
  // anchor other pages scroll/link to (e.g. `/#assessment`) — only the
  // form's own content underneath it is torn down and rebuilt.
  const mounted = useHasMounted();
  return (
    <section className="py-24 bg-background" id="assessment">
      <AssessmentForm key={mounted ? 'mounted' : 'ssr'} />
    </section>
  );
};
