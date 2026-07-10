import type { Metadata } from 'next';
import Link from 'next/link';
import { Info, Clock, Wrench, TrendingUp, ArrowRight } from 'lucide-react';
import { caseStudies } from '@/data/caseStudies';

export const metadata: Metadata = {
  title: 'Case Studies | Darix AI',
  description: 'Illustrative AI transformation scenarios across Dubai real estate, retail, hospitality, and SME operations — see the readiness gaps and roadmaps behind them.',
};

export default function CaseStudiesPage() {
  return (
    <section className="py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Case Studies</h1>
          <p className="text-muted-foreground leading-relaxed">
            A look at how organizations across common UAE sectors close their AI readiness gaps —
            from the initial bottleneck to the roadmap that addressed it.
          </p>
        </div>

        <div className="max-w-2xl mx-auto glass-card p-5 mb-14 flex items-start gap-3 border-t-2 border-t-warning-amber">
          <Info className="w-5 h-5 text-warning-amber flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/90 leading-relaxed">
            These are illustrative scenarios based on patterns typical of UAE SME AI adoption, used
            to show how a Darix readiness score translates into a concrete roadmap — not verified
            client testimonials.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {caseStudies.map((study) => (
            <article key={study.id} className="glass-card p-8 flex flex-col gap-6">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-[#0369A1] dark:text-electric-blue text-xs font-bold uppercase tracking-wider mb-4">
                  {study.timeline}
                </span>
                <h2 className="text-2xl font-display font-bold text-foreground">{study.title}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-1">The Challenge</h3>
                  <p className="text-foreground/90 text-sm">{study.challenge}</p>
                </div>
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Readiness Gap</h3>
                  <p className="text-foreground/90 text-sm">{study.readinessGap}</p>
                </div>
                <div>
                  <h3 className="text-xs text-cyber-cyan uppercase tracking-wider font-semibold mb-1">AI Solution</h3>
                  <p className="text-foreground text-sm font-medium">{study.aiSolution}</p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-glass-panel border border-card-border border-l-4 border-l-emerald-success">
                <h3 className="text-xs text-[#047857] dark:text-emerald-success uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Business Value
                </h3>
                <p className="text-foreground font-bold">{study.businessValue}</p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-card-border text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> {study.timeline}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Wrench className="w-3.5 h-3.5" />
                  {study.toolsUsed.join(', ')}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            href="/#assessment"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyber-cyan text-deep-black font-medium hover:bg-electric-blue transition-colors"
          >
            See where your organization stands <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
