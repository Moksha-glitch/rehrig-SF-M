import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  canAccessModuleForUser,
  canAccessNavKey,
  canAccessAccountTab,
  canCreateAccountsForUser,
  canCreateRecordsForUser,
  getAllowedModules,
  getPsgLabel,
  roleKey,
} from '../data/rbac.js';
import { readNavigation, writeNavigation } from '../utils/appNavigation.js';
import { useAuth } from './authContextBase.js';
import { appRepository, preferences } from '../utils/appRepository.js';
import { applyResolvedTheme, normalizeTheme, subscribeSystemTheme } from '../utils/theme.js';
import { apiClient } from '../lib/apiClient.js';
import { AppStoreContext } from './storeContext.js';

function homeModuleFor() {
  return 'home';
}

const initialUi = {
  theme: typeof window !== 'undefined' ? preferences.getTheme() : 'light',
  nav: typeof window !== 'undefined' ? readNavigation() : { module: 'home', params: {} },
  toast: null,
  assistantOpen: false,
  followedAccountIds:
    typeof window !== 'undefined' ? appRepository.getFollowedAccountIds() : [],
  reportSubscriptions: appRepository.getReportSubscriptions(),
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: normalizeTheme(action.theme) };
    case 'NAVIGATE':
      return { ...state, nav: { module: action.module, params: action.params || {} } };
    case 'TOAST':
      return { ...state, toast: action.message };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    case 'SET_ASSISTANT_OPEN':
      return { ...state, assistantOpen: !!action.open };
    case 'SET_FOLLOWED_ACCOUNTS':
      return { ...state, followedAccountIds: action.ids || [] };
    case 'SET_REPORT_SUBSCRIPTIONS':
      return { ...state, reportSubscriptions: action.items || [] };
    default:
      return state;
  }
}

