import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, FileText, Calendar, Crown } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/SignOutButton';
import { PrivacyActions } from '@/components/PrivacyActions';
import { DashboardScoreTrend } from '@/components/DashboardScoreTrend';
import type { ReadinessResult } from '@/utils/scoring';

interface AssessmentRow {
  id: string;
  company_name: string | null;
  result: ReadinessResult;
  tier: 'free' | 'pro' | 'business';
  created_at: string;
}

const tierLabels: Record<AssessmentRow['tier'], string> = {
  free: 'Free',
  pro: 'Professional',
  business: 'Business',
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // RLS (assessments_select_own) restricts this to rows owned by the
  // signed-in user — no need to add .eq('user_id', ...) ourselves, but
  // it doesn't hurt to be explicit about intent.
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, company_name, result, tier, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .returns<AssessmentRow[]>();

  return (
    <section className="min-h-screen py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Your Assessments
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {error && (
          <p className="text-risk-red text-sm mb-8">
            Could not load your assessments. Please refresh the page.
          </p>
        )}

        {!error && (!assessments || assessments.length === 0) && (
          <div className="glass-card p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No assessments yet</h2>
            <p className="text-muted-foreground mb-6">
              Take the free AI Readiness Assessment to see your results here.
            </p>
            <Link
              href="/#assessment"
              className="inline-flex items-center gap-2 text-cyber-cyan hover:text-electric-blue font-medium transition-colors"
            >
              Start Assessment <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {assessments && assessments.length > 1 && (
          <DashboardScoreTrend
            points={[...assessments]
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((a) => ({
                date: new Date(a.created_at).toLocaleDateString('en-AE', { month: 'short', day: 'numeric' }),
                score: a.result.score,
              }))}
          />
        )}

        {assessments && assessments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((a) => (
              <Link
                key={a.id}
                href={`/report/${a.id}`}
                className="glass-card p-6 flex flex-col gap-4 hover:border-cyber-cyan/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {a.company_name || 'AI Readiness Assessment'}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(a.created_at).toLocaleDateString('en-AE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-display font-black text-electric-blue">
                      {a.result.score}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">/100</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-cyber-cyan">{a.result.level}</span>
                  {a.tier !== 'free' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-dubai-gold">
                      <Crown className="w-3 h-3" /> {tierLabels[a.tier]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
                  View Report <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 max-w-2xl">
          <PrivacyActions />
        </div>
      </div>
    </section>
  );
}
