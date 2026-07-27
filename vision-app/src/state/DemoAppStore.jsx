import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { USERS } from '../data/seed.js';
import { RECORD_SCHEMAS } from '../data/recordSchemas.js';
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
import { appRepository } from '../utils/appRepository.js';
import { readNavigation, writeNavigation } from '../utils/appNavigation.js';
import { AppStoreContext } from './storeContext.js';

const initialState = { ...appRepository.load(), nav: readNavigation() };

function homeModuleFor(user) {
  if (user.persona === 'customer') return 'myLocations';
  if (user.persona === 'sp' && user.role === 'Field Tech') return 'workOrders';
  if (user.persona === 'sp' && user.role === 'Analyst') return 'analytics';
  return 'home';
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.user, nav: action.nav };
    case 'LOGOUT':
      return { ...state, currentUser: null, nav: { module: 'home', params: {} } };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'NAVIGATE':
      return { ...state, nav: { module: action.module, params: action.params || {} } };
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [action.account, ...state.accounts],
        drafts: action.fromDraftId
          ? state.drafts.filter((d) => d.id !== action.fromDraftId)
          : state.drafts,
      };
    case 'SAVE_DRAFT': {
      const draft = action.draft;
      const exists = state.drafts.some((d) => d.id === draft.id);
      return {
        ...state,
        drafts: exists
          ? state.drafts.map((d) => (d.id === draft.id ? draft : d))
          : [...state.drafts, draft],
      };
    }
    case 'DELETE_DRAFT':
      return { ...state, drafts: state.drafts.filter((d) => d.id !== action.id) };
    case 'TOAST':
      return { ...state, toast: action.message };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    case 'MARK_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((item) =>
          item.id === action.id ? { ...item, read: true } : item
        ),
      };
    case 'MARK_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: state.notifications.map((item) => ({ ...item, read: true })),
      };
    case 'ADD_OPERATIONAL_RECORD': {
      const records = state.operationalRecords[action.kind] || [];
      return {
        ...state,
        operationalRecords: {
          ...state.operationalRecords,
          [action.kind]: [action.record, ...records],
        },
      };
    }
    case 'UPDATE_OPERATIONAL_RECORD':
      return {
        ...state,
        operationalRecords: {
          ...state.operationalRecords,
          [action.kind]: (state.operationalRecords[action.kind] || []).map((record) =>
            record.id === action.id ? { ...record, ...action.changes } : record
          ),
        },
      };
    case 'DELETE_OPERATIONAL_RECORD':
      return {
        ...state,
        operationalRecords: {
          ...state.operationalRecords,
          [action.kind]: (state.operationalRecords[action.kind] || []).filter(
            (record) => record.id !== action.id
          ),
        },
      };
    case 'ADD_CONTACT':
      return { ...state, contacts: [action.contact, ...state.contacts] };
    case 'ADD_ROUTE':
      return { ...state, routes: [action.route, ...state.routes] };
    case 'TOGGLE_NOTIF_RULE':
      return {
        ...state,
        notificationConfig: state.notificationConfig.map((r) =>
          r.id === action.id ? { ...r, enabled: !r.enabled } : r
        ),
      };
    case 'DELETE_CONFIG': {
      const list = state.config[action.list].filter((x) => x.id !== action.id);
      return { ...state, config: { ...state.config, [action.list]: list } };
    }
    case 'ADD_CONFIG': {
      const list = [action.item, ...state.config[action.list]];
      return { ...state, config: { ...state.config, [action.list]: list } };
    }
    case 'RESET':
      return action.state;
    default:
      return state;
  }
}

