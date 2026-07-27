import React, { useCallback, useMemo } from 'react';
import { USERS } from '../../data/seed.js';
import { AuthContext, permissionsFor, useAuth } from '../../state/authContextBase.js';
import { useStore } from '../../state/storeHooks.js';

/** Local seed login — no JWT, axios, or vision-api. */
export function AuthProvider({ children }) {
  const store = useStore();
  const user = store.state.currentUser;

  const login = useCallback(
    async (email, password, { remember = true } = {}) => {
      const trimmed = String(email || '').trim().toLowerCase();
      const match = USERS.find((u) => u.email.toLowerCase() === trimmed);
      if (!match) {
        const error = new Error('No Vision account matches that email.');
        error.userMessage = error.message;
        throw error;
      }
      if (!match.active) {
        const error = new Error('This account is inactive. Contact your administrator.');
        error.userMessage = error.message;
        throw error;
      }
      if (password !== 'vision') {
        const error = new Error('Incorrect password. Try again or contact helpdesk.');
        error.userMessage = error.message;
        throw error;
      }
      store.login(match, { remember });
      return match;
    },
    [store]
  );

  const value = useMemo(
    () => ({
      user,
      permissions: permissionsFor(user),
      bootstrapping: false,
      authError: null,
      setAuthError: () => {},
      login,
      logout: async () => store.logout(),
      isAuthenticated: !!user,
      rememberDefault: true,
      mode: 'demo',
      demoUsers: USERS,
    }),
    [user, login, store]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, useAuth };
export const DemoAuthBridge = AuthProvider;
