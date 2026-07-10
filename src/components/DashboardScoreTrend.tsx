'use client';

import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendPoint {
  date: string;
  score: number;
}

interface DashboardScoreTrendProps {
  points: TrendPoint[];
}

// Renders only when the caller has 2+ assessments — a single point isn't a
// trend. This is the code-level piece of "quarterly re-assessment
// tracking": the dashboard already lists every past assessment
// (src/app/dashboard/page.tsx), this just visualizes the score across
// them instead of leaving that comparison to the user.
export const DashboardScoreTrend = ({ points }: DashboardScoreTrendProps) => {
  if (points.length < 2) return null;

  const latest = points[points.length - 1];
  const first = points[0];
  const delta = latest.score - first.score;

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyber-cyan" />
          Score Over Time
        </h2>
        {delta !== 0 && (
          <span className={`text-sm font-semibold ${delta > 0 ? 'text-emerald-success' : 'text-risk-red'}`}>
            {delta > 0 ? '+' : ''}
            {delta} since your first assessment
          </span>
        )}
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#22D3EE' }}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Line type="monotone" dataKey="score" stroke="#38BDF8" strokeWidth={2} dot={{ r: 4, fill: '#38BDF8' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
