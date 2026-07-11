// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { dimensions } from '@/data/questions';
import { translate } from '@/lib/i18n/translations';
import { calculateReadiness } from '@/utils/scoring';
import { ASSESSMENT_DRAFT_KEY } from '@/lib/storage-keys';
import { ReadinessAssessment } from './ReadinessAssessment';

// LanguageProvider derives locale from the URL and calls next/navigation's
// router/pathname hooks unconditionally — needs mocking for every render.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// SectionTitle (rendered by ReadinessAssessment) uses framer-motion's
// whileInView, which needs a real IntersectionObserver — jsdom doesn't
// implement one, so a minimal stub is required for the tree to mount.
// Assigned directly (not via vi.stubGlobal) so it survives the
// vi.unstubAllGlobals() call in afterEach below — this stub needs to stay
// in place for every test in this file, not just one.
class IntersectionObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [];
}
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IntersectionObserverStub;

const ASSESSMENT_ID = '22222222-2222-4222-8222-222222222222';

// A handful of mid-range answers is enough to produce a real, fully-formed
// ReadinessResult via the actual scoring logic (mirrors ScoreDashboard.test.tsx).
const result = calculateReadiness({ q1: 3, q2: 2, q3: 4, q4: 1, q5: 3 });

const renderAssessment = () =>
  render(
    <LanguageProvider locale="en">
      <ReadinessAssessment />
    </LanguageProvider>
  );

// Each question renders as "<n>. <question text>" split across sibling text
// nodes within the same <p>, so an exact string match against getByText
// would fail — match the question text as a substring instead.
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const questionTextMatcher = (id: string) => new RegExp(escapeRegExp(translate('en', `q.${id}`)));

// Clicks an answer for every question in the given dimension.
const answerDimension = async (user: ReturnType<typeof userEvent.setup>, dimIndex: number, value = 3) => {
  const dim = dimensions[dimIndex];
  for (const q of dim.questions) {
    // AnimatePresence mode="wait" keeps the outgoing dimension mounted
    // during its exit transition, so the incoming dimension's answer
    // buttons aren't in the DOM instantly after "Next Dimension" —
    // findByTestId polls until framer-motion finishes swapping content.
    await user.click(await screen.findByTestId(`answer-${q.id}-${value}`));
  }
};

describe('ReadinessAssessment', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // The component now persists an in-progress draft to localStorage —
    // without clearing it, one test's answers would bleed into the next
    // test's initial render as a "restored" draft.
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the first dimension's questions", () => {
    renderAssessment();

    expect(screen.getByText('AI Strategy')).toBeInTheDocument();
    for (const q of dimensions[0].questions) {
      // The rendered question text comes from the `q.<id>` translation key
      // (not dimensions[].text, which is unused by the component) — assert
      // against the same source the component reads from.
      expect(screen.getByText(questionTextMatcher(q.id))).toBeInTheDocument();
      expect(screen.getByTestId(`answer-${q.id}-0`)).toBeInTheDocument();
    }
    // Second dimension's content shouldn't be on screen yet.
    expect(screen.queryByText('Data Maturity')).not.toBeInTheDocument();
  });

  it('disables "Next Dimension" until every question in the dimension is answered', async () => {
    const user = userEvent.setup();
    renderAssessment();

    const nextButton = screen.getByTestId('assessment-next-button');
    expect(nextButton).toBeDisabled();

    const [q1, q2, q3] = dimensions[0].questions;
    await user.click(screen.getByTestId(`answer-${q1.id}-3`));
    await user.click(screen.getByTestId(`answer-${q2.id}-3`));
    expect(nextButton).toBeDisabled();

    await user.click(screen.getByTestId(`answer-${q3.id}-3`));
    expect(nextButton).not.toBeDisabled();
  });

  it('advances to the next dimension after answering every question and clicking "Next Dimension"', async () => {
    const user = userEvent.setup();
    renderAssessment();

    await answerDimension(user, 0);
    await user.click(screen.getByTestId('assessment-next-button'));

    expect(await screen.findByText('Data Maturity')).toBeInTheDocument();
    expect(screen.queryByText('AI Strategy')).not.toBeInTheDocument();
  });

  it('submits all answers to /api/assessments and renders the results dashboard on completion', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: ASSESSMENT_ID, result }), { status: 200 })
    );
    renderAssessment();

    for (let i = 0; i < dimensions.length; i++) {
      await answerDimension(user, i);
      await user.click(screen.getByTestId('assessment-next-button'));
    }

    await waitFor(() => expect(screen.getByText('Your AI Readiness Command Center')).toBeInTheDocument());

    expect(fetch).toHaveBeenCalledWith(
      '/api/assessments',
      expect.objectContaining({ method: 'POST' })
    );
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(Object.keys(body.answers).length).toBe(24);
  });

  it('shows a save error and lets the user retry without crashing on the optional industry/company-size selects', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: 'nope' }), { status: 500 }));
    renderAssessment();

    for (let i = 0; i < dimensions.length; i++) {
      await answerDimension(user, i);
      if (i < dimensions.length - 1) {
        await user.click(screen.getByTestId('assessment-next-button'));
      }
    }

    // Final screen also renders the optional industry/company-size selects —
    // they should just sit there without breaking anything.
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company size/i)).toBeInTheDocument();

    await user.click(screen.getByTestId('assessment-next-button'));

    await waitFor(() =>
      expect(
        screen.getByText('We could not save your assessment. Please check your connection and try again.')
      ).toBeInTheDocument()
    );
  });

  it('clears the saved draft after a successful submit', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: ASSESSMENT_ID, result }), { status: 200 })
    );
    renderAssessment();

    for (let i = 0; i < dimensions.length; i++) {
      await answerDimension(user, i);
      await user.click(screen.getByTestId('assessment-next-button'));
    }

    await waitFor(() => expect(screen.getByText('Your AI Readiness Command Center')).toBeInTheDocument());
    expect(window.localStorage.getItem(ASSESSMENT_DRAFT_KEY)).toBeNull();
  });

  it('restores an in-progress draft on mount and shows a restored banner', async () => {
    const [q1] = dimensions[0].questions;
    window.localStorage.setItem(
      ASSESSMENT_DRAFT_KEY,
      JSON.stringify({ answers: { [q1.id]: 4 }, currentDimIndex: 0, industry: '', companySize: '' })
    );

    renderAssessment();

    expect(await screen.findByText(/restored your in-progress assessment/i)).toBeInTheDocument();
    expect(screen.getByTestId(`answer-${q1.id}-4`)).toHaveClass('bg-cyber-cyan/20');
  });

  it('clears the draft and restarts from scratch when "Start over" is clicked', async () => {
    const user = userEvent.setup();
    const [q1] = dimensions[0].questions;
    window.localStorage.setItem(
      ASSESSMENT_DRAFT_KEY,
      JSON.stringify({ answers: { [q1.id]: 4 }, currentDimIndex: 0, industry: '', companySize: '' })
    );

    renderAssessment();
    await screen.findByText(/restored your in-progress assessment/i);

    await user.click(screen.getByRole('button', { name: 'Start over' }));

    expect(window.localStorage.getItem(ASSESSMENT_DRAFT_KEY)).toBeNull();
    expect(screen.queryByText(/restored your in-progress assessment/i)).not.toBeInTheDocument();
    expect(screen.getByTestId(`answer-${q1.id}-3`)).not.toHaveClass('bg-cyber-cyan/20');
  });
});
