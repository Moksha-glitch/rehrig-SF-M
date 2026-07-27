import { createContext, useContext } from 'react';
import {
  canCreateAccountsForUser,
  canCreateRecordsForUser,
  getAllowedModules,
  getPsgLabel,
  ROLE_ACCOUNT_TABS,
  ROLE_NAV_KEYS,
  roleKey,
  ROLE_PSG,
} from '../data/rbac.js';

export const AuthContext = createContext(null);

export function permissionsFor(user) {
  if (!user) return null;
  return {
    modules: getAllowedModules(user),
    navKeys: ROLE_NAV_KEYS[roleKey(user)] === undefined ? [] : ROLE_NAV_KEYS[roleKey(user)],
    accountTabs: ROLE_ACCOUNT_TABS[roleKey(user)] || [],
    psgLabel: ROLE_PSG[roleKey(user)] || getPsgLabel(user),
    canCreateAccounts: canCreateAccountsForUser(user),
    canCreateRecords: canCreateRecordsForUser(user),
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within the mode AuthProvider');
  }
  return ctx;
}
