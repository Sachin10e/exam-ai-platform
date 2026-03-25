'use client';

import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional label shown in the error card, e.g. "Dashboard Analytics" */
  section?: string;
  /** If provided, render a compact inline card instead of the large centered block */
  compact?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console only — never expose raw errors in the UI
    console.error(`[ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ''}]`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { section, compact } = this.props;

      if (compact) {
        return (
          <div className="w-full h-full rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-200">
                {section ? `${section} failed to load` : 'Something went wrong'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">An unexpected error occurred. Try again or refresh the page.</p>
            </div>
            <button
              onClick={this.handleRetry}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        );
      }

      return (
        <div className="flex w-full h-full flex-col items-center justify-center p-12 text-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 shadow-lg shadow-rose-500/10">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">
            {section ? `${section} encountered an error` : 'Something went wrong'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            An unexpected error occurred while rendering this section. No data has been lost. You can try again or refresh the page.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleRetry}
              className="btn-primary"
            >
              <RefreshCcw className="w-4 h-4" /> Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
