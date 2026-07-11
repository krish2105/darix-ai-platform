'use client';

import { BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { LeadFunnelPoint, AssessmentTrendPoint } from '@/lib/admin/analytics';

interface AdminAnalyticsProps {
  leadFunnel: LeadFunnelPoint[];
  assessmentTrend: AssessmentTrendPoint[];
}

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

const tooltipStyle = {
  contentStyle: { backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' },
  labelStyle: { color: '#94A3B8' },
};

// recharts's own already-installed dependency (used by DashboardScoreTrend
// for the same purpose) — both charts here are built from data the admin
// page already fetches for its list view (last 100 leads/assessments), no
// new queries.
export const AdminAnalytics = ({ leadFunnel, assessmentTrend }: AdminAnalyticsProps) => {
  const funnelData = leadFunnel.map((p) => ({ ...p, label: statusLabels[p.status] ?? p.status }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-cyber-cyan" />
          Lead Funnel
        </h2>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} itemStyle={{ color: '#22D3EE' }} />
              <Bar dataKey="count" name="Leads" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <LineChartIcon className="w-5 h-5 text-ai-violet" />
          Assessment Volume &amp; Average Score
        </h2>
        {assessmentTrend.length === 0 ? (
          <p className="text-muted-foreground text-sm">No assessment data yet.</p>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={assessmentTrend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis yAxisId="count" allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis
                  yAxisId="score"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <Tooltip {...tooltipStyle} />
                <Bar yAxisId="count" dataKey="count" name="Assessments" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="score"
                  type="monotone"
                  dataKey="averageScore"
                  name="Avg Score"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#38BDF8' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
