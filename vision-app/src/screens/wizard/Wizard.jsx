import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Icon from '../../components/Icon.jsx';
import {
  Field,
  TextInput,
  TextArea,
  Select,
  Checkbox,
  Toggle,
  Dialog,
} from '../../components/UI.jsx';
import { PICKLISTS, HARDWARE_TYPES, SERVICE_TYPE_CARDS, DAY_LABELS } from '../../data/picklists.js';
import { MASTER_CATALOG, WIZARD_PRODUCTS } from '../../data/seed.js';
import { useStore } from '../../state/AppStore.jsx';
import { useCompleteOnboarding, useDrafts, useSaveDraft } from '../../hooks/useOnboarding.js';
import { getErrorMessage } from '../../lib/errors.js';
import {
  EntryChoice,
  FileConfirm,
  WizardChatbot,
  getMissingWizardFields,
  extractContractFile,
  mockParseWizardChat,
} from './WizardAssist.jsx';
import {
  STEPS,
  isStepComplete,
  getStepStatuses,
  nextRequiredIncompleteStep,
  pendingIssues,
  applyWizardFieldUpdate,
  completeNoteForStep,
  countRequiredChatFields,
  stepForErrorKey,
  requiredErrors,
} from './wizardSteps.js';

const emptyAddress = { country: 'United States', street: '', city: '', state: '', zip: '' };
const emptyRoute = () => ({ routeNumber: '', collectionType: 'Trash', days: [false, false, false, false, false, false, false], frequency: 'Weekly' });
const emptyContact = (role) => ({ firstName: '', lastName: '', email: '', role, portal: true });

function HeroBanner({ children }) {
  return (
    <div className="mb-5 border-y border-line py-4 text-sm leading-relaxed text-ink-muted">
      {children}
    </div>
  );
}

function PreviewBanner({ children }) {
  return (
    <div className="mt-5 border border-dashed border-line-strong bg-elevated p-4">
      <div className="type-overline mb-1">Live preview</div>
      <p className="text-sm text-ink-muted">{children}</p>
    </div>
  );
}

