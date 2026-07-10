'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BenchmarkResponse {
  available: boolean;
  averageScore?: number;
  sampleSize: number;
}

interface IndustryBenchmarkPanelProps {
  industryId: string;
  score: number;
}

// Only renders for assessments that supplied an industry at intake
// (src/components/ReadinessAssessment.tsx). Never shows a fabricated
// number — /api/benchmarks itself refuses to return an average below a
// minimum real sample size, and this renders that "not enough data yet"
// state explicitly rather than hiding it or guessing.
export const IndustryBenchmarkPanel = ({ industryId, score }: IndustryBenchmarkPanelProps) => {
  const { t } = useLanguage();
  const [data, setData] = useState<BenchmarkResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/benchmarks?industry=${encodeURIComponent(industryId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: BenchmarkResponse | null) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [industryId]);

  if (!data) return null;

  return (
    <div className="glass-card p-6 mb-6 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-electric-blue/10 flex items-center justify-center flex-shrink-0">
        <BarChart3 className="w-5 h-5 text-electric-blue" />
      </div>
      {data.available && data.averageScore !== undefined ? (
        <p className="text-sm text-foreground/90">
          {t('results.benchmark.available', {
            industry: t(`industry.${industryId}.name`),
            average: data.averageScore,
            comparison:
              score > data.averageScore
                ? t('results.benchmark.above')
                : score < data.averageScore
                  ? t('results.benchmark.below')
                  : t('results.benchmark.equal'),
          })}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('results.benchmark.unavailable', { industry: t(`industry.${industryId}.name`) })}
        </p>
      )}
    </div>
  );
};
