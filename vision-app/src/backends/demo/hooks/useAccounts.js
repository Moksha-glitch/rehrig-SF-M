import { USERS } from '../../../data/seed.js';
import { useStore } from '../../../state/storeHooks.js';
import { demoMutation, demoQuery } from './queryShape.js';

export function useAccounts() {
  const store = useStore();
  return demoQuery(store.selectAccounts());
}

export function useAccount(accountId) {
  const store = useStore();
  const account = store.state.accounts.find((a) => a.id === accountId);
  if (!account) return demoQuery(null);
  return demoQuery({
    data: account,
    contacts: store.selectContacts(account.id),
    segments: store.selectSegments(account.id),
    routes: store.selectRoutes(account.id),
    products: store.selectProducts(account.id),
    customers: USERS.filter(
      (u) => u.persona === 'customer' && u.accountIds?.includes(account.id)
    ),
  });
}

export function useCreateAccount() {
  const store = useStore();
  return demoMutation(async (account) => {
    store.addAccount(account, account.fromDraftId || null);
    return account;
  });
}

export function useUsers() {
  return demoQuery(USERS);
}

export function useSegments(accountId) {
  const store = useStore();
  return demoQuery(store.selectSegments(accountId));
}

export function useProducts(accountId) {
  const store = useStore();
  return demoQuery(store.selectProducts(accountId));
}
