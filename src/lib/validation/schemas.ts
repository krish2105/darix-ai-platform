import { z } from 'zod';
import { industries } from '@/data/industries';

// Answers come from the client as { [questionId]: 0-5 }. We don't require
// every question to be present here — calculateReadiness() already treats
// missing/unknown keys as 0 — but we do bound each value so a tampered
// request body can't inject out-of-range numbers before scoring.
export const answersSchema = z.record(z.string(), z.number().min(0).max(5));

export const companySizeOptions = ['1-50', '51-200', '201-500', '500+'] as const;

const industryIds = industries.map((i) => i.id) as [string, ...string[]];

export const createAssessmentSchema = z.object({
  answers: answersSchema,
  companyName: z.string().trim().max(200).optional(),
  contactName: z.string().trim().max(200).optional(),
  contactEmail: z.string().trim().email().max(320).optional().or(z.literal('')),
  // Both optional — the free assessment has always been usable without
  // either. When present, industry is validated against the known
  // industries list (src/data/industries.ts) rather than accepted as
  // free text, since it's used to look up personalized report content.
  industry: z.enum(industryIds).optional(),
  companySize: z.enum(companySizeOptions).optional(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

// Where the prospective customer's own entity is registered — not asked
// out of idle curiosity: UAE Federal PDPL, the DIFC Data Protection Law,
// and the ADGM Data Protection Regulations are three separate, non-
// overlapping regimes (see docs/ROPA.md §0). Surfacing this at intake lets
// the team apply the "mainland-only for now" policy documented there
// before a deal progresses, rather than discovering it after the fact.
// Optional: asking isn't a hard gate on submitting the form.
export const businessJurisdictionOptions = ['mainland', 'difc', 'adgm', 'other'] as const;

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(200),
  workEmail: z.string().trim().email('Enter a valid work email').max(320),
  companyName: z.string().trim().min(1, 'Company name is required').max(200),
  companySize: z.enum(companySizeOptions, {
    message: 'Select a company size',
  }),
  // Untouched native <select> submits "" (its placeholder option's value),
  // not undefined — .optional() alone rejects that. Same pattern as
  // createAssessmentSchema's contactEmail below.
  businessJurisdiction: z.enum(businessJurisdictionOptions).optional().or(z.literal('')),
  challenge: z.string().trim().min(10, 'Please provide a bit more detail (10+ characters)').max(4000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const emailReportSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(320),
});

// International format, digits only (no leading "+"), matching what Meta's
// WhatsApp Cloud API expects and what NEXT_PUBLIC_WHATSAPP_NUMBER already
// uses for the click-to-chat button — e.g. 971501234567. Accepts an
// optional leading "+" from user input and strips it before validation.
export const whatsappReportSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s-]/g, '').replace(/^\+/, ''))
    .pipe(z.string().regex(/^[1-9]\d{7,14}$/, 'Enter a valid phone number with country code')),
});

export const purchasableTiers = ['pro', 'business'] as const;

export const createCheckoutSchema = z.object({
  assessmentId: z.string().uuid('Invalid assessment id'),
  tier: z.enum(purchasableTiers),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

// Tabby (BNPL) is only offered for the Business Consultation tier — see
// src/lib/tabby/client.ts — so this doesn't take a `tier` param at all.
export const tabbyCheckoutSchema = z.object({
  assessmentId: z.string().uuid('Invalid assessment id'),
});

export type TabbyCheckoutInput = z.infer<typeof tabbyCheckoutSchema>;

export const dataRequestTypes = ['access', 'erasure'] as const;

export const dataRequestSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(200),
  email: z.string().trim().email('Enter a valid email').max(320),
  requestType: z.enum(dataRequestTypes, { message: 'Select a request type' }),
  details: z.string().trim().max(4000).optional(),
});

export type DataRequestInput = z.infer<typeof dataRequestSchema>;

export const leadStatusOptions = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;

export const updateLeadSchema = z.object({
  status: z.enum(leadStatusOptions).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const partnerTypes = ['consultancy', 'systems_integrator', 'referral', 'other'] as const;

export const partnerInquirySchema = z.object({
  organizationName: z.string().trim().min(1, 'Organization name is required').max(200),
  contactName: z.string().trim().min(2, 'Full name is required').max(200),
  contactEmail: z.string().trim().email('Enter a valid work email').max(320),
  partnerType: z.enum(partnerTypes, { message: 'Select a partner type' }),
  message: z.string().trim().max(4000).optional(),
});

export type PartnerInquiryInput = z.infer<typeof partnerInquirySchema>;

// 'never' means share_expires_at is cleared (no deadline) — see
// src/app/api/assessments/[id]/sharing/route.ts.
export const shareExpiryOptions = ['never', '1d', '7d', '30d'] as const;
export type ShareExpiryOption = (typeof shareExpiryOptions)[number];

export const updateSharingSchema = z.object({
  shareEnabled: z.boolean(),
  shareExpiry: z.enum(shareExpiryOptions),
  organizationShared: z.boolean(),
});

export type UpdateSharingInput = z.infer<typeof updateSharingSchema>;

export const inviteTeammateSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(320),
});

export type InviteTeammateInput = z.infer<typeof inviteTeammateSchema>;
