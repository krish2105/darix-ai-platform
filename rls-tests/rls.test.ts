import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Exercises the *real* Row Level Security policies in supabase/migrations
// against a real local Postgres/PostgREST instance (via the Supabase CLI's
// Docker stack) — unlike every other Supabase-touching test in this repo,
// which mocks the client entirely (src/test/supabase-mock.ts) and therefore
// cannot catch a broken or missing RLS policy. This is the test that would
// have caught the class of bug this session found and fixed in application
// code (an unguarded client crashing the page), applied instead to data
// access: "can user B read/edit user A's row." Run via `npm run test:rls`,
// which starts/stops the local stack — running this file directly with
// `vitest` will fail fast with a clear message if that hasn't happened.
const API_URL = process.env.SUPABASE_LOCAL_API_URL;
const ANON_KEY = process.env.SUPABASE_LOCAL_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY;

if (!API_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error(
    'RLS tests need a running local Supabase stack. Run `npm run test:rls` ' +
      '(not `vitest run --config vitest.rls.config.ts` directly) — it starts ' +
      'the Supabase CLI Docker stack, exports SUPABASE_LOCAL_* env vars, runs ' +
      'these tests, then tears the stack down.'
  );
}

const admin = createClient(API_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anonClient = () => createClient(API_URL!, ANON_KEY!, { auth: { persistSession: false } });

const PASSWORD = 'Rls-Test-Password-123!';
const randomEmail = (label: string) =>
  `rls-test-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

async function createSignedInUser(label: string) {
  const email = randomEmail(label);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('createUser failed');

  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInError) throw signInError;

  return { client, userId: data.user.id };
}

describe('RLS: public.assessments', () => {
  let userA: { client: SupabaseClient; userId: string };
  let userB: { client: SupabaseClient; userId: string };
  let assessmentAId: string;
  const seededIds: string[] = [];

  beforeAll(async () => {
    userA = await createSignedInUser('assessments-a');
    userB = await createSignedInUser('assessments-b');

    const { data, error } = await admin
      .from('assessments')
      .insert({
        user_id: userA.userId,
        company_name: 'RLS Test Co',
        answers: {},
        result: { score: 42 },
        tier: 'free',
      })
      .select('id')
      .single();
    if (error || !data) throw error ?? new Error('seed insert failed');
    assessmentAId = data.id as string;
    seededIds.push(assessmentAId);
  });

  afterAll(async () => {
    await admin.from('assessments').delete().in('id', seededIds);
    await admin.auth.admin.deleteUser(userA.userId);
    await admin.auth.admin.deleteUser(userB.userId);
  });

  it('lets the owning user read their own assessment', async () => {
    const { data, error } = await userA.client.from('assessments').select('id').eq('id', assessmentAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('blocks a different signed-in user from reading it by id', async () => {
    const { data, error } = await userB.client.from('assessments').select('id').eq('id', assessmentAId);
    // RLS filters non-matching rows out of the result set silently — it
    // does not surface as a permission error. Asserting an empty array (not
    // just "not equal to the real row") is the actual security guarantee.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('blocks a different signed-in user from finding it via an unfiltered select', async () => {
    const { data, error } = await userB.client.from('assessments').select('id');
    expect(error).toBeNull();
    expect(data?.some((row) => row.id === assessmentAId)).toBe(false);
  });

  it('blocks an anonymous (unauthenticated) client entirely', async () => {
    const { data, error } = await anonClient().from('assessments').select('id').eq('id', assessmentAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('blocks a different signed-in user from updating it', async () => {
    const { error } = await userB.client
      .from('assessments')
      .update({ company_name: 'Hijacked' })
      .eq('id', assessmentAId);
    // Same silent-filter behavior as select: the UPDATE's USING clause
    // excludes the row, so PostgREST reports 0 rows affected, not an error.
    expect(error).toBeNull();

    const { data } = await admin.from('assessments').select('company_name').eq('id', assessmentAId).single();
    expect(data?.company_name).toBe('RLS Test Co');
  });

  it('lets anyone, including anonymous visitors, insert a new assessment', async () => {
    const { data, error } = await anonClient()
      .from('assessments')
      .insert({ answers: {}, result: { score: 10 }, tier: 'free' })
      .select('id')
      .single();
    expect(error).toBeNull();
    if (data) seededIds.push(data.id as string);
  });
});

describe('RLS: public.leads', () => {
  it('allows anonymous insert but blocks all reads', async () => {
    const client = anonClient();
    const email = randomEmail('lead');
    const { error: insertError } = await client.from('leads').insert({
      full_name: 'RLS Test Lead',
      work_email: email,
      company_name: 'RLS Test Co',
      company_size: '1-10',
      challenge: 'Testing RLS',
    });
    expect(insertError).toBeNull();

    const { data, error } = await client.from('leads').select('id').eq('work_email', email);
    expect(error).toBeNull();
    expect(data).toEqual([]);

    await admin.from('leads').delete().eq('work_email', email);
  });
});

describe('RLS: public.data_requests', () => {
  it('allows anonymous insert but blocks all reads', async () => {
    const client = anonClient();
    const email = randomEmail('data-request');
    const { error: insertError } = await client.from('data_requests').insert({
      request_type: 'access',
      full_name: 'RLS Test Requester',
      email,
    });
    expect(insertError).toBeNull();

    const { data, error } = await client.from('data_requests').select('id').eq('email', email);
    expect(error).toBeNull();
    expect(data).toEqual([]);

    await admin.from('data_requests').delete().eq('email', email);
  });
});
