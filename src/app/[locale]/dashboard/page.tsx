import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, FileText, Calendar, Crown, Users2 } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { SignOutButton } from '@/components/SignOutButton';
import { PrivacyActions } from '@/components/PrivacyActions';
import { DashboardScoreTrend } from '@/components/DashboardScoreTrend';
import { TeamPanel, type TeamMember } from '@/components/TeamPanel';
import { defaultLocale, isLocale } from '@/lib/i18n/translations';
import { localePath } from '@/lib/i18n/paths';
import type { ReadinessResult } from '@/utils/scoring';

interface AssessmentRow {
  id: string;
  user_id: string | null;
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

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(localePath(locale, '/login'));
  }

  // RLS now unions two permissive select policies (0001_init.sql's
  // assessments_select_own OR 0009_sharing_and_teams.sql's
  // assessments_select_org_member) — dropping the .eq('user_id', ...)
  // filter here lets a teammate's org-shared assessments show up
  // alongside the caller's own, with user_id kept in the select so the
  // card below can badge the ones that aren't the caller's.
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, user_id, company_name, result, tier, created_at')
    .order('created_at', { ascending: false })
    .returns<AssessmentRow[]>();

  // Lightweight team accounts: at most one organization per user (see
  // src/lib/organizations/ensure.ts). No membership row means the user
  // has never used team sharing — TeamPanel simply doesn't render.
  const { data: ownMembership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  let teamMembers: TeamMember[] = [];
  let pendingInvites: string[] = [];
  const isTeamOwner = ownMembership?.role === 'owner';

  if (ownMembership) {
    const { data: memberRows } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', ownMembership.organization_id)
      .returns<{ user_id: string; role: 'owner' | 'member' }[]>();

    if (memberRows) {
      const admin = createAdminSupabaseClient();
      teamMembers = await Promise.all(
        memberRows.map(async (row) => {
          const { data } = await admin.auth.admin.getUserById(row.user_id);
          return { userId: row.user_id, email: data.user?.email ?? row.user_id, role: row.role };
        })
      );
    }

    if (isTeamOwner) {
      const admin = createAdminSupabaseClient();
      const { data: inviteRows } = await admin
        .from('organization_invites')
        .select('email')
        .eq('organization_id', ownMembership.organization_id)
        .returns<{ email: string }[]>();
      pendingInvites = inviteRows?.map((r) => r.email) ?? [];
    }
  }

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
              href={`${localePath(locale, '/')}#assessment`}
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
                href={`${localePath(locale, `/report/${a.id}`)}`}
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
                  <div className="flex items-center gap-2">
                    {a.user_id !== user.id && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <Users2 className="w-3 h-3" /> Shared
                      </span>
                    )}
                    {a.tier !== 'free' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-dubai-gold">
                        <Crown className="w-3 h-3" /> {tierLabels[a.tier]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
                  View Report <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {ownMembership && (
          <div className="mt-12 max-w-2xl">
            <TeamPanel members={teamMembers} pendingInvites={pendingInvites} isOwner={isTeamOwner} />
          </div>
        )}

        <div className="mt-12 max-w-2xl">
          <PrivacyActions />
        </div>
      </div>
    </section>
  );
}
