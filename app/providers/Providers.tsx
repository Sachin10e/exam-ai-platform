'use client';

import React from 'react';
import { type User as SupabaseUser } from '@supabase/supabase-js';
import { ToastProvider } from '../components/ui/Toast';
import AuthProvider from './AuthProvider';

interface ProvidersProps {
  children: React.ReactNode;
  initialUser: SupabaseUser | null;
}

export default function Providers({ children, initialUser }: ProvidersProps) {
  return (
    <ToastProvider>
      <AuthProvider initialUser={initialUser}>
        {children}
      </AuthProvider>
    </ToastProvider>
  );
}
