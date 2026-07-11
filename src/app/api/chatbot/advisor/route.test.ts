import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/gemini/client', () => ({
  isGeminiConfigured: vi.fn(),
  streamGeminiChat: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isGeminiConfigured, streamGeminiChat } from '@/lib/gemini/client';
import { POST } from './route';

const ASSESSMENT_ID = '11111111-1111-4111-8111-111111111111';

const makeReplyStream = (text: string) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

const call = (body: Record<string, unknown>) =>
  POST(
    new NextRequest('http://localhost/api/chatbot/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );

const fakeResult = {
  score: 42,
  level: 'AI Builder',
  description: 'Good foundation.',
  strengths: ['Strategy is strong'],
  gaps: ['Governance needs work'],
  recommendedPilots: ['AI Assistant'],
  roadmap: [{ phase: 'Phase 1', timeline: 'Days 1-30', actions: ['Audit'] }],
  dimensionScores: [{ dimensionId: 'governance', score: 5, percentage: 33 }],
};

// makeQueryBuilder's returned object has its own `.then` (so a chain like
// `.eq(...).insert(...)` can be awaited directly without `.single()`) —
// spreading it straight onto the top-level session-client mock would make
// *that* object thenable too, which breaks `await createServerSupabaseClient()`
// in the real route: `await` unwraps any thenable, so it would resolve to
// whatever `.then()` produces (the raw query result) instead of the client
// object, silently dropping `.auth`. Stripped here since this route always
// ends its query chain in `.single()` (a real Promise), so the client mock
// itself never needs to be thenable.
const sessionClientMock = (user: { id: string } | null, queryResult: { data: unknown; error: unknown }) => {
  const builder: Record<string, unknown> = makeQueryBuilder(queryResult);
  delete builder.then;
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    ...builder,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
};

describe('POST /api/chatbot/advisor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not signed in', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } } as unknown as Awaited<
        ReturnType<typeof createServerSupabaseClient>
      >
    );
    const res = await call({ message: 'Why?', locale: 'en', assessmentId: ASSESSMENT_ID });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the assessment doesn't belong to the caller", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      sessionClientMock({ id: 'user-1' }, { data: null, error: { message: 'not found' } })
    );
    vi.mocked(isGeminiConfigured).mockReturnValue(true);

    const res = await call({ message: 'Why?', locale: 'en', assessmentId: ASSESSMENT_ID });
    expect(res.status).toBe(404);
  });

  it('returns 503 when Gemini is unconfigured', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      sessionClientMock({ id: 'user-1' }, { data: { result: fakeResult }, error: null })
    );
    vi.mocked(isGeminiConfigured).mockReturnValue(false);

    const res = await call({ message: 'Why?', locale: 'en', assessmentId: ASSESSMENT_ID });
    expect(res.status).toBe(503);
  });

  it("streams a reply grounded in the caller's own assessment result", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      sessionClientMock({ id: 'user-1' }, { data: { result: fakeResult }, error: null })
    );
    vi.mocked(isGeminiConfigured).mockReturnValue(true);
    vi.mocked(streamGeminiChat).mockResolvedValue(makeReplyStream('Governance needs work because...'));
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      makeQueryBuilder({ data: { id: 'conv-1' }, error: null }) as unknown as ReturnType<typeof createAdminSupabaseClient>
    );

    const res = await call({ message: 'Why is governance low?', locale: 'en', assessmentId: ASSESSMENT_ID });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('Governance needs work because...');
    expect(res.headers.get('X-Conversation-Id')).toBe('conv-1');
  });
});
