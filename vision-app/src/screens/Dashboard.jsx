import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Icon from '../components/Icon.jsx';
import { Badge, Page, PageHeader, Panel, StatStrip, AsyncState } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useRecords } from '../hooks/useRecords.js';
import { useDashboardAnalytics } from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';

const AGING_COLORS = ['#0f7b55', '#8b969f', '#c27803', '#b42318'];

function OpsBar({ label, value, target, warn }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="mono flex items-center gap-1 font-semibold tabular-nums text-ink">
          {warn && <Icon name="alert" size={13} className="text-warn" />}
          {value}%
        </span>
      </div>
      <div className="h-1 w-full bg-elevated">
        <div
          className={`h-1 transition-all duration-soft ease-out ${warn ? 'bg-warn' : 'bg-ink'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="mt-1.5 text-[11px] text-ink-faint">{target}</div>
    </div>
  );
}

export default function Dashboard() {
  const { state, navigate } = useStore();
  const accountsQuery = useAccounts();
  const workOrdersQuery = useRecords('workOrders');
  const dispatchesQuery = useRecords('dispatches');
  const trucksQuery = useRecords('trucks');
  const tipsQuery = useRecords('aggregatedTips');
  const analyticsQuery = useDashboardAnalytics();
  const first = state.currentUser?.firstName || 'there';
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const workOrders = workOrdersQuery.data?.data || [];
  const dispatches = dispatchesQuery.data?.data || [];
  const trucks = trucksQuery.data?.data || [];
  const tips = tipsQuery.data?.data || [];
  const openWorkOrders = workOrders.filter((w) => !['Closed', 'Complete'].includes(w.status));
  const activeDispatches = dispatches.filter((d) => ['In Route', 'In Progress'].includes(d.status));
  const activeTrucks = trucks.filter((t) => t.status === 'Active');
  const latestTipDate = tips.map((t) => t.date).filter(Boolean).sort().at(-1);
  const latestTons = tips.filter((t) => t.date === latestTipDate).reduce((sum, t) => sum + Number(t.tons || 0), 0);
  const agingRows = analyticsQuery.data?.hotTicketAging || [];
  const missedPickups = analyticsQuery.data?.missedPickups30d || [];
  const priorityWorkOrders = openWorkOrders.slice(0, 5);
  const fleetUtilization = trucks.length ? Math.round((activeTrucks.length / trucks.length) * 100) : 0;
  const completedWorkOrders = workOrders.filter((workOrder) =>
    ['Closed', 'Complete'].includes(workOrder.status)
  ).length;
  const resolutionRate = workOrders.length
    ? Math.round((completedWorkOrders / workOrders.length) * 100)
    : 0;
  const loading =
    workOrdersQuery.isLoading ||
    dispatchesQuery.isLoading ||
    trucksQuery.isLoading ||
    analyticsQuery.isLoading;

  return (
    <Page wide>
      <PageHeader
        overline={today}
        title={`Good morning, ${first}.`}
        description={`Operational snapshot · ${openWorkOrders.length} open work orders · source data through ${latestTipDate || 'unknown'}`}
      />
      <AsyncState
        loading={loading}
        error={
          workOrdersQuery.isError
            ? getErrorMessage(workOrdersQuery.error)
            : null
        }
        onRetry={() => {
          workOrdersQuery.refetch();
          dispatchesQuery.refetch();
          trucksQuery.refetch();
          analyticsQuery.refetch();
        }}
      >

      <StatStrip
        items={[
          { label: 'Active dispatches', value: activeDispatches.length, hint: `${dispatches.length} dispatches in dataset` },
          { label: 'Open work orders', value: openWorkOrders.length, hint: `${workOrders.length} total records` },
          { label: 'Active trucks', value: activeTrucks.length, hint: `of ${trucks.length} tracked` },
          { label: `Tons on ${latestTipDate || 'latest date'}`, value: latestTons.toFixed(1), hint: 'Sum of aggregated tip records' },
        ]}
      />
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <button className="link-brand" onClick={() => navigate('dispatches')}>Open dispatches →</button>
        <button className="link-brand" onClick={() => navigate('workOrders')}>Open work orders →</button>
        <button className="link-brand" onClick={() => navigate('trucks')}>Review fleet →</button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel className="lg:col-span-8" padded>
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="type-overline">SLA risk</p>
              <p className="mt-1 font-display text-title-sm text-ink">Hot ticket aging</p>
            </div>
            <button className="link-brand text-xs" onClick={() => navigate('workOrders')}>Open tickets</button>
          </div>
          <p className="mb-5 text-xs text-ink-muted">
            High-priority tickets by age · over 48h is SLA-at-risk
          </p>
          <div className="space-y-4">
            {agingRows.map((row) => (
              <div key={row.name}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-soft">{row.name}</span>
                  <span className="flex items-center gap-2">
                    {row.breach && <Badge color="rose">Breach</Badge>}
                    <span className="mono font-semibold tabular-nums text-ink">{row.total}</span>
                  </span>
                </div>
                <div className="flex h-3 w-full overflow-hidden bg-elevated">
                  {row.buckets.map((b, i) =>
                    b > 0 ? (
                      <div
                        key={i}
                        className="flex items-center justify-center text-[9px] font-semibold text-white"
                        style={{ width: `${(b / row.total) * 100}%`, background: AGING_COLORS[i] }}
                      >
                        {b}
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-[11px] text-ink-muted">
            {['< 24h', '24-48h', '48-72h', '> 72h'].map((l, i) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="h-2 w-2" style={{ background: AGING_COLORS[i] }} /> {l}
              </span>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-4" padded>
          <p className="type-overline">Ops health</p>
          <p className="mt-1 font-display text-title-sm text-ink">Fleet status</p>
          <div className="mt-5 space-y-5">
            <OpsBar label="Fleet utilization" value={fleetUtilization} target={`${activeTrucks.length}/${trucks.length} trucks · target 75%`} warn={fleetUtilization < 75} />
            <OpsBar label="On-time completion" value={87} target="5 routes · target 85%" />
            <OpsBar label="WO resolution rate" value={resolutionRate} target={`${openWorkOrders.length} still open · target 80%`} warn={resolutionRate < 80} />
          </div>
        </Panel>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel padded>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="type-overline">Queue</p>
              <p className="mt-1 font-display text-title-sm text-ink">Priority work orders</p>
            </div>
            <button className="link-brand flex items-center gap-1 text-xs" onClick={() => navigate('workOrders')}>
              All <Icon name="chevronRight" size={12} />
            </button>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {priorityWorkOrders.map((wo) => (
              <li key={wo.id} className="flex items-start gap-3 py-3">
                <Badge color="amber">{wo.priority || (wo.hotTicket ? 'High' : 'Medium')}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {wo.subject || wo.requestType || 'Service request'}{' '}
                    <span className="mono text-ink-faint">· {wo.number || wo.id}</span>
                  </div>
                  <div className="text-xs text-ink-muted">
                    {wo.account || 'Unassigned account'} · {wo.owner || 'Unassigned'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel padded>
          <div className="mb-1 flex items-baseline justify-between">
            <div>
              <p className="type-overline">Trend</p>
              <p className="mt-1 font-display text-title-sm text-ink">Missed pickups</p>
            </div>
            <span className="font-display text-2xl font-semibold tabular-nums text-ink">77</span>
          </div>
          <p className="mb-3 text-xs text-ink-muted">30-day seeded trend · not live telemetry</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={missedPickups} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe8" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#8b969f' }} interval={6} />
                <YAxis tick={{ fontSize: 9, fill: '#8b969f' }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid #e6ebe8',
                  }}
                />
                <Line type="monotone" dataKey="Trash" stroke="#b42318" strokeWidth={1.75} dot={false} />
                <Line type="monotone" dataKey="Recycle" stroke="#0b5f49" strokeWidth={1.75} dot={false} />
                <Line type="monotone" dataKey="Organic" stroke="#0f7b55" strokeWidth={1.75} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-3 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-danger" /> Trash
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-brand" /> Recycle
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-success" /> Organic
            </span>
          </div>
        </Panel>

        <Panel padded>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="type-overline">Snapshot</p>
              <p className="mt-1 font-display text-title-sm text-ink">Dispatches</p>
            </div>
            <button className="link-brand flex items-center gap-1 text-xs" onClick={() => navigate('dispatches')}>
              All <Icon name="chevronRight" size={12} />
            </button>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {dispatches.slice(0, 5).map((dispatch) => {
              const progress = dispatch.status === 'Complete'
                ? 100
                : ['In Route', 'In Progress'].includes(dispatch.status) ? 62 : 0;
              return (
              <li key={dispatch.id} className="py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="mono font-medium text-ink">{dispatch.number || dispatch.id}</span>
                  <span className="mono text-xs font-semibold tabular-nums text-ink-soft">
                    {progress}%
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {dispatch.account || 'Unassigned account'} · {dispatch.truck || 'Unassigned truck'}
                </div>
                <div className="mt-2 h-1 w-full bg-elevated">
                  <div className="h-1 bg-ink" style={{ width: `${progress}%` }} />
                </div>
              </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      </AsyncState>
    </Page>
  );
}
