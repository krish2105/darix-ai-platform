import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <section className="py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-3">{title}</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

          <div className="glass-card p-5 mb-10 flex items-start gap-3 border-t-2 border-t-warning-amber">
            <AlertTriangle className="w-5 h-5 text-warning-amber flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 leading-relaxed">
              <strong>Draft — requires legal review.</strong> This document was drafted to give a
              reasonable starting structure aligned with the UAE Personal Data Protection Law
              (Federal Decree-Law No. 45 of 2021) and is not final legal advice. Have a
              UAE-qualified lawyer review and approve it before relying on it in production.
            </p>
          </div>

          <div className="prose-legal space-y-8 text-foreground/90 leading-relaxed [&_h2]:text-xl [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:mb-4 [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-4 [&_a]:text-[#0E7490] [&_a]:dark:text-cyber-cyan [&_a]:hover:text-electric-blue [&_a]:underline [&_a]:underline-offset-2">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};
