import { apiClient } from '../lib/apiClient.js';

export const searchService = {
  search(q) {
    return apiClient.get('/search', { params: { q } }).then((r) => r.data.data);
  },
};
