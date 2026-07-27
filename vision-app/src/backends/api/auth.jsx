import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '../../services/authService.js';
import { getErrorMessage } from '../../lib/errors.js';
import {
  clearTokens,
  getRememberPreference,
  loadPersistedRefresh,
  setAuthLossHandler,
  setTokens,
} from '../../lib/tokenStore.js';
import { queryClient } from '../../lib/queryClient.js';
import { AuthContext, useAuth } from '../../state/authContextBase.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authError, setAuthError] = useState(null);

  const applySession = useCallback((payload) => {
    setUser(payload.user);
    setPermissions(payload.permissions || null);
    setTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setPermissions(null);
    clearTokens();
    queryClient.clear();
  }, []);

  useEffect(() => {
    setAuthLossHandler(() => {
      setUser(null);
      setPermissions(null);
      queryClient.clear();
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const refresh = loadPersistedRefresh();
      if (!refresh) {
        if (!cancelled) setBootstrapping(false);
        return;
      }
      try {
        const payload = await authService.refresh(refresh);
        if (!cancelled) applySession(payload);
      } catch {
        clearTokens();
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = useCallback(async (email, password, { remember = true } = {}) => {
    setAuthError(null);
    try {
      const payload = await authService.login(email, password);
      setTokens({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        remember,
      });
      setUser(payload.user);
      setPermissions(payload.permissions || null);
      return payload.user;
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to sign in.');
      setAuthError(message);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const refresh = loadPersistedRefresh();
    try {
      if (refresh) await authService.logout(refresh);
    } catch {
      /* ignore */
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      permissions,
      bootstrapping,
      authError,
      setAuthError,
      login,
      logout,
      isAuthenticated: !!user,
      rememberDefault: getRememberPreference(),
      mode: 'api',
      demoUsers: null,
    }),
    [user, permissions, bootstrapping, authError, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, useAuth };
export const ApiAuthProvider = AuthProvider;
