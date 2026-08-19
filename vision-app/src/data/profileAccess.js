export const SEED_PROFILES = [
  {
    id: 'vp1',
    role: 'Service Provider Admin',
    access: 'SP: All access · Screen: All access',
    status: 'Active',
    description: 'Full operator access across every service provider and screen.',
    created: 'Hansie',
    createdDate: '14/01/26',
    lastUpdatedBy: 'Hansie',
    lastUpdatedDate: '14/01/26',
    preset: 'all',
  },
  {
    id: 'vp2',
    role: 'Account Manager',
    access: 'SP: All access · Screen: Partial access',
    status: 'Active',
    description: 'Account-level access with a reduced screen set.',
    created: 'Hansie',
    createdDate: '14/01/26',
    lastUpdatedBy: 'Hansie',
    lastUpdatedDate: '14/01/26',
    preset: 'partial',
  },
  {
    id: 'vp3',
    role: 'Fleet Manager',
    access: 'SP: 14 · Screen: Partial access',
    status: 'Active',
    description: 'Fleet, trucks, and dispatch for assigned providers.',
    created: 'Jacques',
    createdDate: '22/02/26',
    lastUpdatedBy: 'Jacques',
    lastUpdatedDate: '22/02/26',
    preset: 'partial',
  },
  {
    id: 'vp4',
    role: 'Asset Manager',
    access: 'SP: 14 · Screen: Partial access',
    status: 'Active',
    description: 'Assets, products, and yard inventory.',
    created: 'Jacques',
    createdDate: '22/02/26',
    lastUpdatedBy: 'Jacques',
    lastUpdatedDate: '22/02/26',
    preset: 'partial',
  },
  {
    id: 'vp5',
    role: 'Division Manager',
    access: 'SP: 8 · Screen: Partial access',
    status: 'Active',
    description: 'Division-scoped operations and reporting.',
    created: 'Jacques',
    createdDate: '25/02/26',
    lastUpdatedBy: 'Priya',
    lastUpdatedDate: '02/03/26',
    preset: 'partial',
  },
  {
    id: 'vp6',
    role: 'Driver / Maintenance Admin',
    access: 'SP: 3 · Screen: Mobile only',
    status: 'Active',
    description: 'Mobile driver tools and maintenance admin.',
    created: 'Hansie',
    createdDate: '02/03/26',
    lastUpdatedBy: 'Priya',
    lastUpdatedDate: '18/03/26',
    preset: 'mobile',
  },
  {
    id: 'vp7',
    role: 'Industrial Container Driver',
    access: 'SP: 3 · Screen: Mobile only',
    status: 'Active',
    description: 'Industrial container routes on the driver app.',
    created: 'Hansie',
    createdDate: '02/03/26',
    lastUpdatedBy: 'Priya',
    lastUpdatedDate: '18/03/26',
    preset: 'mobile',
  },
  {
    id: 'vp8',
    role: 'Maintenance Yard Manager',
    access: 'SP: 1 · Screen: View only',
    status: 'Inactive',
    description: 'Yard inventory visibility without edit rights.',
    created: 'Priya',
    createdDate: '18/03/26',
    lastUpdatedBy: 'Priya',
    lastUpdatedDate: '18/03/26',
    preset: 'view',
  },
];

