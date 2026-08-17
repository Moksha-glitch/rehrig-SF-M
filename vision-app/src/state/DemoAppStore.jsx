import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { MASTER_CATALOG, USERS } from '../data/seed.js';
import { RECORD_SCHEMAS } from '../data/recordSchemas.js';
import { PICKLISTS } from '../data/picklists.js';
import { NAV, filterNavTree, flattenNavDestinations } from '../components/navConfig.js';
import {
  canAccessModuleForUser,
  canAccessNavKey,
  canAccessAccountTab,
  canCreateAccountsForUser,
  canCreateRecordsForUser,
  canPreviewPersonasForUser,
  getAllowedModules,
  getPsgLabel,
  ROLE_PSG,
  roleKey,
} from '../data/rbac.js';
import { appRepository } from '../utils/appRepository.js';
import { readNavigation, writeNavigation } from '../utils/appNavigation.js';
import { AppStoreContext } from './storeContext.js';

const initialState = { ...appRepository.load(), nav: readNavigation() };

const SEARCH_CATEGORY_LIMIT = 5;
const SEARCH_RESULT_LIMIT = 24;

const DEVICE_SLOTS = (
  RECORD_SCHEMAS.trucks.sections.find((section) => section.title === 'Devices')?.fields || []
).map((field) => ({ key: field.key, label: field.label }));

