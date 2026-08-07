import {
  ACCOUNTS,
  API_INTEGRATIONS,
  CONFIG_ASSET_TYPES,
  CONFIG_LOCATION_TYPES,
  CONFIG_PRODUCT_TYPES,
  CONFIG_SERVICE_TYPES,
  CONTACTS,
  NOTIFICATION_CONFIG,
  PRODUCTS_BY_ACCOUNT,
  ROUTES,
  SEGMENTS,
  USERS,
} from '../data/seed.js';
import { RECORD_SCHEMAS } from '../data/recordSchemas.js';
import { DEFAULT_WORKSPACE_SETTINGS, SEED_APP_LICENSES } from '../data/appLauncher.js';
import { SEED_REPORT_SPECS } from '../data/reportStudio.js';

export const STORAGE_VERSION = 1;
export const STORAGE_KEY = `vision.demo.v${STORAGE_VERSION}`;
export const REMEMBER_KEY = 'vision.demo.remember';
export const SESSION_USER_KEY = 'vision.demo.sessionUserId';
export const THEME_KEY = 'vision.theme';

const clone = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

function readRememberPreference() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(REMEMBER_KEY) !== '0';
}

function resolvePersistedUserId(storedUserId) {
  if (typeof window === 'undefined') return storedUserId || null;
  if (readRememberPreference() && storedUserId) return storedUserId;
  return window.sessionStorage.getItem(SESSION_USER_KEY) || null;
}

const accountIdByName = Object.fromEntries(ACCOUNTS.map((account) => [account.name, account.id]));

function inferAccountId(kind, record) {
  if (record.accountId) return record.accountId;
  if (record.account && accountIdByName[record.account]) return accountIdByName[record.account];
  if (kind === 'locations' && record.city === 'Toronto') return 'acc-212883';
  return 'acc-212880';
}

function seedOperationalRecords() {
  return Object.fromEntries(
    Object.entries(RECORD_SCHEMAS).map(([kind, schema]) => [
      kind,
      schema.sample.map((record, index) => ({
        ...clone(record),
        id: record.id || `${kind}-${index + 1}`,
        accountId: inferAccountId(kind, record),
      })),
    ])
  );
}

export function createSeedState() {
  return {
    currentUser: null,
    theme: 'light',
    accounts: clone(ACCOUNTS),
    contacts: clone(CONTACTS),
    segments: clone(SEGMENTS),
    routes: clone(ROUTES),
    productsByAccount: clone(PRODUCTS_BY_ACCOUNT),
    operationalRecords: seedOperationalRecords(),
    apiIntegrations: clone(API_INTEGRATIONS),
    notificationConfig: clone(NOTIFICATION_CONFIG),
    notifications: [
      {
        id: 'notice-1',
        title: 'Route delayed',
        detail: 'Edmonton route R-202 is running behind schedule.',
        severity: 'warning',
        module: 'dispatches',
        read: false,
        createdAt: '2026-07-01T13:20:00.000Z',
        accountId: 'acc-212880',
      },
      {
        id: 'notice-2',
        title: 'Work order completed',
        detail: 'Work order 03933888 was completed.',
        severity: 'success',
        module: 'workOrders',
        read: false,
        createdAt: '2026-07-01T12:05:00.000Z',
        accountId: 'acc-212881',
      },
      {
        id: 'notice-3',
        title: 'Integration needs review',
        detail: 'Legacy API traffic was detected.',
        severity: 'info',
        module: 'apiIntegrations',
        read: true,
        createdAt: '2026-06-30T18:30:00.000Z',
      },
    ],
    config: {
      serviceTypes: clone(CONFIG_SERVICE_TYPES),
      locationTypes: clone(CONFIG_LOCATION_TYPES),
      assetTypes: clone(CONFIG_ASSET_TYPES),
      productTypes: clone(CONFIG_PRODUCT_TYPES),
    },
    reportSpecs: clone(SEED_REPORT_SPECS),
    appLicenses: clone(SEED_APP_LICENSES),
    workspaceSettings: clone(DEFAULT_WORKSPACE_SETTINGS),
    importMappings: {},
    nav: { module: 'home', params: {} },
    toast: null,
    assistantOpen: false,
    drafts: [],
  };
}

function persistedState(state) {
  const { toast: _toast, assistantOpen: _assistantOpen, currentUser, ...rest } = state;
  const remember = readRememberPreference();
  return {
    ...rest,
    currentUserId: remember ? currentUser?.id || null : null,
  };
}

export const appRepository = {
  load() {
    const seed = createSeedState();
    if (typeof window === 'undefined') return seed;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const sessionId = window.sessionStorage.getItem(SESSION_USER_KEY);
        const sessionUser = USERS.find((candidate) => candidate.id === sessionId) || null;
        return { ...seed, currentUser: sessionUser };
      }
      const stored = JSON.parse(raw);
      if (stored.version !== STORAGE_VERSION || !stored.state) return seed;

      const userId = resolvePersistedUserId(stored.state.currentUserId);
      const user = USERS.find((candidate) => candidate.id === userId) || null;
      const { currentUserId: _currentUserId, ...saved } = stored.state;
      return {
        ...seed,
        ...saved,
        currentUser: user,
        config: { ...seed.config, ...(saved.config || {}) },
        operationalRecords: {
          ...seed.operationalRecords,
          ...(saved.operationalRecords || {}),
        },
        reportSpecs: Array.isArray(saved.reportSpecs) ? saved.reportSpecs : seed.reportSpecs,
        appLicenses: Array.isArray(saved.appLicenses) ? saved.appLicenses : seed.appLicenses,
        workspaceSettings: {
          ...seed.workspaceSettings,
          ...(saved.workspaceSettings || {}),
        },
        importMappings: { ...seed.importMappings, ...(saved.importMappings || {}) },
        toast: null,
        assistantOpen: false,
      };
    } catch {
      return seed;
    }
  },

  save(state) {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STORAGE_VERSION, state: persistedState(state) })
      );
      return true;
    } catch {
      return false;
    }
  },

  setRemember(remember) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  },

  setSessionUser(userId) {
    if (typeof window === 'undefined') return;
    if (userId) window.sessionStorage.setItem(SESSION_USER_KEY, userId);
    else window.sessionStorage.removeItem(SESSION_USER_KEY);
  },

  reset() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(SESSION_USER_KEY);
    }
    return createSeedState();
  },
};

export const preferences = {
  getTheme() {
    try {
      return window.localStorage.getItem(THEME_KEY) || 'light';
    } catch {
      return 'light';
    }
  },
  setTheme(theme) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  },
};