export function ApiAppStoreProvider({ children }) {
  const { user, permissions, logout: authLogout, isAuthenticated } = useAuth();
  const [ui, dispatch] = useReducer(reducer, initialUi);
  const toastTimer = useRef(null);
  const didRouteOnLogin = useRef(false);

  useEffect(() => {
    applyResolvedTheme(ui.theme);
    preferences.setTheme(ui.theme);
    return subscribeSystemTheme(ui.theme, () => applyResolvedTheme(ui.theme));
  }, [ui.theme]);

  useEffect(() => {
    const onPopState = () => dispatch({ type: 'NAVIGATE', ...readNavigation() });
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!user) {
      didRouteOnLogin.current = false;
      return;
    }
    if (didRouteOnLogin.current) return;
    didRouteOnLogin.current = true;
    const requested = readNavigation();
    if (requested.module === 'home') {
      const nav =
        user.role === 'Analyst'
          ? { module: 'analytics', params: { view: 'dashboards' } }
          : { module: homeModuleFor(user), params: {} };
      dispatch({ type: 'NAVIGATE', ...nav });
      writeNavigation(nav, { replace: true });
    }
  }, [user]);

  const setTheme = useCallback((theme) => dispatch({ type: 'SET_THEME', theme }), []);
  const navigate = useCallback((module, params = {}, options = {}) => {
    const nav = { module, params };
    dispatch({ type: 'NAVIGATE', ...nav });
    writeNavigation(nav, options);
  }, []);

  const openAssistant = useCallback(
    () => dispatch({ type: 'SET_ASSISTANT_OPEN', open: true }),
    []
  );
  const closeAssistant = useCallback(
    () => dispatch({ type: 'SET_ASSISTANT_OPEN', open: false }),
    []
  );
  const toggleAssistant = useCallback(
    () => dispatch({ type: 'SET_ASSISTANT_OPEN', open: !ui.assistantOpen }),
    [ui.assistantOpen]
  );

  const toast = useCallback((message, severity = 'success', options = {}) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    const payload =
      typeof message === 'object'
        ? { severity: 'success', ...message }
        : { message, severity, ...options };
    dispatch({ type: 'TOAST', message: payload });
    toastTimer.current = window.setTimeout(
      () => dispatch({ type: 'CLEAR_TOAST' }),
      payload.duration || 3200
    );
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    dispatch({ type: 'SET_ASSISTANT_OPEN', open: false });
    dispatch({ type: 'NAVIGATE', module: 'home', params: {} });
    writeNavigation({ module: 'home', params: {} }, { replace: true });
  }, [authLogout]);

  const persona = user?.persona || null;
  const allowedModules = useMemo(() => getAllowedModules(user), [user]);
  const canAccessModule = useCallback(
    (moduleKey) => canAccessModuleForUser(user, moduleKey),
    [user]
  );
  const canNav = useCallback((navKey) => canAccessNavKey(user, navKey), [user]);
  const canTab = useCallback((tab) => canAccessAccountTab(user, tab), [user]);
  const canCreateAccounts =
    permissions?.canCreateAccounts ?? canCreateAccountsForUser(user);
  const canCreateRecords =
    permissions?.canCreateRecords ?? canCreateRecordsForUser(user);
  const psgLabel = user ? getPsgLabel(user) : '';
  const rbacKey = user ? roleKey(user) : '';
  const scopedAccountIds = useMemo(() => user?.accountIds || [], [user]);
  const isScoped = scopedAccountIds.length > 0 || !!user?.segmentIds?.length;

  const isFollowingAccount = useCallback(
    (accountId) => (ui.followedAccountIds || []).includes(accountId),
    [ui.followedAccountIds]
  );
  const toggleFollowAccount = useCallback((accountId) => {
    const next = appRepository.toggleFollowedAccount(accountId);
    dispatch({ type: 'SET_FOLLOWED_ACCOUNTS', ids: next });
    return next.includes(accountId);
  }, []);
  const deleteApiIntegration = useCallback(async (id) => {
    await apiClient.delete(`/api-integrations/${id}`);
    return { id };
  }, []);

  const commitSubscriptions = useCallback((items) => {
    const next = appRepository.setReportSubscriptions(items);
    dispatch({ type: 'SET_REPORT_SUBSCRIPTIONS', items: next });
    return next;
  }, []);
  const createReportSubscription = useCallback(
    (item) => {
      const next = {
        ...item,
        id: item.id || `sub-${Date.now().toString(36)}`,
        active: item.active !== false,
      };
      commitSubscriptions([next, ...(ui.reportSubscriptions || [])]);
      return next;
    },
    [commitSubscriptions, ui.reportSubscriptions]
  );
  const updateReportSubscription = useCallback(
    (id, changes) => {
      commitSubscriptions(
        (ui.reportSubscriptions || []).map((item) =>
          item.id === id ? { ...item, ...changes } : item
        )
      );
      return { id, ...changes };
    },
    [commitSubscriptions, ui.reportSubscriptions]
  );
  const deleteReportSubscription = useCallback(
    (id) => {
      commitSubscriptions((ui.reportSubscriptions || []).filter((item) => item.id !== id));
      return { id };
    },
    [commitSubscriptions, ui.reportSubscriptions]
  );

  const state = useMemo(
    () => ({
      currentUser: user,
      theme: ui.theme,
      nav: ui.nav,
      toast: ui.toast,
      assistantOpen: ui.assistantOpen,
      followedAccountIds: ui.followedAccountIds,
      reportSubscriptions: ui.reportSubscriptions,
    }),
    [user, ui]
  );

  const value = {
    state,
    navigate,
    setTheme,
    toast,
    logout,
    assistantOpen: !!ui.assistantOpen,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    isFollowingAccount,
    toggleFollowAccount,
    followedAccountIds: ui.followedAccountIds || [],
    reportSubscriptions: ui.reportSubscriptions || [],
    createReportSubscription,
    updateReportSubscription,
    deleteReportSubscription,
    deleteApiIntegration,
    canPreviewPersonas: false,
    personaViews: [],
    previewPersona: () => null,
    exitPersonaPreview: () => null,
    previewOrigin: null,
    isPreviewingPersona: false,
    persona,
    allowedModules,
    canAccessModule,
    canNav,
    canTab,
    canCreateAccounts,
    canCreateRecords,
    isScoped,
    scopedAccountIds,
    psgLabel,
    rbacKey,
    isAuthenticated,
    permissions,
    mode: 'api',
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}
