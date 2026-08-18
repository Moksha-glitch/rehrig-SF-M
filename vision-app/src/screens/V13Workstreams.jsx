import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Page,
  PageHeader,
  Panel,
  SearchField,
  Select,
  Table,
  TextInput,
  Toolbar,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import {
  APPROVALS,
  CHATTER_POSTS,
  CUSTOMER_INSIGHTS,
  HOLIDAYS,
  LOGIN_EVENTS,
  QALERT_TICKETS,
  RECORD_SHARES,
  V13_KINDS,
} from '../data/v13Workstreams.js';

const FILTERS = {
  chatter: ['All', 'Comment', 'Post', 'Mention'],
  approvals: ['All', 'Pending', 'Approved', 'Rejected'],
  qalert: ['All', 'Synced', 'Pending map', 'Closed in QAlert'],
  customerInsights: ['All', 'Low', 'Watch', 'High'],
  recordSharing: ['All', 'Read', 'Read / Edit'],
  holidays: ['All', 'Yes', 'No'],
  automationCenter: ['All', 'On', 'Off'],
  loginHistory: ['All', 'Success', 'Blocked · inactive'],
};

const COMPOSABLE = {
  chatter: {
    label: 'New post',
    fields: [
      { key: 'on', label: 'On', placeholder: 'Record or account' },
      { key: 'post', label: 'Post', placeholder: 'Write a comment…' },
    ],
  },
  holidays: {
    label: 'Add holiday',
    fields: [
      { key: 'name', label: 'Name', placeholder: 'Holiday name' },
      { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD' },
      { key: 'appliesTo', label: 'Applies to', placeholder: 'Canada SPs' },
    ],
  },
  recordSharing: {
    label: 'New share',
    fields: [
      { key: 'record', label: 'Record', placeholder: 'WO-10421' },
      { key: 'sharedWith', label: 'Shared with', placeholder: 'Name' },
      { key: 'reason', label: 'Reason', placeholder: 'Why' },
    ],
  },
};

function rowsFor(kind, accounts) {
  if (kind === 'chatter') return CHATTER_POSTS;
  if (kind === 'approvals') return APPROVALS;
  if (kind === 'qalert') return QALERT_TICKETS;
  if (kind === 'customerInsights') return CUSTOMER_INSIGHTS;
  if (kind === 'recordSharing') return RECORD_SHARES;
  if (kind === 'holidays') return HOLIDAYS;
  if (kind === 'loginHistory') return LOGIN_EVENTS;
  return (accounts || []).map((account) => ({
    id: account.id,
    provider: account.name,
    autoWo: account.enableAutoWO ? 'On' : 'Off',
    autoHot: account.enableAutoHotTicket ? 'On' : 'Off',
    days: account.autoHotTicketDays ?? '—',
    burnt: account.enableMoveBurntCarts ? 'On' : 'Off',
    tableau: account.isTableauCloud ? 'Yes' : 'No',
  }));
}

function cells(kind, row) {
  if (kind === 'chatter') return [row.when, row.author, row.on, row.post, row.type];
  if (kind === 'approvals') return [row.item, row.type, row.submittedBy, row.status, row.waitingOn, row.submitted];
  if (kind === 'qalert') return [row.number, row.resident, row.type, row.status, row.lastSync, row.linkedWo];
  if (kind === 'customerInsights') return [row.customer, row.provider, row.openWos, row.missed30d, row.portal, row.risk];
  if (kind === 'recordSharing') return [row.record, row.object, row.sharedWith, row.access, row.reason, row.expires];
  if (kind === 'holidays') return [row.name, row.date, row.appliesTo, row.shift, row.notify];
  if (kind === 'loginHistory') return [row.user, row.persona, row.when, row.result, row.source, row.location];
  return [row.provider, row.autoWo, row.autoHot, row.days, row.burnt, row.tableau];
}

function filterValue(kind, row) {
  if (kind === 'chatter') return row.type;
  if (kind === 'approvals') return row.status;
  if (kind === 'qalert') return row.status;
  if (kind === 'customerInsights') return row.risk;
  if (kind === 'recordSharing') return row.access;
  if (kind === 'holidays') return row.notify;
  if (kind === 'loginHistory') return row.result;
  return row.autoWo;
}

function badgeFor(kind, row) {
  const value = filterValue(kind, row);
  if (['Pending', 'Watch', 'Pending map', 'Blocked · inactive'].includes(value)) return 'amber';
  if (['Approved', 'Synced', 'Success', 'On', 'Low', 'Yes'].includes(value)) return 'green';
  if (['Rejected', 'High', 'Off'].includes(value)) return 'rose';
  return 'slate';
}

function stamp() {
  const now = new Date();
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
  const time = [now.getHours(), now.getMinutes()].map((part) => String(part).padStart(2, '0')).join(':');
  return { date, when: `${date} ${time}` };
}

export default function V13Workstreams({ kind = 'chatter' }) {
  const meta = V13_KINDS[kind];
  const { state, toast } = useStore();
  const accountsQuery = useAccounts();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState({});
  const seed = useMemo(() => rowsFor(kind, accountsQuery.data), [kind, accountsQuery.data]);
  const [rows, setRows] = useState(seed);

  useEffect(() => {
    setRows(seed);
    setQuery('');
    setFilter('All');
    setCompose(false);
    setDraft({});
  }, [seed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== 'All' && filterValue(kind, row) !== filter) return false;
      if (!q) return true;
      return cells(kind, row).some((cell) => String(cell).toLowerCase().includes(q));
    });
  }, [rows, query, filter, kind]);

  if (!meta) return null;

  const author = state.currentUser?.name || 'You';
  const composer = COMPOSABLE[kind];
  const columns = kind === 'approvals' ? [...meta.columns, ''] : meta.columns;

  const addRow = () => {
    const { date, when } = stamp();
    if (kind === 'chatter' && draft.post?.trim()) {
      setRows((prev) => [
        {
          id: `ch-${Date.now()}`,
          when,
          author,
          on: draft.on?.trim() || 'Workspace',
          post: draft.post.trim(),
          type: 'Post',
        },
        ...prev,
      ]);
    } else if (kind === 'holidays' && draft.name?.trim() && draft.date?.trim()) {
      setRows((prev) => [
        {
          id: `hd-${Date.now()}`,
          name: draft.name.trim(),
          date: draft.date.trim(),
          appliesTo: draft.appliesTo?.trim() || 'All SPs',
          shift: 'Next service day',
          notify: 'Yes',
        },
        ...prev,
      ]);
    } else if (kind === 'recordSharing' && draft.record?.trim() && draft.sharedWith?.trim()) {
      setRows((prev) => [
        {
          id: `rs-${Date.now()}`,
          record: draft.record.trim(),
          object: 'Work Order',
          sharedWith: draft.sharedWith.trim(),
          access: 'Read',
          reason: draft.reason?.trim() || 'Manual share',
          expires: date,
        },
        ...prev,
      ]);
    } else {
      return;
    }
    setDraft({});
    setCompose(false);
    toast(`${meta.title} updated`);
  };

  const decide = (id, status) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status, waitingOn: '—' } : row))
    );
    toast(status === 'Approved' ? 'Approved' : 'Rejected');
  };

  return (
    <Page>
      <PageHeader
        overline="Vision 1.3"
        title={meta.title}
        description={meta.description}
        actions={
          composer ? (
            <Button variant="primary" onClick={() => setCompose((open) => !open)}>
              {compose ? 'Cancel' : composer.label}
            </Button>
          ) : null
        }
      />
      {compose && composer && (
        <Panel padded className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {composer.fields.map((field) => (
              <Field key={field.key} label={field.label}>
                <TextInput
                  value={draft[field.key] || ''}
                  onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                />
              </Field>
            ))}
          </div>
          <div className="mt-3">
            <Button variant="primary" onClick={addRow}>
              Save
            </Button>
          </div>
        </Panel>
      )}
      <Panel>
        <Toolbar>
          <Select
            aria-label={`Filter ${meta.title}`}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            options={(FILTERS[kind] || ['All']).map((value) => ({ value, label: value }))}
          />
          <SearchField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${meta.title.toLowerCase()}…`}
            label={`Search ${meta.title}`}
          />
          <div className="ml-auto shrink-0 text-sm font-medium text-ink">
            {meta.title} · {filtered.length}
          </div>
        </Toolbar>
        {filtered.length === 0 ? (
          <EmptyState icon={meta.icon} title="No matching rows" description="Clear the filter or search." />
        ) : (
          <Table columns={columns}>
            {filtered.map((row) => {
              const values = cells(kind, row);
              const statusIndex = kind === 'holidays' ? 4 : kind === 'automationCenter' ? 1 : 3;
              return (
                <tr key={row.id} className="interactive hover:bg-elevated/70">
                  {values.map((value, index) => (
                    <td key={index} className="max-w-[16rem] truncate px-4 py-3 text-sm text-ink">
                      {index === statusIndex ? (
                        <Badge color={badgeFor(kind, row)}>{value}</Badge>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                  {kind === 'approvals' && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {row.status === 'Pending' ? (
                        <div className="flex justify-end gap-1">
                          <Button variant="secondary" onClick={() => decide(row.id, 'Approved')}>
                            Approve
                          </Button>
                          <Button variant="secondary" onClick={() => decide(row.id, 'Rejected')}>
                            Reject
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  )}
                </tr>
              );
            })}
          </Table>
        )}
      </Panel>
      {kind === 'qalert' && (
        <p className="mt-3 text-xs text-ink-faint">
          Last successful pull 2026-08-18 07:12 · Endpoint /qalert/v2/requests · Mapping uses resident
          address + request type.
        </p>
      )}
    </Page>
  );
}
