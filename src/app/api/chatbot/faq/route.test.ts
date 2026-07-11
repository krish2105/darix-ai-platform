import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/turnstile/verify', () => ({
  verifyTurnstileToken: vi.fn(),
}));
vi.mock('@/lib/gemini/client', () => ({
  isGeminiConfigured: vi.fn(),
  getGeminiEmbedding: vi.fn(),
  streamGeminiChat: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';
import { isGeminiConfigured, getGeminiEmbedding, streamGeminiChat } from '@/lib/gemini/client';
import { POST } from './route';

const anonymousSession = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } };
const signedInSession = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
};

const makeReplyStream = (text: string) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

const call = (body: Record<string, unknown>, ip = `10.1.1.${Math.floor(Math.random() * 1000)}`) =>
  POST(
    new NextRequest('http://localhost/api/chatbot/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    })
  );

describe('POST /api/chatbot/faq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an invalid body', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(anonymousSession as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>);
    const res = await call({ message: '' });
    expect(res.status).toBe(400);
  });

  it('requires Turnstile verification for an anonymous first message', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(anonymousSession as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>);
    vi.mocked(verifyTurnstileToken).mockResolvedValue(false);

    const res = await call({ message: 'Hello', locale: 'en', isFirstMessage: true });
    expect(res.status).toBe(403);
  });

  it('skips Turnstile for signed-in users', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(signedInSession as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>);
    vi.mocked(isGeminiConfigured).mockReturnValue(true);
    vi.mocked(getGeminiEmbedding).mockResolvedValue([0.1, 0.2]);
    vi.mocked(streamGeminiChat).mockResolvedValue(makeReplyStream('Hi there'));
    vi.mocked(createAdminSupabaseClient).mockReturnValue({
      ...makeQueryBuilder({ data: { id: 'conv-1' }, error: null }),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const res = await call({ message: 'Hello', locale: 'en', isFirstMessage: true });
    expect(verifyTurnstileToken).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('returns 503 without calling Gemini when unconfigured', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(anonymousSession as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>);
    vi.mocked(verifyTurnstileToken).mockResolvedValue(true);
    vi.mocked(isGeminiConfigured).mockReturnValue(false);

    const res = await call({ message: 'Hello', locale: 'en', isFirstMessage: true });
    expect(res.status).toBe(503);
    expect(getGeminiEmbedding).not.toHaveBeenCalled();
  });

  it('streams the reply body for an anonymous, verified visitor', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(anonymousSession as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>);
    vi.mocked(verifyTurnstileToken).mockResolvedValue(true);
    vi.mocked(isGeminiConfigured).mockReturnValue(true);
    vi.mocked(getGeminiEmbedding).mockResolvedValue([0.1, 0.2]);
    vi.mocked(streamGeminiChat).mockResolvedValue(makeReplyStream('Darix AI has a free tier.'));
    vi.mocked(createAdminSupabaseClient).mockReturnValue({
      ...makeQueryBuilder({ data: [{ title: 'Pricing', content: 'Darix AI has a free tier.' }], error: null }),
      rpc: vi.fn().mockResolvedValue({ data: [{ title: 'Pricing', content: 'Darix AI has a free tier.' }], error: null }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const res = await call({ message: 'What does it cost?', locale: 'en', isFirstMessage: true });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('Darix AI has a free tier.');
    // Anonymous visitors never get a conversation id — nothing is persisted.
    expect(res.headers.get('X-Conversation-Id')).toBeNull();
  });
});
