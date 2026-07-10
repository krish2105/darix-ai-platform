#!/usr/bin/env bash
# Runs the Row Level Security regression suite (rls-tests/) against a real,
# throwaway local Supabase stack — not the mocked client every other test
# uses. Requires Docker. See rls-tests/rls.test.ts for what this actually
# verifies and why it exists as a separate suite from `npm test`.
set -euo pipefail

cleanup() {
  npx supabase stop >/dev/null 2>&1 || true
}
trap cleanup EXIT

npx supabase start

# Guarantee a schema that exactly matches supabase/migrations/, independent
# of whatever state a previous local run left behind.
npx supabase db reset

STATUS_ENV="$(npx supabase status -o env 2>/dev/null)"

extract() {
  echo "$STATUS_ENV" | grep "^$1=" | head -n1 | cut -d'=' -f2- | tr -d '"'
}

export SUPABASE_LOCAL_API_URL
export SUPABASE_LOCAL_ANON_KEY
export SUPABASE_LOCAL_SERVICE_ROLE_KEY
SUPABASE_LOCAL_API_URL="$(extract API_URL)"
SUPABASE_LOCAL_ANON_KEY="$(extract ANON_KEY)"
SUPABASE_LOCAL_SERVICE_ROLE_KEY="$(extract SERVICE_ROLE_KEY)"

if [[ -z "$SUPABASE_LOCAL_API_URL" || -z "$SUPABASE_LOCAL_ANON_KEY" || -z "$SUPABASE_LOCAL_SERVICE_ROLE_KEY" ]]; then
  echo "Could not parse 'supabase status -o env' output. Raw output was:" >&2
  echo "$STATUS_ENV" >&2
  exit 1
fi

npx vitest run --config vitest.rls.config.ts
