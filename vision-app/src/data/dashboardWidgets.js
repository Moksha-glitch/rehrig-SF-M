export const DASHBOARD_WIDGETS = [
  { id: 'kpi-tiles', title: 'KPI Tiles', category: 'Overview', span: 12 },
  { id: 'hot-ticket-aging', title: 'Hot Ticket Aging', category: 'Operations', span: 8 },
  { id: 'ops-health', title: 'Ops Health', category: 'Fleet', span: 4 },
  { id: 'live-dispatches', title: 'Live Dispatches', category: 'Dispatch', span: 4 },
  { id: 'priority-wos', title: 'Priority Work Orders', category: 'Operations', span: 4 },
  { id: 'setup-checklist', title: 'Setup Checklist', category: 'Configuration', span: 4 },
  { id: 'missed-pickups', title: 'Missed Pickups 30d', category: 'Operations', span: 4 },
  { id: 'sla-by-account', title: 'SLA % by Service Provider', category: 'Compliance', span: 6 },
  { id: 'tip-history', title: 'Tip History', category: 'Collections', span: 6 },
  { id: 'my-work-orders', title: 'My Work Orders', category: 'Operations', span: 4 },
  { id: 'active-dispatches', title: 'Active Dispatches', category: 'Dispatch', span: 4 },
  { id: 'open-work-orders', title: 'Open Work Orders', category: 'Operations', span: 4 },
  { id: 'trucks-in-field', title: 'Trucks in Field', category: 'Fleet', span: 4 },
  { id: 'tons-collected-today', title: 'Tons Collected Today', category: 'Collections', span: 4 },
  { id: 'truck-utilization', title: 'Truck Utilization', category: 'Fleet', span: 6 },
  { id: 'wo-opened-closed', title: 'WO Opened vs Closed', category: 'Operations', span: 6 },
  { id: 'assets-by-family', title: 'Assets by Family', category: 'Assets', span: 4 },
  { id: 'providers-by-industry', title: 'Providers by Industry', category: 'Overview', span: 4 },
];

export const DASHBOARD_WIDGET_BY_ID = Object.fromEntries(
  DASHBOARD_WIDGETS.map((widget) => [widget.id, widget])
);

export const DASHBOARD_ROLE_PRESETS = {
  Default: [
    'kpi-tiles',
    'hot-ticket-aging',
    'ops-health',
    'live-dispatches',
    'priority-wos',
    'missed-pickups',
    'truck-utilization',
    'wo-opened-closed',
  ],
  'Field Tech': ['kpi-tiles', 'my-work-orders', 'live-dispatches', 'priority-wos'],
  Analyst: ['kpi-tiles', 'sla-by-account', 'hot-ticket-aging', 'missed-pickups'],
  Customer: ['kpi-tiles', 'my-work-orders'],
};

export function dashboardPresetFor(user) {
  const role = user?.persona === 'customer' ? 'Customer' : user?.role;
  return [...(DASHBOARD_ROLE_PRESETS[role] || DASHBOARD_ROLE_PRESETS.Default)];
}
