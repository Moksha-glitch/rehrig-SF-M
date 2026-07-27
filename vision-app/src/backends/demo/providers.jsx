import React from 'react';
import { AppStoreProvider } from './store.jsx';
import { AuthProvider } from './auth.jsx';

/** Demo root providers — local seed store only. No React Query / API client. */
export function AppProviders({ children }) {
  return (
    <AppStoreProvider>
      <AuthProvider>{children}</AuthProvider>
    </AppStoreProvider>
  );
}
