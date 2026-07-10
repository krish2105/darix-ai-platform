# Deployment Guide

## 1. Supabase (database + auth)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql`. This creates:
   - `public.assessments` — every completed quiz (answers, computed result, optional company/contact info, optional `user_id`).
   - `public.leads` — contact-form submissions.
   - Row Level Security policies (see comments in the migration file for the trust model behind each one).
3. In **Authentication > Providers**, email/password is enabled by default — that's all this app uses. If you want confirmation emails to go out from your own domain rather than Supabase's shared sender, configure SMTP under **Authentication > Email Templates**.
4. In **Authentication > URL Configuration**, add your deployed site URL and `http://localhost:3000` to the allowed redirect URLs (needed for `/auth/callback`).
5. Copy the values from **Project Settings > API** into your environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API > service_role — keep this secret, server-only)

## 2. Resend (email)

1. Create an account at [resend.com](https://resend.com) and verify a sending domain (or use their shared test domain during development).
2. Create an API key and set `RESEND_API_KEY`.
3. Set `EMAIL_FROM` to a verified address, e.g. `Darix AI <hello@darix.ai>`.
4. Optionally set `TEAM_ALERT_EMAIL` to the inbox that should receive a copy of every contact-form lead.

Until these are set, the app still works — the contact form and assessment flow save to the database regardless, and email sending is skipped gracefully (see `isEmailConfigured()` in `src/lib/email/resend.ts`).

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in every value described there. `NEXT_PUBLIC_SITE_URL` should be your production URL once deployed (used to build links inside emails).

## 4. Local development

```bash
npm install
npm run dev
```

Run the test suite and typecheck before pushing:

```bash
npm test
npx tsc --noEmit
npm run lint
```

## 5. Deploying to Vercel

1. Import the GitHub repository into Vercel.
2. Framework preset: Next.js (auto-detected).
3. Add every variable from `.env.example` under **Project Settings > Environment Variables** (for Production, Preview, and Development as appropriate).
4. Deploy. The PDF report route (`/api/assessments/[id]/pdf`) uses `@react-pdf/renderer`, which needs the Node.js runtime — this is already set via `export const runtime = 'nodejs'` in that route, so no extra Vercel configuration is required.
5. After the first deploy, update `NEXT_PUBLIC_SITE_URL` to the real domain and redeploy so report-link emails point to the right place.

## What's intentionally not wired up yet

- **Payments**: no gateway has been selected (Stripe AED / Telr / PayTabs were the candidates). The "Professional Report" and "Business Consultation" pricing tiers currently route to the contact form rather than a real checkout — see the note at the bottom of `.env.example`.
- **Admin view of leads**: leads are saved to `public.leads` but there's no UI to browse them yet — query the table directly in the Supabase dashboard for now.
- **SEO (sitemap, robots.txt, OG images, structured data), analytics, bot protection/CAPTCHA, Playwright E2E tests, and CI** are scoped for a later pass — see the master build-out prompt for the full phased plan.
