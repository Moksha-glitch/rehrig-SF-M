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

  // Ops Manager / Back-Office — ops data, no Segments / MRP / Request-Type config / Bulk Import
  'sp:Ops Manager': [
    'home',
    'details',
    'mindmap',
    'r-products',
    'r-contacts',
    'r-assets',
    'r-locations',
    'r-customers',
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
    'activity',
    'reportSubs',
  ],

  // Field Tech — assigned Work Orders + Assets only (+ Map, Details)
  'sp:Field Tech': ['home', 'details', 'r-assets', 'r-workOrders', 'mapCenter'],

  // Dispatcher — Dispatches / WOs / Routes / Assets / Trucks; no Contacts or Segments
  'sp:Dispatcher': [
    'home',
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
    'activity',
  ],

  // Analyst — dashboards / reports (read-only); no mutate tools
  'sp:Analyst': [
    'home',
    'details',
    'reports',
    'dashboards',
    'activity',
    'reportSubs',
    'r-aggTips',
    'r-indTips',
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
    'accounts',
    'accountDetail',
    'contacts',
    'serviceTypes',
    'locationTypes',
    'assetTypes',
    'productTypes',
    'apiIntegrations',
    'notificationConfig',
    'reportSubscriptions',
    'activity',
    'onboarding',
    'contractOnboarding',
    'setup',
  ],

  'sp:Admin': [
    'home',
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
    'activity',
    'devices',
    'reportSubscriptions',
  ],

  'sp:Ops Manager': [
    'home',
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
    'activity',
    'devices',
    'reportSubscriptions',
  ],

  'sp:Field Tech': ['home', 'account', 'assets', 'workOrders', 'mapCenter'],

  'sp:Dispatcher': [
    'home',
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
    'activity',
    'devices',
  ],

  'sp:Analyst': [
    'home',
    'account',
    'aggregatedTips',
    'individualTips',
    'analytics',
    'activity',
    'reportSubscriptions',
  ],

  'customer:Portal User': ['home', 'myLocations', 'myWorkOrders', 'myNotifications', 'myAccount'],
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
  if (user.role === 'Field Tech' || user.role === 'Analyst') return false;
  return true;
}
