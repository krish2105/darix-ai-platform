'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export const AuthNavLink = ({ className }: { className?: string }) => {
  // Lazy initializer (not a setState call inside the effect body) so the
  // "Supabase unconfigured" case never crashes the site-wide Navbar — it
  // just renders the logged-out "Log In" link and skips the effect below.
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(() =>
    isSupabaseConfigured() ? null : false
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsSignedIn(Boolean(data.user)));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (isSignedIn === null) return null;

  return (
    <Link
      href={isSignedIn ? '/dashboard' : '/login'}
      className={className ?? 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5'}
    >
      <User className="w-4 h-4" />
      {isSignedIn ? 'Dashboard' : 'Log In'}
    </Link>
  );
};
