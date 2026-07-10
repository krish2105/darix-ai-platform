// Comma-separated allowlist of emails permitted to view /admin. Reuses the
// Supabase auth already in place rather than a separate password system —
// intentionally simple for MVP internal use.
export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
};
