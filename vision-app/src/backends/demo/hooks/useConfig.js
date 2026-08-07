import {
  HOT_TICKET_AGING,
  LIVE_DISPATCHES,
  MISSED_PICKUPS_30D,
  PRIORITY_WORK_ORDERS,
} from '../../../data/seed.js';
import { useStore } from '../../../state/storeHooks.js';
import { demoMutation, demoQuery } from './queryShape.js';

export function useConfigList(configKey) {
  const store = useStore();
  if (!configKey) return demoQuery([]);
  return demoQuery(store.state.config?.[configKey] || []);
}

export function useApiIntegrations() {
  const store = useStore();
  return demoQuery(store.state.apiIntegrations || []);
}

export function useNotificationConfig() {
  const store = useStore();
  return demoQuery(store.state.notificationConfig || []);
}

export function useNotifications() {
  const store = useStore();
  return demoQuery(store.state.notifications || []);
}

export function useDashboardAnalytics() {
  const store = useStore();
  const names = new Set(store.scopedAccounts.map((a) => a.name));
  return demoQuery({
    hotTicketAging: HOT_TICKET_AGING.filter((row) => names.has(row.name)),
    missedPickups30d: MISSED_PICKUPS_30D,
    liveDispatches: LIVE_DISPATCHES.filter((d) => names.has(d.account)),
    priorityWorkOrders: PRIORITY_WORK_ORDERS.filter((w) => names.has(w.account)),
  });
}

export function useConfigMutations(configKey) {
  const store = useStore();
  return {
    create: demoMutation(async (item) => {
      store.addConfig(configKey, item);
      return item;
    }),
    remove: demoMutation(async (id) => {
      store.deleteConfig(configKey, id);
      return { id };
    }),
  };
}

export function useApiIntegrationMutations() {
  const store = useStore();
  return {
    create: demoMutation(async (item) => store.addApiIntegration(item)),
    update: demoMutation(async ({ id, changes }) => store.updateApiIntegration(id, changes)),
  };
}

export function useNotificationRuleMutations() {
  const store = useStore();
  return {
    create: demoMutation(async (item) => store.addNotificationRule(item)),
    update: demoMutation(async ({ id, changes }) => store.updateNotificationRule(id, changes)),
  };
}

export function useToggleNotificationRule() {
  const store = useStore();
  return demoMutation(async ({ id }) => {
    store.toggleNotifRule(id);
    return { id };
  });
}

export function useMarkNotifications() {
  const store = useStore();
  return {
    markOne: demoMutation(async (id) => {
      store.markNotificationRead(id);
      return { id };
    }),
    markAll: demoMutation(async () => {
      store.markAllNotificationsRead();
      return { ok: true };
    }),
  };
}

export function useReportSpecs() {
  const store = useStore();
  return demoQuery(store.state.reportSpecs || []);
}

export function useReportMutations() {
  const store = useStore();
  return {
    upsert: demoMutation(async (item) => store.upsertReportSpec(item)),
    remove: demoMutation(async (id) => store.deleteReportSpec(id)),
  };
}

export function useAppLicenses() {
  const store = useStore();
  return demoQuery(store.state.appLicenses || []);
}

export function useAppLicenseMutations() {
  const store = useStore();
  return {
    upsert: demoMutation(async (item) => store.upsertAppLicense(item)),
  };
}

export function useWorkspaceSettings() {
  const store = useStore();
  return demoQuery(store.state.workspaceSettings || {});
}

export function useWorkspaceMutations() {
  const store = useStore();
  return {
    update: demoMutation(async (changes) => store.updateWorkspaceSettings(changes)),
  };
}

export function useImportMapping(objectKey) {
  const store = useStore();
  return demoQuery((store.state.importMappings || {})[objectKey] || null);
}

export function useImportMappingMutations() {
  const store = useStore();
  return {
    save: demoMutation(async ({ objectKey, mapping }) =>
      store.saveImportMapping(objectKey, mapping)
    ),
  };
}
