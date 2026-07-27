import { useContext } from 'react';
import { AppStoreContext } from './storeContext.js';

export function useStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useStore must be used within AppStoreProvider');
  return ctx;
}
