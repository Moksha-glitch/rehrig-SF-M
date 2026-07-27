import {
  ROLE_MODULES,
  ROLE_NAV_KEYS,
  ROLE_ACCOUNT_TABS,
  ROLE_PSG,
  canCreateAccountsForUser,
  canCreateRecordsForUser,
  getAllowedModules,
  roleKey,
} from '../../vision-app/src/data/rbac.js';

export {
  ROLE_MODULES,
  ROLE_NAV_KEYS,
  ROLE_ACCOUNT_TABS,
  ROLE_PSG,
  canCreateAccountsForUser,
  canCreateRecordsForUser,
  getAllowedModules,
  roleKey,
};

export function permissionsFor(user) {
  return {
    modules: getAllowedModules(user),
    navKeys: ROLE_NAV_KEYS[roleKey(user)] === undefined ? [] : ROLE_NAV_KEYS[roleKey(user)],
    accountTabs: ROLE_ACCOUNT_TABS[roleKey(user)] || [],
    psgLabel: ROLE_PSG[roleKey(user)] || 'No PSG',
    canCreateAccounts: canCreateAccountsForUser(user),
    canCreateRecords: canCreateRecordsForUser(user),
  };
}

export function assertModule(user, moduleKey) {
  const allowed = getAllowedModules(user);
  if (!allowed.includes(moduleKey)) {
    const err = new Error('You do not have access to this resource.');
    err.status = 403;
    throw err;
  }
}
