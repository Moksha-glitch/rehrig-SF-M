/** Workspace licenses, report subscriptions, and org defaults. */

export const SEED_APP_LICENSES = [
  {
    id: 'lic-vision',
    appKey: 'vision',
    productName: 'Vision Ops',
    licenseType: 'Named User',
    seats: 50,
    assigned: 28,
    status: 'Active',
    renewalDate: '2027-01-15',
    notes: 'Primary operations suite.',
  },
  {
    id: 'lic-sales',
    appKey: 'sales',
    productName: 'Vision Sales',
    licenseType: 'Platform',
    seats: 10,
    assigned: 4,
    status: 'Active',
    renewalDate: '2026-12-01',
    notes: '',
  },
  {
    id: 'lic-shield',
    appKey: 'shield',
    productName: 'Shield Monitoring',
    licenseType: 'Org',
    seats: 1,
    assigned: 1,
    status: 'Trial',
    renewalDate: '2026-09-30',
    notes: 'Trial expires end of Q3.',
  },
];

export const LICENSE_STATUSES = ['Active', 'Trial', 'Expired', 'Suspended'];
export const LICENSE_TYPES = ['Named User', 'Platform', 'Org', 'Community'];

export const SUBSCRIPTION_FREQUENCIES = ['Daily', 'Weekdays', 'Weekly', 'Monthly'];
export const SUBSCRIPTION_WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export const SUBSCRIPTION_CHANNELS = ['Email', 'Email + Slack', 'Slack', 'In-app only'];
export const SUBSCRIPTION_FORMATS = ['PDF', 'CSV', 'PDF + CSV', 'Email digest'];

export const SEED_REPORT_SUBSCRIPTIONS = [
  {
    id: 'sub-001',
    reportId: 'rpt-hot-aging',
    reportName: 'Hot Tickets Aging',
    frequency: 'Daily',
    day: '',
    time: '07:00',
    recipients: 'yolanda@vision.io',
    channel: 'Email',
    format: 'PDF',
    active: true,
    notes: 'Morning triage list for the back office.',
  },
  {
    id: 'sub-002',
    reportId: 'rpt-sla-account',
    reportName: 'SLA % by Account',
    frequency: 'Weekly',
    day: 'Monday',
    time: '08:00',
    recipients: 'helena@vision.io, ravi.medam@vision.io',
    channel: 'Email + Slack',
    format: 'PDF + CSV',
    active: true,
    notes: 'Leadership review pack.',
  },
  {
    id: 'sub-003',
    reportId: 'rpt-truck-util',
    reportName: 'Truck Utilization',
    frequency: 'Weekly',
    day: 'Friday',
    time: '17:00',
    recipients: 'marcus@vision.io',
    channel: 'Email',
    format: 'CSV',
    active: false,
    notes: 'Paused until the fleet audit closes.',
  },
];

export const DEFAULT_WORKSPACE_SETTINGS = {
  organizationName: 'Rehrig Pacific Company',
  headquarters: 'Los Angeles, CA',
  primaryDomain: 'rehrigpacific.com',
  platformName: 'Vision Pulse',
  defaultTimeZone: 'America/Edmonton',
  defaultLocale: 'en-US',
  defaultAccountOwner: 'Ravindra Medam',
  sessionPersonaLock: true,
  requireMfaAdmins: true,
  auditRetentionDays: 365,
  notificationPreference: 'In-app + email digest',
  defaultLanding: 'Home',
};