function hasFormProgress(f, phase, step) {
  if (phase === 'confirm' || phase === 'extracting' || phase === 'steps') return true;
  if (step > 0) return true;
  return Boolean(
    f.accountName?.trim() ||
      f.uid?.trim() ||
      f.phone?.trim() ||
      f.website?.trim() ||
      f.description?.trim() ||
      f.supportEmail?.trim() ||
      (f.serviceTypes && f.serviceTypes.length > 0)
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UID_RE = /^[A-Z0-9][A-Z0-9-]{2,9}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

function validWebsite(value) {
  if (!value?.trim()) return true;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return !!url.hostname.includes('.');
  } catch {
    return false;
  }
}

function validateWizard(f) {
  const errors = {};
  const required = (key, value, label) => {
    if (!String(value ?? '').trim()) errors[key] = `${label} is required.`;
  };

  required('accountName', f.accountName, 'Account name');
  if (f.accountName?.trim() && f.accountName.trim().length < 3) errors.accountName = 'Use at least 3 characters.';
  required('uid', f.uid, 'Service Provider UID');
  if (f.uid && !UID_RE.test(f.uid.trim())) errors.uid = 'Use 3–10 uppercase letters, numbers, or hyphens.';
  required('phone', f.phone, 'Phone');
  if (f.phone && (!PHONE_RE.test(f.phone.trim()) || (f.phone.match(/\d/g) || []).length < 7)) {
    errors.phone = 'Enter a valid phone number with at least 7 digits.';
  }
  if (f.supportEmail && !EMAIL_RE.test(f.supportEmail.trim())) errors.supportEmail = 'Enter a valid email address.';
  if (!validWebsite(f.website)) errors.website = 'Enter a valid website, such as example.com.';
  if (!Number.isInteger(Number(f.employees)) || Number(f.employees) < 0) errors.employees = 'Enter a whole number of 0 or more.';
  if (!f.serviceTypes?.length) errors.serviceTypes = 'Select at least one service type.';
  if (f.enableAutoHotTicket && (!Number.isInteger(Number(f.autoHotTicketDays)) || Number(f.autoHotTicketDays) < 1)) {
    errors.autoHotTicketDays = 'Enter a whole number of at least 1.';
  }
  if (!Number.isInteger(Number(f.notif?.messageLimit)) || Number(f.notif?.messageLimit) < 1) {
    errors.messageLimit = 'Enter a whole number of at least 1.';
  }
  ['billing', ...(f.sameAsBilling ? [] : ['shipping'])].forEach((kind) => {
    ['street', 'city', 'state', 'zip'].forEach((field) => required(`${kind}.${field}`, f[kind]?.[field], `${kind === 'billing' ? 'Billing' : 'Shipping'} ${field}`));
  });
  const selectedProducts = Object.entries(f.products || {}).filter(([, p]) => p.selected);
  if (!selectedProducts.length) errors.products = 'Select at least one product.';
  selectedProducts.forEach(([code, product]) => {
    if ((product.rename || '').length > 100) errors[`products.${code}`] = 'Product names must be 100 characters or fewer.';
  });
  if (!f.routes?.length) errors.routes = 'Add at least one route.';
  f.routes?.forEach((route, i) => {
    required(`routes.${i}.routeNumber`, route.routeNumber, `Route ${i + 1} number`);
    if (!route.days?.some(Boolean)) errors[`routes.${i}.days`] = `Choose at least one day for route ${i + 1}.`;
  });
  if (!f.contacts?.length) errors.contacts = 'Add at least one contact.';
  f.contacts?.forEach((contact, i) => {
    required(`contacts.${i}.firstName`, contact.firstName, `Contact ${i + 1} first name`);
    required(`contacts.${i}.lastName`, contact.lastName, `Contact ${i + 1} last name`);
    required(`contacts.${i}.email`, contact.email, `Contact ${i + 1} email`);
    if (contact.email && !EMAIL_RE.test(contact.email.trim())) errors[`contacts.${i}.email`] = 'Enter a valid email address.';
  });
  return errors;
}

function InlineError({ message }) {
  return message ? <p className="mt-1 text-xs text-danger" role="alert">{message}</p> : null;
}

export default function Wizard({ onClose, draftId = null }) {
  const { state, navigate, toast } = useStore();
  const draftsQuery = useDrafts();
  const saveDraftMutation = useSaveDraft();
  const completeOnboarding = useCompleteOnboarding();
  const existingDraft = draftId
    ? (draftsQuery.data || []).find((d) => d.id === draftId)
    : null;

  // entry: choose | confirm | extracting | steps
  const [phase, setPhase] = useState(existingDraft?.phase || 'choose');
  const [pendingFile, setPendingFile] = useState(null);
  const [fileName, setFileName] = useState(existingDraft?.fileName || '');
  const [fromContract, setFromContract] = useState(!!existingDraft?.fromContract);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatFocusKey, setChatFocusKey] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState(existingDraft?.id || null);
  const [extractionError, setExtractionError] = useState('');
  const [chatError, setChatError] = useState('');
  const [draftError, setDraftError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const extractionRun = useRef(0);
  const chatRun = useRef(0);
  const extractionFile = useRef(null);
  const lastChatAnswer = useRef('');
  const mounted = useRef(true);
  const msgId = useRef(0);
  const stepCompleteSnap = useRef(null);
  const prevStepForChat = useRef(null);
  const skipAutoNav = useRef(false);

  const [step, setStep] = useState(existingDraft?.step ?? 0);
  const [visited, setVisited] = useState(existingDraft?.visited || { 0: true });
  const [focusFieldKey, setFocusFieldKey] = useState(null);

  const [f, setF] = useState(() => {
    if (existingDraft?.form) {
      return existingDraft.form.sameAsBilling
        ? { ...existingDraft.form, shipping: { ...existingDraft.form.billing } }
        : existingDraft.form;
    }
    return {
      accountName: '',
      accountOwner: state.currentUser?.name || 'Yolanda Wagner',
      type: 'Customer',
      parentAccount: '',
      website: '',
      phone: '',
      description: '',
      industry: 'Municipal',
      uid: '',
      employees: 0,
      supportEmail: '',
      inactive: false,
      serviceTypes: [],
      modules: '',
      enableAutoWO: true,
      enableAutoHotTicket: true,
      autoHotTicketDays: 1,
      enableMoveBurntCarts: false,
      notif: {
        enableTab: true,
        send: true,
        messageLimit: 100,
        timeZone: 'America/Edmonton',
        startTime: '07:00',
        endTime: '20:00',
        emailSendTime: '08:00',
        smsSendTime: '09:00',
        smsFailed: false,
        phoneFailed: false,
        sendGridFailed: false,
      },
      hardwareType: 'RFID',
      trackObservations: false,
      trackSafetyEvents: false,
      billing: { ...emptyAddress },
      shipping: { ...emptyAddress },
      sameAsBilling: false,
      products: {},
      routes: [emptyRoute()],
      contacts: [emptyContact('Service Provider Admin')],
    };
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      extractionRun.current += 1;
      chatRun.current += 1;
    };
  }, []);

  const set = (patch) => {
    if (chatBusy) {
      chatRun.current += 1;
      setChatBusy(false);
    }
    setF((prev) => {
    const next = { ...prev, ...patch };
    if ((prev.sameAsBilling && patch.billing) || patch.sameAsBilling === true) {
      next.shipping = { ...next.billing };
    }
    return next;
    });
  };
  const setNotif = (patch) => setF((prev) => ({ ...prev, notif: { ...prev.notif, ...patch } }));

  const validationErrors = useMemo(() => validateWizard(f), [f]);
  const blockingErrors = useMemo(() => requiredErrors(validationErrors), [validationErrors]);
  const isValid = Object.keys(blockingErrors).length === 0;
  const stepStatuses = useMemo(() => getStepStatuses(validationErrors), [validationErrors]);
  const stepComplete = isStepComplete(validationErrors, step);
  const missingFields = useMemo(
    () => getMissingWizardFields(f, validationErrors, step),
    [f, validationErrors, step]
  );
  const missingKeys = useMemo(() => new Set(missingFields.map((x) => x.key)), [missingFields]);
  const reviewIssues = useMemo(() => pendingIssues(validationErrors), [validationErrors]);
  const sectionNote = completeNoteForStep(step, stepComplete);
  const showChat = phase === 'steps' && chatOpen;

  const pushMessage = useCallback((role, text, options = []) => {
    msgId.current += 1;
    setMessages((prev) => [...prev, { id: msgId.current, role, text, options }]);
  }, []);

  const handleChatUpdate = useCallback((field, value) => {
    if (!field) return;
    setF((prev) => {
      const next = applyWizardFieldUpdate(prev, field, value);
      if (next.sameAsBilling && (field.startsWith('billing.') || field === 'sameAsBilling')) {
        next.shipping = { ...next.billing };
      }
      return next;
    });
  }, []);

  const canNext = useMemo(
    () => isStepComplete(validationErrors, step),
    [step, validationErrors]
  );

  const jumpToStep = useCallback((i, fieldKey = null) => {
    skipAutoNav.current = true;
    setStep(i);
    setVisited((v) => ({ ...v, [i]: true }));
    setFocusFieldKey(fieldKey);
    setShowErrors(true);
  }, []);

  const goto = (i) => {
    // Sequential navigation + already-visited steps; Review jump uses jumpToStep directly
    if (visited[i] || i <= step) {
      jumpToStep(i);
    }
  };
  const next = () => {
    setShowErrors(true);
    if (step < 7 && canNext) {
      skipAutoNav.current = true;
      const n = step + 1;
      setStep(n);
      setVisited((v) => ({ ...v, [n]: true }));
    }
  };
  const back = () => {
    if (step > 0) {
      skipAutoNav.current = true;
      setStep(step - 1);
    }
  };

  // Auto-advance to the next required incomplete step once the current required step is complete
  useEffect(() => {
    if (phase !== 'steps') return;
    const complete = isStepComplete(validationErrors, step);
    if (stepCompleteSnap.current == null || stepCompleteSnap.current.step !== step) {
      stepCompleteSnap.current = { step, complete };
      return;
    }
    if (skipAutoNav.current) {
      skipAutoNav.current = false;
      stepCompleteSnap.current = { step, complete };
      return;
    }
    const wasComplete = stepCompleteSnap.current.complete;
    stepCompleteSnap.current = { step, complete };
    if (!wasComplete && complete && STEPS[step]?.required && step < 7) {
      const n = nextRequiredIncompleteStep(validationErrors, step);
      if (n != null && n !== step) {
        setStep(n);
        setVisited((v) => ({ ...v, [n]: true }));
      }
    }
  }, [validationErrors, step, phase]);

  // Refresh assistant context when the step changes while the panel is open
  useEffect(() => {
    if (phase !== 'steps') return;
    if (prevStepForChat.current === step) return;
    const changed = prevStepForChat.current != null;
    prevStepForChat.current = step;
    if (!changed || !chatOpen) return;
    setMessages([]);
    setChatError('');
    const fields = getMissingWizardFields(f, validationErrors, step);
    const note = completeNoteForStep(step, isStepComplete(validationErrors, step));
    if (note) {
      setChatFocusKey(null);
      pushMessage('assistant', note);
    } else if (fields[0]) {
      setChatFocusKey(fields[0].key);
      pushMessage('assistant', fields[0].question, fields.map((x) => x.label));
    }
  }, [step, phase, chatOpen, f, validationErrors, pushMessage]);

  // Scroll / focus a field after jumping from Review
  useEffect(() => {
    if (!focusFieldKey || phase !== 'steps') return;
    const id = `wizard-field-${focusFieldKey.replace(/\./g, '-')}`;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id) || document.querySelector(`[data-wizard-field="${focusFieldKey}"]`);
      el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      const input = el?.querySelector?.('input, textarea, select, button') || el;
      if (input && typeof input.focus === 'function') input.focus();
      setFocusFieldKey(null);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [focusFieldKey, step, phase]);

  const toggleServiceType = (key) =>
    set({
      serviceTypes: f.serviceTypes.includes(key)
        ? f.serviceTypes.filter((s) => s !== key)
        : [...f.serviceTypes, key],
    });

  const toggleSameAsBilling = (checked) => {
    if (checked) set({ sameAsBilling: true, shipping: { ...f.billing } });
    else set({ sameAsBilling: false });
  };

  const setProduct = (code, patch) =>
    set({ products: { ...f.products, [code]: { ...(f.products[code] || {}), ...patch } } });

  const addRoute = () => set({ routes: [...f.routes, emptyRoute()] });
  const removeRoute = (i) => set({ routes: f.routes.filter((_, k) => k !== i) });
  const setRoute = (i, patch) =>
    set({ routes: f.routes.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const toggleRouteDay = (i, d) =>
    set({
      routes: f.routes.map((r, k) =>
        k === i ? { ...r, days: r.days.map((x, j) => (j === d ? !x : x)) } : r
      ),
    });

  const addContact = () => set({ contacts: [...f.contacts, emptyContact('Dispatcher')] });
  const removeContact = (i) => set({ contacts: f.contacts.filter((_, k) => k !== i) });
  const setContact = (i, patch) =>
    set({ contacts: f.contacts.map((c, k) => (k === i ? { ...c, ...patch } : c)) });

  const startManual = () => {
    setFromContract(false);
    setChatOpen(false);
    setChatBusy(false);
    setChatFocusKey(null);
    setChatError('');
    setMessages([]);
    setPhase('steps');
    setStep(0);
    setVisited({ 0: true });
    prevStepForChat.current = 0;
    stepCompleteSnap.current = null;
  };

  const selectContractFile = (file) => {
    extractionFile.current = file;
    setExtractionError('');
    setPendingFile(file);
    setFileName(file.name);
    setPhase('confirm');
  };

  const cancelPendingFile = () => {
    extractionRun.current += 1;
    setPendingFile(null);
    setFileName('');
    setPhase('choose');
  };

  const changePendingFile = (file) => {
    extractionFile.current = file;
    setExtractionError('');
    setPendingFile(file);
    setFileName(file.name);
  };

  const handleContractFile = async (file) => {
    if (!file) return;
    const run = ++extractionRun.current;
    extractionFile.current = file;
    setExtractionError('');
    setPendingFile(null);
    setFileName(file.name);
    setPhase('extracting');
    setFromContract(true);
    try {
    const extracted = await extractContractFile(file);
    if (!mounted.current || run !== extractionRun.current) return;
    let mergedForm = null;
    setF((prev) => {
      mergedForm = {
        ...prev,
        accountName: extracted.accountName,
        uid: extracted.uid,
        phone: extracted.phone,
        website: extracted.website,
        supportEmail: extracted.supportEmail,
        industry: extracted.industry,
        type: extracted.type,
        description: extracted.description,
        employees: extracted.employees,
        serviceTypes: extracted.serviceTypes || [],
        modules: extracted.modules || '',
        billing: { ...prev.billing, ...extracted.billing },
        shipping: { ...prev.shipping, ...extracted.billing },
        sameAsBilling: true,
      };
      return mergedForm;
    });
    setPhase('steps');
    setStep(0);
    setVisited({ 0: true });
    setChatOpen(true);
    prevStepForChat.current = 0;
    stepCompleteSnap.current = null;

    const errs = validateWizard(mergedForm);
    const still = getMissingWizardFields(mergedForm, errs, 0);
    if (still.length) {
      setChatFocusKey(still[0].key);
      pushMessage(
        'assistant',
        `Extracted from **${file.name}**. ${still[0].question}`,
        still.map((x) => x.label)
      );
    } else {
      setChatFocusKey(null);
      pushMessage('assistant', completeNoteForStep(0, true) || 'Extraction complete. This section looks good.');
    }
    } catch (error) {
      if (!mounted.current || run !== extractionRun.current) return;
      setExtractionError(error?.message || 'We could not extract this contract. Try again.');
    }
  };

  const cancelExtraction = () => {
    extractionRun.current += 1;
    setExtractionError('');
    setPendingFile(null);
    setFileName('');
    setFromContract(false);
    setPhase('choose');
  };

  const handleChatSend = async (text) => {
    const answer = text.trim();
    if (!answer || chatBusy) return;
    pushMessage('user', answer);
    lastChatAnswer.current = answer;
    setChatBusy(true);
    setChatError('');
    const run = ++chatRun.current;
    try {
      const result = await mockParseWizardChat(answer, missingFields, chatFocusKey);
      if (!mounted.current || run !== chatRun.current) return;

      if (result.selectField) {
        setChatFocusKey(result.selectField);
        pushMessage('assistant', result.reply);
        return;
      }

      let nextMissing = missingFields;
      if (result.field && result.value != null) {
        handleChatUpdate(result.field, result.value);
        nextMissing = missingFields.filter((x) => x.key !== result.field);
      }
      if (result.field && nextMissing.length > 0) {
        setChatFocusKey(nextMissing[0].key);
        pushMessage('assistant', result.reply);
      } else if (result.field && nextMissing.length === 0) {
        setChatFocusKey(null);
        pushMessage('assistant', result.reply);
      } else {
        pushMessage('assistant', result.reply);
      }
    } catch (error) {
      if (!mounted.current || run !== chatRun.current) return;
      setChatError(error?.message || 'The assistant could not process that response. Please retry.');
    } finally {
      if (mounted.current && run === chatRun.current) setChatBusy(false);
    }
  };

  const activate = async () => {
    setShowErrors(true);
    if (!isValid) {
      const firstKey = Object.keys(blockingErrors)[0];
      jumpToStep(stepForErrorKey(firstKey), firstKey);
      return;
    }
    const selectedProducts = Object.entries(f.products).filter(([, v]) => v.selected);
    try {
      const account = await completeOnboarding.mutateAsync({
        fromDraftId: activeDraftId,
        form: {
          companyName: f.accountName,
          name: f.accountName,
          registrationNumber: f.uid,
          uid: f.uid,
          type: f.type,
          industry: f.industry,
          phone: f.phone,
          website: f.website,
          description: f.description,
          employees: Number(f.employees) || 0,
          serviceTypes: f.serviceTypes,
          serviceModules: f.modules,
          hardwareType: f.hardwareType,
          supportEmail: f.supportEmail,
          billing: { ...f.billing },
          shipping: f.sameAsBilling ? { ...f.billing } : { ...f.shipping },
          paymentRequired: false,
          apiIntegrated: false,
          contacts: f.contacts,
          routes: f.routes,
          accountExtras: {
            ownerName: f.accountOwner,
            trackObservations: f.trackObservations,
            trackSafetyEvents: f.trackSafetyEvents,
            enableAutoWO: f.enableAutoWO,
            enableAutoHotTicket: f.enableAutoHotTicket,
            autoHotTicketDays: f.autoHotTicketDays,
            enableMoveBurntCarts: f.enableMoveBurntCarts,
            inactive: f.inactive,
            notif: { ...f.notif },
            _wizardProducts: selectedProducts.map(([code, v]) => ({
              code,
              rename: v.rename || '',
            })),
          },
        },
      });
      toast('Service Provider onboarded');
      navigate('accountDetail', { accountId: account.id, tab: 'details' });
    } catch (error) {
      toast(getErrorMessage(error, 'Onboarding failed. Please try again.'), 'danger');
    }
  };

  const requestClose = () => {
    if (hasFormProgress(f, phase, step)) setCancelOpen(true);
    else onClose();
  };

  const discardAndClose = () => {
    setCancelOpen(false);
    onClose();
  };

  const saveAsDraftAndClose = () => {
    const id = activeDraftId || `draft-${Date.now()}`;
    const name = f.accountName?.trim() || 'Untitled draft';
    setDraftError('');
    try {
    const draft = {
      id,
      name,
      form: JSON.parse(JSON.stringify(f)),
      phase: phase === 'extracting' ? 'steps' : phase === 'confirm' ? 'choose' : phase,
      step,
      visited,
      fileName,
      fromContract,
      updatedAt: new Date().toISOString(),
      ownerName: state.currentUser?.name || '',
      industry: f.industry || '',
    };
    saveDraftMutation
      .mutateAsync(draft)
      .then(() => {
        setActiveDraftId(id);
        setCancelOpen(false);
        toast('Draft saved');
        navigate('accounts');
      })
      .catch((error) => {
        setDraftError(getErrorMessage(error, 'Draft could not be saved. Keep editing and try again.'));
      });
    } catch (error) {
      setDraftError(error?.message || 'Draft could not be saved. Keep editing and try again.');
    }
  };

  return (
    <section
      aria-labelledby="wizard-title"
      className="flex h-full min-h-0 flex-1 flex-col bg-surface animate-fade-up"
    >
      {/* Header */}
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-surface px-6 py-5 sm:px-8">
        <div className="min-w-0">
          <p className="type-overline">Onboarding</p>
          <h1 id="wizard-title" className="font-display mt-1.5 text-title-md text-ink">
            Onboard Service Provider
          </h1>
          <div className="mt-1 text-sm text-ink-muted">
            {phase === 'choose' || phase === 'confirm' || phase === 'extracting'
              ? phase === 'confirm'
                ? 'Confirm the contract file before extraction'
                : 'Upload a contract or fill in the details manually'
              : 'Guided setup based on the VISION onboarding process'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'steps' && (
            <button
              type="button"
              onClick={() => {
                if (chatOpen) {
                  setChatOpen(false);
                  return;
                }
                setChatOpen(true);
                setMessages([]);
                setChatError('');
                if (sectionNote) {
                  setChatFocusKey(null);
                  pushMessage('assistant', sectionNote);
                } else if (missingFields[0]) {
                  setChatFocusKey(missingFields[0].key);
                  pushMessage(
                    'assistant',
                    missingFields[0].question,
                    missingFields.map((x) => x.label)
                  );
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 text-xs font-medium interactive ${
                showChat
                  ? 'border-brand/40 bg-brand-soft text-brand-ink'
                  : 'border-line text-ink-muted hover:bg-elevated'
              }`}
            >
              <Icon name="help" size={14} />
              {showChat ? 'Hide assistant' : 'AI assistant'}
              {missingFields.length > 0 && (
                <span className="mono rounded-control bg-warn-soft px-1.5 text-[10px] font-semibold text-warn">
                  {missingFields.length}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={requestClose}
            className="rounded-control p-1.5 text-ink-faint interactive hover:bg-elevated"
            aria-label="Leave onboarding"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      </header>

      {/* First screen: upload + fill manually together */}
      {(phase === 'choose' || phase === 'extracting') && (
        <>
          <EntryChoice
            onSelectFile={selectContractFile}
            onManual={startManual}
            extracting={phase === 'extracting'}
            fileName={fileName}
            onCancelExtraction={cancelExtraction}
            extractionError={extractionError}
            onRetry={() => handleContractFile(extractionFile.current)}
          />
          {phase === 'choose' && (
            <div className="flex shrink-0 items-center justify-between border-t border-line bg-elevated/30 px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={requestClose}
                className="text-sm font-medium text-ink-muted interactive hover:text-ink"
              >
                Cancel
              </button>
              <span className="text-xs text-ink-faint">Choose an option above to continue</span>
            </div>
          )}
        </>
      )}

      {phase === 'confirm' && (
        <FileConfirm
          file={pendingFile}
          onConfirm={() => handleContractFile(pendingFile)}
          onChangeFile={changePendingFile}
          onCancel={cancelPendingFile}
        />
      )}

      {/* 8-step wizard (after upload or manual) */}
      {phase === 'steps' && (
        <>
          <div className="relative flex min-h-0 flex-1">
            {/* Step rail */}
            <nav
              aria-label="Onboarding steps"
              className="hidden w-60 shrink-0 overflow-y-auto border-r border-line bg-elevated/70 px-3 py-4 md:block scroll-thin"
            >
              {fromContract && (
                <div className="mb-3 rounded-control border border-line bg-brand-soft px-3 py-2.5 text-[10px] text-brand-ink">
                  <span className="font-semibold">From contract</span>
                  <div className="mt-0.5 truncate text-brand">{fileName}</div>
                </div>
              )}
              {stepStatuses.map((s) => {
                const current = s.index === step;
                const done = s.complete && (visited[s.index] || s.index < step || !s.required);
                return (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => goto(s.index)}
                    className={`mb-1 flex w-full items-start gap-3 rounded-control px-3 py-2.5 text-left transition ${
                      current
                        ? 'bg-surface shadow-raise'
                        : s.highlight
                          ? 'bg-warn-soft/50 hover:bg-warn-soft'
                          : 'hover:bg-surface/70'
                    }`}
                  >
                    <span
                      className={`mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                        done
                          ? 'bg-success-soft text-success'
                          : current
                            ? 'bg-ink text-white'
                            : s.highlight
                              ? 'bg-warn-soft text-warn'
                              : 'text-ink-faint'
                      }`}
                    >
                      {done ? '✓' : String(s.index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm ${
                          current ? 'font-semibold text-ink' : s.highlight ? 'font-medium text-ink-soft' : 'text-ink-muted'
                        }`}
                      >
                        {s.title}
                      </span>
                      {s.required && (
                        <span className={`mt-0.5 block text-[10px] font-medium uppercase tracking-wide ${
                          done ? 'text-success' : 'text-warn'
                        }`}>
                          {done ? 'Complete' : 'Required'}
                        </span>
                      )}
                      {!s.required && (
                        <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                          Optional
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Step body */}
            <div className="min-w-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7 scroll-thin">
              <label className="mb-5 block md:hidden">
                <span className="type-overline mb-2 block">Onboarding step</span>
                <select
                  className="field-input"
                  value={step}
                  onChange={(e) => goto(Number(e.target.value))}
                >
                  {STEPS.map((item, i) => (
                    <option key={item.title} value={i} disabled={!visited[i] && i > step}>
                      {i + 1}. {item.title}
                      {item.required ? (stepStatuses[i]?.complete ? ' ✓' : ' *') : ''}
                    </option>
                  ))}
                </select>
              </label>
              <div className="type-overline flex items-center gap-2">
                Step {step + 1} of 8
                {STEPS[step]?.required ? (
                  <span className={`rounded-control px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    stepComplete ? 'bg-success-soft text-success' : 'bg-warn-soft text-warn'
                  }`}>
                    {stepComplete ? 'Complete' : 'Required'}
                  </span>
                ) : (
                  <span className="rounded-control bg-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                    Optional
                  </span>
                )}
              </div>
              <h2 className="font-display mt-2 text-title-lg text-ink">{STEPS[step].title}</h2>

              {missingFields.length > 0 && step < 7 && (
                <div className="mt-3 flex items-start gap-2 rounded-panel border border-line bg-warn-soft px-3 py-2.5">
                  <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warn" />
                  <div>
                    <div className="text-sm font-semibold text-ink-soft">
                      Missing required fields. Complete them here or use the AI assistant.
                    </div>
                    <div className="text-xs text-ink-muted">
                      Still needed: {missingFields.map((x) => x.label).join(', ')}
                    </div>
                  </div>
                </div>
              )}
              {stepComplete && step < 7 && (
                <div className="mt-3 flex items-start gap-2 rounded-panel border border-success/25 bg-success-soft px-3 py-2.5">
                  <Icon name="checkCircle" size={16} className="mt-0.5 shrink-0 text-success" />
                  <div className="text-sm font-medium text-ink-soft">
                    {sectionNote || 'This section looks good.'}
                  </div>
                </div>
              )}

              {step === 0 && (
                <Step1 f={f} set={set} missingKeys={missingKeys} errors={showErrors ? validationErrors : {}} />
              )}
              {step === 1 && (
                <Step2 f={f} set={set} setNotif={setNotif} toggleServiceType={toggleServiceType} errors={showErrors ? validationErrors : {}} />
              )}
              {step === 2 && <Step3 f={f} set={set} />}
              {step === 3 && <Step4 f={f} set={set} toggleSameAsBilling={toggleSameAsBilling} errors={showErrors ? validationErrors : {}} />}
              {step === 4 && <Step5 f={f} setProduct={setProduct} errors={showErrors ? validationErrors : {}} />}
              {step === 5 && (
                <Step6
                  f={f}
                  addRoute={addRoute}
                  removeRoute={removeRoute}
                  setRoute={setRoute}
                  toggleRouteDay={toggleRouteDay}
                  errors={showErrors ? validationErrors : {}}
                />
              )}
              {step === 6 && (
                <Step7
                  f={f}
                  addContact={addContact}
                  removeContact={removeContact}
                  setContact={setContact}
                  errors={showErrors ? validationErrors : {}}
                />
              )}
              {step === 7 && (
                <Step8
                  f={f}
                  errors={validationErrors}
                  issues={reviewIssues}
                  onJump={(issue) => jumpToStep(issue.step, issue.key)}
                  onOpenAssistant={() => {
                    setChatOpen(true);
                    setMessages([]);
                    if (reviewIssues[0]) {
                      setChatFocusKey(reviewIssues[0].key);
                      pushMessage(
                        'assistant',
                        `I can help finish onboarding. ${reviewIssues[0].message} What value should we use?`,
                        reviewIssues.map((x) => x.message.replace(/\.$/, ''))
                      );
                    } else {
                      pushMessage('assistant', completeNoteForStep(7, true));
                    }
                  }}
                />
              )}
            </div>

            {showChat && (
              <div className="absolute inset-0 z-20 flex flex-col bg-surface md:static md:z-auto md:w-80 lg:w-96 md:border-l md:border-line">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 md:hidden">
                  <p className="text-sm font-medium text-ink">AI assistant</p>
                  <button
                    type="button"
                    className="rounded-control border border-line px-2.5 py-1.5 text-xs font-semibold text-ink interactive hover:bg-elevated"
                    onClick={() => setChatOpen(false)}
                  >
                    Fill form manually
                  </button>
                </div>
                <WizardChatbot
                  variant="rail"
                  missingFields={missingFields}
                  focusedKey={chatFocusKey}
                  messages={messages}
                  onSend={handleChatSend}
                  onClose={() => setChatOpen(false)}
                  totalRequired={countRequiredChatFields(step, f, validationErrors) || missingFields.length || 1}
                  completeNote={sectionNote}
                  busy={chatBusy}
                />
                {chatError && (
                  <div className="flex items-center justify-between gap-3 border-t border-line p-3 text-xs text-danger" role="alert">
                    <span>{chatError}</span>
                    <button type="button" className="font-semibold underline" onClick={() => handleChatSend(lastChatAnswer.current)}>Retry</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky actions */}
          <div className="flex shrink-0 items-center justify-between border-t border-line bg-elevated/30 px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={requestClose}
              className="text-sm font-medium text-ink-muted interactive hover:text-ink"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2.5">
              {step > 0 && (
                <button type="button" onClick={back} className="btn-secondary">
                  <Icon name="chevronLeft" size={15} /> Back
                </button>
              )}
              {step < 7 ? (
                <button type="button" onClick={next} disabled={!canNext} className="btn-primary">
                  Next <Icon name="chevronRight" size={15} />
                </button>
              ) : (
                <button type="button" onClick={activate} disabled={!isValid} className="btn-brand disabled:cursor-not-allowed disabled:opacity-50">
                  <Icon name="check" size={15} /> Activate
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {cancelOpen && (
        <Dialog
          title="Discard entered data?"
          description="All entered data will be lost unless you save a draft. Drafts appear below active providers in the directory."
          onClose={() => setCancelOpen(false)}
        >
          <div className="px-6 py-4">
            <p className="type-overline mb-3">Leave onboarding?</p>
            {draftError && (
              <p className="mb-3 text-sm text-danger" role="alert">
                {draftError}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setCancelOpen(false)} className="btn-secondary">
                Keep editing
              </button>
              <button type="button" onClick={discardAndClose} className="btn-secondary">
                Discard
              </button>
              <button type="button" onClick={saveAsDraftAndClose} className="btn-primary">
                Save as draft
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
}

/* ---------------- Steps ---------------- */

function warnInput(missing) {
  return missing
    ? 'border-danger/50 bg-danger-soft focus:border-danger'
    : '';
}

function Step1({ f, set, missingKeys = new Set(), errors = {} }) {
  return (
    <>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
        Basic details — name, type, industry, and other account fields.
      </p>
      <div className="type-overline mt-7 text-brand">
        Account Information
      </div>
      <div className="mt-4 grid grid-cols-1 items-start gap-x-5 gap-y-5 sm:grid-cols-2">
        <Field label="Account Name" required>
          <div data-wizard-field="accountName" id="wizard-field-accountName">
            <TextInput
              placeholder="e.g. Boston Sanitation Co"
              value={f.accountName}
              className={warnInput(missingKeys.has('accountName') || errors.accountName)}
              onChange={(e) => set({ accountName: e.target.value })}
              aria-invalid={!!errors.accountName}
            />
            <InlineError message={errors.accountName} />
          </div>
        </Field>
        <Field label="Account Owner">
          <div className="field-input flex items-center gap-2 bg-elevated text-ink-muted">
            <Icon name="users" size={14} className="shrink-0 text-ink-faint" />
            <span className="truncate">{f.accountOwner}</span>
          </div>
        </Field>
        <Field label="Type">
          <Select options={PICKLISTS.accountType} value={f.type} onChange={(e) => set({ type: e.target.value })} />
        </Field>
        <Field label="Parent Account">
          <TextInput placeholder="Search accounts…" value={f.parentAccount} onChange={(e) => set({ parentAccount: e.target.value })} />
        </Field>
        <Field label="Website">
          <TextInput value={f.website} onChange={(e) => set({ website: e.target.value })} aria-invalid={!!errors.website} className={warnInput(errors.website)} />
          <InlineError message={errors.website} />
        </Field>
        <Field label="Phone" required>
          <div data-wizard-field="phone" id="wizard-field-phone">
            <TextInput
              value={f.phone}
              className={warnInput(missingKeys.has('phone') || errors.phone)}
              onChange={(e) => set({ phone: e.target.value })}
              aria-invalid={!!errors.phone}
            />
            <InlineError message={errors.phone} />
          </div>
        </Field>
        <Field label="Description" span2>
          <TextArea rows={2} value={f.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <Field label="Service Provider UID" required>
          <div data-wizard-field="uid" id="wizard-field-uid">
            <TextInput
              placeholder="10-char unique - e.g. EDMTNA8001"
              value={f.uid}
              className={warnInput(missingKeys.has('uid') || errors.uid)}
              onChange={(e) => set({ uid: e.target.value.toUpperCase().slice(0, 10) })}
              aria-invalid={!!errors.uid}
            />
            <InlineError message={errors.uid} />
          </div>
        </Field>
        <Field label="Industry">
          <Select options={PICKLISTS.industry} value={f.industry} onChange={(e) => set({ industry: e.target.value })} />
        </Field>
        <Field label="Employees">
          <TextInput type="number" min="0" step="1" value={f.employees} onChange={(e) => set({ employees: e.target.value })} aria-invalid={!!errors.employees} className={warnInput(errors.employees)} />
          <InlineError message={errors.employees} />
        </Field>
        <Field label="Support Email">
          <TextInput type="email" value={f.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} aria-invalid={!!errors.supportEmail} className={warnInput(errors.supportEmail)} />
          <InlineError message={errors.supportEmail} />
        </Field>
      </div>
      <div className="mt-5">
        <Checkbox label="Inactive" checked={f.inactive} onChange={(e) => set({ inactive: e.target.checked })} />
      </div>
      <div className="mt-5 flex gap-2.5 rounded-panel border border-line bg-warn-soft px-4 py-3.5 text-xs leading-relaxed text-ink-muted">
        <Icon name="info" size={15} className="mt-0.5 shrink-0 text-warn" />
        <span>
          Some standard SF fields (Parent Account, Number of Employees) are on the layout per v2 but
          unused in current ops. Legacy fields (Number of Weeks, JDEdwardsId, Is Tableau Cloud)
          removed from Vision 2.0 per audit.
        </span>
      </div>
    </>
  );
}

function Step2({ f, set, setNotif, toggleServiceType, errors = {} }) {
  const preview = `This Service Provider will deliver ${
    f.serviceTypes.length ? f.serviceTypes.join(' + ') : '—'
  }${f.modules ? `, using modules ${f.modules}` : ''}${
    f.enableAutoWO ? ', with auto work orders' : ''
  }${f.enableAutoHotTicket ? ` and hot ticket conversion after ${f.autoHotTicketDays}d` : ''}. Resident notifications: ${
    f.notif.send ? 'on' : 'off'
  }.`;
  return (
    <>
      <HeroBanner>
        <strong className="text-ink">What this SP delivers, and how workflow behaves.</strong> Pick
        service types, list operational modules, and set automation defaults for work orders and
        notifications.
      </HeroBanner>

      <div className="mb-2 text-sm">
        {f.serviceTypes.length === 0 ? (
          <span className="font-medium text-danger">None selected</span>
        ) : (
          <span className="font-medium text-ink-muted">{f.serviceTypes.length} selected</span>
        )}
      </div>
      <div data-wizard-field="serviceTypes" id="wizard-field-serviceTypes">
      <InlineError message={errors.serviceTypes} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SERVICE_TYPE_CARDS.map((c) => {
          const sel = f.serviceTypes.includes(c.key);
          return (
            <button
              key={c.key}
              onClick={() => toggleServiceType(c.key)}
              className={`rounded-panel border p-4 text-left transition ${
                sel ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{c.key}</span>
                {sel && <Icon name="checkCircle" size={16} className="text-brand" />}
              </div>
              <div className="mt-1 text-xs font-medium text-ink-muted">{c.tagline}</div>
              <div className="mt-1 text-xs text-ink-faint">{c.detail}</div>
            </button>
          );
        })}
      </div>
      </div>

      <Field label="Operational Modules" className="mt-5">
        <TextInput
          placeholder="e.g. Route, Dispatch, Repair, Bulk Pickup"
          value={f.modules}
          onChange={(e) => set({ modules: e.target.value })}
        />
      </Field>

      {/* Automation panels */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-panel border border-line p-4">
          <div className="text-sm font-semibold text-ink">Automated Work Orders</div>
          <div className="mt-3">
            <Checkbox label="Enable Auto WO" checked={f.enableAutoWO} onChange={(e) => set({ enableAutoWO: e.target.checked })} />
          </div>
        </div>
        <div className="rounded-panel border border-line p-4">
          <div className="text-sm font-semibold text-ink">Hot Ticket Conversion</div>
          <div className="mt-3 space-y-3">
            <Checkbox label="Enable Auto Hot Ticket" checked={f.enableAutoHotTicket} onChange={(e) => set({ enableAutoHotTicket: e.target.checked })} />
            <Field label="Auto Hot Ticket Days">
              <TextInput
                type="number"
                min="1"
                step="1"
                value={f.autoHotTicketDays}
                disabled={!f.enableAutoHotTicket}
                onChange={(e) => set({ autoHotTicketDays: e.target.value })}
                aria-invalid={!!errors.autoHotTicketDays}
                className={warnInput(errors.autoHotTicketDays)}
              />
              <InlineError message={errors.autoHotTicketDays} />
            </Field>
          </div>
        </div>
        <div className="rounded-panel border border-line p-4">
          <div className="text-sm font-semibold text-ink">Move Burnt Carts</div>
          <div className="mt-3">
            <Checkbox
              label="Enable Auto Move Burnt Carts to Yard"
              checked={f.enableMoveBurntCarts}
              onChange={(e) => set({ enableMoveBurntCarts: e.target.checked })}
            />
          </div>
        </div>
      </div>

      {/* Service Notifications */}
      <div className="mt-3 rounded-panel border border-line p-4">
        <div className="mb-3 text-sm font-semibold text-ink">Service Notifications</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Checkbox label="Enable Service Notification Tab" checked={f.notif.enableTab} onChange={(e) => setNotif({ enableTab: e.target.checked })} />
            <Checkbox label="Send Service Notifications" checked={f.notif.send} onChange={(e) => setNotif({ send: e.target.checked })} />
            <Field label="Message Limit">
              <TextInput type="number" min="1" step="1" value={f.notif.messageLimit} onChange={(e) => setNotif({ messageLimit: e.target.value })} aria-invalid={!!errors.messageLimit} className={warnInput(errors.messageLimit)} />
              <InlineError message={errors.messageLimit} />
            </Field>
            <Field label="Time Zone">
              <Select options={PICKLISTS.timeZone} value={f.notif.timeZone} onChange={(e) => setNotif({ timeZone: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Time">
                <TextInput type="time" value={f.notif.startTime} onChange={(e) => setNotif({ startTime: e.target.value })} />
              </Field>
              <Field label="End Time">
                <TextInput type="time" value={f.notif.endTime} onChange={(e) => setNotif({ endTime: e.target.value })} />
              </Field>
              <Field label="Email Send Time">
                <TextInput type="time" value={f.notif.emailSendTime} onChange={(e) => setNotif({ emailSendTime: e.target.value })} />
              </Field>
              <Field label="SMS Send Time">
                <TextInput type="time" value={f.notif.smsSendTime} onChange={(e) => setNotif({ smsSendTime: e.target.value })} />
              </Field>
            </div>
          </div>
          <div className="rounded-panel border border-line bg-elevated p-3">
            <div className="type-overline">Failure Tracking</div>
            <p className="mt-1 mb-2 text-xs text-ink-muted">Enable to log delivery failures for support triage.</p>
            <div className="space-y-2">
              <Checkbox label="SMS Failed" checked={f.notif.smsFailed} onChange={(e) => setNotif({ smsFailed: e.target.checked })} />
              <Checkbox label="Phone Failed" checked={f.notif.phoneFailed} onChange={(e) => setNotif({ phoneFailed: e.target.checked })} />
              <Checkbox label="SendGrid Service Failed" checked={f.notif.sendGridFailed} onChange={(e) => setNotif({ sendGridFailed: e.target.checked })} />
            </div>
          </div>
        </div>
      </div>

      <PreviewBanner>{preview}</PreviewBanner>
    </>
  );
}

function Step3({ f, set }) {
  const preview = f.trackObservations || f.trackSafetyEvents
    ? `Carts will be identified via ${f.hardwareType} hardware, and drivers will capture ${[
        f.trackObservations && 'observations',
        f.trackSafetyEvents && 'safety events',
      ]
        .filter(Boolean)
        .join(' and ')} at every stop.`
    : `Carts will be identified via ${f.hardwareType} hardware, with no extra tracking beyond the hardware feed.`;
  return (
    <>
      <HeroBanner>
        <strong className="text-ink">How carts get identified and what drivers capture.</strong>
      </HeroBanner>
      <div className="type-overline text-ink-muted">Hardware Type</div>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-4">
        {HARDWARE_TYPES.map((h) => {
          const sel = f.hardwareType === h.key;
          return (
            <button
              key={h.key}
              onClick={() => set({ hardwareType: h.key })}
              className={`rounded-panel border p-3 text-left transition ${
                sel ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{h.label}</span>
                {sel && <Icon name="checkCircle" size={15} className="text-brand" />}
              </div>
              <div className="mt-1 text-xs text-ink-faint">{h.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="type-overline mt-5 text-ink-muted">Tracking</div>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { key: 'trackObservations', label: 'Observations', sub: 'Capture per-visit driver notes on every stop' },
          { key: 'trackSafetyEvents', label: 'Safety Events', sub: 'Log incidents and near-misses per work order' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => set({ [t.key]: !f[t.key] })}
            className={`flex items-center justify-between rounded-panel border p-4 text-left transition ${
              f[t.key] ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong'
            }`}
          >
            <span>
              <span className="block text-sm font-semibold text-ink">{t.label}</span>
              <span className="block text-xs text-ink-faint">{t.sub}</span>
            </span>
            <Toggle checked={f[t.key]} onChange={() => set({ [t.key]: !f[t.key] })} />
          </button>
        ))}
      </div>

      <PreviewBanner>{preview}</PreviewBanner>
    </>
  );
}

function AddressPanel({ title, addr, onChange, disabled, header, errorPrefix, errors = {} }) {
  return (
    <div className={`rounded-panel border border-line p-5 ${disabled ? 'opacity-50' : ''}`}>
      <div className="mb-4 flex min-h-[1.5rem] items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink">{title}</div>
        {header}
      </div>
      <Field label="Address Search">
        <TextInput placeholder="Search address…" disabled={disabled} />
      </Field>
      <div className="mt-4 space-y-4">
        <Field label="Country">
          <Select options={PICKLISTS.country} value={addr.country} disabled={disabled} onChange={(e) => onChange({ country: e.target.value })} />
        </Field>
        <Field label="Street">
          <div data-wizard-field={`${errorPrefix}.street`} id={`wizard-field-${errorPrefix}-street`}>
            <TextArea rows={2} value={addr.street} disabled={disabled} onChange={(e) => onChange({ street: e.target.value })} aria-invalid={!!errors[`${errorPrefix}.street`]} className={warnInput(errors[`${errorPrefix}.street`])} />
            <InlineError message={errors[`${errorPrefix}.street`]} />
          </div>
        </Field>
        <Field label="City">
          <div data-wizard-field={`${errorPrefix}.city`} id={`wizard-field-${errorPrefix}-city`}>
            <TextInput value={addr.city} disabled={disabled} onChange={(e) => onChange({ city: e.target.value })} aria-invalid={!!errors[`${errorPrefix}.city`]} className={warnInput(errors[`${errorPrefix}.city`])} />
            <InlineError message={errors[`${errorPrefix}.city`]} />
          </div>
        </Field>
        <Field label="State / Province">
          <div data-wizard-field={`${errorPrefix}.state`} id={`wizard-field-${errorPrefix}-state`}>
            <Select options={PICKLISTS.wizardProvinceState} placeholder="Select…" value={addr.state} disabled={disabled} onChange={(e) => onChange({ state: e.target.value })} aria-invalid={!!errors[`${errorPrefix}.state`]} className={warnInput(errors[`${errorPrefix}.state`])} />
            <InlineError message={errors[`${errorPrefix}.state`]} />
          </div>
        </Field>
        <Field label="Zip / Postal Code">
          <div data-wizard-field={`${errorPrefix}.zip`} id={`wizard-field-${errorPrefix}-zip`}>
            <TextInput value={addr.zip} disabled={disabled} onChange={(e) => onChange({ zip: e.target.value })} aria-invalid={!!errors[`${errorPrefix}.zip`]} className={warnInput(errors[`${errorPrefix}.zip`])} />
            <InlineError message={errors[`${errorPrefix}.zip`]} />
          </div>
        </Field>
      </div>
    </div>
  );
}

function Step4({ f, set, toggleSameAsBilling, errors = {} }) {
  return (
    <>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Billing and shipping addresses for this Service Provider.
      </p>
      <div className="mt-5 grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
        <AddressPanel
          title="Billing Address"
          addr={f.billing}
          onChange={(patch) => set({ billing: { ...f.billing, ...patch } })}
          errorPrefix="billing"
          errors={errors}
        />
        <AddressPanel
          title="Shipping Address"
          addr={f.shipping}
          disabled={f.sameAsBilling}
          onChange={(patch) => set({ shipping: { ...f.shipping, ...patch } })}
          errorPrefix="shipping"
          errors={errors}
          header={
            <Checkbox
              label="Same as Billing"
              checked={f.sameAsBilling}
              onChange={(e) => toggleSameAsBilling(e.target.checked)}
            />
          }
        />
      </div>
    </>
  );
}

function Step5({ f, setProduct, errors = {} }) {
  const products = MASTER_CATALOG.filter((p) => WIZARD_PRODUCTS.includes(p.code));
  return (
    <>
      <div className="mt-4 flex gap-2 rounded-panel border border-line bg-brand-soft p-3 text-xs text-brand-ink">
        <Icon name="info" size={15} className="mt-0.5 shrink-0" />
        <span>
          Products in the master catalog can be renamed to match the SP's resident-facing terminology.
          Products span all segments; no per-segment product configuration.
        </span>
      </div>
      <div data-wizard-field="products" id="wizard-field-products">
      <InlineError message={errors.products} />
      <div className="mt-4 max-h-96 space-y-2 overflow-y-auto scroll-thin">
        {products.map((p) => {
          const row = f.products[p.code] || {};
          return (
            <div key={p.code} className="flex items-center gap-3 rounded-panel border border-line p-3">
              <input
                type="checkbox"
                checked={!!row.selected}
                onChange={(e) => setProduct(p.code, { selected: e.target.checked })}
                className="h-4 w-4 rounded border-line-strong text-brand"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{p.name}</div>
                <div className="text-xs text-ink-muted">
                  {p.family} · <span className="mono">{p.code}</span>
                </div>
              </div>
              {row.selected && (
                <div className="w-64">
                  <input
                    placeholder="Rename for residents (optional)"
                    value={row.rename || ''}
                    onChange={(e) => setProduct(p.code, { rename: e.target.value })}
                    className={`field-input w-full py-1.5 ${warnInput(errors[`products.${p.code}`])}`}
                    aria-invalid={!!errors[`products.${p.code}`]}
                  />
                  <InlineError message={errors[`products.${p.code}`]} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
}

function Step6({ f, addRoute, removeRoute, setRoute, toggleRouteDay, errors = {} }) {
  return (
    <>
      <div className="mt-4 flex gap-2 rounded-panel border border-line bg-brand-soft p-3 text-xs text-brand-ink">
        <Icon name="info" size={15} className="mt-0.5 shrink-0" />
        <span>
          Collection routes are scheduled runs (Trash, Recycle, Organic, Yard Waste). Route status
          lives in BDP. Vision stores only the route reference. Add representative routes; more can be
          added later.
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {f.routes.map((r, i) => (
          <div key={i} className="rounded-panel border border-line p-3">
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
              <div data-wizard-field={`routes.${i}.routeNumber`} id={`wizard-field-routes-${i}-routeNumber`}>
                {i === 0 && <div className="type-overline mb-1">Route Number</div>}
                <TextInput placeholder="R-201" value={r.routeNumber} onChange={(e) => setRoute(i, { routeNumber: e.target.value })} aria-invalid={!!errors[`routes.${i}.routeNumber`]} className={warnInput(errors[`routes.${i}.routeNumber`])} />
                <InlineError message={errors[`routes.${i}.routeNumber`]} />
              </div>
              <div>
                {i === 0 && <div className="type-overline mb-1">Collection Type</div>}
                <Select options={PICKLISTS.routeCollectionType} value={r.collectionType} onChange={(e) => setRoute(i, { collectionType: e.target.value })} />
              </div>
              <div data-wizard-field={`routes.${i}.days`} id={`wizard-field-routes-${i}-days`}>
                {i === 0 && <div className="type-overline mb-1">Days</div>}
                <div className="flex gap-1">
                  {DAY_LABELS.map((d, di) => (
                    <button
                      key={di}
                      onClick={() => toggleRouteDay(i, di)}
                      className={`mono h-8 w-8 rounded-control text-xs font-semibold interactive ${
                        r.days[di] ? 'bg-brand text-white' : 'bg-elevated text-ink-muted hover:bg-line'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <InlineError message={errors[`routes.${i}.days`]} />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  {i === 0 && <div className="type-overline mb-1">Frequency</div>}
                  <Select options={['Weekly', 'Bi-Weekly']} value={r.frequency} onChange={(e) => setRoute(i, { frequency: e.target.value })} />
                </div>
                <button
                  onClick={() => removeRoute(i)}
                  disabled={f.routes.length === 1}
                  className="mb-0.5 rounded-control p-2 text-ink-faint interactive hover:bg-elevated disabled:opacity-30"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addRoute} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
        <Icon name="plus" size={15} /> Add route
      </button>
    </>
  );
}

function Step7({ f, addContact, removeContact, setContact, errors = {} }) {
  return (
    <>
      <div className="mt-4 flex gap-2 rounded-panel border border-line bg-brand-soft p-3 text-xs text-brand-ink">
        <Icon name="info" size={15} className="mt-0.5 shrink-0" />
        <span>
          Each contact belongs to exactly one segment. Contact's segment determines what data they
          see: a parent-segment user sees children too; a child-segment user cannot see siblings or
          parent. Clicking Enable as Portal User creates the Experience Cloud user.
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {f.contacts.map((c, i) => (
          <div key={i} className="rounded-panel border border-line p-3">
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-5">
              <div data-wizard-field={`contacts.${i}.firstName`} id={`wizard-field-contacts-${i}-firstName`}>
                {i === 0 && <div className="type-overline mb-1">First Name</div>}
                <TextInput value={c.firstName} onChange={(e) => setContact(i, { firstName: e.target.value })} aria-invalid={!!errors[`contacts.${i}.firstName`]} className={warnInput(errors[`contacts.${i}.firstName`])} />
                <InlineError message={errors[`contacts.${i}.firstName`]} />
              </div>
              <div data-wizard-field={`contacts.${i}.lastName`} id={`wizard-field-contacts-${i}-lastName`}>
                {i === 0 && <div className="type-overline mb-1">Last Name</div>}
                <TextInput value={c.lastName} onChange={(e) => setContact(i, { lastName: e.target.value })} aria-invalid={!!errors[`contacts.${i}.lastName`]} className={warnInput(errors[`contacts.${i}.lastName`])} />
                <InlineError message={errors[`contacts.${i}.lastName`]} />
              </div>
              <div data-wizard-field={`contacts.${i}.email`} id={`wizard-field-contacts-${i}-email`}>
                {i === 0 && <div className="type-overline mb-1">Email</div>}
                <TextInput type="email" value={c.email} onChange={(e) => setContact(i, { email: e.target.value })} aria-invalid={!!errors[`contacts.${i}.email`]} className={warnInput(errors[`contacts.${i}.email`])} />
                <InlineError message={errors[`contacts.${i}.email`]} />
              </div>
              <div>
                {i === 0 && <div className="type-overline mb-1">Role</div>}
                <Select options={PICKLISTS.wizardRole} value={c.role} onChange={(e) => setContact(i, { role: e.target.value })} />
              </div>
              <div className="flex items-end justify-between gap-2">
                <Checkbox label="Portal user" checked={c.portal} onChange={(e) => setContact(i, { portal: e.target.checked })} />
                <button
                  onClick={() => removeContact(i)}
                  disabled={f.contacts.length === 1}
                  className="rounded-control p-2 text-ink-faint interactive hover:bg-elevated disabled:opacity-30"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addContact} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
        <Icon name="plus" size={15} /> Add contact
      </button>
    </>
  );
}

function ReviewCard({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-panel border border-line p-3">
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      <span className="text-right text-sm text-ink">{children}</span>
    </div>
  );
}

function Step8({ f, errors = {}, issues = [], onJump, onOpenAssistant }) {
  const dash = <span className="text-ink-faint">—</span>;
  const products = Object.values(f.products).filter((p) => p.selected).length;
  const routes = f.routes.filter((r) => r.routeNumber);
  const contacts = f.contacts.filter((c) => c.firstName || c.lastName);
  const autoFlags = [
    f.enableAutoWO && 'Auto WO',
    f.enableAutoHotTicket && `Hot Ticket (${f.autoHotTicketDays}d)`,
    f.enableMoveBurntCarts && 'Move Burnt Carts',
    f.notif.enableTab && 'Service Notif Tab',
  ].filter(Boolean);
  const tracking = [f.trackObservations && 'Observations', f.trackSafetyEvents && 'Safety Events'].filter(Boolean);
  const billingLine = [f.billing.street, f.billing.city, f.billing.zip, f.billing.country].filter(Boolean).join(', ');
  const shippingLine = f.sameAsBilling
    ? '(same as billing)'
    : [f.shipping.street, f.shipping.city, f.shipping.zip, f.shipping.country].filter(Boolean).join(', ');

  return (
    <>
      <p className="mt-1 text-sm text-ink-muted">Review everything before activating this Service Provider.</p>
      {issues.length > 0 && (
        <div className="mt-4 rounded-panel border border-danger/30 bg-danger-soft p-3" role="alert">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-danger">
                {issues.length} required {issues.length === 1 ? 'item needs' : 'items need'} attention
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">Click an item to jump to that field, or fix them with the AI assistant.</p>
            </div>
            {onOpenAssistant && (
              <button type="button" className="btn-secondary text-xs" onClick={onOpenAssistant}>
                <Icon name="help" size={14} /> Fix with AI
              </button>
            )}
          </div>
          <ul className="mt-3 space-y-1.5">
            {issues.map((issue) => (
              <li key={issue.key}>
                <button
                  type="button"
                  onClick={() => onJump?.(issue)}
                  className="flex w-full items-start gap-2 rounded-control border border-danger/20 bg-surface px-3 py-2 text-left text-sm interactive hover:border-danger/40"
                >
                  <Icon name="alert" size={14} className="mt-0.5 shrink-0 text-danger" />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      Step {issue.step + 1}: {issue.stepTitle}
                    </span>
                    <span className="text-ink-soft">{issue.message}</span>
                  </span>
                  <Icon name="chevronRight" size={14} className="ml-auto mt-0.5 shrink-0 text-ink-faint" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {issues.length === 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-panel border border-success/25 bg-success-soft px-3 py-2.5">
          <Icon name="checkCircle" size={16} className="mt-0.5 shrink-0 text-success" />
          <p className="text-sm font-medium text-ink-soft">Everything looks good — you can activate this service provider.</p>
        </div>
      )}
      <div className="mt-4 space-y-2">
        <ReviewCard label="Service Provider">{f.accountName || dash}</ReviewCard>
        <ReviewCard label="Type · Industry">
          {f.type || dash} · {f.industry || dash}
        </ReviewCard>
        <ReviewCard label="Service Provider UID">{f.uid || dash}</ReviewCard>
        <ReviewCard label="Service Types">
          {f.serviceTypes.length ? f.serviceTypes.join(' · ') : <span className="text-danger">At least one required</span>}
        </ReviewCard>
        <ReviewCard label="Tracking flags">{tracking.length ? tracking.join(' · ') : 'None'}</ReviewCard>
        <ReviewCard label="Hardware · Modules">
          {f.hardwareType || dash} · {f.modules || dash}
        </ReviewCard>
        <ReviewCard label="Billing Address">{billingLine || dash}</ReviewCard>
        <ReviewCard label="Shipping Address">{shippingLine || dash}</ReviewCard>
        <ReviewCard label="Automation flags">{autoFlags.length ? autoFlags.join(' · ') : 'None'}</ReviewCard>
        <ReviewCard label="Notification window">
          {f.notif.startTime} to {f.notif.endTime} · {f.notif.timeZone} · Msg limit {f.notif.messageLimit}
        </ReviewCard>
        <ReviewCard label="Products selected">{products} products</ReviewCard>
        <ReviewCard label="Routes">
          {routes.length ? routes.map((r) => `${r.routeNumber} (${r.collectionType})`).join(' · ') : 'Add later'}
        </ReviewCard>
        <ReviewCard label="Contacts">
          {contacts.length
            ? contacts.map((c, i) => (
                <span key={i}>
                  {c.firstName} {c.lastName}
                  {c.portal && <Icon name="star" size={11} className="ml-0.5 inline text-warn" />}
                  {i < contacts.length - 1 ? ' · ' : ''}
                </span>
              ))
            : dash}
        </ReviewCard>
        <ReviewCard label="Payment gate">Disabled</ReviewCard>
      </div>
    </>
  );
}
