import React, { useEffect, useState } from 'react';
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
import { Badge, Button, Page, PageHeader, Panel, Select, StatStrip, AsyncState } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useRecords } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';
import { useAccounts } from '../hooks/useAccounts.js';
import {
  useWorkspaceMutations,
  useWorkspaceSettings,
} from '../hooks/useConfig.js';
import {
  DASHBOARD_WIDGETS,
  DASHBOARD_WIDGET_BY_ID,
  dashboardPresetFor,
} from '../data/dashboardWidgets.js';

const AGING_COLORS = ['#0f7b55', '#8b969f', '#c27803', '#b42318'];

function parseRecordDate(value) {
  if (!value) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localDateKey(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
}

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

function WidgetShell({ widget, index, count, onMove, onRemove, onDragStart, onDrop, children }) {
  const spanClass = {
    4: 'lg:col-span-4',
    6: 'lg:col-span-6',
    8: 'lg:col-span-8',
    12: 'lg:col-span-12',
  }[widget.span] || 'lg:col-span-4';
  return (
    <Panel
      className={spanClass}
      padded
    >
      <div
        draggable
        onDragStart={(event) => onDragStart(event, widget.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => onDrop(event, widget.id)}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="type-overline">{widget.category}</p>
            <h2 className="mt-1 font-display text-title-sm text-ink">{widget.title}</h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <button
              type="button"
              className="btn-secondary px-2 py-1.5"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              aria-label={`Move ${widget.title} up`}
            >
              <Icon name="chevronDown" size={13} className="rotate-180" />
            </button>
            <button
              type="button"
              className="btn-secondary px-2 py-1.5"
              onClick={() => onMove(index, 1)}
              disabled={index === count - 1}
              aria-label={`Move ${widget.title} down`}
            >
              <Icon name="chevronDown" size={13} />
            </button>
            <button
              type="button"
              className="btn-secondary px-2 py-1.5 text-danger"
              onClick={() => onRemove(widget.id)}
              aria-label={`Remove ${widget.title}`}
            >
              <Icon name="x" size={13} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </Panel>
  );
}

function RecordList({ rows, empty, render }) {
  return rows.length ? (
    <ul className="divide-y divide-line border-y border-line">{rows.map(render)}</ul>
  ) : (
    <p className="py-8 text-center text-sm text-ink-muted">{empty}</p>
  );
}

export default function Dashboard() {
  const { state, navigate, toast } = useStore();
  const workOrdersQuery = useRecords('workOrders');
  const dispatchesQuery = useRecords('dispatches');
  const trucksQuery = useRecords('trucks');
  const tipsQuery = useRecords('aggregatedTips');
  const accountsQuery = useAccounts();
  const settingsQuery = useWorkspaceSettings();
  const { update: updateWorkspace } = useWorkspaceMutations();
  const workOrders = workOrdersQuery.data?.data || [];
  const dispatches = dispatchesQuery.data?.data || [];
  const trucks = trucksQuery.data?.data || [];
  const tips = tipsQuery.data?.data || [];
  const accounts = accountsQuery.data || [];
  const user = state.currentUser;
  const userKey = user?.id || user?.email || 'anonymous';
  const storedLayout = settingsQuery.data?.dashboardLayouts?.[userKey];
  const fallbackLayout = dashboardPresetFor(user);
  const initialLayout = Array.isArray(storedLayout)
    ? storedLayout.filter((id) => DASHBOARD_WIDGET_BY_ID[id])
    : fallbackLayout;
  const [layoutState, setLayoutState] = useState({ userKey, ids: initialLayout });
  const layout = layoutState.userKey === userKey ? layoutState.ids : initialLayout;
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    setLayoutState({ userKey, ids: initialLayout });
  }, [userKey, JSON.stringify(storedLayout)]);

  const persistLayout = async (next) => {
    setLayoutState({ userKey, ids: next });
    try {
      await updateWorkspace.mutateAsync({
        dashboardLayouts: {
          ...(settingsQuery.data?.dashboardLayouts || {}),
          [userKey]: next,
        },
      });
    } catch (error) {
      toast(getErrorMessage(error, 'Unable to save dashboard layout.'), 'danger');
    }
  };

  const moveWidget = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= layout.length) return;
    const next = [...layout];
    [next[index], next[target]] = [next[target], next[index]];
    persistLayout(next);
  };

  const dropWidget = (event, targetId) => {
    event?.preventDefault?.();
    if (!draggedId || draggedId === targetId) return;
    const next = layout.filter((id) => id !== draggedId);
    const insertAt = next.indexOf(targetId);
    if (insertAt < 0) return;
    next.splice(insertAt, 0, draggedId);
    setDraggedId(null);
    persistLayout(next);
  };

  const openWorkOrders = workOrders.filter((row) => !['Closed', 'Complete'].includes(row.status));
  const activeDispatches = dispatches.filter((row) => ['In Route', 'In Progress'].includes(row.status));
  const activeTrucks = trucks.filter((row) => row.status === 'Active');
  const now = new Date();
  const todayKey = localDateKey(now);
  const todayTons = tips
    .filter((row) => row.date === todayKey)
    .reduce((sum, row) => sum + Number(row.tons || 0), 0);
  const ownerValues = [user?.id, user?.alias, user?.name, user?.email].filter(Boolean);
  const myWorkOrders = workOrders.filter(
    (row) => ownerValues.includes(row.owner) || (user?.customerId && row.customerId === user.customerId)
  );
  const priorityWorkOrders = [...openWorkOrders]
    .sort((a, b) => {
      const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (rank[a.priority] ?? 4) - (rank[b.priority] ?? 4);
    })
    .slice(0, 5);
  const agingRows = [...openWorkOrders
    .filter((row) => row.hotTicket || ['Critical', 'High'].includes(row.priority))
    .reduce((groups, row) => {
      const openedAt = parseRecordDate(row.requestDate || row.createdAt || row.dueDate);
      if (!openedAt) return groups;
      const hours = Math.max(0, (now.getTime() - openedAt.getTime()) / 36e5);
      const bucket = hours < 24 ? 0 : hours < 48 ? 1 : hours < 72 ? 2 : 3;
      const name = row.account || 'Unassigned account';
      const buckets = groups.get(name) || [0, 0, 0, 0];
      buckets[bucket] += 1;
      groups.set(name, buckets);
      return groups;
    }, new Map()).entries()].map(([name, buckets]) => ({
      name,
      buckets,
      total: buckets.reduce((sum, value) => sum + value, 0),
    }));
  const trendStart = new Date(now);
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(trendStart.getDate() - 29);
  const missedPickups = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(trendStart);
    date.setDate(trendStart.getDate() + index);
    return { day: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), dateKey: localDateKey(date), count: 0 };
  });
  workOrders.forEach((row) => {
    if (!/missed pickup/i.test(`${row.requestType || ''} ${row.subject || ''}`)) return;
    const date = parseRecordDate(row.requestDate || row.createdAt || row.dueDate);
    const point = date && missedPickups.find((item) => item.dateKey === localDateKey(date));
    if (point) point.count += 1;
  });
  const tipHistory = [...tips.reduce((groups, row) => {
    if (!row.date) return groups;
    groups.set(row.date, (groups.get(row.date) || 0) + Number(row.tons || 0));
    return groups;
  }, new Map()).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, tons]) => ({
      date: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      tons,
    }));
  const slaRows = [...workOrders.reduce((groups, row) => {
    if (!row.account || !row.dueDate || !row.completionDate || !['Closed', 'Complete'].includes(row.status)) return groups;
    const due = parseRecordDate(row.dueDate);
    const completed = parseRecordDate(row.completionDate);
    if (!due || !completed) return groups;
    const current = groups.get(row.account) || { total: 0, met: 0 };
    current.total += 1;
    if (completed <= due) current.met += 1;
    groups.set(row.account, current);
    return groups;
  }, new Map()).entries()].map(([name, value]) => ({
    name,
    value: Math.round((value.met / value.total) * 100),
    detail: `${value.met}/${value.total} completed by due date`,
  }));
  const completedDispatches = dispatches.filter((row) => row.status === 'Complete').length;
  const completedWorkOrders = workOrders.filter((row) => ['Closed', 'Complete'].includes(row.status)).length;
  const readiness = [
    { label: 'Provider records', count: accounts.length },
    { label: 'Work order records', count: workOrders.length },
    { label: 'Dispatch records', count: dispatches.length },
    { label: 'Fleet records', count: trucks.length },
    { label: 'Tip records', count: tips.length },
  ];

  const renderWidget = (id) => {
    if (id === 'kpi-tiles') {
      return <StatStrip compact items={[
        { label: 'Active dispatches', value: activeDispatches.length, hint: 'In route or in progress' },
        { label: 'Open work orders', value: openWorkOrders.length, hint: 'Awaiting completion' },
        { label: 'Trucks in field', value: activeTrucks.length, hint: `of ${trucks.length} tracked` },
        { label: 'Tons collected today', value: todayTons.toFixed(1), hint: todayKey },
      ]} />;
    }
    if (id === 'hot-ticket-aging') {
      return <div className="space-y-4">{agingRows.length ? agingRows.map((row) => (
        <div key={row.name}>
          <div className="mb-1.5 flex justify-between gap-2 text-xs"><span className="min-w-0 truncate">{row.name}</span><span className="mono shrink-0">{row.total}</span></div>
          <div className="flex h-3 overflow-hidden bg-elevated">{row.buckets.map((value, index) => value ? (
            <span key={index} style={{ width: `${value / row.total * 100}%`, background: AGING_COLORS[index] }} />
          ) : null)}</div>
        </div>
      )) : <p className="py-6 text-center text-sm text-ink-muted">No hot tickets with aging data.</p>}</div>;
    }
    if (id === 'ops-health') {
      const fleetRate = trucks.length ? Math.round(activeTrucks.length / trucks.length * 100) : 0;
      const dispatchRate = dispatches.length ? Math.round(completedDispatches / dispatches.length * 100) : 0;
      const resolutionRate = workOrders.length ? Math.round(completedWorkOrders / workOrders.length * 100) : 0;
      return <div className="space-y-5">
        <OpsBar label="Fleet utilization" value={fleetRate} target={`${activeTrucks.length}/${trucks.length} active`} />
        <OpsBar label="Dispatch completion" value={dispatchRate} target={`${completedDispatches}/${dispatches.length} complete`} />
        <OpsBar label="WO resolution" value={resolutionRate} target={`${completedWorkOrders}/${workOrders.length} resolved`} />
      </div>;
    }
    if (id === 'missed-pickups') {
      return <div className="h-44"><ResponsiveContainer width="100%" height="100%"><LineChart data={missedPickups}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe8" /><XAxis dataKey="day" tick={{ fontSize: 9 }} interval={6} />
        <YAxis tick={{ fontSize: 9 }} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#b42318" dot={false} />
      </LineChart></ResponsiveContainer></div>;
    }
    if (id === 'sla-by-account') {
      return slaRows.length ? <div className="space-y-3">{slaRows.map((row) => (
        <div key={row.name}><div className="flex justify-between text-xs"><span>{row.name}</span><span className="mono font-semibold">{row.value}%</span></div>
          <div className="mt-1 h-2 bg-elevated"><div className="h-2 bg-brand" style={{ width: `${row.value}%` }} /></div>
          <p className="mt-1 text-[11px] text-ink-faint">{row.detail}</p></div>
      ))}</div> : <p className="py-6 text-center text-sm text-ink-muted">No completed work orders include both due and completion dates.</p>;
    }
    if (id === 'tip-history') {
      return tipHistory.length ? <div className="h-44"><ResponsiveContainer width="100%" height="100%"><LineChart data={tipHistory}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe8" /><XAxis dataKey="date" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} /><Tooltip /><Line type="monotone" dataKey="tons" stroke="#0b5f49" dot={false} />
      </LineChart></ResponsiveContainer></div> : <p className="py-6 text-center text-sm text-ink-muted">No tip history yet.</p>;
    }
    if (id === 'setup-checklist') {
      return <ul className="divide-y divide-line border-y border-line">{readiness.map((item) => (
        <li key={item.label} className="flex items-center justify-between py-2.5 text-sm"><span>{item.label}</span>
          <span className="flex items-center gap-2 text-ink-muted">{item.count}<Icon name={item.count ? 'checkCircle' : 'alert'} size={14} /></span></li>
      ))}</ul>;
    }
    if (id === 'trucks-in-field') {
      return <><p className="font-display text-3xl font-semibold text-ink">{activeTrucks.length}</p><p className="mt-1 text-xs text-ink-muted">Active of {trucks.length} tracked trucks</p></>;
    }
    if (id === 'tons-collected-today') {
      return <><p className="font-display text-3xl font-semibold text-ink">{todayTons.toFixed(1)}</p><p className="mt-1 text-xs text-ink-muted">Tons recorded for {todayKey}</p></>;
    }
    if (id === 'open-work-orders') {
      return <><p className="font-display text-3xl font-semibold text-ink">{openWorkOrders.length}</p><Button variant="ghost" onClick={() => navigate('workOrders')} className="mt-3">Open queue</Button></>;
    }
    const isMyWork = id === 'my-work-orders';
    const isDispatch = id === 'live-dispatches' || id === 'active-dispatches';
    const rows = isDispatch ? activeDispatches.slice(0, 5) : isMyWork ? myWorkOrders.slice(0, 5) : priorityWorkOrders;
    return <RecordList rows={rows} empty={isDispatch ? 'No active dispatches.' : 'No matching work orders.'} render={(row) => (
      <li key={row.id || row.number} className="py-3">
        <div className="flex items-center justify-between gap-2 text-sm"><span className="truncate font-medium">{row.subject || row.number || row.id}</span><Badge color={isDispatch ? 'cyan' : 'amber'}>{row.status || row.priority}</Badge></div>
        <p className="mt-0.5 truncate text-xs text-ink-muted">{row.account || 'Unassigned'}{row.owner ? ` · ${row.owner}` : ''}</p>
      </li>
    )} />;
  };

  const first = user?.firstName || 'there';
  const available = DASHBOARD_WIDGETS.filter((widget) => !layout.includes(widget.id));
  const loading = workOrdersQuery.isLoading || dispatchesQuery.isLoading || trucksQuery.isLoading || tipsQuery.isLoading || accountsQuery.isLoading || settingsQuery.isLoading;

  return (
    <Page wide>
      <PageHeader
        overline={`Home · ${now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
        title={`Welcome, ${first}.`}
        description={`${openWorkOrders.length} open work orders · ${activeDispatches.length} active dispatches`}
        actions={available.length ? (
          <Select
            value=""
            placeholder="Add widget…"
            aria-label="Add dashboard widget"
            options={available.map((widget) => ({ value: widget.id, label: widget.title }))}
            onChange={(event) => event.target.value && persistLayout([...layout, event.target.value])}
          />
        ) : null}
      />
      <AsyncState loading={loading} error={workOrdersQuery.isError ? getErrorMessage(workOrdersQuery.error) : null} onRetry={() => {
        workOrdersQuery.refetch(); dispatchesQuery.refetch(); trucksQuery.refetch(); tipsQuery.refetch(); accountsQuery.refetch(); settingsQuery.refetch();
      }}>
        {layout.length ? (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {layout.map((id, index) => {
              const widget = DASHBOARD_WIDGET_BY_ID[id];
              if (!widget) return null;
              return <WidgetShell key={id} widget={widget} index={index} count={layout.length} onMove={moveWidget}
                onRemove={(widgetId) => persistLayout(layout.filter((item) => item !== widgetId))}
                onDragStart={(event, widgetId) => { setDraggedId(widgetId); event.dataTransfer.effectAllowed = 'move'; }}
                onDrop={dropWidget}>{renderWidget(id)}</WidgetShell>;
            })}
          </div>
        ) : (
          <Panel padded className="mt-6 text-center"><p className="text-sm text-ink-muted">Add a widget to build your dashboard.</p></Panel>
        )}
      </AsyncState>
    </Page>
  );
}