export function DemoAppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef(null);

  useEffect(() => {
    appRepository.save(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

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

  const login = useCallback((user, options = {}) => {
    const remember = options.remember !== false;
    appRepository.setRemember(remember);
    if (remember) appRepository.setSessionUser(null);
    else appRepository.setSessionUser(user.id);

    const requested = readNavigation();
    const fallback = {
      module: homeModuleFor(user),
      params: user.role === 'Analyst' ? { view: 'dashboards' } : {},
    };
    const nav = requested.module === 'home' ? fallback : requested;
    dispatch({ type: 'LOGIN', user, nav });
    writeNavigation(nav, { replace: true });
  }, []);

  const logout = useCallback(() => {
    appRepository.setSessionUser(null);
    dispatch({ type: 'LOGOUT' });
    writeNavigation({ module: 'home', params: {} }, { replace: true });
  }, []);

  const setTheme = useCallback((theme) => dispatch({ type: 'SET_THEME', theme }), []);
  const navigate = useCallback((module, params = {}, options = {}) => {
    const nav = { module, params };
    dispatch({ type: 'NAVIGATE', ...nav });
    writeNavigation(nav, options);
  }, []);

  const addAccount = useCallback(
    (account, fromDraftId = null) => dispatch({ type: 'ADD_ACCOUNT', account, fromDraftId }),
    []
  );
  const saveDraft = useCallback((draft) => dispatch({ type: 'SAVE_DRAFT', draft }), []);
  const deleteDraft = useCallback((id) => dispatch({ type: 'DELETE_DRAFT', id }), []);
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

  const toggleNotifRule = useCallback((id) => dispatch({ type: 'TOGGLE_NOTIF_RULE', id }), []);
  const deleteConfig = useCallback((list, id) => dispatch({ type: 'DELETE_CONFIG', list, id }), []);
  const addConfig = useCallback((list, item) => dispatch({ type: 'ADD_CONFIG', list, item }), []);
  const markNotificationRead = useCallback(
    (id) => dispatch({ type: 'MARK_NOTIFICATION', id }),
    []
  );
  const markAllNotificationsRead = useCallback(
    () => dispatch({ type: 'MARK_ALL_NOTIFICATIONS' }),
    []
  );
  const resetToSeed = useCallback(() => {
    const next = appRepository.reset();
    dispatch({ type: 'RESET', state: next });
    writeNavigation(next.nav, { replace: true });
  }, []);

  const addOperationalRecord = useCallback((kind, record) => {
    const next = {
      ...record,
      id: record.id || `${kind}-${Date.now().toString(36)}`,
    };
    dispatch({ type: 'ADD_OPERATIONAL_RECORD', kind, record: next });
    return next;
  }, []);
  const updateOperationalRecord = useCallback(
    (kind, id, changes) => dispatch({ type: 'UPDATE_OPERATIONAL_RECORD', kind, id, changes }),
    []
  );
  const deleteOperationalRecord = useCallback(
    (kind, id) => dispatch({ type: 'DELETE_OPERATIONAL_RECORD', kind, id }),
    []
  );
  const addContact = useCallback((contact) => {
    const next = {
      ...contact,
      id: contact.id || `con-${Date.now().toString(36)}`,
      name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
    };
    dispatch({ type: 'ADD_CONTACT', contact: next });
    return next;
  }, []);
  const addRoute = useCallback((route) => {
    const next = { ...route, id: route.id || `rt-${Date.now().toString(36)}` };
    dispatch({ type: 'ADD_ROUTE', route: next });
    return next;
  }, []);

  const user = state.currentUser;
  const persona = user?.persona || null;
  const allowedModules = useMemo(() => getAllowedModules(user), [user]);
  const canAccessModule = useCallback(
    (moduleKey) => canAccessModuleForUser(user, moduleKey),
    [user]
  );
  const canNav = useCallback((navKey) => canAccessNavKey(user, navKey), [user]);
  const canTab = useCallback((tab) => canAccessAccountTab(user, tab), [user]);
  const canCreateAccounts = canCreateAccountsForUser(user);
  const canCreateRecords = canCreateRecordsForUser(user);
  const psgLabel = user ? getPsgLabel(user) : '';
  const rbacKey = user ? roleKey(user) : '';

  const scopedAccountIds = useMemo(() => {
    if (!user) return [];
    if (user.accountIds?.length) return user.accountIds;
    if (user.segmentIds?.length) {
      return [
        ...new Set(
          state.segments
            .filter((segment) => user.segmentIds.includes(segment.id))
            .map((segment) => segment.accountId)
        ),
      ];
    }
    return [];
  }, [state.segments, user]);

  const isScoped = scopedAccountIds.length > 0 || !!user?.segmentIds?.length;
  const scopedAccounts = useMemo(() => {
    if (!isScoped) return state.accounts;
    return state.accounts.filter((account) => scopedAccountIds.includes(account.id));
  }, [isScoped, scopedAccountIds, state.accounts]);

  const scopeRecords = useCallback(
    (records) => {
      if (!isScoped) return records;
      const accountNames = new Set(scopedAccounts.map((account) => account.name));
      return records.filter((record) => {
        if (record.segmentId && user?.segmentIds?.length) {
          return user.segmentIds.includes(record.segmentId);
        }
        return (
          scopedAccountIds.includes(record.accountId) ||
          accountNames.has(record.account) ||
          accountNames.has(record.accountName)
        );
      });
    },
    [isScoped, scopedAccountIds, scopedAccounts, user]
  );

  const selectAccounts = useCallback(() => scopedAccounts, [scopedAccounts]);
  const selectContacts = useCallback(
    (accountId) =>
      scopeRecords(state.contacts).filter((record) => !accountId || record.accountId === accountId),
    [scopeRecords, state.contacts]
  );
  const selectSegments = useCallback(
    (accountId) =>
      scopeRecords(state.segments).filter((record) => !accountId || record.accountId === accountId),
    [scopeRecords, state.segments]
  );
  const selectRoutes = useCallback(
    (accountId) =>
      scopeRecords(state.routes).filter((record) => !accountId || record.accountId === accountId),
    [scopeRecords, state.routes]
  );
  const selectProducts = useCallback(
    (accountId) => {
      if (accountId) {
        if (isScoped && !scopedAccountIds.includes(accountId)) return [];
        return state.productsByAccount[accountId] || [];
      }
      return scopedAccounts.flatMap((account) => state.productsByAccount[account.id] || []);
    },
    [isScoped, scopedAccountIds, scopedAccounts, state.productsByAccount]
  );
  const selectOperationalRecords = useCallback(
    (kind, filters = {}) =>
      scopeRecords(state.operationalRecords[kind] || []).filter((record) =>
        Object.entries(filters).every((entry) => record[entry[0]] === entry[1])
      ),
    [scopeRecords, state.operationalRecords]
  );

  const searchRecords = useCallback(
    (query) => {
      const q = String(query || '').trim().toLowerCase();
      if (!q) return [];
      const results = [];
      scopedAccounts.forEach((account) => {
        if (account.name.toLowerCase().includes(q) || account.uid?.includes(q)) {
          results.push({
            id: account.id,
            title: account.name,
            label: account.name,
            meta: 'Service Provider',
            module: user?.persona === 'rehrig' ? 'accountDetail' : 'account',
            params:
              user?.persona === 'rehrig' ? { accountId: account.id } : { tab: 'details' },
          });
        }
      });
      selectContacts().forEach((contact) => {
        if (`${contact.name} ${contact.email || ''}`.toLowerCase().includes(q)) {
          results.push({
            id: contact.id,
            title: contact.name,
            label: contact.name,
            meta: 'Contact',
            module: 'contacts',
            params: {},
          });
        }
      });
      Object.keys(RECORD_SCHEMAS).forEach((kind) => {
        selectOperationalRecords(kind).forEach((record) => {
          const title =
            record.number || record.name || record.subject || record.title || record.id;
          if (String(title).toLowerCase().includes(q)) {
            results.push({
              id: record.id,
              title: String(title),
              label: String(title),
              meta: RECORD_SCHEMAS[kind].singular,
              module: kind,
              params: {},
            });
          }
        });
      });
      return results.slice(0, 12);
    },
    [scopedAccounts, selectContacts, selectOperationalRecords, user]
  );

  const value = {
    state,
    dispatch,
    login,
    logout,
    setTheme,
    navigate,
    addAccount,
    saveDraft,
    deleteDraft,
    toast,
    toggleNotifRule,
    deleteConfig,
    addConfig,
    markNotificationRead,
    markAllNotificationsRead,
    resetToSeed,
    resetData: resetToSeed,
    createRecord: addOperationalRecord,
    updateRecord: updateOperationalRecord,
    deleteRecord: deleteOperationalRecord,
    addContact,
    addRoute,
    selectAccounts,
    selectContacts,
    selectSegments,
    selectRoutes,
    selectProducts,
    selectOperationalRecords,
    searchRecords,
    persona,
    allowedModules,
    canAccessModule,
    canNav,
    canTab,
    canCreateAccounts,
    canCreateRecords,
    isScoped,
    scopedAccountIds,
    scopedAccounts,
    psgLabel,
    rbacKey,
    users: USERS,
    isAuthenticated: !!user,
    mode: 'demo',
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}
