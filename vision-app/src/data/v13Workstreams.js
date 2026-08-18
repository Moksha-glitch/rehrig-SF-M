/** V1.3 workstreams that sit beside the core ops objects. */

export const V13_KINDS = {
  chatter: {
    title: 'Chatter',
    description: 'Account and record collaboration. Posts stay on the object they were written from.',
    icon: 'message',
    columns: ['When', 'Author', 'On', 'Post', 'Type'],
  },
  approvals: {
    title: 'Approvals',
    description: 'Approve or reject work that needs a second set of eyes before it goes live.',
    icon: 'checkCircle',
    columns: ['Item', 'Type', 'Submitted by', 'Status', 'Waiting on', 'Submitted'],
  },
  qalert: {
    title: 'QAlert (Sarasota Co.)',
    description: 'Citizen-request sync for QAlert. Review inbound tickets and last successful pull.',
    icon: 'layers',
    columns: ['QAlert #', 'Resident', 'Type', 'Status', 'Last sync', 'Linked WO'],
  },
  customerInsights: {
    title: 'Customer Insights',
    description: 'Resident and site signals: missed pickups, open requests, and payment-gated access.',
    icon: 'barChart',
    columns: ['Customer', 'Provider', 'Open WOs', 'Missed 30d', 'Portal', 'Risk'],
  },
  recordSharing: {
    title: 'Record Sharing',
    description: 'Who can see which records beyond their profile. Manual shares and reason codes.',
    icon: 'users',
    columns: ['Record', 'Object', 'Shared with', 'Access', 'Reason', 'Expires'],
  },
  holidays: {
    title: 'Holiday schedule',
    description: 'Collection holidays used by due-date computation and resident notifications.',
    icon: 'calendar',
    columns: ['Name', 'Date', 'Applies to', 'Shift rule', 'Notify residents'],
  },
  automationCenter: {
    title: 'Automation',
    description: 'Account-level automation flags from V1.3: Auto WO, hot-ticket conversion, burnt-cart yard moves.',
    icon: 'zap',
    columns: ['Provider', 'Auto WO', 'Auto hot ticket', 'Days', 'Move burnt carts', 'Tableau'],
  },
  loginHistory: {
    title: 'Login History / Security Audit',
    description: 'Recent sign-ins for the workspace. Used by Rehrig admin and security review.',
    icon: 'lock',
    columns: ['User', 'Persona', 'When', 'Result', 'Source', 'Location'],
  },
};

export const CHATTER_POSTS = [
  {
    id: 'ch-1',
    when: '2026-08-17 09:14',
    author: 'Yolanda Wagner',
    on: 'WO-10421 · Edmonton AB',
    post: 'Resident confirmed cart was blocked by a contractor vehicle. Retry tomorrow.',
    type: 'Comment',
  },
  {
    id: 'ch-2',
    when: '2026-08-16 16:02',
    author: 'Helena Rehrig',
    on: 'Edmonton AB',
    post: 'Contract addendum uploaded. Screen access for Field Tech profile stays mobile-only.',
    type: 'Post',
  },
  {
    id: 'ch-3',
    when: '2026-08-15 11:40',
    author: 'Sarah Kaminski',
    on: 'Dispatch D-8891',
    post: '@Marcus please confirm TRK-201 is back from repair before 06:00.',
    type: 'Mention',
  },
];

export const APPROVALS = [
  {
    id: 'ap-1',
    item: 'Bulk import job WOIT-221',
    type: 'WOIT commit',
    submittedBy: 'Marcus Chen',
    status: 'Pending',
    waitingOn: 'Yolanda Wagner',
    submitted: '2026-08-17',
  },
  {
    id: 'ap-2',
    item: 'Profile · Fleet Manager screen access',
    type: 'Profile change',
    submittedBy: 'Helena Rehrig',
    status: 'Approved',
    waitingOn: '—',
    submitted: '2026-08-12',
  },
  {
    id: 'ap-3',
    item: 'Fairfax payment-gate exception',
    type: 'Billing',
    submittedBy: 'Ravindra Medam',
    status: 'Rejected',
    waitingOn: '—',
    submitted: '2026-08-10',
  },
];

export const QALERT_TICKETS = [
  {
    id: 'qa-1',
    number: 'QA-44821',
    resident: 'L. Herrera',
    type: 'Missed pickup',
    status: 'Synced',
    lastSync: '2026-08-18 07:12',
    linkedWo: 'WO-10488',
  },
  {
    id: 'qa-2',
    number: 'QA-44830',
    resident: 'P. Singh',
    type: 'Cart damaged',
    status: 'Pending map',
    lastSync: '2026-08-18 07:12',
    linkedWo: '—',
  },
  {
    id: 'qa-3',
    number: 'QA-44701',
    resident: 'Sarasota Parks',
    type: 'Bulk pickup',
    status: 'Closed in QAlert',
    lastSync: '2026-08-16 19:04',
    linkedWo: 'WO-10302',
  },
];

export const CUSTOMER_INSIGHTS = [
  {
    id: 'ci-1',
    customer: "Sam O'Brien",
    provider: 'Edmonton AB',
    openWos: 1,
    missed30d: 0,
    portal: 'Active',
    risk: 'Low',
  },
  {
    id: 'ci-2',
    customer: 'Nadia Petrov',
    provider: 'Edmonton AB',
    openWos: 0,
    missed30d: 2,
    portal: 'Active',
    risk: 'Watch',
  },
  {
    id: 'ci-3',
    customer: 'Fairfax resident portal',
    provider: 'Fairfax County VA',
    openWos: 4,
    missed30d: 6,
    portal: 'Payment-gated',
    risk: 'High',
  },
];

export const RECORD_SHARES = [
  {
    id: 'rs-1',
    record: 'WO-10421',
    object: 'Work Order',
    sharedWith: 'Anton Volkov',
    access: 'Read',
    reason: 'Contract review',
    expires: '2026-09-01',
  },
  {
    id: 'rs-2',
    record: 'CART-000123',
    object: 'Asset',
    sharedWith: 'Marcus Chen',
    access: 'Read / Edit',
    reason: 'Yard transfer',
    expires: '—',
  },
];

export const HOLIDAYS = [
  {
    id: 'hd-1',
    name: 'Canada Day',
    date: '2026-07-01',
    appliesTo: 'Canada SPs',
    shift: 'Next service day',
    notify: 'Yes',
  },
  {
    id: 'hd-2',
    name: 'Labour Day',
    date: '2026-09-07',
    appliesTo: 'Canada SPs',
    shift: 'Next service day',
    notify: 'Yes',
  },
  {
    id: 'hd-3',
    name: 'Thanksgiving (US)',
    date: '2026-11-26',
    appliesTo: 'Fairfax County VA',
    shift: 'Skip + notify',
    notify: 'Yes',
  },
];

export const LOGIN_EVENTS = [
  {
    id: 'lh-1',
    user: 'Helena Rehrig',
    persona: 'Rehrig',
    when: '2026-08-18 08:02',
    result: 'Success',
    source: 'Password',
    location: 'Los Angeles, CA',
  },
  {
    id: 'lh-2',
    user: 'David Thornton',
    persona: 'SP',
    when: '2026-08-18 05:41',
    result: 'Success',
    source: 'Password',
    location: 'Edmonton, AB',
  },
  {
    id: 'lh-3',
    user: 'Priya Ramanathan',
    persona: 'SP',
    when: '2026-08-17 21:10',
    result: 'Blocked · inactive',
    source: 'Password',
    location: 'Toronto, ON',
  },
];
