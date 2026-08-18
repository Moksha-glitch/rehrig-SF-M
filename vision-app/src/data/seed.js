// Seed fixtures for Vision 2.0 (Spec Ch.1, Ch.12, Ch.21, Ch.23).

// ---- Seed users across the three personas (Ch.1) ----
export const USERS = [
  // rehrig persona
  { id: 'u-hrehrig', alias: 'hrehrig', name: 'Helena Rehrig', firstName: 'Helena', email: 'helena@vision.io', persona: 'rehrig', role: 'Admin', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  { id: 'u-avolkov', alias: 'avolkov', name: 'Anton Volkov', firstName: 'Anton', email: 'anton@vision.io', persona: 'rehrig', role: 'Admin', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  // sp persona
  { id: 'u-ywagn', alias: 'ywagn', name: 'Yolanda Wagner', firstName: 'Yolanda', email: 'yolanda@vision.io', persona: 'sp', role: 'Admin', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  { id: 'u-mchen', alias: 'mchen', name: 'Marcus Chen', firstName: 'Marcus', email: 'marcus@vision.io', persona: 'sp', role: 'Ops Manager', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  { id: 'u-dthorn', alias: 'dthorn', name: 'David Thornton', firstName: 'David', email: 'david@vision.io', persona: 'sp', role: 'Field Tech', scopeLabel: 'Edmonton AB only', active: true, accountIds: ['acc-212880'], segmentIds: [] },
  { id: 'u-praman', alias: 'praman', name: 'Priya Ramanathan', firstName: 'Priya', email: 'priya@vision.io', persona: 'sp', role: 'Analyst', scopeLabel: 'All accounts (Inactive)', active: false, accountIds: [], segmentIds: [] },
  { id: 'u-skami', alias: 'skami', name: 'Sarah Kaminski', firstName: 'Sarah', email: 'sarah@vision.io', persona: 'sp', role: 'Dispatcher', scopeLabel: 'Toronto Waste Services only', active: true, accountIds: ['acc-212883'], segmentIds: [] },
  { id: 'u-jortiz', alias: 'jortiz', name: 'Jordan Ortiz', firstName: 'Jordan', email: 'jordan@vision.io', persona: 'sp', role: 'Maintenance Admin', scopeLabel: 'Edmonton AB only', active: true, accountIds: ['acc-212880'], segmentIds: [] },
  { id: 'u-rmedam', alias: 'rmedam', name: 'Ravindra Medam', firstName: 'Ravindra', email: 'ravi.medam@vision.io', persona: 'sp', role: 'Admin', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  // customer persona
  { id: 'u-sobrien', alias: 'sobrien', name: "Sam O'Brien", firstName: 'Sam', email: 'sam@vision.io', persona: 'customer', role: 'Portal User', scopeLabel: 'Edmonton AB', active: true, accountIds: ['acc-212880'], segmentIds: [], customerId: 'cust-1001' },
  { id: 'u-npetrov', alias: 'npetrov', name: 'Nadia Petrov', firstName: 'Nadia', email: 'nadia@vision.io', persona: 'customer', role: 'Portal User', scopeLabel: 'Edmonton AB', active: true, accountIds: ['acc-212880'], segmentIds: [], customerId: 'cust-1002' },
];

// ---- The six existing Service Provider accounts (Ch.23) ----
export const ACCOUNTS = [
  {
    id: 'acc-212880',
    name: 'Edmonton AB',
    uid: '212880',
    type: 'Customer',
    industry: 'Municipal',
    phone: '(780) 555-0110',
    owner: 'ywagn',
    ownerName: 'Yolanda Wagner',
    website: 'edmonton.ca',
    description: 'Municipal waste services for the City of Edmonton.',
    employees: 240,
    numberOfWeeks: 52,
    jdEdwardsId: '',
    serviceTypes: ['Commercial', 'Residential'],
    serviceModules: 'WO, Dispatch, Tips, Notifications',
    hardwareType: 'RFID + Arm-lift',
    trackObservations: true,
    trackSafetyEvents: true,
    enableAutoWO: true,
    enableAutoHotTicket: true,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: true,
    isTableauCloud: true,
    inactive: false,
    supportEmail: 'support@edmonton.ca',
    notif: {
      enableTab: true, send: true, messageLimit: 1, timeZone: 'Asia/Kolkata',
      startTime: '08:00', endTime: '19:00', emailSendTime: '22:56', smsSendTime: '15:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '9803 102A Ave NW', city: 'Edmonton', state: 'Alberta', zip: 'T5J 3A3' },
    shipping: { country: 'Canada', street: '9803 102A Ave NW', city: 'Edmonton', state: 'Alberta', zip: 'T5J 3A3' },
    paymentRequired: false,
    apiIntegrated: false,
    onboardingComplete: true,
    residents: 1,
    addedDate: '2024-03-02',
    createdBy: 'Yolanda Wagner, 3/2/2024, 9:14 AM',
    lastModifiedBy: 'Helena Rehrig, 6/29/2026, 4:02 PM',
  },
  {
    id: 'acc-212881',
    name: 'Calgary Metro Waste',
    uid: '212881',
    type: 'Customer',
    industry: 'Municipal',
    phone: '(403) 555-0134',
    owner: 'rmedam',
    ownerName: 'Ravindra Medam',
    website: 'calgarymetrowaste.ca',
    description: 'Residential recycling and organics for Calgary metro.',
    employees: 180,
    numberOfWeeks: 52,
    jdEdwardsId: '',
    serviceTypes: ['Residential'],
    serviceModules: 'WO, Dispatch',
    hardwareType: 'RFID',
    trackObservations: true,
    trackSafetyEvents: true,
    enableAutoWO: true,
    enableAutoHotTicket: false,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: false,
    isTableauCloud: false,
    inactive: false,
    supportEmail: 'help@calgarymetrowaste.ca',
    notif: {
      enableTab: true, send: true, messageLimit: 3, timeZone: 'America/Edmonton',
      startTime: '06:00', endTime: '18:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '800 Macleod Trail SE', city: 'Calgary', state: 'Alberta', zip: 'T2G 2M3' },
    shipping: { country: 'Canada', street: '800 Macleod Trail SE', city: 'Calgary', state: 'Alberta', zip: 'T2G 2M3' },
    paymentRequired: false,
    apiIntegrated: true,
    onboardingComplete: true,
    residents: 1,
    addedDate: '2024-06-04',
    createdBy: 'Ravindra Medam, 6/4/2024, 10:31 AM',
    lastModifiedBy: 'Ravindra Medam, 6/20/2026, 1:12 PM',
  },
  {
    id: 'acc-212882',
    name: 'Vancouver Sanitation Co',
    uid: '212882',
    type: 'Customer',
    industry: 'Environmental',
    phone: '(604) 555-0158',
    owner: 'rmedam',
    ownerName: 'Ravindra Medam',
    website: 'vansanitation.co',
    description: 'Commercial sanitation contractor for Greater Vancouver.',
    employees: 90,
    numberOfWeeks: 52,
    jdEdwardsId: '',
    serviceTypes: ['Commercial'],
    serviceModules: 'WO',
    hardwareType: 'None',
    trackObservations: false,
    trackSafetyEvents: false,
    enableAutoWO: false,
    enableAutoHotTicket: false,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: false,
    isTableauCloud: false,
    inactive: false,
    supportEmail: '',
    notif: {
      enableTab: true, send: false, messageLimit: 0, timeZone: 'America/Los_Angeles',
      startTime: '07:00', endTime: '20:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '453 W 12th Ave', city: 'Vancouver', state: 'British Columbia', zip: 'V5Y 1V4' },
    shipping: { country: 'Canada', street: '453 W 12th Ave', city: 'Vancouver', state: 'British Columbia', zip: 'V5Y 1V4' },
    paymentRequired: false,
    apiIntegrated: false,
    onboardingComplete: false,
    residents: 1,
    addedDate: '2024-09-21',
    createdBy: 'Ravindra Medam, 9/21/2024, 2:45 PM',
    lastModifiedBy: 'Ravindra Medam, 5/3/2026, 11:20 AM',
  },
  {
    id: 'acc-212883',
    name: 'Toronto Waste Services',
    uid: '212883',
    type: 'Customer',
    industry: 'Municipal',
    phone: '(416) 555-0172',
    owner: 'rmedam',
    ownerName: 'Ravindra Medam',
    website: 'torontowaste.ca',
    description: 'Commercial and residential collection across Toronto.',
    employees: 320,
    numberOfWeeks: 52,
    jdEdwardsId: '',
    serviceTypes: ['Commercial', 'Residential'],
    serviceModules: 'WO, Dispatch, Tips, Notifications, Payments',
    hardwareType: 'RFID + Arm-lift',
    trackObservations: true,
    trackSafetyEvents: true,
    enableAutoWO: true,
    enableAutoHotTicket: true,
    autoHotTicketDays: 2,
    enableMoveBurntCarts: true,
    isTableauCloud: true,
    inactive: false,
    supportEmail: 'support@torontowaste.ca',
    notif: {
      enableTab: true, send: true, messageLimit: 2, timeZone: 'America/Toronto',
      startTime: '07:00', endTime: '20:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '100 Queen St W', city: 'Toronto', state: 'Ontario', zip: 'M5H 2N2' },
    shipping: { country: 'Canada', street: '100 Queen St W', city: 'Toronto', state: 'Ontario', zip: 'M5H 2N2' },
    paymentRequired: false,
    apiIntegrated: true,
    onboardingComplete: true,
    residents: 1,
    addedDate: '2025-01-08',
    createdBy: 'Ravindra Medam, 1/8/2025, 8:52 AM',
    lastModifiedBy: 'Sarah Kaminski, 7/1/2026, 7:40 AM',
  },
  {
    id: 'acc-212884',
    name: 'Winnipeg Green Bins Ltd',
    uid: '212884',
    type: 'Customer',
    industry: 'Environmental',
    phone: '(204) 555-0193',
    owner: 'rmedam',
    ownerName: 'Ravindra Medam',
    website: 'winnipeggreenbins.ca',
    description: 'Residential green bin program for Winnipeg.',
    employees: 60,
    numberOfWeeks: 52,
    jdEdwardsId: '',
    serviceTypes: ['Residential'],
    serviceModules: '',
    hardwareType: 'None',
    trackObservations: false,
    trackSafetyEvents: false,
    enableAutoWO: false,
    enableAutoHotTicket: false,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: false,
    isTableauCloud: false,
    inactive: true,
    supportEmail: '',
    notif: {
      enableTab: true, send: false, messageLimit: 0, timeZone: 'America/Chicago',
      startTime: '07:00', endTime: '20:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '510 Main St', city: 'Winnipeg', state: 'Manitoba', zip: 'R3B 1B9' },
    shipping: { country: 'Canada', street: '510 Main St', city: 'Winnipeg', state: 'Manitoba', zip: 'R3B 1B9' },
    paymentRequired: false,
    apiIntegrated: false,
    onboardingComplete: true,
    residents: 0,
    addedDate: '2025-03-14',
    createdBy: 'Ravindra Medam, 3/14/2025, 3:18 PM',
    lastModifiedBy: 'Ravindra Medam, 4/1/2026, 9:05 AM',
  },
  {
    id: 'acc-212885',
    name: 'Fairfax County VA',
    uid: '212885',
    type: 'Customer',
    industry: 'Municipal',
    phone: '(703) 555-0217',
    owner: 'ywagn',
    ownerName: 'Yolanda Wagner',
    website: 'fairfaxcounty.gov',
    description: 'Residential collection for Fairfax County, Virginia.',
    employees: 210,
    numberOfWeeks: 52,
    jdEdwardsId: '',
    serviceTypes: ['Residential'],
    serviceModules: 'WO, Dispatch, Payments',
    hardwareType: 'RFID',
    trackObservations: true,
    trackSafetyEvents: true,
    enableAutoWO: true,
    enableAutoHotTicket: true,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: false,
    isTableauCloud: true,
    inactive: false,
    supportEmail: 'support@fairfaxcounty.gov',
    notif: {
      enableTab: true, send: true, messageLimit: 2, timeZone: 'America/New_York',
      startTime: '06:00', endTime: '18:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'United States', street: '12000 Government Center Pkwy', city: 'Fairfax', state: 'Virginia', zip: '22035' },
    shipping: { country: 'United States', street: '12000 Government Center Pkwy', city: 'Fairfax', state: 'Virginia', zip: '22035' },
    paymentRequired: true,
    apiIntegrated: false,
    onboardingComplete: true,
    residents: 1,
    addedDate: '2025-05-27',
    createdBy: 'Yolanda Wagner, 5/27/2025, 1:47 PM',
    lastModifiedBy: 'Helena Rehrig, 6/30/2026, 5:15 PM',
  },
];

// ---- Master Product Catalog (Ch.12, Ch.21) ----
export const MASTER_CATALOG = [
  { code: 'MPR-001', name: '120 Liter Trash', family: 'Roll-Out Cart', serviceType: 'Trash', category: 'Residential', size: '120 L', active: true },
  { code: 'MPR-002', name: '240 Liter Trash', family: 'Roll-Out Cart', serviceType: 'Trash', category: 'Residential', size: '240 L', active: true },
  { code: 'MPR-003', name: '360 Liter Organics', family: 'Universal Cart', serviceType: 'Organics', category: 'Residential', size: '360 L', active: true },
  { code: 'MPR-004', name: '96 Gallon Trash', family: 'Roll-Out Cart', serviceType: 'Trash', category: 'Residential', size: '96 gal', active: true },
  { code: 'MPR-005', name: '3 YD Garbage Bin Trash', family: 'Bin', serviceType: 'Trash', category: 'Commercial', size: '3 YD', active: true },
  { code: 'MPR-006', name: '4 YD Garbage Bin Trash', family: 'Bin', serviceType: 'Trash', category: 'Commercial', size: '4 YD', active: true },
  { code: 'MPR-007', name: '3 YD Recycle Bin Recycling', family: 'Bin', serviceType: 'Recycling', category: 'Commercial', size: '3 YD', active: true },
  { code: 'MPR-008', name: '1100 Liter Universal', family: 'Universal Cart', serviceType: 'Industrial', category: 'Industrial', size: '1100 L', active: true },
];

// Products shown on Wizard Step 5 (Ch.12.1 - six products)
export const WIZARD_PRODUCTS = ['MPR-001', 'MPR-002', 'MPR-004', 'MPR-005', 'MPR-006', 'MPR-007'];

// ---- API Integrations at launch (Ch.21.5) ----
export const API_INTEGRATIONS = [
  { id: 'api-1', name: 'Calgary Metro Waste', endpoint: '/api/v1/workorder', status: 'Active', calls30d: 1420 },
  { id: 'api-2', name: 'Toronto Waste Services', endpoint: '/api/v1/workorder', status: 'Active', calls30d: 3218 },
  { id: 'api-3', name: 'Unknown (Legacy)', endpoint: '/api/v1/workorder', status: 'Suspected', calls30d: 22 },
];

// ---- Service Notification Config rules (Ch.21, Ch.21.6) ----
export const NOTIFICATION_CONFIG = [
  { id: 'nc-1', enabled: true, name: 'Work Order Completed', event: 'work_order.completed', channel: 'SMS', priority: 'High' },
  { id: 'nc-2', enabled: true, name: 'Delivery Scheduled', event: 'work_order.delivery_scheduled', channel: 'Email', priority: 'Medium' },
  { id: 'nc-3', enabled: true, name: 'Missed Pickup Reported', event: 'work_order.missed_pickup', channel: 'SMS', priority: 'High' },
  { id: 'nc-4', enabled: false, name: 'Route Delayed', event: 'route.delayed', channel: 'Email', priority: 'Low' },
  { id: 'nc-5', enabled: true, name: 'Cart Delivered', event: 'asset.delivered', channel: 'Phone', priority: 'Medium' },
];

// ---- Master configuration vocabularies (Ch.21) ----
export const CONFIG_SERVICE_TYPES = [
  { id: 'st-1', name: 'Residential', description: 'Households; route-based collection.' },
  { id: 'st-2', name: 'Commercial', description: 'Businesses; on-demand or contract.' },
  { id: 'st-3', name: 'Industrial', description: 'Large sites; roll-off / front-load.' },
];
export const CONFIG_LOCATION_TYPES = [
  { id: 'lt-1', name: 'Single-Family Home', description: 'Detached residential property' },
  { id: 'lt-2', name: 'Multi-Family Home', description: 'Duplex, triplex, or similar' },
  { id: 'lt-3', name: 'Town Home', description: 'Terraced or town house' },
  { id: 'lt-4', name: 'Apartment', description: 'Apartment or condo building' },
  { id: 'lt-5', name: 'Commercial Business', description: 'Any commercial service address' },
  { id: 'lt-6', name: 'Yard', description: 'SP facility or depot' },
  { id: 'lt-7', name: 'Site', description: 'Industrial or construction site' },
  { id: 'lt-8', name: 'Rehrig Manufacturing', description: 'Rehrig own facility — used internally' },
  { id: 'lt-9', name: 'Other Yard', description: 'External third-party depot' },
  { id: 'lt-10', name: 'UNASSIGNED-WOIT', description: 'Catch-all for unmatched geocoding imports' },
];
export const CONFIG_ASSET_TYPES = [
  { id: 'at-1', name: 'Roll-Out Cart', description: 'Standard wheeled residential cart' },
  { id: 'at-2', name: 'Universal Cart', description: 'Multi-stream universal cart' },
  { id: 'at-3', name: 'Cart Bi-Weekly', description: 'Cart on a bi-weekly cycle' },
  { id: 'at-4', name: 'Industrial Container', description: 'Large industrial container' },
  { id: 'at-5', name: 'Self Contained Compactor', description: 'Compactor with integrated container' },
  { id: 'at-6', name: 'Break Away Compactor', description: 'Detachable compactor unit' },
  { id: 'at-7', name: 'IC Container', description: 'Intermediate container' },
  { id: 'at-8', name: 'Pickup', description: 'Pickup vehicle asset' },
  { id: 'at-9', name: 'Compactor', description: 'Standalone compactor' },
  { id: 'at-10', name: 'Roll Off', description: 'Roll-off container' },
  { id: 'at-11', name: 'Bin', description: 'Front-load / rear-load bin' },
];
export const CONFIG_PRODUCT_TYPES = CONFIG_ASSET_TYPES.map((t, i) => ({ id: 'pt-' + (i + 1), name: t.name, description: t.description }));
export const CONFIG_DEVICES = [
  { id: 'dev-1', name: 'RFID Arm Reader', code: 'RFID-ARM', type: 'RFID Reader', manufacturer: 'Rehrig', isActive: true, description: 'Side-arm RFID reader for residential carts.' },
  { id: 'dev-2', name: 'All-in-one Telematics', code: 'AIO-TEL', type: 'All-in-one', manufacturer: 'Samsara', isActive: true, description: 'Combined GPS, camera and tip sensor unit.' },
  { id: 'dev-3', name: 'Yard Handheld', code: 'HH-YARD', type: 'Other', manufacturer: 'Zebra', isActive: true, description: 'Handheld scanner used in maintenance yards.' },
];
export const CONFIG_TRUCKS = [
  { id: 'trkcfg-1', name: 'Residential Side Loader', code: 'RSL', type: 'Side Loader', isActive: true, description: 'Automated side-load truck for cart collection.' },
  { id: 'trkcfg-2', name: 'Commercial Front Loader', code: 'CFL', type: 'Front Loader', isActive: true, description: 'Front-load truck for commercial bins.' },
  { id: 'trkcfg-3', name: 'Roll-Off Hauler', code: 'ROH', type: 'Roll-Off', isActive: true, description: 'Roll-off truck for industrial containers.' },
];

// ---- Related records for account detail tabs ----
export const CONTACTS = [
  { id: 'con-1', accountId: 'acc-212880', salutation: 'Ms.', firstName: 'Yolanda', lastName: 'Wagner', name: 'Yolanda Wagner', email: 'yolanda@vision.io', phone: '(780) 555-0110', mobile: '(780) 555-2001', title: 'Operations Director', roleTitle: 'Service Provider Admin', segment: 'Edmonton AB Top', segmentId: 'seg-1', isUserCreated: true, isUserActive: true },
  { id: 'con-2', accountId: 'acc-212880', salutation: 'Mr.', firstName: 'David', lastName: 'Thornton', name: 'David Thornton', email: 'david@vision.io', phone: '(780) 555-0110', mobile: '(780) 555-2002', title: 'Field Technician', roleTitle: 'Field Tech', segment: 'Hauler 1', segmentId: 'seg-2', isUserCreated: true, isUserActive: true },
  { id: 'con-3', accountId: 'acc-212880', salutation: 'Mr.', firstName: 'Marcus', lastName: 'Chen', name: 'Marcus Chen', email: 'marcus@vision.io', phone: '(780) 555-0110', mobile: '(780) 555-2003', title: 'Ops Manager', roleTitle: 'Maintenance Admin', segment: 'Downtown District', segmentId: 'seg-3', isUserCreated: true, isUserActive: false },
  { id: 'con-4', accountId: 'acc-212883', salutation: 'Ms.', firstName: 'Sarah', lastName: 'Kaminski', name: 'Sarah Kaminski', email: 'sarah@vision.io', phone: '(416) 555-0172', mobile: '(416) 555-3001', title: 'Dispatch Lead', roleTitle: 'Dispatcher', segment: 'Toronto Top', segmentId: 'seg-10', isUserCreated: true, isUserActive: true },
];

export const SEGMENTS = [
  { id: 'seg-1', accountId: 'acc-212880', name: 'Edmonton AB Top', shortName: 'EDM-TOP', type: 'Top', parentId: null, delaySharing: false, delayDuration: 0, publicGroupId: 'PG-000001' },
  { id: 'seg-2', accountId: 'acc-212880', name: 'Hauler 1', shortName: 'H1', type: 'Market Area', parentId: 'seg-1', delaySharing: false, delayDuration: 0, publicGroupId: 'PG-000002' },
  { id: 'seg-3', accountId: 'acc-212880', name: 'Downtown District', shortName: 'DT', type: 'District', parentId: 'seg-2', delaySharing: false, delayDuration: 0, publicGroupId: 'PG-000003' },
  { id: 'seg-4', accountId: 'acc-212880', name: 'Division A', shortName: 'DIV-A', type: 'Division', parentId: 'seg-3', delaySharing: true, delayDuration: 300, publicGroupId: 'PG-000004' },
  { id: 'seg-10', accountId: 'acc-212883', name: 'Toronto Top', shortName: 'TOR-TOP', type: 'Top', parentId: null, delaySharing: false, delayDuration: 0, publicGroupId: 'PG-000010' },
];

export const ROUTES = [
  { id: 'rt-1', accountId: 'acc-212880', routeNumber: 'R-201', recordType: 'Collection', dispatch: 'D-72110', routeUID: 'UID-R201', duration: '8h', startTime: '06:30', truck: 'TRK-201', driver: 'David Thornton', status: 'Planned', collectionType: 'Trash', collectionDays: 'Monday, Wednesday, Friday', expectedContainers: 420 },
  { id: 'rt-2', accountId: 'acc-212880', routeNumber: 'R-202', recordType: 'Collection', dispatch: 'D-72114', routeUID: 'UID-R202', duration: '6h', startTime: '07:00', truck: 'TRK-102', driver: 'Ravi Nair', status: 'In Progress', collectionType: 'Recycle', collectionDays: 'Tuesday, Saturday', expectedContainers: 310 },
];

export const PRODUCTS_BY_ACCOUNT = {
  'acc-212880': [
    { id: 'spp-1', number: 'SPP-000101', code: 'MPR-001', product: '120 Liter Trash', size: '120 L', sizeType: 'Liter', category: 'Residential', family: 'Roll-Out Cart' },
    { id: 'spp-2', number: 'SPP-000102', code: 'MPR-004', product: '96 Gallon Trash', size: '96 gal', sizeType: 'Gallon', category: 'Residential', family: 'Roll-Out Cart' },
    { id: 'spp-3', number: 'SPP-000103', code: 'MPR-007', product: '3 YD Recycle Bin Recycling', size: '3 YD', sizeType: 'Yard', category: 'Commercial', family: 'Bin' },
  ],
};

// KPI helpers for the SP dashboard (Ch. dashboard visuals from render)
export const HOT_TICKET_AGING = [
  { name: 'Edmonton AB', breach: true, total: 5, buckets: [2, 1, 1, 1] },
  { name: 'Calgary Metro Waste', breach: true, total: 8, buckets: [2, 2, 2, 2] },
  { name: 'Vancouver Sanitation Co', breach: false, total: 8, buckets: [3, 3, 2, 0] },
  { name: 'Toronto Waste Services', breach: false, total: 7, buckets: [4, 1, 2, 0] },
  { name: 'Fairfax County VA', breach: false, total: 4, buckets: [1, 3, 0, 0] },
];

export const MISSED_PICKUPS_30D = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  Trash: 3 + Math.round(3 * Math.abs(Math.sin(i / 2))),
  Recycle: 2 + Math.round(2 * Math.abs(Math.cos(i / 3))),
  Organic: 1 + Math.round(2 * Math.abs(Math.sin(i / 4 + 1))),
}));

export const LIVE_DISPATCHES = [
  { id: 'D-72110', account: 'Edmonton AB', truck: 'TRK-201', pct: 62 },
  { id: 'D-72114', account: 'Edmonton AB', truck: 'TRK-102 · Ravi Nair', pct: 41 },
];

export const PRIORITY_WORK_ORDERS = [
  { id: '03933942', priority: 'Medium', subject: 'Deliver — 96...', account: 'Edmonton AB', owner: 'Yolanda Wagner' },
  { id: '03933920', priority: 'Medium', subject: 'Inactive Acco...', account: 'Edmonton AB', owner: 'Yolanda Wagner' },
];
