import {
  ACCOUNTS,
  API_INTEGRATIONS,
  CONFIG_ASSET_TYPES,
  CONFIG_DEVICES,
  CONFIG_LOCATION_TYPES,
  CONFIG_PRODUCT_TYPES,
  CONFIG_SERVICE_TYPES,
  CONFIG_TRUCKS,
  CONTACTS,
  NOTIFICATION_CONFIG,
  PRODUCTS_BY_ACCOUNT,
  ROUTES,
  SEGMENTS,
  USERS,
} from '../data/seed.js';
import { RECORD_SCHEMAS } from '../data/recordSchemas.js';
import {
  DEFAULT_WORKSPACE_SETTINGS,
  SEED_APP_LICENSES,
  SEED_REPORT_SUBSCRIPTIONS,
} from '../data/appLauncher.js';
import { SEED_REPORT_SPECS } from '../data/reportStudio.js';

export const STORAGE_VERSION = 1;
export const STORAGE_KEY = `vision.app.v${STORAGE_VERSION}`;
export const REMEMBER_KEY = 'vision.app.remember';
export const SESSION_USER_KEY = 'vision.app.sessionUserId';
export const THEME_KEY = 'vision.theme';
export const FOLLOWED_ACCOUNTS_KEY = 'vision.app.followedAccountIds';
export const REPORT_SUBSCRIPTIONS_KEY = 'vision.app.reportSubscriptions';

const LEGACY_STORAGE_KEY = `vision.demo.v${STORAGE_VERSION}`;
const LEGACY_REMEMBER_KEY = 'vision.demo.remember';
const LEGACY_SESSION_USER_KEY = 'vision.demo.sessionUserId';

const clone = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

function migrateLegacyKeys() {
  if (typeof window === 'undefined') return;
  try {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        window.localStorage.setItem(STORAGE_KEY, legacy);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    if (window.localStorage.getItem(REMEMBER_KEY) == null) {
      const legacyRemember = window.localStorage.getItem(LEGACY_REMEMBER_KEY);
      if (legacyRemember != null) {
        window.localStorage.setItem(REMEMBER_KEY, legacyRemember);
        window.localStorage.removeItem(LEGACY_REMEMBER_KEY);
      }
    }
    if (!window.sessionStorage.getItem(SESSION_USER_KEY)) {
      const legacySession = window.sessionStorage.getItem(LEGACY_SESSION_USER_KEY);
      if (legacySession) {
        window.sessionStorage.setItem(SESSION_USER_KEY, legacySession);
        window.sessionStorage.removeItem(LEGACY_SESSION_USER_KEY);
      }
    }
  } catch {
    /* ignore */
  }
}

function readRememberPreference() {
  if (typeof window === 'undefined') return true;
  migrateLegacyKeys();
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
    theme: preferences.getTheme(),
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
      device: clone(CONFIG_DEVICES),
      truck: clone(CONFIG_TRUCKS),
    },
    reportSpecs: clone(SEED_REPORT_SPECS),
    reportSubscriptions: clone(SEED_REPORT_SUBSCRIPTIONS),
    appLicenses: clone(SEED_APP_LICENSES),
    workspaceSettings: clone(DEFAULT_WORKSPACE_SETTINGS),
    importMappings: {},
    followedAccountIds: [],
    previewOriginUserId: null,
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

function readFollowedAccountIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FOLLOWED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeFollowedAccountIds(ids) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FOLLOWED_ACCOUNTS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function readReportSubscriptions() {
  if (typeof window === 'undefined') return clone(SEED_REPORT_SUBSCRIPTIONS);
  try {
    const raw = window.localStorage.getItem(REPORT_SUBSCRIPTIONS_KEY);
    if (!raw) return clone(SEED_REPORT_SUBSCRIPTIONS);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(SEED_REPORT_SUBSCRIPTIONS);
  } catch {
    return clone(SEED_REPORT_SUBSCRIPTIONS);
  }
}