export const PROFILE_SCREEN_MODULES = [
  {
    module: 'Platform Access & Identity',
    screens: [
      'Login Page',
      'Forgot Password / Reset Password',
      'Your Account (personal preferences)',
      'Login History / Security Audit',
    ],
  },
  {
    module: 'Home Dashboard',
    screens: [
      'Home — SP Admin View',
      'Home — SP Segment Admin View',
      'Customize Home (slide-over)',
      'Vision AI',
    ],
  },
  {
    module: 'Contacts',
    screens: [
      {
        name: 'Contacts List',
        fields: [
          'First Name',
          'Last Name',
          'Email',
          'Phone',
          'Role Title',
          'Profile',
          'Segment',
          'Status',
          'Enabled as Customer User',
        ],
      },
      'New / Edit Contact',
      'Contact Detail (popup)',
    ],
  },
  {
    module: 'Segments',
    screens: [
      { name: 'Service Provider Segments List', fields: ['Segment Name', 'Type', 'Parent Segment', 'Service Provider'] },
      'New / Edit Segment',
    ],
  },
  {
    module: 'Product Configuration',
    screens: [
      'Product Master Catalog List',
      'New / Edit Master Product',
      'Service Provider Products List',
      'New / Edit Service Provider Product',
    ],
  },
  {
    module: 'Request Types & Resolution Codes',
    screens: [
      'Request Types List',
      'New / Edit Request Type',
      'Resolution Codes List',
      'New / Edit Resolution Code',
      'Request Type Resolution Codes (RRC) List',
      'New / Edit RRC Record',
    ],
  },
  {
    module: 'Rehrig Master Configuration',
    screens: [
      'Service Types List',
      'New / Edit Service Type',
      'Location Types List',
      'New / Edit Location Type',
      'Route Profile Templates List',
      'New / Edit Route Profile Template',
      'Service Notification Config List',
      'New / Edit Service Notification Config',
    ],
  },
  {
    module: 'Customers & Manage Account',
    screens: [
      'Customers List',
      'New / Edit Customer',
      'Locations List',
      'New / Edit Location',
      'Manage Customers — Search Screen',
      'Manage Customers — Account Detail View',
      'Manage Customers — Asset Action Panel',
      'Manage Customers — Assign New Asset Modal',
      'Manage Customers — Tip History View',
      'Manage Customers — Map Asset View',
      'Manage Customers — Observation History View',
      'Mass Upload Customers',
    ],
  },
  {
    module: 'Assets & Trucks',
    screens: [
      'Assets List',
      'New / Edit Asset',
      'Asset Import — Standard',
      'Asset Import — Legacy / Cart System',
      'Trucks List',
      'New / Edit Truck',
    ],
  },
  {
    module: 'Work Orders',
    screens: [
      'Work Orders List',
      'Work Order Source Picker',
      'New / Edit Work Order',
      'WOIT — Stage 1: Upload',
      'WOIT — Stage 2: Preview Mapping',
      'WOIT — Stage 3: Validate Sample',
      'WOIT — Stage 4: Commit',
    ],
  },
  {
    module: 'Routing & Dispatch',
    screens: [
      'Routes List',
      'New / Edit Route',
      'Dispatch — Route Table / Grid View',
      'Dispatch — Lasso Routing View',
      'Dispatch — Manage Profiles',
      'Dispatch — Publish Confirmation',
    ],
  },
  {
    module: 'Map Center',
    screens: [
      'Map Center — Main Map View',
      'Map Center — Address Search Panel',
      'Map Center — Route Progress View',
    ],
  },
  {
    module: 'Telematics / Tips',
    screens: [
      'Individual Tips / Non-Tip Events List',
      'New / Edit Individual Tip',
      'Aggregated Truck and Tips List',
      'New / Edit Aggregated Tip Record',
    ],
  },
  {
    module: 'Service Notifications',
    screens: ['Service Notifications List (account-level)', 'New / Edit Service Notification'],
  },
  { module: 'Notes & Attachments', screens: ['Notes & Attachments List', 'New Note'] },
  { module: 'Driver Mobile App', screens: ['Mobile — Service Provider Admin View'] },
  {
    module: 'Activity Feed',
    screens: ['Activity Feed (Chatter equivalent)', 'Chatter Posts', 'Mentions'],
  },
  {
    module: 'Governance',
    screens: [
      'Approvals Queue',
      'Record Sharing',
      'Customer Insights',
      'Holiday Schedule',
      'Automation Center',
      'QAlert (Sarasota Co.)',
    ],
  },
  {
    module: 'Integration & Device Mapping',
    screens: ['WO Service Provider Mapping', 'Truck Device Sync'],
  },
];

export const TOTAL_PROFILE_SCREENS = PROFILE_SCREEN_MODULES.reduce(
  (sum, group) => sum + group.screens.length,
  0
);

function screenName(entry) {
  return typeof entry === 'string' ? entry : entry.name;
}

function screenFields(entry) {
  return typeof entry === 'string' ? null : entry.fields || null;
}

