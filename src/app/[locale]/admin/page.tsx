import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Mail, Building2, Calendar, ShieldAlert, FileWarning, Handshake, Download } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/auth/is-admin';
import { SignOutButton } from '@/components/SignOutButton';
import { LeadStatusEditor } from '@/components/LeadStatusEditor';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { buildLeadFunnel, buildAssessmentTrend } from '@/lib/admin/analytics';
import { defaultLocale, isLocale } from '@/lib/i18n/translations';
import { localePath } from '@/lib/i18n/paths';
import type { ReadinessResult } from '@/utils/scoring';
import type { leadStatusOptions } from '@/lib/validation/schemas';

export const metadata: Metadata = {
  title: 'Admin | Darix AI',
  robots: { index: false, follow: false },
};

interface LeadRow {
  id: string;
  full_name: string;
  work_email: string;
  company_name: string;
  company_size: string;
  challenge: string;
  status: (typeof leadStatusOptions)[number];
  notes: string | null;
  created_at: string;
}

interface AssessmentRow {
  id: string;
  company_name: string | null;
  contact_email: string | null;
  result: ReadinessResult;
  tier: 'free' | 'pro' | 'business';
  created_at: string;
}

interface DataRequestRow {
  id: string;
  request_type: 'access' | 'erasure';
  full_name: string;
  email: string;
  details: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
}

interface PartnerInquiryRow {
  id: string;
  organization_name: string;
  contact_name: string;
  contact_email: string;
  partner_type: 'consultancy' | 'systems_integrator' | 'referral' | 'other';
  message: string | null;
  created_at: string;
}

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`${localePath(locale, '/login')}?next=${localePath(locale, '/admin')}`);

  if (!isAdminEmail(user.email)) {
    return (
      <section className="min-h-screen flex items-center justify-center py-32 bg-background">
        <div className="glass-card p-10 text-center max-w-md">
          <ShieldAlert className="w-10 h-10 text-risk-red mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Not authorized</h1>
          <p className="text-muted-foreground text-sm">
            This account ({user.email}) isn&apos;t on the admin allowlist.
          </p>
        </div>
      </section>
    );
  }

  const admin = createAdminSupabaseClient();
  const [
    { data: leads, error: leadsError },
    { data: assessments, error: assessmentsError },
    { data: dataRequests, error: dataRequestsError },
    { data: partnerInquiries, error: partnerInquiriesError },
  ] = await Promise.all([
    admin
      .from('leads')
      .select('id, full_name, work_email, company_name, company_size, challenge, status, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .returns<LeadRow[]>(),
    admin
      .from('assessments')
      .select('id, company_name, contact_email, result, tier, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .returns<AssessmentRow[]>(),
    admin
      .from('data_requests')
      .select('id, request_type, full_name, email, details, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .returns<DataRequestRow[]>(),
    admin
      .from('partner_inquiries')
      .select('id, organization_name, contact_name, contact_email, partner_type, message, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .returns<PartnerInquiryRow[]>(),
  ]);

  const statusPillClass: Record<DataRequestRow['status'], string> = {
    pending: 'bg-warning-amber/15 text-warning-amber',
    in_progress: 'bg-electric-blue/15 text-electric-blue',
    completed: 'bg-emerald-success/15 text-emerald-success',
    rejected: 'bg-risk-red/15 text-risk-red',
  };

  return (
    <section className="min-h-screen py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Admin</h1>
            <p className="text-muted-foreground">Signed in as {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/api/admin/export?type=leads"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Leads CSV
            </Link>
            <Link
              href="/api/admin/export?type=assessments"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Assessments CSV
            </Link>
            <SignOutButton />
          </div>
        </div>

        <AdminAnalytics
          leadFunnel={buildLeadFunnel(leads ?? [])}
          assessmentTrend={buildAssessmentTrend(assessments ?? [])}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-10">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Leads {leads ? `(${leads.length})` : ''}
            </h2>
            {leadsError && <p className="text-risk-red text-sm">Could not load leads.</p>}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {leads?.map((lead) => (
                <div key={lead.id} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-foreground">{lead.full_name}</h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      {new Date(lead.created_at).toLocaleDateString('en-AE')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3" /> {lead.work_email}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <Building2 className="w-3 h-3" /> {lead.company_name} &middot; {lead.company_size} employees
                  </p>
                  <p className="text-sm text-foreground/80">{lead.challenge}</p>
                  <LeadStatusEditor leadId={lead.id} initialStatus={lead.status} initialNotes={lead.notes} />
                </div>
              ))}
              {leads?.length === 0 && <p className="text-muted-foreground text-sm">No leads yet.</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Assessments {assessments ? `(${assessments.length})` : ''}
            </h2>
            {assessmentsError && <p className="text-risk-red text-sm">Could not load assessments.</p>}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {assessments?.map((a) => (
                <a
                  key={a.id}
                  href={localePath(locale, `/report/${a.id}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-5 flex items-center justify-between gap-4 hover:border-cyber-cyan/50 transition-colors block"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {a.company_name || a.contact_email || 'Anonymous'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.result.level} &middot; {a.tier} &middot;{' '}
                      {new Date(a.created_at).toLocaleDateString('en-AE')}
                    </p>
                  </div>
                  <div className="text-xl font-display font-black text-electric-blue flex-shrink-0">
                    {a.result.score}
                  </div>
                </a>
              ))}
              {assessments?.length === 0 && <p className="text-muted-foreground text-sm">No assessments yet.</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-warning-amber" />
              PDPL Requests {dataRequests ? `(${dataRequests.length})` : ''}
            </h2>
            {dataRequestsError && <p className="text-risk-red text-sm">Could not load data requests.</p>}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {dataRequests?.map((dr) => (
                <div key={dr.id} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-foreground">{dr.full_name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${statusPillClass[dr.status]}`}>
                      {dr.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3" /> {dr.email}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Request: <span className="font-semibold text-foreground/80">{dr.request_type}</span> &middot;{' '}
                    {new Date(dr.created_at).toLocaleDateString('en-AE')}
                  </p>
                  {dr.details && <p className="text-sm text-foreground/80">{dr.details}</p>}
                </div>
              ))}
              {dataRequests?.length === 0 && <p className="text-muted-foreground text-sm">No PDPL requests yet.</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-cyber-cyan" />
              Partner Inquiries {partnerInquiries ? `(${partnerInquiries.length})` : ''}
            </h2>
            {partnerInquiriesError && <p className="text-risk-red text-sm">Could not load partner inquiries.</p>}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {partnerInquiries?.map((pi) => (
                <div key={pi.id} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-foreground">{pi.organization_name}</h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      {new Date(pi.created_at).toLocaleDateString('en-AE')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{pi.contact_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <Mail className="w-3 h-3" /> {pi.contact_email}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Type: <span className="font-semibold text-foreground/80">{pi.partner_type.replace('_', ' ')}</span>
                  </p>
                  {pi.message && <p className="text-sm text-foreground/80">{pi.message}</p>}
                </div>
              ))}
              {partnerInquiries?.length === 0 && <p className="text-muted-foreground text-sm">No partner inquiries yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
