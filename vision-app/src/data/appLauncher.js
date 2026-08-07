/** App Launcher catalog and default product/license configuration (V1.4). */

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
    key: 'sales',
    label: 'Sales',
    subtitle: 'Manage accounts, leads, opportunities, and more.',
    color: '#1E5A8F',
    module: null,
  },
  {
    key: 'yourAcct',
    label: 'Your Account',
    subtitle: 'Add products and licenses, and review subscription details.',
    color: '#8b969f',
    configureLicenses: true,
    module: 'setup',
    params: { section: 'account' },
  },
  {
    key: 'automation',
    label: 'Automation',
    subtitle: 'Automate business processes and repetitive tasks.',
    color: '#0f7b55',
    module: null,
  },
  {
    key: 'approvals',
    label: 'Approvals',
    subtitle: 'Manage approvals and approval flows.',
    color: '#0f7b55',
    module: null,
  },
  {
    key: 'shield',
    label: 'Shield',
    subtitle: 'Monitor apps and data. Discover, track, and encrypt sensitive information.',
    color: '#1E5A8F',
    module: null,
  },
];

export const LAUNCHER_ITEMS = [
  { label: 'Accounts', module: 'accounts' },
  { label: 'Assets', module: 'assets' },
  { label: 'Contacts', module: 'contacts' },
  { label: 'Dashboards', module: 'analytics', params: { view: 'dashboards' } },
  { label: 'Dispatches', module: 'dispatches' },
  { label: 'Home', module: 'home' },
  { label: 'Locations', module: 'locations' },
  { label: 'Map Center', module: 'mapCenter' },
  { label: 'Reports', module: 'analytics', params: { view: 'reports' } },
  { label: 'Trucks', module: 'trucks' },
  { label: 'Work Orders', module: 'workOrders' },
  { label: 'Bulk Import', module: 'bulkImport' },
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
    productName: 'Sales Cloud (demo)',
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
