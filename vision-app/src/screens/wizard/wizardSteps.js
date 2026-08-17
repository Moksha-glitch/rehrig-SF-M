/** Step metadata, completion checks, and AI field catalogs for SP onboarding. */

import { MASTER_CATALOG, WIZARD_PRODUCTS } from '../../data/seed.js';

export const STEPS = [
  { title: 'Account Information', required: true },
  { title: 'Service Types & Modules', required: false },
  { title: 'Hardware & Tracking', required: false },
  { title: 'Billing & Shipping Address', required: false },
  { title: 'Service Provider Products', required: true },
  { title: 'Collection Routes', required: false },
  { title: 'Contacts & Portal Users', required: false },
  { title: 'Screen Access', required: false },
  { title: 'Review & Activate', required: false },
];

export const LAST_STEP = STEPS.length - 1;

/** Errors that block activation (only required steps). */
export function requiredErrors(errors) {
  return Object.fromEntries(
    Object.entries(errors || {}).filter(([key]) => STEPS[stepForErrorKey(key)]?.required)
  );
}

/** Map validation error keys → step index. */
export function stepForErrorKey(key) {
  if (!key) return 0;
  if (
    key === 'serviceTypes' ||
    key === 'autoHotTicketDays' ||
    key === 'messageLimit'
  ) {
    return 1;
  }
  if (key.startsWith('billing') || key.startsWith('shipping')) return 3;
  if (key.startsWith('products')) return 4;
  if (key.startsWith('routes')) return 5;
  if (key.startsWith('contacts')) return 6;
  return 0;
}

export function errorsForStep(errors, stepIndex) {
  return Object.entries(errors || {}).filter(([key]) => stepForErrorKey(key) === stepIndex);
}

export function isStepComplete(errors, stepIndex) {
  // Non-required steps always show as completed in the rail
  if (!STEPS[stepIndex]?.required) return true;
  return errorsForStep(errors, stepIndex).length === 0;
}

export function getStepStatuses(errors) {
  return STEPS.map((step, index) => {
    const complete = isStepComplete(errors, index);
    const issueCount = errorsForStep(errors, index).length;
    return {
      ...step,
      index,
      complete,
      issueCount,
      highlight: step.required && !complete,
    };
  });
}

/** Next required incomplete step after `fromStep`, or null if none. */
export function nextRequiredIncompleteStep(errors, fromStep = -1) {
  for (let i = fromStep + 1; i < STEPS.length; i += 1) {
    if (STEPS[i].required && !isStepComplete(errors, i)) return i;
  }
  for (let i = 0; i < STEPS.length; i += 1) {
    if (i !== fromStep && STEPS[i].required && !isStepComplete(errors, i)) return i;
  }
  // All required done — land on Review
  if (fromStep < LAST_STEP) return LAST_STEP;
  return null;
}

export function pendingIssues(errors) {
  return Object.entries(requiredErrors(errors)).map(([key, message]) => ({
    key,
    message,
    step: stepForErrorKey(key),
    stepTitle: STEPS[stepForErrorKey(key)]?.title || 'Details',
  }));
}

/** AI-editable required fields for a step (and review = pending required issues). */
export function getChatFieldsForStep(f, errors, stepIndex) {
  if (stepIndex === LAST_STEP) {
    return pendingIssues(errors).map((issue) => ({
      key: issue.key,
      label: issue.message.replace(/\.$/, ''),
      required: true,
      question: `Let's fix: ${issue.message} What value should we use?`,
      placeholder: 'Type the value…',
      step: issue.step,
    }));
  }

  if (!STEPS[stepIndex]?.required) return [];

  let defs = STEP_CHAT_DEFS[stepIndex] || [];
  if (stepIndex === 3 && !f.sameAsBilling) {
    defs = [
      ...defs,
      {
        key: 'shipping.street',
        label: 'Shipping Street',
        required: true,
        question: 'What is the shipping street address?',
        placeholder: 'Street address…',
      },
      {
        key: 'shipping.city',
        label: 'Shipping City',
        required: true,
        question: 'What is the shipping city?',
        placeholder: 'City…',
      },
      {
        key: 'shipping.state',
        label: 'Shipping State',
        required: true,
        question: 'What is the shipping state or province?',
        placeholder: 'State…',
      },
      {
        key: 'shipping.zip',
        label: 'Shipping ZIP',
        required: true,
        question: 'What is the shipping postal / ZIP code?',
        placeholder: 'ZIP…',
      },
    ];
  }
  return defs.filter((field) => isChatFieldMissing(f, field, errors));
}

