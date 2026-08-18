/** App Launcher catalog, product/license configuration, and report subscription options (V1.4). */

export const LAUNCHER_APPS = [
  {
    key: 'vision',
    label: 'VISION',
    subtitle: 'Operations workspace for service providers and Rehrig staff.',
    color: '#0b5f49',
    isVision: true,
    module: 'home',
  },
  {
    key: 'yourAcct',
    label: 'Your Account',
    subtitle: 'Signed-in user details, preferences, and password reset.',
    color: '#8b969f',
    configureLicenses: true,
    module: 'userAccount',
  },
];

export const LAUNCHER_ITEMS = [
  { label: 'Accounts', module: 'accounts' },
  { label: 'Aggregated Truck and Tips', module: 'aggregatedTips' },
  { label: 'Assets', module: 'assets' },
  { label: 'Contacts', module: 'contacts' },
  { label: 'Dashboards', module: 'analytics', params: { view: 'dashboards' } },
  { label: 'Devices', module: 'devices' },
  { label: 'Dispatches', module: 'dispatches' },
  { label: 'Home', module: 'home' },
  { label: 'Individual Tip / Non-Tip', module: 'individualTips' },
  { label: 'Locations', module: 'locations' },
  { label: 'Maintenance Route Profiles', module: 'maintenanceRouteProfiles' },
  { label: 'Map Center', module: 'mapCenter' },
  { label: 'Product', module: 'productTypes' },
  { label: 'Device', module: 'device' },
  { label: 'Truck', module: 'truck' },
  { label: 'Profile Management', module: 'setup', params: { section: 'profileMgmt' } },
  { label: 'User Management', module: 'setup', params: { section: 'userMgmt' } },
  { label: 'Notes & Attachments', module: 'notesAttachments' },
  { label: 'Report Subscriptions', module: 'reportSubscriptions' },
  { label: 'Reports', module: 'analytics', params: { view: 'reports' } },
  { label: 'Request Type / Resolutions', module: 'requestTypeResolutions' },
  { label: 'Trucks', module: 'trucks' },
  { label: 'Work Orders', module: 'workOrders' },
  { label: 'Bulk Import (White Tool)', module: 'bulkImport' },
  { label: 'Workspace', module: 'setup', params: { section: 'userMgmt' } },
];

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
  platformName: 'Vision 2.0',
  defaultTimeZone: 'America/Edmonton',
  defaultLocale: 'en-US',
  defaultAccountOwner: 'Ravindra Medam',
  sessionPersonaLock: true,
  requireMfaAdmins: true,
  auditRetentionDays: 365,
  notificationPreference: 'In-app + email digest',
  defaultLanding: 'Home',
};
