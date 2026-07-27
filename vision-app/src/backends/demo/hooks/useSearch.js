import { useStore } from '../../../state/storeHooks.js';
import { demoQuery } from './queryShape.js';

export function useSearch(query) {
  const store = useStore();
  const q = (query || '').trim();
  if (q.length < 2) return demoQuery([]);
  return demoQuery(store.searchRecords(q));
}