export function countRequiredChatFields(stepIndex, f, errors) {
  if (stepIndex === LAST_STEP) return Math.max(pendingIssues(errors).length, 1);
  let defs = STEP_CHAT_DEFS[stepIndex] || [];
  if (stepIndex === 3 && !f.sameAsBilling) {
    defs = [
      ...defs,
      { key: 'shipping.street', required: true },
      { key: 'shipping.city', required: true },
      { key: 'shipping.state', required: true },
      { key: 'shipping.zip', required: true },
    ];
  }
  return defs.filter((field) => field.required).length || 1;
}

function isChatFieldMissing(f, field, errors) {
  if (errors?.[field.key]) return true;
  if (!field.required) return false;
  return !hasFieldValue(f, field.key);
}

function hasFieldValue(f, key) {
  if (key === 'serviceTypes') return (f.serviceTypes || []).length > 0;
  if (key === 'products') {
    return Object.values(f.products || {}).some((p) => p.selected);
  }
  if (key === 'routes.0.routeNumber') return !!f.routes?.[0]?.routeNumber?.trim();
  if (key === 'routes.0.days') return !!f.routes?.[0]?.days?.some(Boolean);
  if (key.startsWith('billing.')) {
    const k = key.slice(8);
    return !!String(f.billing?.[k] ?? '').trim();
  }
  if (key.startsWith('shipping.')) {
    const k = key.slice(9);
    return !!String(f.shipping?.[k] ?? '').trim();
  }
  if (key.startsWith('contacts.')) {
    const [, index, prop] = key.split('.');
    return !!String(f.contacts?.[Number(index)]?.[prop] ?? '').trim();
  }
  const v = f[key];
  if (key === 'accountName') return !!v && String(v).trim().length > 2;
  if (key === 'uid') return !!v && String(v).trim().length >= 3;
  return v !== null && v !== undefined && String(v).trim() !== '';
}

const STEP_CHAT_DEFS = {
  0: [
    {
      key: 'accountName',
      label: 'Account Name',
      required: true,
      question: 'What is the account name?',
      placeholder: 'Type the account name…',
    },
    {
      key: 'uid',
      label: 'Service Provider UID',
      required: true,
      question: 'What is the Service Provider UID?',
      placeholder: 'Type the UID…',
    },
    {
      key: 'phone',
      label: 'Phone',
      required: true,
      question: 'What phone number should we use?',
      placeholder: 'Type the phone number…',
    },
    {
      key: 'supportEmail',
      label: 'Support Email',
      required: false,
      question: 'What is the support email?',
      placeholder: 'Type the email…',
    },
    {
      key: 'website',
      label: 'Website',
      required: false,
      question: 'What is the website?',
      placeholder: 'Type the website…',
    },
  ],
  1: [
    {
      key: 'serviceTypes',
      label: 'Service Types',
      required: true,
      question: 'Which service types apply? (e.g. Residential, Commercial)',
      placeholder: 'Residential, Commercial…',
    },
  ],
  2: [],
  3: [
    {
      key: 'billing.street',
      label: 'Billing Street',
      required: true,
      question: 'What is the billing street address?',
      placeholder: 'Street address…',
    },
    {
      key: 'billing.city',
      label: 'Billing City',
      required: true,
      question: 'What is the billing city?',
      placeholder: 'City…',
    },
    {
      key: 'billing.state',
      label: 'Billing State',
      required: true,
      question: 'What is the billing state or province?',
      placeholder: 'State…',
    },
    {
      key: 'billing.zip',
      label: 'Billing ZIP',
      required: true,
      question: 'What is the billing postal / ZIP code?',
      placeholder: 'ZIP…',
    },
  ],
  4: [
    {
      key: 'products',
      label: 'Products',
      required: true,
      question: 'Name a product to select (e.g. 120 Liter Trash or MPR-001).',
      placeholder: 'Product name or code…',
    },
  ],
  5: [
    {
      key: 'routes.0.routeNumber',
      label: 'Route Number',
      required: true,
      question: 'What is the first route number?',
      placeholder: 'e.g. R-201…',
    },
    {
      key: 'routes.0.days',
      label: 'Route Days',
      required: true,
      question: 'Which collection days? (e.g. Monday, Wednesday, Friday)',
      placeholder: 'Monday, Wednesday…',
    },
  ],
  6: [
    {
      key: 'contacts.0.firstName',
      label: 'Contact First Name',
      required: true,
      question: 'What is the primary contact’s first name?',
      placeholder: 'First name…',
    },
    {
      key: 'contacts.0.lastName',
      label: 'Contact Last Name',
      required: true,
      question: 'What is the primary contact’s last name?',
      placeholder: 'Last name…',
    },
    {
      key: 'contacts.0.email',
      label: 'Contact Email',
      required: true,
      question: 'What is the primary contact’s email?',
      placeholder: 'email@example.com…',
    },
  ],
};

