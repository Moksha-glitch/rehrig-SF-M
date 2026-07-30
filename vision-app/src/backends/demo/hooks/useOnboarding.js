import { useStore } from '../../../state/storeHooks.js';
import { extractContractFile } from '../assistant.js';
import { demoMutation, demoQuery } from './queryShape.js';

const EMPTY_ADDRESS = { country: '', street: '', city: '', state: '', zip: '' };
const EMPTY_NOTIF = {
  enableTab: false,
  send: false,
  messageLimit: 1,
  timeZone: '',
  startTime: '',
  endTime: '',
  emailSendTime: '',
  smsSendTime: '',
  smsFailed: false,
  phoneFailed: false,
  sendGridFailed: false,
};

function normalizeServiceTypes(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeAddress(value) {
  return { ...EMPTY_ADDRESS, ...(value || {}) };
}

function normalizeContact(contact, accountId) {
  const firstName = (contact.firstName || '').trim();
  const lastName = (contact.lastName || '').trim();
  const portal = !!contact.portal;
  return {
    ...contact,
    accountId,
    firstName,
    lastName,
    name: (contact.name || `${firstName} ${lastName}`).trim(),
    email: (contact.email || '').trim(),
    roleTitle: contact.roleTitle || contact.role || '',
    title: contact.title || contact.roleTitle || contact.role || '',
    isUserCreated: contact.isUserCreated ?? portal,
    isUserActive: contact.isUserActive ?? portal,
    segment: contact.segment || '',
  };
}

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
    const extras = form.accountExtras || {};
    const account = {
      id: `acc-${Date.now().toString(36)}`,
      name: form.companyName || form.name,
      uid: form.registrationNumber || form.uid,
      type: form.type || extras.type || 'Customer',
      industry: form.industry || extras.industry || 'Municipal',
      phone: form.phone || '',
      owner: store.state.currentUser?.alias || '',
      ownerName: extras.ownerName || store.state.currentUser?.name || '',
      website: form.website || '',
      description: form.description || 'Created from onboarding.',
      employees: Number(form.employees) || 0,
      serviceModules: form.serviceModules || '',
      hardwareType: form.hardwareType || '',
      inactive: !!extras.inactive,
      supportEmail: form.signatoryEmail || form.supportEmail || '',
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
      ...extras,
      serviceTypes: normalizeServiceTypes(form.serviceTypes ?? extras.serviceTypes),
      billing: normalizeAddress(form.billing || extras.billing),
      shipping: normalizeAddress(form.shipping || extras.shipping || form.billing || extras.billing),
      notif: { ...EMPTY_NOTIF, ...(extras.notif || form.notif || {}) },
    };
    store.addAccount(account, payload.fromDraftId || form.fromDraftId || null);
    (form.contacts || []).forEach((c) => {
      store.addContact(normalizeContact(c, account.id));
    });
    (form.routes || []).forEach((r) => store.addRoute({ ...r, accountId: account.id }));
    return account;
  });
}

export function useExtractContract() {
  return demoMutation(async (file) => extractContractFile(file));
}
