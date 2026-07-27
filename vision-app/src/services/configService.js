import { apiClient } from '../lib/apiClient.js';

export const configService = {
  list(configKey) {
    return apiClient.get(`/config/${configKey}`).then((r) => r.data.data);
  },
  create(configKey, item) {
    return apiClient.post(`/config/${configKey}`, item).then((r) => r.data.data);
  },
  remove(configKey, id) {
    return apiClient.delete(`/config/${configKey}/${id}`).then((r) => r.data.data);
  },
  apiIntegrations() {
    return apiClient.get('/api-integrations').then((r) => r.data.data);
  },
  notificationConfig() {
    return apiClient.get('/notifications/config').then((r) => r.data.data);
  },
  toggleNotification(id, enabled) {
    return apiClient.patch(`/notifications/config/${id}`, { enabled }).then((r) => r.data.data);
  },
  notifications() {
    return apiClient.get('/notifications').then((r) => r.data.data);
  },
  markRead(id) {
    return apiClient.patch(`/notifications/${id}/read`).then((r) => r.data.data);
  },
  markAllRead() {
    return apiClient.post('/notifications/read-all').then((r) => r.data);
  },
  dashboardAnalytics() {
    return apiClient.get('/analytics/dashboard').then((r) => r.data.data);
  },
  resetDev() {
    return apiClient.post('/dev/reset').then((r) => r.data);
  },
};
