'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export const AuthNavLink = ({ className }: { className?: string }) => {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
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
