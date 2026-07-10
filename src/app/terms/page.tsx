import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms of Service | Darix AI',
  description: 'The terms governing your use of the Darix AI (Dubai AI Readiness Index) platform.',
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="10 July 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Darix AI (Dubai AI
        Readiness Index), operated from Dubai, United Arab Emirates (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;). By using the Service you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        Darix AI provides an AI-readiness self-assessment tool, generated reports, and related
        consultation services for businesses. The free assessment produces an automated,
        indicative score based on your self-reported answers — it is not professional advice.
      </p>

      <h2>2. Accounts</h2>
      <p>
        If you create an account, you are responsible for maintaining the confidentiality of your
        credentials and for all activity under your account. Notify us promptly of any
        unauthorized use.
      </p>

      <h2>3. Acceptable Use</h2>
      <ul>
        <li>Do not submit false, misleading, or another party&rsquo;s personal data without authorization.</li>
        <li>Do not attempt to abuse, overload, or circumvent rate limits or security controls on the Service.</li>
        <li>Do not use the Service for any unlawful purpose.</li>
      </ul>

      <h2>4. Paid Plans</h2>
      <p>
        Certain report tiers and consultation services are offered for a fee, priced in AED as
        shown on the Pricing page. Online checkout is not yet available for all tiers; where a
        &ldquo;Request This Plan&rdquo; button routes to our contact form, no payment obligation
        arises until we separately confirm pricing and payment terms with you. Once online payment
        is enabled, applicable refund and cancellation terms will be added here.
      </p>

      <h2>5. Intellectual Property</h2>
      <p>
        The assessment methodology, report design, and all Service content are owned by Darix AI
        or its licensors. Your assessment answers and the resulting report are yours to use for
        your own internal business purposes.
      </p>

      <h2>6. Disclaimer</h2>
      <p>
        The Service and any report it generates are provided &ldquo;as is&rdquo; without
        warranties of any kind. The AI readiness score is an indicative, automated assessment
        based on self-reported answers and does not constitute professional, financial, or legal
        advice. You should seek independent professional advice before making business decisions
        based on it.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by applicable law, Darix AI shall not be liable for any
        indirect, incidental, or consequential damages arising from your use of the Service.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the United Arab Emirates. Any dispute shall be
        subject to the exclusive jurisdiction of the competent courts of Dubai, without prejudice
        to any mandatory consumer-protection rules that may apply.
      </p>

      <h2>9. Changes to These Terms</h2>
      <p>We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.</p>

      <h2>10. Contact Us</h2>
      <p>
        Questions about these Terms? Contact us at <a href="mailto:hello@darix.ai">hello@darix.ai</a>.
      </p>
    </LegalPageLayout>
  );
}
