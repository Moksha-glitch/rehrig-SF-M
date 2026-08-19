/**
 * RBAC model (Spec Ch.1, Ch.4, Ch.5).
 *
 * Access is persona × role:
 *   - Persona picks the nav tree (rehrig | sp | customer)
 *   - Role / PSG filters which items inside that tree are visible and routable
 */

// Permission Set Group labels shown in the UI
export const ROLE_PSG = {
  'rehrig:Admin': 'Rehrig Admin PSG',
  'sp:Admin': 'SP Admin PSG',
  'sp:Ops Manager': 'SP Back-Office PSG',
  'sp:Field Tech': 'SP Field Tech PSG',
  'sp:Dispatcher': 'SP Dispatcher PSG',
  'sp:Analyst': 'SP Analyst (read-only)',
  'sp:Maintenance Admin': 'SP Maintenance Admin PSG',
  'customer:Portal User': 'Customer Portal',
};

/**
 * Allowed sidebar nav `key` values per persona:role.
 * `null` = every item in that persona's tree is allowed.
 */
export const ROLE_NAV_KEYS = {
  // Rehrig — platform oversight only (no operational Related lists)
  'rehrig:Admin': null,

  // SP Admin — full operator surface
  'sp:Admin': null,

  // Ops Manager / Back-Office — ops data, no Segments / MRP / Request-Type config / WOIT
  'sp:Ops Manager': [
    'assistant',
    'home',
    'notifications',
    'details',
    'mindmap',
    'r-products',
    'r-contacts',
    'r-assets',
    'r-locations',
    'r-customers',
    'r-manage',
    'r-masterProducts',
    'r-dispatches',
    'r-notes',
    'r-workOrders',
    'r-aggTips',
    'r-trucks',
    'r-indTips',
    'r-routes',
    'r-notif',
    'mapCenter',
    'devices',
    'reports',
    'dashboards',
    'reportSubs',
    'chatter',
    'approvals',
    'customerInsights',
    'recordSharing',
    'automationCenter',
    'holidays',
  ],

  // Field Tech — assigned Work Orders + Assets only (+ Map, Details)
  'sp:Field Tech': ['assistant', 'home', 'details', 'r-assets', 'r-workOrders', 'mapCenter', 'chatter'],

  // Dispatcher — Dispatches / WOs / Routes / Assets / Trucks; no Contacts or Segments
  'sp:Dispatcher': [
    'assistant',
    'home',
    'notifications',
    'details',
    'mindmap',
    'r-assets',
    'r-locations',
    'r-dispatches',
    'r-notes',
    'r-workOrders',
    'r-aggTips',
    'r-trucks',
    'r-indTips',
    'r-routes',
    'mapCenter',
    'devices',
    'reports',
    'chatter',
    'approvals',
  ],

  // Analyst — dashboards / reports (read-only); no mutate tools
  'sp:Analyst': [
    'assistant',
    'home',
    'details',
    'reports',
    'dashboards',
    'reportSubs',
    'r-aggTips',
    'r-indTips',
    'customerInsights',
  ],

  // Maintenance Admin — assets, trucks, MRP, assigned WOs
  'sp:Maintenance Admin': [
    'assistant',
    'home',
    'details',
    'r-assets',
    'r-workOrders',
    'r-trucks',
    'r-mrp',
    'mapCenter',
    'chatter',
    'approvals',
  ],

  // Customer portal
  'customer:Portal User': null,
};

/**
 * Module keys the router may open for each persona:role.
 * Must stay in sync with ROLE_NAV_KEYS (and account-tab destinations).
 */
