'use client';

import React from 'react';
import { MotionConfig } from 'framer-motion';

// reducedMotion="user" makes every framer-motion animation in the app
// automatically respect the OS-level prefers-reduced-motion setting
// (WCAG 2.3.3 territory, and standard courtesy for vestibular-motion
// sensitivity) — animations still run their state changes instantly
// instead of transitioning, rather than being deleted outright.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
