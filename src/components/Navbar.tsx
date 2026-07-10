'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, BrainCircuit } from 'lucide-react';
import { Button, cn } from './Button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { AuthNavLink } from './AuthNavLink';
import { useLanguage } from '@/contexts/LanguageContext';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.assessment'), href: '#assessment' },
    { name: t('nav.dashboard'), href: '#dashboard' },
    { name: t('nav.framework'), href: '#framework' },
    { name: t('nav.industries'), href: '#industries' },
    { name: t('nav.pricing'), href: '#pricing' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-card-border py-4' : 'bg-transparent py-6'
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-blue to-ai-violet flex items-center justify-center shadow-lg shadow-electric-blue/20 group-hover:shadow-electric-blue/40 transition-all">
              <BrainCircuit className="text-foreground w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl tracking-wide leading-none text-foreground">DARIX AI</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-semibold">Dubai AI Readiness</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyber-cyan transition-all group-hover:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4 border-l border-card-border pl-8">
              <ThemeToggle />
              <LanguageToggle />
              <AuthNavLink />
              <Button variant="primary" size="sm" onClick={() => document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('nav.startAssessment')}
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-foreground p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-3xl border-b border-card-border overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-foreground py-2 border-b border-card-border"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-center gap-3">
                  <ThemeToggle />
                  <LanguageToggle />
                </div>
                <AuthNavLink className="text-lg font-medium text-foreground py-2 flex items-center gap-2 justify-center" />
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {t('nav.viewDemoReport')}
                </Button>
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {t('nav.startAssessmentMobile')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
