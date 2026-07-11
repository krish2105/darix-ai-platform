import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/LegalPageLayout';
import { defaultLocale, isLocale } from '@/lib/i18n/translations';
import { localeAlternates, localePath } from '@/lib/i18n/paths';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return {
    title: 'Privacy Policy | Darix AI',
    description: 'How Darix AI (Dubai AI Readiness Index) collects, uses, and protects your data.',
    alternates: localeAlternates(locale, '/privacy'),
  };
}

interface PrivacyPolicyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPolicyPage({ params }: PrivacyPolicyPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="10 July 2026">
      <p>
        Darix AI (&ldquo;Darix AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the Dubai AI
        Readiness Index assessment platform at this website (the &ldquo;Service&rdquo;). This
        policy explains what personal data we collect, why, and the choices you have.
      </p>

      <h2>1. Data We Collect</h2>
      <ul>
        <li>
          <strong>Assessment data:</strong> your answers to the AI Readiness Assessment, the
          computed score/report, and — if you provide them — your company name and contact email.
        </li>
        <li>
          <strong>Contact form data:</strong> full name, work email, company name, company size,
          and the AI challenge you describe, when you submit the contact form.
        </li>
        <li>
          <strong>Account data:</strong> your email address and authentication credentials, if you
          create an account to save assessment history.
        </li>
        <li>
          <strong>Technical data:</strong> IP address and basic request metadata, collected
          automatically for security and abuse-prevention purposes (e.g. rate limiting).
        </li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>To calculate and deliver your AI readiness score and report (including as a PDF).</li>
        <li>To respond to consultation requests submitted via the contact form.</li>
        <li>To send transactional emails: report delivery, lead confirmation, and (once payments are enabled) purchase receipts.</li>
        <li>To maintain and secure the Service, including preventing abuse of public forms.</li>
      </ul>

      <h2>3. Legal Basis for Processing</h2>
      <p>
        Under the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021), we process
        your data on the basis of your consent (submitting the assessment or contact form),
        performance of a contract (delivering an account or paid report you requested), and our
        legitimate interest in operating and securing the Service.
      </p>

      <h2>4. Data Sharing &amp; Processors</h2>
      <p>
        We share personal data with the service providers listed on our{' '}
        <Link href={localePath(locale, '/sub-processors')}>Sub-Processors</Link> page, solely to operate the Service.
        None of them fall into a UAE PDPL sector with a mandatory data-localization requirement
        (financial services, healthcare, telecommunications, or government); this determination,
        like the rest of this policy, should be confirmed as part of a full legal review.
      </p>
      <p>
        These providers may process or store data outside the UAE. We take reasonable steps to
        ensure they maintain appropriate safeguards — encryption in transit and at rest, and
        standard contractual terms available on request — but a full cross-border transfer
        assessment and Records of Processing Activities should be completed as part of the legal
        review of this policy.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        Assessment and lead data is retained for as long as needed to provide the Service and for
        a reasonable period afterward for record-keeping, unless you request deletion sooner.
      </p>

      <h2>6. Your Rights</h2>
      <p>Subject to applicable law, you may request to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>Request deletion of your data.</li>
        <li>Withdraw consent, where processing is based on consent.</li>
      </ul>
      <p>
        To exercise these rights, visit our <Link href={localePath(locale, '/privacy-center')}>Privacy Center</Link>. If
        you have an account, you can download or delete your data instantly; otherwise you can
        submit a request there and we&apos;ll respond within 30 days.
      </p>

      <h2>7. Security</h2>
      <p>
        We use industry-standard measures (encrypted connections, access controls, and
        least-privilege service credentials) to protect your data, but no system is completely
        secure. Please contact us immediately if you suspect a security issue.
      </p>

      <h2>8. Children</h2>
      <p>The Service is intended for business use and is not directed at individuals under 18.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this policy from time to time. Material changes will be reflected by updating the &ldquo;Last updated&rdquo; date above.</p>

      <h2>10. Contact Us</h2>
      <p>
        For privacy questions or to exercise your rights, contact us at{' '}
        <a href="mailto:hello@darix.ai">hello@darix.ai</a>.
      </p>
    </LegalPageLayout>
  );
}
