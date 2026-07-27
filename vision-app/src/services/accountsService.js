import { apiClient } from '../lib/apiClient.js';

export const accountsService = {
  list() {
    return apiClient.get('/accounts').then((r) => r.data.data);
  },
  get(id) {
    return apiClient.get(`/accounts/${id}`).then((r) => r.data);
  },
  create(account) {
    return apiClient.post('/accounts', account).then((r) => r.data.data);
  },
  users() {
    return apiClient.get('/users').then((r) => r.data.data);
  },
  segments(accountId) {
    return apiClient
      .get('/segments', { params: accountId ? { accountId } : undefined })
      .then((r) => r.data.data);
  },
  products(accountId) {
    return apiClient
      .get('/products', { params: accountId ? { accountId } : undefined })
      .then((r) => r.data.data);
  },
};
