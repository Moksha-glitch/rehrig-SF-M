import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { AppStoreProvider } from './store.jsx';
import { AuthProvider } from './auth.jsx';

/** API root providers — JWT auth + React Query + thin UI store. */
export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppStoreProvider>{children}</AppStoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
