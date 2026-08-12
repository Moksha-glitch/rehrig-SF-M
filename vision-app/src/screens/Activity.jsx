import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  AsyncState,
  Badge,
  Button,
  EmptyState,
  Page,
  PageHeader,
  Panel,
  SearchField,
  Select,
  StatStrip,
  Toolbar,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useRecords } from '../hooks/useRecords.js';
import { useDrafts } from '../hooks/useOnboarding.js';
import { useNotifications } from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';

const PAGE_SIZE = 25;

const TIMEFRAMES = [
  { value: 'all', label: 'All time', days: null },
  { value: '1', label: 'Last 24 hours', days: 1 },
  { value: '7', label: 'Last 7 days', days: 7 },
  { value: '30', label: 'Last 30 days', days: 30 },
  { value: '90', label: 'Last 90 days', days: 90 },
];

const TYPE_META = {
  'Work Orders': { icon: 'clipboard', color: 'cyan' },
  Dispatches: { icon: 'send', color: 'sky' },
  Telematics: { icon: 'truck', color: 'emerald' },
  Assets: { icon: 'box', color: 'slate' },
  Notes: { icon: 'paperclip', color: 'slate' },
  Onboarding: { icon: 'building', color: 'amber' },
  Imports: { icon: 'download', color: 'amber' },
  Notifications: { icon: 'bell', color: 'rose' },
};

