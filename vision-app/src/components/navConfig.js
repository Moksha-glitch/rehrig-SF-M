/** Shared primary navigation trees by persona (top navbar dropdowns). */

export const NAV = {
  rehrig: [
    { type: 'item', key: 'home', module: 'home', label: 'Home', icon: 'grid' },
    { type: 'item', key: 'activity', module: 'activity', label: 'Activity', icon: 'activity' },
    {
      type: 'section',
      label: 'Service Providers',
      children: [
        { key: 'accounts', module: 'accounts', label: 'All Providers', icon: 'building' },
        { key: 'contacts', module: 'contacts', label: 'Contacts', icon: 'user' },
        {
          key: 'contractOnboarding',
          module: 'contractOnboarding',
          label: 'Contract Onboarding',
          icon: 'clipboard',
        },
      ],
    },
    {
      type: 'section',
      label: 'Configure',
      children: [
        { key: 'serviceTypes', module: 'serviceTypes', label: 'Service Types' },
        { key: 'locationTypes', module: 'locationTypes', label: 'Location Types' },
        { key: 'assetTypes', module: 'assetTypes', label: 'Asset Types' },
        {
          key: 'productTypes',
          module: 'productTypes',
          label: 'Master Product Catalog',
        },
        { key: 'apiIntegrations', module: 'apiIntegrations', label: 'API Integrations' },
        {
          key: 'notificationConfig',
          module: 'notificationConfig',
          label: 'Notification Config',
        },
        {
          key: 'reportSubs',
          module: 'reportSubscriptions',
          label: 'Report Subscriptions',
          icon: 'mail',
        },
        {
          key: 'setup',
          module: 'setup',
          params: { section: 'userMgmt' },
          label: 'Workspace',
        },
      ],
    },
  ],
  sp: [
    {
      type: 'section',
      label: 'Overview',
      children: [{ key: 'home', module: 'home', label: 'Home', icon: 'grid' }],
    },
    {
      type: 'section',
      label: 'Service Provider',
      children: [
        {
          key: 'details',
          module: 'account',
          params: { tab: 'details' },
          label: 'Details',
          icon: 'building',
        },
        {
          key: 'mindmap',
          module: 'account',
          params: { tab: 'mindmap' },
          label: 'Mind Map',
          icon: 'network',
        },
        {
          key: 'r-contacts',
          module: 'account',
          params: { tab: 'contacts' },
          label: 'Contacts',
          icon: 'user',
        },
        {
          key: 'r-customers',
          module: 'account',
          params: { tab: 'customers' },
          label: 'Customers',
          icon: 'user',
        },
        { key: 'r-locations', module: 'locations', label: 'Locations', icon: 'mapPin' },
        {
          key: 'r-routes',
          module: 'account',
          params: { tab: 'routes' },
          label: 'Routes',
          icon: 'route',
        },
        {
          key: 'r-segments',
          module: 'account',
          params: { tab: 'segments' },
          label: 'Service Provider Segments',
          icon: 'layers',
        },
        {
          key: 'r-notif',
          module: 'account',
          params: { tab: 'notifications' },
          label: 'Service Notifications',
          icon: 'bell',
        },
      ],
    },
    {
      type: 'section',
      label: 'Assets & Products',
      children: [
        { key: 'r-assets', module: 'assets', label: 'Assets', icon: 'box' },
        {
          key: 'r-products',
          module: 'account',
          params: { tab: 'products' },
          label: 'Service Provider Products',
          icon: 'package',
        },
      ],
    },
    {
      type: 'section',
      label: 'Operations',
      children: [
        { key: 'r-workOrders', module: 'workOrders', label: 'Work Orders', icon: 'clipboard' },
        { key: 'r-dispatches', module: 'dispatches', label: 'Dispatches', icon: 'send' },
        { key: 'r-trucks', module: 'trucks', label: 'Trucks', icon: 'truck' },
        {
          key: 'r-mrp',
          module: 'maintenanceRouteProfiles',
          label: 'Maintenance Route Profiles',
          icon: 'wrench',
        },
        {
          key: 'r-notes',
          module: 'notesAttachments',
          label: 'Notes & Attachments',
          icon: 'paperclip',
        },
        { key: 'mapCenter', module: 'mapCenter', label: 'Map Center', icon: 'map' },
        {
          key: 'bulkImport',
          module: 'bulkImport',
          label: 'Bulk Import (White Tool)',
          icon: 'download',
        },
      ],
    },
    {
      type: 'section',
      label: 'Telematics',
      children: [
        {
          key: 'r-indTips',
          module: 'individualTips',
          label: 'Individual Tip / Non-Tip',
          icon: 'layers',
        },
        {
          key: 'r-aggTips',
          module: 'aggregatedTips',
          label: 'Aggregated Truck and Tips',
          icon: 'barChart',
        },
        { key: 'devices', module: 'devices', label: 'Devices', icon: 'package' },
      ],
    },
    {
      type: 'section',
      label: 'Analytics',
      children: [
        {
          key: 'reports',
          module: 'analytics',
          params: { view: 'reports' },
          label: 'Reports',
          icon: 'clipboard',
        },
        {
          key: 'dashboards',
          module: 'analytics',
          params: { view: 'dashboards' },
          label: 'Dashboards',
          icon: 'barChart',
        },
        { key: 'activity', module: 'activity', label: 'Activity', icon: 'activity' },
        {
          key: 'reportSubs',
          module: 'reportSubscriptions',
          label: 'Report Subscriptions',
          icon: 'mail',
        },
      ],
    },
    {
      type: 'section',
      label: 'Configure',
      children: [
        {
          key: 'r-requestTypes',
          module: 'requestTypeResolutions',
          label: 'Request Type/Resolutions',
          icon: 'layers',
        },
      ],
    },
  ],
  customer: [
    { type: 'item', key: 'home', module: 'home', label: 'Home', icon: 'home' },
    { type: 'item', key: 'myLocations', module: 'myLocations', label: 'My Locations', icon: 'mapPin' },
    {
      type: 'item',
      key: 'myWorkOrders',
      module: 'myWorkOrders',
      label: 'My Work Orders',
      icon: 'clipboard',
    },
    {
      type: 'item',
      key: 'myNotifications',
      module: 'myNotifications',
      label: 'Notifications',
      icon: 'bell',
    },
    { type: 'item', key: 'myAccount', module: 'myAccount', label: 'My Account', icon: 'users' },
  ],
};

