import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Sub-Processors | Darix AI',
  description: 'Every third-party service that processes personal data on behalf of Darix AI, what it does, and where it runs.',
};

interface SubProcessor {
  name: string;
  purpose: string;
  dataCategories: string;
  location: string;
}

const subProcessors: SubProcessor[] = [
  {
    name: 'Supabase',
    purpose: 'Database, authentication, and file storage for assessments, leads, and accounts.',
    dataCategories: 'Assessment answers/results, account emails, lead details, PDPL request records',
    location: 'AWS infrastructure outside the UAE (project region configurable in Supabase)',
  },
  {
    name: 'Vercel',
    purpose: 'Application hosting and edge network.',
    dataCategories: 'Request metadata (IP address, headers) in transit; no data stored at rest beyond logs',
    location: 'Global edge network outside the UAE',
  },
  {
    name: 'Resend',
    purpose: 'Transactional email delivery (report links, lead confirmations, receipts).',
    dataCategories: 'Recipient email address, name, and email content',
    location: 'Outside the UAE',
  },
  {
    name: 'Stripe',
    purpose: 'Payment processing for Professional/Business tier upgrades.',
    dataCategories: 'Payment card data (handled entirely by Stripe, never touches Darix servers), billing email',
    location: 'Outside the UAE; PCI DSS Level 1 certified',
  },
  {
    name: 'Telr',
    purpose: 'UAE-local payment processing alternative to Stripe.',
    dataCategories: 'Payment card data (handled entirely by Telr), billing email',
    location: 'UAE-focused payment infrastructure',
  },
  {
    name: 'PostHog',
    purpose: 'Product analytics (funnel events, feature usage).',
    dataCategories: 'Anonymized/pseudonymous usage events; no payment or full assessment content',
    location: 'Configurable (US or EU hosting)',
  },
  {
    name: 'Cloudflare (Turnstile)',
    purpose: 'Bot protection on public forms.',
    dataCategories: 'IP address, browser fingerprint signals — used only for a pass/fail verification result',
    location: 'Global edge network',
  },
  {
    name: 'Sentry',
    purpose: 'Error monitoring and diagnostics.',
    dataCategories: 'Error stack traces, request context; configured to avoid capturing form field values',
    location: 'Outside the UAE',
  },
  {
    name: 'Upstash',
    purpose: 'Distributed rate limiting for public API routes.',
    dataCategories: 'IP address and request counts only, short-lived (60-second windows)',
    location: 'Configurable region',
  },
];

export default function SubProcessorsPage() {
  return (
    <LegalPageLayout title="Sub-Processors" lastUpdated="10 July 2026">
      <p>
        Darix AI uses the third-party services listed below to operate the platform. Each one
        processes a limited category of personal data strictly to perform the function described —
        none of them are permitted to use Darix AI data for their own purposes.
      </p>
      <p>
        None of these fall into a UAE PDPL sector with a mandatory data-localization requirement
        (financial services, healthcare, telecommunications, or government) as of this writing.
        For a service processing personal data outside the UAE, PDPL requires appropriate
        safeguards rather than in-country hosting — each provider below publishes its own standard
        contractual terms (Stripe, Resend, Supabase, Sentry, and PostHog all offer a Data Processing
        Addendum on request) and uses encryption in transit and at rest. This page, and the
        safeguards it describes, should be reviewed by a UAE-qualified lawyer alongside the Privacy
        Policy — see the note on that page.
      </p>

      <h2>Current sub-processors</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px 8px 0', borderBottom: '1px solid var(--card-border)' }}>Provider</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--card-border)' }}>Purpose</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--card-border)' }}>Data categories</th>
            <th style={{ textAlign: 'left', padding: '8px 0 8px 12px', borderBottom: '1px solid var(--card-border)' }}>Location</th>
          </tr>
        </thead>
        <tbody>
          {subProcessors.map((sp) => (
            <tr key={sp.name}>
              <td style={{ padding: '10px 12px 10px 0', borderBottom: '1px solid var(--card-border)', fontWeight: 600, color: 'var(--foreground)' }}>{sp.name}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--card-border)' }}>{sp.purpose}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--card-border)' }}>{sp.dataCategories}</td>
              <td style={{ padding: '10px 0 10px 12px', borderBottom: '1px solid var(--card-border)' }}>{sp.location}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Changes to this list</h2>
      <p>
        We&apos;ll update this page whenever a new sub-processor is added or removed. For material
        additions, we&apos;ll also update the &ldquo;Last updated&rdquo; date on the Privacy Policy.
      </p>

      <h2>Questions</h2>
      <p>
        Contact <a href="mailto:hello@darix.ai">hello@darix.ai</a> for a copy of any sub-processor&apos;s
        Data Processing Addendum, or to ask about a specific data flow.
      </p>
    </LegalPageLayout>
  );
}
