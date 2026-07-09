'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-glass-panel border border-card-border text-foreground hover:border-cyber-cyan/50 transition-colors"
      aria-label="Toggle theme"
    >
      <Sun className={`w-5 h-5 transition-all duration-300 ${isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
      <Moon className={`absolute w-5 h-5 transition-all duration-300 ${isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'}`} />
    </motion.button>
  );
}
