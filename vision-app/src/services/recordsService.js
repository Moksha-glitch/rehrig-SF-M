import { apiClient } from '../lib/apiClient.js';

export const recordsService = {
  list(kind, params) {
    return apiClient.get(`/records/${kind}`, { params }).then((r) => r.data);
  },
  create(kind, record) {
    return apiClient.post(`/records/${kind}`, record).then((r) => r.data.data);
  },
  update(kind, id, changes) {
    return apiClient.patch(`/records/${kind}/${id}`, changes).then((r) => r.data.data);
  },
  remove(kind, id) {
    return apiClient.delete(`/records/${kind}/${id}`).then((r) => r.data.data);
  },
  contacts(accountId) {
    return apiClient
      .get('/contacts', { params: accountId ? { accountId } : undefined })
      .then((r) => r.data.data);
  },
  createContact(contact) {
    return apiClient.post('/contacts', contact).then((r) => r.data.data);
  },
  routes(accountId) {
    return apiClient
      .get('/routes', { params: accountId ? { accountId } : undefined })
      .then((r) => r.data.data);
  },
  createRoute(route) {
    return apiClient.post('/routes', route).then((r) => r.data.data);
  },
  importRows(object, rows) {
    return apiClient
      .post(`/imports/${encodeURIComponent(object)}`, { rows })
      .then((r) => r.data);
  },
};
