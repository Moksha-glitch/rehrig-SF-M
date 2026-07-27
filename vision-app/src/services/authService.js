import { apiClient } from '../lib/apiClient.js';

export const authService = {
  login(email, password) {
    return apiClient.post('/auth/login', { email, password }).then((r) => r.data);
  },
  refresh(refreshToken) {
    return apiClient.post('/auth/refresh', { refreshToken }).then((r) => r.data);
  },
  logout(refreshToken) {
    return apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data);
  },
  me() {
    return apiClient.get('/me').then((r) => r.data);
  },
  demoUsers() {
    return apiClient.get('/auth/demo-users').then((r) => r.data.data);
  },
};
