import { apiClient } from '../lib/apiClient.js';

export const onboardingService = {
  listDrafts() {
    return apiClient.get('/drafts').then((r) => r.data.data);
  },
  saveDraft(draft) {
    return apiClient.post('/drafts', draft).then((r) => r.data.data);
  },
  deleteDraft(id) {
    return apiClient.delete(`/drafts/${id}`).then((r) => r.data);
  },
  complete(payload) {
    return apiClient.post('/onboarding/accounts', payload).then((r) => r.data.data);
  },
  extractContract(file) {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post('/uploads/contract', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },
};