export function applyWizardFieldUpdate(prev, key, rawValue) {
  const value = String(rawValue ?? '').trim();

  if (key === 'serviceTypes') {
    const types = value
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const hit = ['Residential', 'Commercial', 'Industrial'].find(
          (opt) => opt.toLowerCase() === s.toLowerCase() || opt.toLowerCase().startsWith(s.toLowerCase())
        );
        return hit || s;
      });
    return { ...prev, serviceTypes: types.length ? types : prev.serviceTypes };
  }

  if (key === 'messageLimit') {
    const n = Number(value);
    return {
      ...prev,
      notif: { ...prev.notif, messageLimit: Number.isFinite(n) ? n : value },
    };
  }
  if (key === 'autoHotTicketDays') {
    const n = Number(value);
    return { ...prev, autoHotTicketDays: Number.isFinite(n) ? n : value };
  }
  if (key.startsWith('products.') && key !== 'products') {
    const code = key.slice('products.'.length);
    return {
      ...prev,
      products: {
        ...prev.products,
        [code]: { ...(prev.products?.[code] || {}), rename: value, selected: true },
      },
    };
  }

  if (key === 'products') {
    const needle = value.toLowerCase();
    const catalog = MASTER_CATALOG.filter((p) => WIZARD_PRODUCTS.includes(p.code));
    const hit =
      catalog.find(
        (p) =>
          p.code.toLowerCase() === needle ||
          p.name.toLowerCase() === needle ||
          p.name.toLowerCase().includes(needle) ||
          needle.includes(p.code.toLowerCase())
      ) || catalog[0];
    const products = { ...prev.products };
    if (hit) {
      products[hit.code] = { ...(products[hit.code] || {}), selected: true };
    }
    return { ...prev, products };
  }

  if (key === 'routes.0.days') {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const tokens = value.toLowerCase().split(/[,;\s]+/).filter(Boolean);
    const days = dayNames.map((d) => tokens.some((t) => d.startsWith(t) || t.startsWith(d.slice(0, 3))));
    const routes = [...(prev.routes || [])];
    if (!routes[0]) routes[0] = { routeNumber: '', collectionType: 'Trash', days: dayNames.map(() => false), frequency: 'Weekly' };
    routes[0] = { ...routes[0], days: days.some(Boolean) ? days : routes[0].days };
    return { ...prev, routes };
  }

  if (key.startsWith('billing.')) {
    const k = key.slice(8);
    return { ...prev, billing: { ...prev.billing, [k]: value } };
  }
  if (key.startsWith('shipping.')) {
    const k = key.slice(9);
    return { ...prev, shipping: { ...prev.shipping, [k]: value } };
  }
  if (key.startsWith('contacts.')) {
    const [, indexStr, prop] = key.split('.');
    const index = Number(indexStr);
    const contacts = [...(prev.contacts || [])];
    while (contacts.length <= index) {
      contacts.push({ firstName: '', lastName: '', email: '', role: 'Dispatcher', portal: true });
    }
    contacts[index] = { ...contacts[index], [prop]: prop === 'email' ? value.toLowerCase() : value };
    return { ...prev, contacts };
  }
  if (key.startsWith('routes.')) {
    const [, indexStr, prop] = key.split('.');
    const index = Number(indexStr);
    const routes = [...(prev.routes || [])];
    while (routes.length <= index) {
      routes.push({
        routeNumber: '',
        collectionType: 'Trash',
        days: [false, false, false, false, false, false, false],
        frequency: 'Weekly',
      });
    }
    let nextVal = value;
    if (prop === 'routeNumber') nextVal = value.toUpperCase();
    routes[index] = { ...routes[index], [prop]: nextVal };
    return { ...prev, routes };
  }

  let next = value;
  if (key === 'uid') next = value.toUpperCase().replace(/\s+/g, '').slice(0, 10);
  if (key === 'phone') next = value.replace(/\s{2,}/g, ' ');
  if (key === 'supportEmail') next = value.toLowerCase();
  return { ...prev, [key]: next };
}

export function completeNoteForStep(stepIndex, complete) {
  if (!complete) return null;
  const notes = {
    0: 'This section looks good — account details are complete.',
    1: 'This section looks good — service types are set.',
    2: 'This section looks good — hardware & tracking are ready.',
    3: 'This section looks good — addresses are complete.',
    4: 'This section looks good — products are selected.',
    5: 'This section looks good — routes are ready.',
    6: 'This section looks good — contacts are complete.',
    7: 'This section looks good — screen access is set.',
    8: 'Everything looks good — you can activate this service provider.',
  };
  return notes[stepIndex] || 'This section looks good.';
}
