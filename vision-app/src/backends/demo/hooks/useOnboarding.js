import { useStore } from '../../../state/storeHooks.js';
import { extractContractFile } from '../assistant.js';
import { demoMutation, demoQuery } from './queryShape.js';

export function useDrafts() {
  const store = useStore();
  return demoQuery(store.state.drafts || []);
}

export function useSaveDraft() {
  const store = useStore();
  return demoMutation(async (draft) => {
    store.saveDraft(draft);
    return draft;
  });
}

export function useDeleteDraft() {
  const store = useStore();
  return demoMutation(async (id) => {
    store.deleteDraft(id);
    return { ok: true };
  });
}

export function useCompleteOnboarding() {
  const store = useStore();
  return demoMutation(async (payload) => {
    const form = payload.form || payload;
    const account = {
      id: `acc-${Date.now().toString(36)}`,
      name: form.companyName || form.name,
      uid: form.registrationNumber || form.uid,
      type: form.type || 'Customer',
      industry: form.industry || 'Municipal',
      phone: form.phone || '',
      owner: store.state.currentUser?.alias || '',
      ownerName: store.state.currentUser?.name || '',
      website: form.website || '',
      description: form.description || 'Created from onboarding.',
      employees: Number(form.employees) || 0,
      serviceTypes: Array.isArray(form.serviceTypes)
        ? form.serviceTypes
        : String(form.serviceTypes || '')
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
      serviceModules: form.serviceModules || '',
      hardwareType: form.hardwareType || '',
      inactive: false,
      supportEmail: form.signatoryEmail || form.supportEmail || '',
      billing: form.billing || { country: '', street: '', city: '', state: '', zip: '' },
      shipping:
        form.shipping || form.billing || { country: '', street: '', city: '', state: '', zip: '' },
      paymentRequired: !!form.paymentRequired,
      apiIntegrated: !!form.apiIntegrated,
      onboardingComplete: true,
      residents: Number(form.residents) || 0,
      contract: form.contract || {
        value: form.contractValue,
        startDate: form.startDate,
        endDate: form.endDate,
        signatoryName: form.signatoryName,
      },
      addedDate: new Date().toISOString().slice(0, 10),
      createdBy: `${store.state.currentUser?.name || 'Vision user'}, ${new Date().toLocaleString()}`,
      lastModifiedBy: `${store.state.currentUser?.name || 'Vision user'}, ${new Date().toLocaleString()}`,
      ...(form.accountExtras || {}),
    };
    store.addAccount(account, payload.fromDraftId || form.fromDraftId || null);
    (form.contacts || []).forEach((c) => store.addContact({ ...c, accountId: account.id }));
    (form.routes || []).forEach((r) => store.addRoute({ ...r, accountId: account.id }));
    return account;
  });
}

export function useExtractContract() {
  return demoMutation(async (file) => extractContractFile(file));
}