function writeReportSubscriptions(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REPORT_SUBSCRIPTIONS_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export const appRepository = {
  load() {
    const seed = createSeedState();
    if (typeof window === 'undefined') return seed;

    migrateLegacyKeys();

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const sessionId = window.sessionStorage.getItem(SESSION_USER_KEY);
        const sessionUser = USERS.find((candidate) => candidate.id === sessionId) || null;
        return {
          ...seed,
          theme: preferences.getTheme(),
          currentUser: sessionUser,
          followedAccountIds: readFollowedAccountIds(),
        };
      }
      const stored = JSON.parse(raw);
      if (stored.version !== STORAGE_VERSION || !stored.state) return seed;

      const userId = resolvePersistedUserId(stored.state.currentUserId);
      const user = USERS.find((candidate) => candidate.id === userId) || null;
      const { currentUserId: _currentUserId, ...saved } = stored.state;
      const followedFromState = Array.isArray(saved.followedAccountIds)
        ? saved.followedAccountIds
        : readFollowedAccountIds();
      writeFollowedAccountIds(followedFromState);
      return {
        ...seed,
        ...saved,
        theme: preferences.getTheme(),
        currentUser: user,
        followedAccountIds: followedFromState,
        config: { ...seed.config, ...(saved.config || {}) },
        operationalRecords: {
          ...seed.operationalRecords,
          ...(saved.operationalRecords || {}),
        },
        reportSpecs: Array.isArray(saved.reportSpecs) ? saved.reportSpecs : seed.reportSpecs,
        reportSubscriptions: Array.isArray(saved.reportSubscriptions)
          ? saved.reportSubscriptions
          : seed.reportSubscriptions,
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
      migrateLegacyKeys();
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STORAGE_VERSION, state: persistedState(state) })
      );
      if (Array.isArray(state.followedAccountIds)) {
        writeFollowedAccountIds(state.followedAccountIds);
      }
      if (Array.isArray(state.reportSubscriptions)) {
        writeReportSubscriptions(state.reportSubscriptions);
      }
      return true;
    } catch {
      return false;
    }
  },

  setRemember(remember) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  },

  getRemember() {
    return readRememberPreference();
  },

  setSessionUser(userId) {
    if (typeof window === 'undefined') return;
    if (userId) window.sessionStorage.setItem(SESSION_USER_KEY, userId);
    else window.sessionStorage.removeItem(SESSION_USER_KEY);
  },

  getFollowedAccountIds() {
    return readFollowedAccountIds();
  },

  setFollowedAccountIds(ids) {
    writeFollowedAccountIds(Array.isArray(ids) ? ids : []);
  },

  getReportSubscriptions() {
    return readReportSubscriptions();
  },

  setReportSubscriptions(items) {
    const next = Array.isArray(items) ? items : [];
    writeReportSubscriptions(next);
    return next;
  },

  toggleFollowedAccount(accountId) {
    const current = readFollowedAccountIds();
    const next = current.includes(accountId)
      ? current.filter((id) => id !== accountId)
      : [...current, accountId];
    writeFollowedAccountIds(next);
    return next;
  },

  reset() {
    if (typeof window !== 'undefined') {
      migrateLegacyKeys();
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      window.localStorage.removeItem(FOLLOWED_ACCOUNTS_KEY);
      window.localStorage.removeItem(REPORT_SUBSCRIPTIONS_KEY);
      window.sessionStorage.removeItem(SESSION_USER_KEY);
      window.sessionStorage.removeItem(LEGACY_SESSION_USER_KEY);
    }
    return createSeedState();
  },
};

export const preferences = {
  getTheme() {
    try {
      const stored = window.localStorage.getItem(THEME_KEY);
      return stored === 'dark' || stored === 'system' ? stored : 'light';
    } catch {
      return 'light';
    }
  },
  setTheme(theme) {
    try {
      window.localStorage.setItem(
        THEME_KEY,
        theme === 'dark' || theme === 'system' ? theme : 'light'
      );
    } catch {
      /* ignore */
    }
  },
};
