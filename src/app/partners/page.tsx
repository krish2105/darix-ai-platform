import type { Metadata } from 'next';
import { Handshake, Building2, Users } from 'lucide-react';
import { PartnerInquiryForm } from '@/components/PartnerInquiryForm';

export const metadata: Metadata = {
  title: 'Partners | Darix AI',
  description: 'Partner with Darix AI as a consultancy, systems integrator, or referral partner to bring AI readiness assessments to your UAE clients.',
};

const tracks = [
  {
    icon: Handshake,
    title: 'Consultancies & advisory firms',
    description:
      'Add a structured AI readiness assessment to your client engagements — use Darix as the diagnostic that anchors your recommendations, with white-label-friendly reporting on our roadmap.',
  },
  {
    icon: Building2,
    title: 'Systems integrators',
    description:
      'Qualify prospects before scoping an AI implementation. A Darix score gives you a defensible starting point for the data-maturity and governance gaps a project will need to close.',
  },
  {
    icon: Users,
    title: 'Referral partners',
    description:
      'If you regularly work with UAE SMEs exploring AI — accountants, business setup consultants, industry associations — refer them to Darix and we\'ll credit the relationship.',
  },
];

export default function PartnersPage() {
  return (
    <section className="py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Partner with Darix AI</h1>
          <p className="text-muted-foreground leading-relaxed">
            We work with consultancies, systems integrators, and referral partners who help UAE
            businesses figure out where to start with AI — and want a credible, structured
            assessment to anchor that conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          {tracks.map((track) => (
            <div key={track.title} className="glass-card p-6">
              <div className="w-11 h-11 rounded-xl bg-glass-panel border border-card-border flex items-center justify-center mb-4">
                <track.icon className="w-5 h-5 text-cyber-cyan" />
              </div>
              <h2 className="font-semibold text-foreground mb-2">{track.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{track.description}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-2 text-center">Apply to partner</h2>
          <p className="text-sm text-muted-foreground mb-8 text-center">
            Tell us a bit about your practice and we&apos;ll get back to you within a few business days.
          </p>
          <PartnerInquiryForm />
        </div>
      </div>
    </section>
  );
}
