'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Route Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/10">
        <AlertTriangle className="w-10 h-10 text-rose-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-200 mb-2">Something went wrong</h2>
      <p className="text-slate-500 max-w-md mb-8">
        An unexpected error occurred while loading this page. Your data is safe — try again or head back to the dashboard.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={reset} className="btn-primary">
          <RefreshCcw className="w-4 h-4" /> Try Again
        </button>
        <Link href="/" className="btn-secondary">
          <Home className="w-4 h-4" /> Dashboard
        </Link>
      </div>
    </div>
  );
}
