import { RECORD_SCHEMAS } from '../../../data/recordSchemas.js';
import { useStore } from '../../../state/storeHooks.js';
import { demoMutation, demoQuery } from './queryShape.js';

export function useRecords(kind, params) {
  const store = useStore();
  if (!kind) return demoQuery({ data: [], schema: null });
  return demoQuery({
    data: store.selectOperationalRecords(kind, params || {}),
    schema: RECORD_SCHEMAS[kind],
  });
}

export function useCreateRecord(kind) {
  const store = useStore();
  return demoMutation(async (record) => store.createRecord(kind, record));
}

export function useUpdateRecord(kind) {
  const store = useStore();
  return demoMutation(async ({ id, changes }) => {
    store.updateRecord(kind, id, changes);
    return { id, ...changes };
  });
}

export function useDeleteRecord(kind) {
  const store = useStore();
  return demoMutation(async (id) => {
    store.deleteRecord(kind, id);
    return { id };
  });
}

export function useContacts(accountId) {
  const store = useStore();
  return demoQuery(store.selectContacts(accountId));
}

export function useCreateContact() {
  const store = useStore();
  return demoMutation(async (contact) => store.addContact(contact));
}

export function useUpdateContact() {
  const store = useStore();
  return demoMutation(async ({ id, changes }) => {
    store.updateContact(id, changes);
    return { id, ...changes };
  });
}

export function useRoutes(accountId) {
  const store = useStore();
  return demoQuery(store.selectRoutes(accountId));
}

export function useCreateRoute() {
  const store = useStore();
  return demoMutation(async (route) => store.addRoute(route));
}

export function useBulkImport() {
  const store = useStore();
  return demoMutation(async ({ object, rows }) => {
    const OBJECT_MAP = {
      'Work Orders': { mode: 'operational', kind: 'workOrders' },
      Locations: { mode: 'operational', kind: 'locations' },
      Assets: { mode: 'operational', kind: 'assets' },
      Contacts: { mode: 'contact' },
      Routes: { mode: 'route' },
    };
    const meta = OBJECT_MAP[object];
    const accountIdByName = Object.fromEntries(store.state.accounts.map((a) => [a.name, a.id]));
    let imported = 0;
    let failed = 0;
    rows.forEach((row) => {
      const accountId = accountIdByName[row.account];
      if (!accountId || !meta) {
        failed += 1;
        return;
      }
      if (meta.mode === 'operational') {
        store.createRecord(meta.kind, { ...row, accountId });
      } else if (meta.mode === 'contact') {
        store.addContact({ ...row, accountId });
      } else if (meta.mode === 'route') {
        store.addRoute({
          accountId,
          routeNumber: row.routeNumber,
          truck: row.truck,
          driver: row.driver,
          status: row.status || 'Planned',
        });
      }
      imported += 1;
    });
    return { imported, failed, data: [] };
  });
}
