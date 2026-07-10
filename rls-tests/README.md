# RLS regression tests

Verifies the actual Row Level Security policies in `supabase/migrations/`
against a real local Postgres/PostgREST instance, not a mock. Every other
Supabase-touching test in this repo mocks `createAdminSupabaseClient`/
`createClient` (see `src/test/supabase-mock.ts`), which is fast and fine for
testing route-handler logic, but can never catch a broken, missing, or
regressed RLS policy — the mock has no concept of "which role can see which
row." This suite is that missing check.

## Running

```bash
npm run test:rls
```

This requires Docker. It starts the Supabase CLI's local stack
(`supabase start`), applies every migration to a throwaway database
(`supabase db reset`), runs the tests, then tears the stack down
(`supabase stop`) whether the tests pass or fail.

Do not run `vitest run --config vitest.rls.config.ts` directly — the tests
expect `SUPABASE_LOCAL_API_URL` / `SUPABASE_LOCAL_ANON_KEY` /
`SUPABASE_LOCAL_SERVICE_ROLE_KEY` to already be exported, which only
`npm run test:rls` (via `scripts/run-rls-tests.sh`) does.

## Why it's separate from `npm test`

`npm test` (Vitest against `src/**/*.test.ts`) runs on every save and in
every CI job — it needs to stay fast and infra-free. This suite needs
Docker and takes tens of seconds to spin up a database, so it's its own
command and its own CI job (`.github/workflows/ci.yml`, `rls` job),
matching the existing `test:e2e` (Playwright) split.

## Adding a table

When a new migration adds a table with RLS policies, add a `describe`
block here exercising the actual access pattern the policy is meant to
enforce — not just "insert succeeds," but the negative case: the specific
user/role the policy is supposed to block, and an assertion that they
really are blocked (empty result set, not just "different from the
expected row").
