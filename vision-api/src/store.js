import {
  ACCOUNTS,
  API_INTEGRATIONS,
  CONFIG_ASSET_TYPES,
  CONFIG_LOCATION_TYPES,
  CONFIG_PRODUCT_TYPES,
  CONFIG_SERVICE_TYPES,
  CONTACTS,
  HOT_TICKET_AGING,
  LIVE_DISPATCHES,
  MISSED_PICKUPS_30D,
  NOTIFICATION_CONFIG,
  PRIORITY_WORK_ORDERS,
  PRODUCTS_BY_ACCOUNT,
  ROUTES,
  SEGMENTS,
  USERS,
} from '../../vision-app/src/data/seed.js';
import { RECORD_SCHEMAS } from '../../vision-app/src/data/recordSchemas.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

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

function createSeedDb() {
  return {
    users: clone(USERS),
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
    drafts: [],
    analytics: {
      hotTicketAging: clone(HOT_TICKET_AGING),
      missedPickups30d: clone(MISSED_PICKUPS_30D),
      liveDispatches: clone(LIVE_DISPATCHES),
      priorityWorkOrders: clone(PRIORITY_WORK_ORDERS),
    },
    refreshTokens: new Set(),
  };
}

let db = createSeedDb();

export function getDb() {
  return db;
}

export function resetDb() {
  db = createSeedDb();
  return db;
}

export function publicUser(user) {
  if (!user) return null;
  const { password: _password, ...safe } = user;
  return safe;
}

export function scopeByUser(user, records, { accountField = 'accountId', accountNameField = 'account' } = {}) {
  if (!user) return [];
  const accountIds = user.accountIds || [];
  const segmentIds = user.segmentIds || [];
  if (!accountIds.length && !segmentIds.length) return records;

  const accountNames = new Set(
    db.accounts.filter((a) => accountIds.includes(a.id)).map((a) => a.name)
  );

  return records.filter((record) => {
    if (segmentIds.length && record.segmentId && segmentIds.includes(record.segmentId)) return true;
    if (accountIds.length && record[accountField] && accountIds.includes(record[accountField])) {
      return true;
    }
    if (accountNames.size && record[accountNameField] && accountNames.has(record[accountNameField])) {
      return true;
    }
    return false;
  });
}

export function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export { RECORD_SCHEMAS };
