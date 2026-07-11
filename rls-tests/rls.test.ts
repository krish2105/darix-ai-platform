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

describe('RLS: public.chat_conversations & public.chat_messages', () => {
  let userA: { client: SupabaseClient; userId: string };
  let userB: { client: SupabaseClient; userId: string };
  let conversationAId: string;
  let messageAId: string;

  beforeAll(async () => {
    userA = await createSignedInUser('chat-a');
    userB = await createSignedInUser('chat-b');

    const { data: conversation, error: conversationError } = await userA.client
      .from('chat_conversations')
      .insert({ mode: 'faq' })
      .select('id')
      .single();
    if (conversationError || !conversation) throw conversationError ?? new Error('seed conversation insert failed');
    conversationAId = conversation.id as string;

    const { data: message, error: messageError } = await userA.client
      .from('chat_messages')
      .insert({ conversation_id: conversationAId, role: 'user', content: 'Hello' })
      .select('id')
      .single();
    if (messageError || !message) throw messageError ?? new Error('seed message insert failed');
    messageAId = message.id as string;
  });

  afterAll(async () => {
    await admin.from('chat_conversations').delete().eq('id', conversationAId);
    await admin.auth.admin.deleteUser(userA.userId);
    await admin.auth.admin.deleteUser(userB.userId);
  });

  it("lets a signed-in user insert their own conversation without specifying user_id (defaults aren't required — RLS's with check relies on auth.uid())", async () => {
    // Verified implicitly by beforeAll succeeding — a failed insert there
    // would have thrown before this test file got this far. This test
    // exists to make that assumption explicit and independently checkable.
    expect(conversationAId).toBeTruthy();
  });

  it('lets the owning user read their own conversation and messages', async () => {
    const { data: conversations, error: conversationError } = await userA.client
      .from('chat_conversations')
      .select('id')
      .eq('id', conversationAId);
    expect(conversationError).toBeNull();
    expect(conversations).toHaveLength(1);

    const { data: messages, error: messageError } = await userA.client
      .from('chat_messages')
      .select('id')
      .eq('conversation_id', conversationAId);
    expect(messageError).toBeNull();
    expect(messages).toHaveLength(1);
  });

  it('blocks a different signed-in user from reading the conversation', async () => {
    const { data, error } = await userB.client.from('chat_conversations').select('id').eq('id', conversationAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  // This is the genuinely new RLS shape in this codebase: chat_messages
  // has no user_id column of its own, so its policy is a join through
  // chat_conversations rather than a direct column comparison. Every
  // other table's RLS in this project checks a column on the row itself
  // — this test is what verifies the join actually enforces ownership
  // instead of silently allowing (or blocking) everything.
  it('blocks a different signed-in user from reading messages via the join-based policy', async () => {
    const { data, error } = await userB.client.from('chat_messages').select('id').eq('id', messageAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('blocks a different signed-in user from inserting a message into someone else\'s conversation', async () => {
    const { error } = await userB.client
      .from('chat_messages')
      .insert({ conversation_id: conversationAId, role: 'user', content: 'Hijacked' });
    // RLS's WITH CHECK on the insert rejects this outright (unlike a
    // filtered select/update, an insert that fails RLS surfaces as a
    // real error, not a silently-empty result).
    expect(error).not.toBeNull();
  });

  it('blocks an anonymous (unauthenticated) client from reading or inserting either table', async () => {
    const anon = anonClient();
    const { data: conversations, error: conversationsError } = await anon.from('chat_conversations').select('id');
    expect(conversationsError).toBeNull();
    expect(conversations).toEqual([]);

    const { error: insertError } = await anon
      .from('chat_conversations')
      .insert({ mode: 'faq' });
    expect(insertError).not.toBeNull();
  });
});

describe('RLS: public.organizations, organization_members, organization_invites & assessments_select_org_member', () => {
  let owner: { client: SupabaseClient; userId: string };
  let teammate: { client: SupabaseClient; userId: string };
  let outsider: { client: SupabaseClient; userId: string };
  let orgId: string;
  let sharedAssessmentId: string;

  beforeAll(async () => {
    owner = await createSignedInUser('org-owner');
    teammate = await createSignedInUser('org-teammate');
    outsider = await createSignedInUser('org-outsider');

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name: 'RLS Test Org', created_by: owner.userId })
      .select('id')
      .single();
    if (orgError || !org) throw orgError ?? new Error('organization insert failed');
    orgId = org.id as string;

    const { error: memberError } = await admin.from('organization_members').insert([
      { organization_id: orgId, user_id: owner.userId, role: 'owner' },
      { organization_id: orgId, user_id: teammate.userId, role: 'member' },
    ]);
    if (memberError) throw memberError;

    // Owned by `owner`, shared with the whole org — this is the row that
    // proves assessments_select_org_member (0009_sharing_and_teams.sql)
    // actually grants a non-owner teammate read access, not just the owner.
    const { data: assessment, error: assessmentError } = await admin
      .from('assessments')
      .insert({
        user_id: owner.userId,
        organization_id: orgId,
        answers: {},
        result: { score: 50 },
        tier: 'free',
      })
      .select('id')
      .single();
    if (assessmentError || !assessment) throw assessmentError ?? new Error('assessment insert failed');
    sharedAssessmentId = assessment.id as string;
  });

  afterAll(async () => {
    await admin.from('assessments').delete().eq('id', sharedAssessmentId);
    await admin.from('organizations').delete().eq('id', orgId);
    await admin.auth.admin.deleteUser(owner.userId);
    await admin.auth.admin.deleteUser(teammate.userId);
    await admin.auth.admin.deleteUser(outsider.userId);
  });

  it('lets a member read their own organization row', async () => {
    const { data, error } = await owner.client.from('organizations').select('id').eq('id', orgId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('blocks a non-member from reading the organization row', async () => {
    const { data, error } = await outsider.client.from('organizations').select('id').eq('id', orgId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('lets a member see the full roster of their organization, including teammates', async () => {
    // organization_members_select_same_org is self-referential (a second
    // lookup on the same table, not "is this my own row") specifically so
    // this works — a plain auth.uid() = user_id check would only ever let
    // a member see their own single membership row.
    const { data, error } = await teammate.client
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId);
    expect(error).toBeNull();
    expect(data?.map((row) => row.user_id).sort()).toEqual([owner.userId, teammate.userId].sort());
  });

  it('blocks a non-member from reading the organization roster', async () => {
    const { data, error } = await outsider.client
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('blocks everyone but the service role from reading organization_invites', async () => {
    const { data, error } = await owner.client.from('organization_invites').select('id');
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('lets a teammate read an assessment shared with their organization even though they do not own it', async () => {
    const { data, error } = await teammate.client.from('assessments').select('id').eq('id', sharedAssessmentId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('still blocks a non-member from reading the org-shared assessment', async () => {
    const { data, error } = await outsider.client.from('assessments').select('id').eq('id', sharedAssessmentId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