function parseStamp(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const date = new Date(raw.includes('T') || raw.includes('/') ? raw : `${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Audit strings are stored as `Name, 3/2/2024, 9:14 AM`. */
function parseAudit(value) {
  if (!value) return { actor: '', at: null };
  const [actor, ...rest] = String(value).split(',');
  const stamp = rest.join(' ').replace(/,/g, ' ').trim();
  return { actor: actor.trim(), at: parseStamp(stamp) };
}

function relativeTime(date, now) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(Math.round(seconds / 60), 'minute');
}

function absoluteTime(date) {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Activity() {
  const { state, navigate, persona, canAccessModule, canTab } = useStore();
  const accountsQuery = useAccounts();
  const workOrdersQuery = useRecords('workOrders');
  const dispatchesQuery = useRecords('dispatches');
  const tipsQuery = useRecords('individualTips');
  const aggTipsQuery = useRecords('aggregatedTips');
  const notesQuery = useRecords('notesAttachments');
  const assetsQuery = useRecords('assets');
  const draftsQuery = useDrafts();
  const notificationsQuery = useNotifications();

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [accountFilter, setAccountFilter] = useState('All');
  const [timeframe, setTimeframe] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const queries = [
    accountsQuery,
    workOrdersQuery,
    dispatchesQuery,
    tipsQuery,
    aggTipsQuery,
    notesQuery,
    assetsQuery,
    draftsQuery,
    notificationsQuery,
  ];
  const loading = queries.some((query) => query.isLoading);
  const failed = queries.find((query) => query.isError);

  const now = useMemo(() => new Date(), []);

  const events = useMemo(() => {
    const list = [];
    const records = {
      workOrders: workOrdersQuery.data?.data || [],
      dispatches: dispatchesQuery.data?.data || [],
      tips: tipsQuery.data?.data || [],
      aggTips: aggTipsQuery.data?.data || [],
      notes: notesQuery.data?.data || [],
      assets: assetsQuery.data?.data || [],
    };
    const reachable = (event) => {
      if (!event.module || !canAccessModule(event.module)) return false;
      return !event.params?.tab || canTab(event.params.tab);
    };
    const add = (event) => {
      if (!event.at) return;
      list.push(reachable(event) ? event : { ...event, module: null, params: {} });
    };
    const accountDestination = (accountId) =>
      persona === 'rehrig'
        ? { module: 'accountDetail', params: { accountId } }
        : { module: 'account', params: { tab: 'details' } };

    (accountsQuery.data || []).forEach((account) => {
      const created = parseAudit(account.createdBy);
      add({
        id: `acct-created-${account.id}`,
        type: 'Onboarding',
        title: `${account.name} onboarded`,
        detail: [account.industry, account.billing?.city].filter(Boolean).join(' · '),
        actor: created.actor,
        account: account.name,
        at: created.at,
        ...accountDestination(account.id),
      });
      const modified = parseAudit(account.lastModifiedBy);
      if (modified.at && modified.at.getTime() !== created.at?.getTime()) {
        add({
          id: `acct-updated-${account.id}`,
          type: 'Onboarding',
          title: `${account.name} record updated`,
          detail: 'Service Provider details changed',
          actor: modified.actor,
          account: account.name,
          at: modified.at,
          ...accountDestination(account.id),
        });
      }
    });

    records.workOrders.forEach((record) => {
      add({
        id: `wo-open-${record.id}`,
        type: 'Work Orders',
        title: `Work order ${record.number} ${record.status === 'Open' ? 'opened' : 'created'}`,
        detail: [record.requestType, record.subject, record.priority].filter(Boolean).join(' · '),
        actor: record.owner,
        account: record.account,
        at: parseStamp(record.createdAt || record.requestDate),
        module: 'workOrders',
        params: {},
      });
      if (record.completionDate) {
        add({
          id: `wo-done-${record.id}`,
          type: 'Work Orders',
          title: `Work order ${record.number} completed`,
          detail: [record.resolutionCode, record.resolutionComments].filter(Boolean).join(' · '),
          actor: record.owner,
          account: record.account,
          at: parseStamp(record.completionDate),
          module: 'workOrders',
          params: {},
        });
      }
      if (record.notificationSentDate) {
        add({
          id: `wo-notif-${record.id}`,
          type: 'Notifications',
          title: `Customer notified for ${record.number}`,
          detail: record.customer ? `Sent to ${record.customer}` : 'Service notification sent',
          actor: record.owner,
          account: record.account,
          at: parseStamp(record.notificationSentDate),
          module: 'workOrders',
          params: {},
        });
      }
      if (record.hotTicket) {
        add({
          id: `wo-hot-${record.id}`,
          type: 'Work Orders',
          title: `${record.number} flagged as a hot ticket`,
          detail: record.subject,
          actor: record.owner,
          account: record.account,
          at: parseStamp(record.createdAt || record.requestDate),
          module: 'workOrders',
          params: {},
        });
      }
    });

    records.dispatches.forEach((record) => {
      add({
        id: `disp-${record.id}`,
        type: 'Dispatches',
        title: `Dispatch ${record.number} — ${record.status}`,
        detail: [record.truck, record.driver, record.serviceType].filter(Boolean).join(' · '),
        actor: record.driver,
        account: record.account,
        at: parseStamp(
          record.createdAt ||
            (record.routeDate && record.startTime
              ? `${record.routeDate}T${record.startTime}`
              : record.routeDate)
        ),
        module: 'dispatches',
        params: {},
      });
    });

    records.tips.forEach((record) => {
      add({
        id: `tip-${record.id}`,
        type: 'Telematics',
        title: `${record.type === 'Non-Tip' ? 'Non-tip' : 'Tip'} recorded on ${record.truck || 'truck'}`,
        detail: [record.asset, record.location, record.errorDescription]
          .filter(Boolean)
          .join(' · '),
        actor: record.owner,
        account: record.account,
        at: parseStamp(record.createdAt || record.timestamp),
        module: 'individualTips',
        params: {},
      });
    });

    records.aggTips.forEach((record) => {
      add({
        id: `agg-${record.id}`,
        type: 'Telematics',
        title: `${record.truckNumber || record.truck} logged ${record.tips} tips`,
        detail: [
          record.tons ? `${record.tons} tons` : null,
          record.totalDistance ? `${record.totalDistance} mi` : null,
          record.collectionRoute,
        ]
          .filter(Boolean)
          .join(' · '),
        actor: record.owner,
        account: record.account,
        at: parseStamp(record.createdAt || record.date),
        module: 'aggregatedTips',
        params: {},
      });
    });

    records.notes.forEach((record) => {
      add({
        id: `note-${record.id}`,
        type: 'Notes',
        title: `${record.type === 'Attachment' ? 'Attachment' : 'Note'} added — ${record.title}`,
        detail: record.relatedTo ? `Related to ${record.relatedTo}` : '',
        actor: record.createdBy,
        account: record.account,
        at: parseStamp(record.createdAt || record.created),
        module: 'notesAttachments',
        params: {},
      });
    });

    records.assets.forEach((record) => {
      add({
        id: `asset-${record.id}`,
        type: 'Assets',
        title: `${record.name} installed`,
        detail: [record.product, record.location, record.status].filter(Boolean).join(' · '),
        actor: '',
        account: record.account,
        at: parseStamp(record.createdAt || record.installDate),
        module: 'assets',
        params: {},
      });
    });

    (draftsQuery.data || []).forEach((draft) => {
      add({
        id: `draft-${draft.id}`,
        type: 'Onboarding',
        title: `Onboarding draft saved — ${draft.name || 'Untitled provider'}`,
        detail: [
          draft.step ? `Step ${draft.step}` : null,
          draft.fromContract ? `Extracted from ${draft.fileName || 'contract'}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        actor: draft.ownerName,
        account: draft.name,
        at: parseStamp(draft.updatedAt),
        module: 'onboarding',
        params: {},
      });
    });

    Object.entries(state.importMappings || {}).forEach(([objectKey, mapping]) => {
      add({
        id: `import-${objectKey}`,
        type: 'Imports',
        title: `${objectKey} import mapping saved`,
        detail: `${Object.keys(mapping?.map || mapping || {}).length} column mappings stored`,
        actor: '',
        account: '',
        at: parseStamp(mapping?.savedAt),
        module: 'bulkImport',
        params: {},
      });
    });

    (notificationsQuery.data || []).forEach((notice) => {
      add({
        id: `notice-${notice.id}`,
        type: 'Notifications',
        title: notice.title,
        detail: notice.detail,
        actor: '',
        account: (accountsQuery.data || []).find((a) => a.id === notice.accountId)?.name || '',
        at: parseStamp(notice.createdAt),
        module: notice.module || 'home',
        params: {},
      });
    });

    return list.sort((a, b) => b.at - a.at);
  }, [
    canAccessModule,
    canTab,
    persona,
    accountsQuery.data,
    aggTipsQuery.data,
    assetsQuery.data,
    dispatchesQuery.data,
    draftsQuery.data,
    notesQuery.data,
    notificationsQuery.data,
    state.importMappings,
    tipsQuery.data,
    workOrdersQuery.data,
  ]);

  const accountOptions = useMemo(
    () => ['All', ...[...new Set(events.map((event) => event.account).filter(Boolean))].sort()],
    [events]
  );
  const typeOptions = useMemo(
    () => ['All', ...[...new Set(events.map((event) => event.type))].sort()],
    [events]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const days = TIMEFRAMES.find((frame) => frame.value === timeframe)?.days;
    const cutoff = days ? now.getTime() - days * 86400000 : null;
    return events.filter((event) => {
      if (typeFilter !== 'All' && event.type !== typeFilter) return false;
      if (accountFilter !== 'All' && event.account !== accountFilter) return false;
      if (cutoff && event.at.getTime() < cutoff) return false;
      if (
        query &&
        ![event.title, event.detail, event.actor, event.account]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      ) {
        return false;
      }
      return true;
    });
  }, [accountFilter, events, now, q, timeframe, typeFilter]);

  const shown = filtered.slice(0, visible);
  const stats = useMemo(() => {
    const dayAgo = now.getTime() - 86400000;
    const weekAgo = now.getTime() - 7 * 86400000;
    return [
      { label: 'Events', value: events.length },
      { label: 'Last 24 hours', value: events.filter((e) => e.at.getTime() >= dayAgo).length },
      { label: 'Last 7 days', value: events.filter((e) => e.at.getTime() >= weekAgo).length },
      { label: 'Sources', value: new Set(events.map((e) => e.type)).size },
    ];
  }, [events, now]);

  const resetFilters = () => {
    setQ('');
    setTypeFilter('All');
    setAccountFilter('All');
    setTimeframe('all');
    setVisible(PAGE_SIZE);
  };

  return (
    <Page wide>
      <PageHeader
        overline="Platform"
        title="Activity"
        description="Every timestamped event in the workspace — work orders, dispatches, telematics, onboarding, imports and notifications — newest first."
        actions={
          <Button variant="secondary" onClick={resetFilters}>
            <Icon name="filter" size={16} /> Reset filters
          </Button>
        }
      />

      <AsyncState
        loading={loading}
        error={failed ? getErrorMessage(failed.error) : null}
        onRetry={() => queries.forEach((query) => query.refetch?.())}
      >
        <div className="space-y-5">
          <StatStrip items={stats} compact />
          <Panel>
            <Toolbar>
              <SearchField
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                placeholder="Search activity…"
                label="Search activity"
              />
              <Select
                aria-label="Filter by event type"
                className="max-w-[190px]"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                options={typeOptions}
              />
              <Select
                aria-label="Filter by Service Provider"
                className="max-w-[210px]"
                value={accountFilter}
                onChange={(e) => {
                  setAccountFilter(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                options={accountOptions}
              />
              <Select
                aria-label="Filter by timeframe"
                className="max-w-[170px]"
                value={timeframe}
                onChange={(e) => {
                  setTimeframe(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                options={TIMEFRAMES.map((frame) => ({ value: frame.value, label: frame.label }))}
              />
              <span className="ml-auto text-xs text-ink-faint">
                {filtered.length} of {events.length} events
              </span>
            </Toolbar>

            {shown.length === 0 ? (
              <EmptyState
                icon="activity"
                title="No activity matches these filters"
                description="Widen the timeframe or clear the search to see more of the stream."
                action={
                  <Button variant="secondary" onClick={resetFilters}>
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {shown.map((event) => {
                  const meta = TYPE_META[event.type] || { icon: 'activity', color: 'slate' };
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        disabled={!event.module}
                        onClick={() => navigate(event.module, event.params)}
                        className={`flex w-full items-start gap-3.5 px-4 py-3.5 text-left sm:px-5 ${
                          event.module
                            ? 'interactive hover:bg-elevated/70'
                            : 'cursor-default'
                        }`}
                      >
                        <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-elevated text-ink-muted">
                          <Icon name={meta.icon} size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-ink">{event.title}</span>
                            <Badge color={meta.color}>{event.type}</Badge>
                          </span>
                          {event.detail && (
                            <span className="mt-1 block truncate text-sm text-ink-muted">
                              {event.detail}
                            </span>
                          )}
                          <span className="mt-1 block text-xs text-ink-faint">
                            {[event.actor, event.account].filter(Boolean).join(' · ')}
                            {(event.actor || event.account) && ' · '}
                            {absoluteTime(event.at)}
                          </span>
                        </span>
                        <span className="flex-none text-xs text-ink-faint">
                          {relativeTime(event.at, now)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {filtered.length > shown.length && (
              <div className="flex justify-center border-t border-line px-4 py-3.5">
                <Button variant="secondary" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
                  Load {Math.min(PAGE_SIZE, filtered.length - shown.length)} more
                </Button>
              </div>
            )}
          </Panel>
        </div>
      </AsyncState>
    </Page>
  );
}
