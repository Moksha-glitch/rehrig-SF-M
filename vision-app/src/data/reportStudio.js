/** Reports Studio options and seed specs (V1.4 report builder). */

export const REPORT_TIMEFRAMES = [
  { k: 'today', l: 'Today' },
  { k: 'yesterday', l: 'Yesterday' },
  { k: 'last7d', l: 'Last 7 days' },
  { k: 'last30d', l: 'Last 30 days' },
  { k: 'last90d', l: 'Last 90 days' },
  { k: 'thisWeek', l: 'This week' },
  { k: 'thisMonth', l: 'This month' },
  { k: 'thisQuarter', l: 'This quarter' },
  { k: 'ytd', l: 'Year to date' },
  { k: 'all', l: 'All time' },
];

export const REPORT_CHART_TYPES = [
  { k: 'bar', l: 'Bar' },
  { k: 'bar-h', l: 'Horizontal' },
  { k: 'bar-grouped', l: 'Grouped' },
  { k: 'line', l: 'Line' },
  { k: 'area', l: 'Area' },
  { k: 'donut', l: 'Donut' },
  { k: 'progress', l: 'Progress' },
];

export const REPORT_DATA_SOURCES = {
  workOrders: {
    label: 'Work Orders',
    kind: 'workOrders',
    fields: [
      'priority',
      'status',
      'account',
      'requestType',
      'resolutionCode',
      'hotTicket',
      'owner',
    ],
  },
  dispatches: {
    label: 'Dispatches',
    kind: 'dispatches',
    fields: ['status', 'account', 'truck', 'driver'],
  },
  trucks: {
    label: 'Trucks',
    kind: 'trucks',
    fields: ['status', 'account', 'truckType'],
  },
  assets: {
    label: 'Assets',
    kind: 'assets',
    fields: ['status', 'account', 'product', 'family'],
  },
  aggregatedTips: {
    label: 'Aggregated Tips',
    kind: 'aggregatedTips',
    fields: ['account', 'truck', 'material'],
  },
  locations: {
    label: 'Locations',
    kind: 'locations',
    fields: ['type', 'account', 'city', 'state'],
  },
};

export const REPORT_SORT_BY = [
  { k: 'value', l: 'Metric value' },
  { k: 'name', l: 'Group name' },
];

export const REPORT_MAP_DENSITIES = [
  { k: 'concentrated', l: 'Concentrated' },
  { k: 'sparse', l: 'Sparse' },
  { k: 'low-volume', l: 'Low volume' },
];

export function blankReportSpec(overrides = {}) {
  return {
    id: null,
    name: 'Untitled report',
    desc: '',
    source: 'workOrders',
    timeframe: 'last30d',
    groupBy: 'priority',
    subGroupBy: '',
    chart: 'bar',
    sortBy: 'value',
    sortDir: 'desc',
    limit: 20,
    yMin: '',
    yMax: '',
    showLegend: true,
    showLabels: false,
    mapDensity: 'concentrated',
    ownerId: '',
    owner: '',
    sharedWith: [],
    visibility: 'private',
    favorite: false,
    lastViewed: '',
    category: 'Operations',
    template: false,
    ...overrides,
  };
}

export const SEED_REPORT_SPECS = [
  blankReportSpec({
    id: 'rpt-hot-aging',
    name: 'Hot Tickets Aging',
    desc: 'Open high-priority work orders by priority.',
    source: 'workOrders',
    groupBy: 'priority',
    chart: 'bar',
    timeframe: 'last30d',
    ownerId: 'u-hrehrig',
    owner: 'Helena Rehrig',
    sharedWith: ['*'],
    visibility: 'public',
    favorite: true,
    lastViewed: '2026-08-10T14:30:00.000Z',
    category: 'SLA & Compliance',
  }),
  blankReportSpec({
    id: 'rpt-sla-account',
    name: 'SLA % by Account',
    desc: 'Work order volume grouped by account.',
    source: 'workOrders',
    groupBy: 'account',
    chart: 'progress',
    timeframe: 'last90d',
    ownerId: 'u-avolkov',
    owner: 'Anton Volkov',
    sharedWith: ['*'],
    category: 'Customer Insights',
  }),
  blankReportSpec({
    id: 'rpt-truck-util',
    name: 'Truck Utilization',
    desc: 'Fleet status distribution.',
    source: 'trucks',
    groupBy: 'status',
    chart: 'donut',
    timeframe: 'all',
    ownerId: 'u-hrehrig',
    owner: 'Helena Rehrig',
    visibility: 'public',
    favorite: true,
    lastViewed: '2026-08-08T09:15:00.000Z',
    category: 'Fleet Health',
  }),
  blankReportSpec({
    id: 'rpt-assets-family',
    name: 'Assets by Family',
    desc: 'Asset counts by product family.',
    source: 'assets',
    groupBy: 'product',
    chart: 'donut',
    timeframe: 'all',
    ownerId: 'u-avolkov',
    owner: 'Anton Volkov',
    sharedWith: ['u-hrehrig'],
    category: 'Fleet Health',
    template: true,
  }),
  blankReportSpec({
    id: 'rpt-dispatch-day',
    name: 'Dispatches by Status',
    desc: 'Dispatch pipeline by status.',
    source: 'dispatches',
    groupBy: 'status',
    chart: 'area',
    timeframe: 'last7d',
    ownerId: 'u-hrehrig',
    owner: 'Helena Rehrig',
    category: 'Operations',
    lastViewed: '2026-08-11T11:00:00.000Z',
  }),
  blankReportSpec({
    id: 'rpt-tips-material',
    name: 'Tips by Material',
    desc: 'Aggregated tip counts by material.',
    source: 'aggregatedTips',
    groupBy: 'material',
    chart: 'bar',
    timeframe: 'last30d',
    ownerId: 'u-avolkov',
    owner: 'Anton Volkov',
    visibility: 'public',
    category: 'Operations',
  }),
];

/** Aggregate records into grouped chart data for a report spec. */
export function aggregateReportRows(rows, spec) {
  const groupBy = spec.groupBy || 'status';
  const subGroupBy = spec.subGroupBy || '';
  const buckets = new Map();

  rows.forEach((row) => {
    const primary = String(row[groupBy] ?? '—');
    const key = subGroupBy ? `${primary} / ${String(row[subGroupBy] ?? '—')}` : primary;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });

  let data = [...buckets.entries()].map(([name, value]) => ({ name, value }));
  data.sort((a, b) => {
    if (spec.sortBy === 'name') {
      return spec.sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    return spec.sortDir === 'asc' ? a.value - b.value : b.value - a.value;
  });
  const limit = Math.max(1, Math.min(100, Number(spec.limit) || 20));
  return data.slice(0, limit);
}
