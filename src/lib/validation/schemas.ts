import { z } from 'zod';

// Answers come from the client as { [questionId]: 0-5 }. We don't require
// every question to be present here — calculateReadiness() already treats
// missing/unknown keys as 0 — but we do bound each value so a tampered
// request body can't inject out-of-range numbers before scoring.
export const answersSchema = z.record(z.string(), z.number().min(0).max(5));

export const createAssessmentSchema = z.object({
  answers: answersSchema,
  companyName: z.string().trim().max(200).optional(),
  contactName: z.string().trim().max(200).optional(),
  contactEmail: z.string().trim().email().max(320).optional().or(z.literal('')),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export const companySizeOptions = ['1-50', '51-200', '201-500', '500+'] as const;

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(200),
  workEmail: z.string().trim().email('Enter a valid work email').max(320),
  companyName: z.string().trim().min(1, 'Company name is required').max(200),
  companySize: z.enum(companySizeOptions, {
    message: 'Select a company size',
  }),
  challenge: z.string().trim().min(10, 'Please provide a bit more detail (10+ characters)').max(4000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const emailReportSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(320),
});