export const MODULE_LABELS = {
  home: 'Home',
  accounts: 'Service Providers',
  accountDetail: 'Service Provider',
  account: 'My Service Provider',
  contacts: 'Contacts',
  serviceTypes: 'Service Types',
  locationTypes: 'Location Types',
  assetTypes: 'Asset Types',
  productTypes: 'Master Product Catalog',
  apiIntegrations: 'API Integrations',
  notificationConfig: 'Notification Config',
  reportSubscriptions: 'Report Subscriptions',
  setup: 'Workspace',
  workOrders: 'Work Orders',
  dispatches: 'Dispatches',
  assets: 'Assets',
  trucks: 'Trucks',
  locations: 'Locations',
  maintenanceRouteProfiles: 'Maintenance Route Profiles',
  notesAttachments: 'Notes & Attachments',
  requestTypeResolutions: 'Request Type / Resolutions',
  aggregatedTips: 'Aggregated Truck and Tips',
  individualTips: 'Individual Tip / Non-Tip',
  mapCenter: 'Map Center',
  bulkImport: 'Bulk Import (White Tool)',
  devices: 'Devices',
  activity: 'Activity',
  analytics: 'Analytics',
  myLocations: 'My Locations',
  myWorkOrders: 'My Work Orders',
  myNotifications: 'Notifications',
  myAccount: 'My Account',
  onboarding: 'Guided Onboarding',
  contractOnboarding: 'Contract Onboarding',
};

export function filterNavTree(tree, canNav) {
  return tree
    .map((n) => {
      if (n.type === 'item') return canNav(n.key) ? n : null;
      const children = (n.children || []).filter((c) => canNav(c.key));
      if (!children.length) return null;
      return { ...n, children };
    })
    .filter(Boolean);
}

/** Flat list of destinations in a persona tree, tagged with their group label. */
export function flattenNavDestinations(tree) {
  return tree.flatMap((node) =>
    node.type === 'item'
      ? [{ ...node, group: null }]
      : (node.children || []).map((child) => ({ ...child, group: node.label }))
  );
}

export function isNavItemActive(item, activeModule, activeParams = {}) {
  if (item.module !== activeModule) return false;
  if (item.params?.tab) return item.params.tab === activeParams.tab;
  if (item.params?.section) return item.params.section === (activeParams.section || 'userMgmt');
  if (item.params?.view) return item.params.view === activeParams.view;
  if (activeModule === 'home') return item.key === 'home';
  return true;
}