function homeModuleFor() {
  return 'home';
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        currentUser: action.user,
        previewOriginUserId: null,
        nav: action.nav,
        assistantOpen: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        previewOriginUserId: null,
        nav: { module: 'home', params: {} },
        assistantOpen: false,
      };
    case 'SET_PERSONA_PREVIEW':
      return {
        ...state,
        currentUser: action.user,
        previewOriginUserId: action.originUserId,
        nav: { module: 'home', params: {} },
        assistantOpen: false,
      };
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
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((account) =>
          account.id === action.id
            ? {
                ...account,
                ...action.changes,
                lastModifiedBy: action.modifiedBy || account.lastModifiedBy,
              }
            : account
        ),
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
    case 'SET_ASSISTANT_OPEN':
      return { ...state, assistantOpen: !!action.open };
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
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map((contact) => {
          if (contact.id !== action.id) return contact;
          const next = { ...contact, ...action.changes };
          next.name =
            next.name ||
            `${next.firstName || ''} ${next.lastName || ''}`.trim() ||
            contact.name;
          if (action.changes.role && !action.changes.roleTitle) next.roleTitle = action.changes.role;
          if (action.changes.portal != null) {
            next.isUserCreated = !!action.changes.portal;
            next.isUserActive = !!action.changes.portal;
          }
          return next;
        }),
      };
    case 'ADD_ROUTE':
      return { ...state, routes: [action.route, ...state.routes] };
    case 'TOGGLE_NOTIF_RULE':
      return {
        ...state,
        notificationConfig: state.notificationConfig.map((r) =>
          r.id === action.id ? { ...r, enabled: !r.enabled } : r
        ),
      };
    case 'ADD_API_INTEGRATION':
      return {
        ...state,
        apiIntegrations: [action.item, ...(state.apiIntegrations || [])],
      };
    case 'UPDATE_API_INTEGRATION':
      return {
        ...state,
        apiIntegrations: (state.apiIntegrations || []).map((item) =>
          item.id === action.id ? { ...item, ...action.changes } : item
        ),
      };
    case 'DELETE_API_INTEGRATION':
      return {
        ...state,
        apiIntegrations: (state.apiIntegrations || []).filter((item) => item.id !== action.id),
      };
    case 'TOGGLE_FOLLOW_ACCOUNT': {
      const ids = state.followedAccountIds || [];
      const followed = ids.includes(action.accountId);
      return {
        ...state,
        followedAccountIds: followed
          ? ids.filter((id) => id !== action.accountId)
          : [...ids, action.accountId],
      };
    }
    case 'ADD_NOTIFICATION_RULE':
      return {
        ...state,
        notificationConfig: [action.item, ...(state.notificationConfig || [])],
      };
    case 'UPDATE_NOTIFICATION_RULE':
      return {
        ...state,
        notificationConfig: (state.notificationConfig || []).map((item) =>
          item.id === action.id ? { ...item, ...action.changes } : item
        ),
      };
    case 'DELETE_CONFIG': {
      const list = (state.config[action.list] || []).filter((x) => x.id !== action.id);
      return { ...state, config: { ...state.config, [action.list]: list } };
    }
    case 'ADD_CONFIG': {
      const list = [action.item, ...(state.config[action.list] || [])];
      return { ...state, config: { ...state.config, [action.list]: list } };
    }
    case 'UPSERT_REPORT_SPEC': {
      const specs = state.reportSpecs || [];
      const exists = specs.some((r) => r.id === action.item.id);
      return {
        ...state,
        reportSpecs: exists
          ? specs.map((r) => (r.id === action.item.id ? action.item : r))
          : [action.item, ...specs],
      };
    }
    case 'DELETE_REPORT_SPEC':
      return {
        ...state,
        reportSpecs: (state.reportSpecs || []).filter((r) => r.id !== action.id),
      };
    case 'ADD_REPORT_SUBSCRIPTION':
      return {
        ...state,
        reportSubscriptions: [action.item, ...(state.reportSubscriptions || [])],
      };
    case 'UPDATE_REPORT_SUBSCRIPTION':
      return {
        ...state,
        reportSubscriptions: (state.reportSubscriptions || []).map((item) =>
          item.id === action.id ? { ...item, ...action.changes } : item
        ),
      };
    case 'DELETE_REPORT_SUBSCRIPTION':
      return {
        ...state,
        reportSubscriptions: (state.reportSubscriptions || []).filter(
          (item) => item.id !== action.id
        ),
      };
    case 'UPSERT_APP_LICENSE': {
      const licenses = state.appLicenses || [];
      const exists = licenses.some((r) => r.id === action.item.id);
      return {
        ...state,
        appLicenses: exists
          ? licenses.map((r) => (r.id === action.item.id ? { ...r, ...action.item } : r))
          : [action.item, ...licenses],
      };
    }
    case 'UPDATE_WORKSPACE_SETTINGS':
      return {
        ...state,
        workspaceSettings: { ...(state.workspaceSettings || {}), ...action.changes },
      };
    case 'SAVE_IMPORT_MAPPING':
      return {
        ...state,
        importMappings: {
          ...(state.importMappings || {}),
          [action.objectKey]: action.mapping,
        },
      };
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
    const fallback =
      user.role === 'Analyst'
        ? { module: 'analytics', params: { view: 'dashboards' } }
        : { module: homeModuleFor(user), params: {} };
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

  const openAssistant = useCallback(
    () => dispatch({ type: 'SET_ASSISTANT_OPEN', open: true }),
    []
  );
  const closeAssistant = useCallback(
    () => dispatch({ type: 'SET_ASSISTANT_OPEN', open: false }),
    []
  );
  const toggleAssistant = useCallback(
    () => dispatch({ type: 'SET_ASSISTANT_OPEN', open: !state.assistantOpen }),
    [state.assistantOpen]
  );

  const addAccount = useCallback(
    (account, fromDraftId = null) => dispatch({ type: 'ADD_ACCOUNT', account, fromDraftId }),
    []
  );
  const updateAccount = useCallback(
    (id, changes) =>
      dispatch({
        type: 'UPDATE_ACCOUNT',
        id,
        changes,
        modifiedBy: `${state.currentUser?.name || 'Vision user'}, ${new Date().toLocaleString()}`,
      }),
    [state.currentUser?.name]
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
  const addApiIntegration = useCallback((item) => {
    const next = {
      id: item.id || `api-${Date.now().toString(36)}`,
      name: (item.name || '').trim(),
      description: (item.description || '').trim(),
      endpoint: (item.endpoint || '/api/v1/workorder').trim(),
      status: item.status || 'Active',
      calls30d: Number.isFinite(Number(item.calls30d)) ? Number(item.calls30d) : 0,
    };
    dispatch({ type: 'ADD_API_INTEGRATION', item: next });
    return next;
  }, []);
  const updateApiIntegration = useCallback((id, changes) => {
    dispatch({ type: 'UPDATE_API_INTEGRATION', id, changes });
    return { id, ...changes };
  }, []);
  const deleteApiIntegration = useCallback((id) => {
    dispatch({ type: 'DELETE_API_INTEGRATION', id });
    return { id };
  }, []);
  const isFollowingAccount = useCallback(
    (accountId) => (state.followedAccountIds || []).includes(accountId),
    [state.followedAccountIds]
  );
  const toggleFollowAccount = useCallback((accountId) => {
    dispatch({ type: 'TOGGLE_FOLLOW_ACCOUNT', accountId });
    const next = !(state.followedAccountIds || []).includes(accountId);
    return next;
  }, [state.followedAccountIds]);
  const addNotificationRule = useCallback((item) => {
    const next = {
      id: item.id || `nc-${Date.now().toString(36)}`,
      name: (item.name || '').trim(),
      description: (item.description || '').trim(),
      enabled: item.enabled !== false,
      event: item.event || 'work_order.missed_pickup',
      channel: item.channel || 'SMS',
      priority: item.priority || 'Normal',
    };
    dispatch({ type: 'ADD_NOTIFICATION_RULE', item: next });
    return next;
  }, []);
  const updateNotificationRule = useCallback((id, changes) => {
    dispatch({ type: 'UPDATE_NOTIFICATION_RULE', id, changes });
    return { id, ...changes };
  }, []);
  const deleteConfig = useCallback((list, id) => dispatch({ type: 'DELETE_CONFIG', list, id }), []);
  const addConfig = useCallback((list, item) => dispatch({ type: 'ADD_CONFIG', list, item }), []);
  const upsertReportSpec = useCallback((item) => {
    const next = {
      ...item,
      id: item.id || `rpt-${Date.now().toString(36)}`,
      name: (item.name || 'Untitled report').trim() || 'Untitled report',
      limit: Math.max(1, Math.min(100, Number(item.limit) || 20)),
    };
    dispatch({ type: 'UPSERT_REPORT_SPEC', item: next });
    return next;
  }, []);
  const deleteReportSpec = useCallback((id) => {
    dispatch({ type: 'DELETE_REPORT_SPEC', id });
    return { id };
  }, []);
  const createReportSubscription = useCallback((item) => {
    const next = {
      ...item,
      id: item.id || `sub-${Date.now().toString(36)}`,
      active: item.active !== false,
    };
    dispatch({ type: 'ADD_REPORT_SUBSCRIPTION', item: next });
    return next;
  }, []);
  const updateReportSubscription = useCallback((id, changes) => {
    dispatch({ type: 'UPDATE_REPORT_SUBSCRIPTION', id, changes });
    return { id, ...changes };
  }, []);
  const deleteReportSubscription = useCallback((id) => {
    dispatch({ type: 'DELETE_REPORT_SUBSCRIPTION', id });
    return { id };
  }, []);
  const upsertAppLicense = useCallback((item) => {
    const next = {
      ...item,
      id: item.id || `lic-${Date.now().toString(36)}`,
      productName: (item.productName || '').trim(),
      seats: Number(item.seats) || 0,
      assigned: Number(item.assigned) || 0,
    };
    dispatch({ type: 'UPSERT_APP_LICENSE', item: next });
    return next;
  }, []);
  const updateWorkspaceSettings = useCallback((changes) => {
    dispatch({ type: 'UPDATE_WORKSPACE_SETTINGS', changes });
    return changes;
  }, []);
  const saveImportMapping = useCallback((objectKey, mapping) => {
    const next = { ...mapping, savedAt: new Date().toISOString() };
    dispatch({ type: 'SAVE_IMPORT_MAPPING', objectKey, mapping: next });
    return next;
  }, []);
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
      createdAt: record.createdAt || new Date().toISOString(),
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
    const firstName = (contact.firstName || '').trim();
    const lastName = (contact.lastName || '').trim();
    const portal = !!contact.portal;
    const next = {
      ...contact,
      id: contact.id || `con-${Date.now().toString(36)}`,
      firstName,
      lastName,
      name: contact.name || `${firstName} ${lastName}`.trim(),
      email: (contact.email || '').trim(),
      roleTitle: contact.roleTitle || contact.role || '',
      title: contact.title || contact.roleTitle || contact.role || '',
      isUserCreated: contact.isUserCreated ?? portal,
      isUserActive: contact.isUserActive ?? portal,
      segment: contact.segment || '',
      createdAt: contact.createdAt || new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CONTACT', contact: next });
    return next;
  }, []);
  const updateContact = useCallback((id, changes) => {
    dispatch({ type: 'UPDATE_CONTACT', id, changes });
  }, []);
  const addRoute = useCallback((route) => {
    const next = {
      ...route,
      id: route.id || `rt-${Date.now().toString(36)}`,
      createdAt: route.createdAt || new Date().toISOString(),
    };
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

  const previewOrigin = useMemo(
    () => USERS.find((candidate) => candidate.id === state.previewOriginUserId) || null,
    [state.previewOriginUserId]
  );
  const canPreviewPersonas = canPreviewPersonasForUser(previewOrigin || user);
  const personaViews = useMemo(() => {
    if (!canPreviewPersonas) return [];
    const seen = new Set();
    return USERS.filter((candidate) => {
      if (!candidate.active) return false;
      const key = roleKey(candidate);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      persona: candidate.persona,
      role: candidate.role,
      label: `${candidate.persona === 'sp' ? 'Service Provider' : candidate.persona === 'customer' ? 'Customer' : 'Rehrig'} · ${candidate.role}`,
      psgLabel: ROLE_PSG[roleKey(candidate)] || 'No PSG',
    }));
  }, [canPreviewPersonas]);

  const previewPersona = useCallback(
    (userId) => {
      const origin = previewOrigin || user;
      if (!canPreviewPersonasForUser(origin)) return null;
      const target = USERS.find((candidate) => candidate.id === userId);
      if (!target || !target.active) return null;
      const originUserId = target.id === origin.id ? null : origin.id;
      if (!appRepository.getRemember()) appRepository.setSessionUser(target.id);
      dispatch({ type: 'SET_PERSONA_PREVIEW', user: target, originUserId });
      writeNavigation({ module: 'home', params: {} }, { replace: true });
      return target;
    },
    [previewOrigin, user]
  );

  const exitPersonaPreview = useCallback(() => {
    if (!previewOrigin) return null;
    if (!appRepository.getRemember()) appRepository.setSessionUser(previewOrigin.id);
    dispatch({ type: 'SET_PERSONA_PREVIEW', user: previewOrigin, originUserId: null });
    writeNavigation({ module: 'home', params: {} }, { replace: true });
    return previewOrigin;
  }, [previewOrigin]);

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
      const hit = (...values) =>
        values.some((value) => value != null && String(value).toLowerCase().includes(q));
      const groups = new Map();
      const push = (category, item) => {
        if (item.module && !canAccessModule(item.module)) return;
        if (item.params?.tab && !canTab(item.params.tab)) return;
        const bucket = groups.get(category) || [];
        if (bucket.length >= SEARCH_CATEGORY_LIMIT) return;
        bucket.push({
          ...item,
          id: `${category}|${item.id}`,
          category,
          label: item.label || item.title,
          meta: item.meta || category,
        });
        groups.set(category, bucket);
      };

      scopedAccounts.forEach((account) => {
        if (!hit(account.name, account.uid, account.industry, account.billing?.city)) return;
        push('Service Providers', {
          id: account.id,
          title: account.name,
          meta: `Service Provider · ${account.uid}`,
          module: persona === 'rehrig' ? 'accountDetail' : 'account',
          params: persona === 'rehrig' ? { accountId: account.id } : { tab: 'details' },
        });
      });

      selectContacts().forEach((contact) => {
        if (!hit(contact.name, contact.email, contact.roleTitle, contact.title)) return;
        push('Contacts', {
          id: contact.id,
          title: contact.name,
          meta: [contact.roleTitle || contact.title, contact.email].filter(Boolean).join(' · '),
          module: 'contacts',
          params: {},
        });
      });

      USERS.filter((candidate) => candidate.persona === 'customer')
        .filter(
          (candidate) =>
            !isScoped || candidate.accountIds?.some((id) => scopedAccountIds.includes(id))
        )
        .forEach((candidate) => {
          if (!hit(candidate.name, candidate.email, candidate.customerId)) return;
          push('Customers', {
            id: candidate.id,
            title: candidate.name,
            meta: [candidate.email, candidate.scopeLabel].filter(Boolean).join(' · '),
            module: persona === 'rehrig' ? 'accountDetail' : 'account',
            params:
              persona === 'rehrig'
                ? { accountId: candidate.accountIds?.[0], tab: 'customers' }
                : { tab: 'customers' },
          });
        });

      Object.keys(RECORD_SCHEMAS).forEach((kind) => {
        const schema = RECORD_SCHEMAS[kind];
        selectOperationalRecords(kind).forEach((record) => {
          const title =
            record.number || record.name || record.subject || record.title || record.id;
          if (!hit(title, record.subject, record.account, record.status)) return;
          push(schema.title, {
            id: record.id,
            title: String(title),
            meta: [schema.singular, record.account, record.status].filter(Boolean).join(' · '),
            module: kind,
            params: {},
          });
        });
      });

      selectSegments().forEach((segment) => {
        if (!hit(segment.name, segment.shortName, segment.type)) return;
        push('Service Provider Segments', {
          id: segment.id,
          title: segment.name,
          meta: [segment.type, segment.shortName].filter(Boolean).join(' · '),
          module: persona === 'rehrig' ? 'accountDetail' : 'account',
          params:
            persona === 'rehrig'
              ? { accountId: segment.accountId, tab: 'segments' }
              : { tab: 'segments' },
        });
      });

      selectRoutes().forEach((route) => {
        if (!hit(route.routeNumber, route.truck, route.driver, route.collectionType)) return;
        push('Routes', {
          id: route.id,
          title: route.routeNumber,
          meta: [route.collectionType, route.truck, route.driver].filter(Boolean).join(' · '),
          module: persona === 'rehrig' ? 'accountDetail' : 'account',
          params:
            persona === 'rehrig'
              ? { accountId: route.accountId, tab: 'routes' }
              : { tab: 'routes' },
        });
      });

      scopedAccounts.forEach((account) => {
        selectProducts(account.id).forEach((product) => {
          if (!hit(product.product, product.number, product.code, product.family)) return;
          push('Service Provider Products', {
            id: `${account.id}-${product.id || product.number}`,
            title: product.product,
            meta: [product.number, product.size, account.name].filter(Boolean).join(' · '),
            module: persona === 'rehrig' ? 'accountDetail' : 'account',
            params:
              persona === 'rehrig'
                ? { accountId: account.id, tab: 'products' }
                : { tab: 'products' },
          });
        });
      });

      MASTER_CATALOG.forEach((product) => {
        if (!hit(product.name, product.code, product.family, product.serviceType)) return;
        push('Master Product Catalog', {
          id: product.code,
          title: product.name,
          meta: [product.code, product.family, product.size].filter(Boolean).join(' · '),
          module: 'productTypes',
          params: {},
        });
      });

      (state.config?.productTypes || []).forEach((item) => {
        if (!hit(item.name, item.description)) return;
        push('Master Product Catalog', {
          id: item.id,
          title: item.name,
          meta: 'Product Type',
          module: 'productTypes',
          params: {},
        });
      });

      [
        ['serviceTypes', 'Service Types', 'Service Type'],
        ['locationTypes', 'Location Types', 'Location Type'],
        ['assetTypes', 'Asset Types', 'Asset Type'],
      ].forEach(([configKey, category, singular]) => {
        (state.config?.[configKey] || []).forEach((item) => {
          if (!hit(item.name, item.description)) return;
          push(category, {
            id: item.id,
            title: item.name,
            meta: singular,
            module: configKey,
            params: {},
          });
        });
      });

      const specs = state.reportSpecs || [];
      specs.forEach((spec) => {
        if (!hit(spec.name, spec.desc, spec.source)) return;
        push('Reports', {
          id: spec.id,
          title: spec.name,
          meta: [spec.desc || spec.source, spec.chart].filter(Boolean).join(' · '),
          module: 'analytics',
          params: { view: 'reports' },
        });
      });

      const dashboardWidgets = specs.filter((spec) => hit(spec.name, spec.desc, spec.source));
      if (dashboardWidgets.length || hit('dashboards', 'dashboard')) {
        push('Dashboards', {
          id: 'dashboards',
          title: 'Dashboards',
          meta: dashboardWidgets.length
            ? `${dashboardWidgets.length} matching widget${dashboardWidgets.length === 1 ? '' : 's'} · ${dashboardWidgets
                .slice(0, 2)
                .map((spec) => spec.name)
                .join(', ')}`
            : `${specs.length} saved widgets`,
          module: 'analytics',
          params: { view: 'dashboards' },
        });
      }

      (state.reportSubscriptions || []).forEach((sub) => {
        if (!hit(sub.reportName, sub.recipients, sub.frequency, sub.channel, sub.format)) return;
        push('Report Subscriptions', {
          id: sub.id,
          title: sub.reportName || 'Subscription',
          meta: [sub.frequency, sub.channel, sub.active ? 'Active' : 'Paused']
            .filter(Boolean)
            .join(' · '),
          module: 'reportSubscriptions',
          params: {},
        });
      });

      selectOperationalRecords('trucks').forEach((truck) => {
        DEVICE_SLOTS.forEach(({ key, label }) => {
          const value = truck[key];
          if (!value || !hit(value, label)) return;
          push('Devices', {
            id: `${truck.id}-${key}`,
            title: String(value),
            meta: `${label} · ${truck.name || truck.number || ''}`.trim(),
            module: 'devices',
            params: {},
          });
        });
      });

      PICKLISTS.requestType.forEach((requestType) => {
        if (!hit(requestType)) return;
        push('Request Types', {
          id: requestType,
          title: requestType,
          meta: 'Request Type',
          module: 'requestTypeResolutions',
          params: {},
        });
      });

      PICKLISTS.resolutionCode.forEach((code) => {
        if (!hit(code)) return;
        push('Resolution Codes', {
          id: code,
          title: code,
          meta: 'Resolution Code',
          module: 'requestTypeResolutions',
          params: {},
        });
      });

      (state.notificationConfig || []).forEach((rule) => {
        if (!hit(rule.name, rule.event, rule.channel)) return;
        push('Notification Rules', {
          id: rule.id,
          title: rule.name,
          meta: [rule.event, rule.channel, rule.enabled ? 'Enabled' : 'Paused']
            .filter(Boolean)
            .join(' · '),
          module: 'notificationConfig',
          params: {},
        });
      });

      (state.apiIntegrations || []).forEach((integration) => {
        if (!hit(integration.name, integration.endpoint, integration.status)) return;
        push('API Integrations', {
          id: integration.id,
          title: integration.name,
          meta: [integration.endpoint, integration.status].filter(Boolean).join(' · '),
          module: 'apiIntegrations',
          params: {},
        });
      });

      USERS.filter((candidate) => candidate.persona !== 'customer').forEach((candidate) => {
        if (!hit(candidate.name, candidate.email, candidate.role, candidate.alias)) return;
        push('People', {
          id: candidate.id,
          title: candidate.name,
          meta: [candidate.role, candidate.email].filter(Boolean).join(' · '),
          module: 'setup',
          params: { section: 'userMgmt' },
        });
      });

      (state.notifications || []).forEach((notice) => {
        if (!hit(notice.title, notice.detail)) return;
        push('Notifications', {
          id: notice.id,
          title: notice.title,
          meta: notice.detail,
          module: notice.module || 'home',
          params: {},
        });
      });

      flattenNavDestinations(filterNavTree(NAV[persona] || [], canNav)).forEach((item) => {
        if (!hit(item.label, item.group)) return;
        push('Go to', {
          id: item.key,
          title: item.label,
          meta: item.group ? `Navigation · ${item.group}` : 'Navigation',
          module: item.module,
          params: item.params || {},
        });
      });

      return [...groups.values()].flat().slice(0, SEARCH_RESULT_LIMIT);
    },
    [
      canAccessModule,
      canNav,
      canTab,
      isScoped,
      persona,
      scopedAccountIds,
      scopedAccounts,
      selectContacts,
      selectOperationalRecords,
      selectProducts,
      selectRoutes,
      selectSegments,
      state.apiIntegrations,
      state.config,
      state.notificationConfig,
      state.notifications,
      state.reportSpecs,
      state.reportSubscriptions,
    ]
  );

  const value = {
    state,
    dispatch,
    login,
    logout,
    setTheme,
    navigate,
    assistantOpen: !!state.assistantOpen,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    addAccount,
    updateAccount,
    saveDraft,
    deleteDraft,
    toast,
    toggleNotifRule,
    addApiIntegration,
    updateApiIntegration,
    deleteApiIntegration,
    isFollowingAccount,
    toggleFollowAccount,
    followedAccountIds: state.followedAccountIds || [],
    addNotificationRule,
    updateNotificationRule,
    deleteConfig,
    addConfig,
    upsertReportSpec,
    deleteReportSpec,
    reportSubscriptions: state.reportSubscriptions || [],
    createReportSubscription,
    updateReportSubscription,
    deleteReportSubscription,
    upsertAppLicense,
    updateWorkspaceSettings,
    saveImportMapping,
    markNotificationRead,
    markAllNotificationsRead,
    resetToSeed,
    resetData: resetToSeed,
    createRecord: addOperationalRecord,
    updateRecord: updateOperationalRecord,
    deleteRecord: deleteOperationalRecord,
    addContact,
    updateContact,
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
    canPreviewPersonas,
    personaViews,
    previewPersona,
    exitPersonaPreview,
    previewOrigin,
    isPreviewingPersona: !!previewOrigin,
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
