'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Label shown in the fallback UI, e.g. "the assessment" — used in "Something went wrong loading {label}." */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Class components are the only way to implement a React error boundary —
// wraps a section of the page (e.g. the assessment or contact form) so a
// render error there shows a scoped fallback instead of blanking the
// entire homepage.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error${this.props.label ? ` in ${this.props.label}` : ''}`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="glass-card max-w-lg mx-auto p-10 text-center">
              <AlertTriangle className="w-10 h-10 text-risk-red mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
              <p className="text-muted-foreground text-sm mb-6">
                {this.props.label ? `We hit an error loading ${this.props.label}.` : 'We hit an unexpected error.'} Please try again.
              </p>
              <Button variant="outline" onClick={this.handleRetry} icon={<RefreshCw className="w-4 h-4" />}>
                Try Again
              </Button>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
