'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dimensions, Dimension } from '@/data/questions';
import { ReadinessResult } from '@/utils/scoring';
import { Button } from './Button';
import { SectionTitle } from './SectionTitle';
import { ScoreDashboard } from './ScoreDashboard';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { LAST_ASSESSMENT_ID_KEY } from '@/lib/storage-keys';
import { trackEvent } from '@/lib/analytics/posthog-client';
import { TurnstileWidget } from './Turnstile';
import { useLanguage } from '@/contexts/LanguageContext';

const TURNSTILE_REQUIRED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export const ReadinessAssessment = () => {
  const { t } = useLanguage();
  const [currentDimIndex, setCurrentDimIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const currentDim = dimensions[currentDimIndex];
  const hasStartedRef = useRef(false);

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
        body: JSON.stringify({ answers, turnstileToken }),
      });
      if (!res.ok) throw new Error('Failed to save assessment');
      const data: { id: string; result: ReadinessResult } = await res.json();
      setResult(data.result);
      setAssessmentId(data.id);
      setIsComplete(true);
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
    <section className="py-24 bg-background" id="assessment">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title={t('assessment.title')}
          subtitle={t('assessment.subtitle')}
        />

        <div className="max-w-4xl mx-auto mt-12">
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
    </section>
  );
};
