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
  createApiIntegration(item) {
    return apiClient.post('/api-integrations', item).then((r) => r.data.data);
  },
  updateApiIntegration(id, changes) {
    return apiClient.patch(`/api-integrations/${id}`, changes).then((r) => r.data.data);
  },
  notificationConfig() {
    return apiClient.get('/notifications/config').then((r) => r.data.data);
  },
  createNotificationRule(item) {
    return apiClient.post('/notifications/config', item).then((r) => r.data.data);
  },
  updateNotificationRule(id, changes) {
    return apiClient.patch(`/notifications/config/${id}`, changes).then((r) => r.data.data);
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
  reportSpecs() {
    return apiClient.get('/analytics/reports').then((r) => r.data.data);
  },
  upsertReportSpec(item) {
    if (item.id) {
      return apiClient
        .put(`/analytics/reports/${item.id}`, item)
        .then((r) => r.data.data);
    }
    return apiClient.post('/analytics/reports', item).then((r) => r.data.data);
  },
  deleteReportSpec(id) {
    return apiClient.delete(`/analytics/reports/${id}`).then((r) => r.data.data);
  },
  appLicenses() {
    return apiClient.get('/app-licenses').then((r) => r.data.data);
  },
  upsertAppLicense(item) {
    if (item.id) {
      return apiClient.patch(`/app-licenses/${item.id}`, item).then((r) => r.data.data);
    }
    return apiClient.post('/app-licenses', item).then((r) => r.data.data);
  },
  workspaceSettings() {
    return apiClient.get('/workspace/settings').then((r) => r.data.data);
  },
  updateWorkspaceSettings(changes) {
    return apiClient.patch('/workspace/settings', changes).then((r) => r.data.data);
  },
  importMapping(objectKey) {
    return apiClient.get(`/bulk-import/mappings/${encodeURIComponent(objectKey)}`).then((r) => r.data.data);
  },
  saveImportMapping(objectKey, mapping) {
    return apiClient
      .put(`/bulk-import/mappings/${encodeURIComponent(objectKey)}`, mapping)
      .then((r) => r.data.data);
  },
  resetDev() {
    return apiClient.post('/dev/reset').then((r) => r.data);
  },
};