export const ROLE_MODULES = {
  'rehrig:Admin': [
    'home',
    'notifications',
    'accounts',
    'accountDetail',
    'contacts',
    'customers',
    'serviceTypes',
    'locationTypes',
    'assetTypes',
    'productTypes',
    'device',
    'truck',
    'apiIntegrations',
    'notificationConfig',
    'reportSubscriptions',
    'analytics',
    'onboarding',
    'contractOnboarding',
    'setup',
    'userAccount',
    'qalert',
    'holidays',
    'loginHistory',
    'chatter',
    'approvals',
    'customerInsights',
    'recordSharing',
  ],

  'sp:Admin': [
    'home',
    'notifications',
    'account',
    'assets',
    'locations',
    'dispatches',
    'workOrders',
    'trucks',
    'maintenanceRouteProfiles',
    'notesAttachments',
    'requestTypeResolutions',
    'aggregatedTips',
    'individualTips',
    'mapCenter',
    'bulkImport',
    'analytics',
    'devices',
    'reportSubscriptions',
    'productTypes',
    'notificationConfig',
    'setup',
    'userAccount',
    'chatter',
    'approvals',
    'customerInsights',
    'recordSharing',
    'automationCenter',
    'holidays',
  ],

  'sp:Ops Manager': [
    'home',
    'notifications',
    'account',
    'assets',
    'locations',
    'dispatches',
    'workOrders',
    'trucks',
    'notesAttachments',
    'aggregatedTips',
    'individualTips',
    'mapCenter',
    'analytics',
    'devices',
    'reportSubscriptions',
    'productTypes',
    'userAccount',
    'chatter',
    'approvals',
    'customerInsights',
    'recordSharing',
    'automationCenter',
    'holidays',
  ],

  'sp:Field Tech': ['home', 'account', 'assets', 'workOrders', 'mapCenter', 'userAccount', 'chatter'],

  'sp:Maintenance Admin': [
    'home',
    'account',
    'assets',
    'workOrders',
    'trucks',
    'maintenanceRouteProfiles',
    'mapCenter',
    'userAccount',
    'chatter',
    'approvals',
  ],

  'sp:Dispatcher': [
    'home',
    'notifications',
    'account',
    'assets',
    'locations',
    'dispatches',
    'workOrders',
    'trucks',
    'notesAttachments',
    'aggregatedTips',
    'individualTips',
    'mapCenter',
    'analytics',
    'devices',
    'userAccount',
    'chatter',
    'approvals',
  ],

  'sp:Analyst': [
    'home',
    'account',
    'aggregatedTips',
    'individualTips',
    'analytics',
    'reportSubscriptions',
    'userAccount',
    'customerInsights',
  ],

  'customer:Portal User': [
    'home',
    'myLocations',
    'myWorkOrders',
    'myNotifications',
    'myAccount',
    'userAccount',
  ],
};

/** Account-detail tabs each SP role may open */
export const ROLE_ACCOUNT_TABS = {
  'sp:Admin': [
    'details',
    'contacts',
    'customers',
    'products',
    'segments',
    'routes',
    'notifications',
    'mindmap',
  ],
  'sp:Ops Manager': [
    'details',
    'contacts',
    'customers',
    'products',
    'routes',
    'notifications',
    'mindmap',
  ],
  'sp:Field Tech': ['details'],
  'sp:Dispatcher': ['details', 'routes', 'mindmap'],
  'sp:Analyst': ['details'],
  'sp:Maintenance Admin': ['details'],
  'rehrig:Admin': [
    'details',
    'contacts',
    'customers',
    'products',
    'segments',
    'routes',
    'notifications',
    'mindmap',
  ],
};

export function roleKey(user) {
  if (!user) return null;
  return `${user.persona}:${user.role}`;
}

export function getPsgLabel(user) {
  return ROLE_PSG[roleKey(user)] || 'No PSG';
}

export function getAllowedNavKeys(user) {
  const k = roleKey(user);
  if (!k) return [];
  return ROLE_NAV_KEYS[k] === undefined ? [] : ROLE_NAV_KEYS[k];
}

export function getAllowedModules(user) {
  const k = roleKey(user);
  return ROLE_MODULES[k] || [];
}

export function canAccessModuleForUser(user, moduleKey) {
  if (!user || !user.active) return false;
  return getAllowedModules(user).includes(moduleKey);
}

export function canAccessNavKey(user, navKey) {
  if (!user || !user.active) return false;
  const allowed = getAllowedNavKeys(user);
  if (allowed === null) return true; // full tree for this role
  return allowed.includes(navKey);
}

export function canAccessAccountTab(user, tab) {
  if (!user || !user.active) return false;
  const tabs = ROLE_ACCOUNT_TABS[roleKey(user)];
  if (!tabs) return false;
  return tabs.includes(tab);
}

/** Who may preview the workspace as another persona (Rehrig admin only) */
export function canPreviewPersonasForUser(user) {
  return !!(user?.active && user.persona === 'rehrig' && user.role === 'Admin');
}

/** Who may create Service Provider accounts */
export function canCreateAccountsForUser(user) {
  return !!(user?.active && user.persona === 'rehrig' && user.role === 'Admin');
}

/** Who may create operational records (WO, Asset, …) */
export function canCreateRecordsForUser(user) {
  if (!user?.active) return false;
  if (user.persona === 'customer') return false;
  if (user.persona === 'rehrig') return false; // oversight only
  // Field Tech + Analyst are read-only
  if (user.role === 'Field Tech' || user.role === 'Analyst' || user.role === 'Read-Only') return false;
  return true;
}
