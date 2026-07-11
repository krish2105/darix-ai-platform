import { vi } from 'vitest';

// A minimal stand-in for a Supabase PostgrestFilterBuilder chain: every
// chain method (.from/.select/.insert/.update/.delete/.eq/.order/.limit/.returns)
// returns itself, and the object is thenable so `await` resolves to the
// configured result whether or not the caller ends the chain with
// `.single()`. Good enough for exercising route-handler logic without a
// live database.
export function makeQueryBuilder<T>(result: { data: T | null; error: unknown }) {
  const builder: Record<string, unknown> = {};
  const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'order', 'limit', 'returns'];
  chainMethods.forEach((method) => {
    builder[method] = vi.fn(() => builder);
  });
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (
    onFulfilled?: (value: typeof result) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}
