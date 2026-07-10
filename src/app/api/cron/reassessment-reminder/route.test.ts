import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/email/resend', () => ({
  getResendClient: vi.fn(),
  isEmailConfigured: vi.fn(() => true),
  EMAIL_FROM: 'Darix AI <test@darix.ai>',
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getResendClient, isEmailConfigured } from '@/lib/email/resend';
import { GET } from './route';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString();

function makeAdminMock(opts: {
  assessments: { user_id: string; result: unknown; created_at: string }[];
  reminders?: { user_id: string; last_sent_at: string }[];
  users?: Record<string, string | null>;
}) {
  const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });

  const from = vi.fn((table: string) => {
    if (table === 'assessments') {
      const chain = {
        select: vi.fn(() => chain),
        not: vi.fn(() => chain),
        order: vi.fn(() => Promise.resolve({ data: opts.assessments, error: null })),
      };
      return chain;
    }
    if (table === 'reassessment_reminders') {
      const chain = {
        select: vi.fn(() => chain),
        in: vi.fn(() => Promise.resolve({ data: opts.reminders ?? [], error: null })),
        upsert: upsertMock,
      };
      return chain;
    }
    throw new Error(`unexpected table ${table}`);
  });

  const getUserById = vi.fn((userId: string) => {
    const email = opts.users?.[userId];
    return Promise.resolve(
      email
        ? { data: { user: { email } }, error: null }
        : { data: { user: null }, error: { message: 'not found' } }
    );
  });

  return { from, auth: { admin: { getUserById } }, upsertMock };
}

const makeRequest = (authHeader?: string) =>
  new NextRequest('http://localhost/api/cron/reassessment-reminder', {
    headers: authHeader ? { authorization: authHeader } : {},
  });

describe('GET /api/cron/reassessment-reminder', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    vi.mocked(isEmailConfigured).mockReturnValue(true);
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: vi.fn().mockResolvedValue({ error: null }) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it('returns 503 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeRequest());
    expect(res.status).toBe(503);
  });

  it('returns 401 for a missing or wrong bearer token', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 503 when email delivery is not configured', async () => {
    vi.mocked(isEmailConfigured).mockReturnValue(false);
    const res = await GET(makeRequest('Bearer test-secret'));
    expect(res.status).toBe(503);
  });

  it('sends a reminder to a user whose latest assessment is 90+ days old with no prior reminder', async () => {
    const mock = makeAdminMock({
      assessments: [
        { user_id: 'user-1', result: { score: 40, level: 'AI Starter' }, created_at: daysAgo(95) },
      ],
      reminders: [],
      users: { 'user-1': 'jane@example.com' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminSupabaseClient).mockReturnValue(mock as any);

    const res = await GET(makeRequest('Bearer test-secret'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ evaluated: 1, sent: 1, skipped: 0 });
    expect(mock.upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1' })
    );
  });

  it('does not evaluate a user whose latest assessment is recent', async () => {
    const mock = makeAdminMock({
      assessments: [
        { user_id: 'user-2', result: { score: 60, level: 'AI Builder' }, created_at: daysAgo(10) },
      ],
      users: { 'user-2': 'recent@example.com' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminSupabaseClient).mockReturnValue(mock as any);

    const res = await GET(makeRequest('Bearer test-secret'));
    const json = await res.json();
    expect(json).toEqual({ evaluated: 0, sent: 0, skipped: 0 });
  });

  it('skips a user still within the reminder cooldown', async () => {
    const mock = makeAdminMock({
      assessments: [
        { user_id: 'user-3', result: { score: 50, level: 'AI Starter' }, created_at: daysAgo(120) },
      ],
      reminders: [{ user_id: 'user-3', last_sent_at: daysAgo(10) }],
      users: { 'user-3': 'cooldown@example.com' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminSupabaseClient).mockReturnValue(mock as any);

    const res = await GET(makeRequest('Bearer test-secret'));
    const json = await res.json();
    expect(json).toEqual({ evaluated: 1, sent: 0, skipped: 1 });
    expect(mock.upsertMock).not.toHaveBeenCalled();
  });

  it('only reminds each user once even if they have multiple old assessments', async () => {
    const mock = makeAdminMock({
      assessments: [
        { user_id: 'user-4', result: { score: 70, level: 'AI Builder' }, created_at: daysAgo(91) },
        { user_id: 'user-4', result: { score: 40, level: 'AI Starter' }, created_at: daysAgo(200) },
      ],
      users: { 'user-4': 'multi@example.com' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminSupabaseClient).mockReturnValue(mock as any);

    const res = await GET(makeRequest('Bearer test-secret'));
    const json = await res.json();
    expect(json.evaluated).toBe(1);
  });
});