function flagsForPreset(group, entry, index, preset) {
  if (preset === 'all' || preset === true) {
    return { view: true, edit: true, create: true, delete: true };
  }
  if (preset === 'none' || preset === 'off' || preset === false) {
    return { view: false, edit: false, create: false, delete: false };
  }
  if (preset === 'view') return { view: true, edit: false, create: false, delete: false };
  if (preset === 'mobile') {
    const on = group.module === 'Driver Mobile App' || group.module === 'Home Dashboard';
    return { view: on, edit: on, create: false, delete: false };
  }
  const operational = [
    'Home Dashboard',
    'Contacts',
    'Customers & Manage Account',
    'Assets & Trucks',
    'Work Orders',
    'Routing & Dispatch',
    'Activity Feed',
    'Governance',
  ];
  if (!operational.includes(group.module)) {
    return { view: false, edit: false, create: false, delete: false };
  }
  if (index === 0) {
    return {
      view: true,
      edit: group.module === 'Home Dashboard',
      create: false,
      delete: false,
    };
  }
  return {
    view: group.module === 'Home Dashboard',
    edit: false,
    create: false,
    delete: false,
  };
}

export function buildScreenModules(preset = 'all') {
  return PROFILE_SCREEN_MODULES.map((group) => ({
    module: group.module,
    expanded: false,
    screens: group.screens.map((entry, index) => {
      const access = flagsForPreset(group, entry, index, preset);
      const fields = screenFields(entry);
      return {
        id: `${group.module.slice(0, 3)}-${index}`,
        name: screenName(entry),
        view: access.view,
        edit: access.edit,
        create: access.create,
        delete: access.delete,
        expanded: false,
        fields: fields
          ? fields.map((name, fieldIndex) => ({
              id: `${group.module.slice(0, 3)}-${index}-f${fieldIndex}`,
              name,
              view: access.view,
              edit: access.edit,
            }))
          : null,
      };
    }),
  }));
}

export function collectFlags(screen) {
  const flags = [!!screen.view, !!screen.edit, !!screen.create, !!screen.delete];
  (screen.fields || []).forEach((field) => {
    flags.push(!!field.view, !!field.edit);
  });
  return flags;
}

export function accessStateFromFlags(flags) {
  const on = flags.filter(Boolean).length;
  if (on === 0) return 'off';
  if (on === flags.length) return 'on';
  return 'partial';
}

export function screenAccessState(screen) {
  return accessStateFromFlags(collectFlags(screen));
}

export function moduleAccessState(group) {
  return accessStateFromFlags(group.screens.flatMap(collectFlags));
}

export function buildProviderTree(accounts = [], segments = [], options = {}) {
  const checked = options.checked !== false;
  if (!accounts.length) {
    return [
      {
        id: 'sp1',
        name: 'Service Provider 1',
        checked,
        segments: [
          { id: 'sp1-seg1', name: 'Segment 1', checked },
          { id: 'sp1-seg2', name: 'Segment 2', checked },
          { id: 'sp1-seg3', name: 'Segment 3', checked },
        ],
      },
      {
        id: 'sp2',
        name: 'Service Provider 2',
        checked,
        segments: [
          { id: 'sp2-seg1', name: 'Segment 1', checked },
          { id: 'sp2-seg2', name: 'Segment 2', checked },
        ],
      },
    ];
  }

  return accounts.map((account) => {
    const kids = segments.filter((segment) => segment.accountId === account.id);
    return {
      id: account.id,
      name: account.name,
      checked,
      segments: kids.map((segment) => ({
        id: segment.id,
        name: segment.name,
        checked,
      })),
    };
  });
}

export function summarizeProfileAccess(providers, screens) {
  const selectedProviders = providers.filter(
    (provider) => provider.checked || provider.segments.some((segment) => segment.checked)
  ).length;
  const enabledScreens = screens.reduce(
    (sum, group) =>
      sum +
      group.screens.filter(
        (screen) => screen.view || screen.edit || screen.create || screen.delete || screen.enabled
      ).length,
    0
  );
  const totalScreens = screens.reduce((sum, group) => sum + group.screens.length, 0);
  const allProviders = selectedProviders === providers.length && providers.length > 0;
  const allScreens = enabledScreens === totalScreens && totalScreens > 0;
  const noScreens = enabledScreens === 0;

  const spLabel = allProviders ? 'All access' : String(selectedProviders);
  let screenLabel = 'Partial access';
  if (allScreens) screenLabel = 'All access';
  else if (noScreens) screenLabel = 'None';
  else if (enabledScreens <= 2) screenLabel = 'Mobile only';

  return `SP: ${spLabel} · Screen: ${screenLabel}`;
}
