import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  AccountBadges,
  StatusDot,
  Table,
  Page,
  PageHeader,
  Panel,
  Toolbar,
  SearchField,
  Button,
  Badge,
  ConfirmDialog,
  AsyncState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useDeleteDraft, useDrafts } from '../hooks/useOnboarding.js';
import { getErrorMessage } from '../lib/errors.js';

export default function AccountsList({ onOnboard }) {
  const { navigate, canCreateAccounts, isScoped, toast } = useStore();
  const accountsQuery = useAccounts();
  const draftsQuery = useDrafts();
  const deleteDraftMutation = useDeleteDraft();
  const scopedAccounts = accountsQuery.data || [];
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [draftToDelete, setDraftToDelete] = useState(null);
  const matches = (a) => [a.name, a.uid, a.industry, a.phone, a.ownerName, a.billing?.city, a.billing?.state]
    .some((value) => String(value || '').toLowerCase().includes(q.trim().toLowerCase()));

  const activeRows = scopedAccounts
    .filter((a) => !a.inactive)
    .filter(matches)
    .filter(() => status !== 'Inactive');
  const inactiveRows = scopedAccounts
    .filter((a) => a.inactive)
    .filter(matches)
    .filter(() => status !== 'Active');
  const drafts = (draftsQuery.data || []).filter((d) =>
    (d.name || '').toLowerCase().includes(q.toLowerCase())
  );

  const providerRows = [...activeRows, ...inactiveRows];

  return (
    <Page>
      <PageHeader
        overline="Directory"
        title="Service Providers"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="mono tabular-nums">{scopedAccounts.filter((a) => !a.inactive).length}</span> active ·{' '}
            <span className="mono tabular-nums">{scopedAccounts.length}</span> total
            {drafts.length > 0 && (
              <>
                <span className="text-ink-faint">·</span>
                <span className="mono tabular-nums">{drafts.length}</span> draft
                {drafts.length === 1 ? '' : 's'}
              </>
            )}
            {isScoped && (
              <Badge color="cyan">
                <Icon name="filter" size={11} /> Scoped view
              </Badge>
            )}
          </span>
        }
        actions={
          canCreateAccounts ? (
            <Button variant="primary" onClick={() => onOnboard()}>
              <Icon name="plus" size={16} /> Onboard Service Provider
            </Button>
          ) : null
        }
      />

      <AsyncState
        loading={accountsQuery.isLoading}
        error={accountsQuery.isError ? getErrorMessage(accountsQuery.error) : null}
        onRetry={() => accountsQuery.refetch()}
      >
      <Panel>
        <Toolbar>
          <SearchField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search accounts…"
          />
          <select className="field-input max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option><option>Active</option><option>Inactive</option>
          </select>
          {(q || status !== 'All') && <button className="link-brand text-xs" onClick={() => { setQ(''); setStatus('All'); }}>Clear filters</button>}
        </Toolbar>
        <Table columns={['#', 'Account Name', 'Industry', 'Phone', 'Owner', 'Residents', 'Status', '']}>
          {providerRows.map((a, i) => (
            <tr key={a.id} className="interactive hover:bg-elevated/70">
              <td className="mono px-4 py-3 text-ink-faint tabular-nums">{i + 1}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => navigate('accountDetail', { accountId: a.id, tab: 'details' })}
                  className="link-brand flex items-center gap-2 text-left"
                >
                  {a.name}
                  <span className="flex items-center gap-1">
                    <AccountBadges account={a} />
                  </span>
                </button>
              </td>
              <td className="px-4 py-3 text-ink-muted">{a.industry}</td>
              <td className="mono px-4 py-3 text-ink-muted">{a.phone}</td>
              <td className="px-4 py-3 text-ink-muted">{a.ownerName}</td>
              <td className="mono px-4 py-3 text-ink-muted tabular-nums">{a.residents}</td>
              <td className="px-4 py-3">
                {a.inactive ? (
                  <StatusDot color="slate" label="Inactive" />
                ) : (
                  <StatusDot color="emerald" label="Active" />
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {canCreateAccounts && (
                  <button
                    type="button"
                    className="link-brand text-xs font-medium"
                    onClick={() => navigate('accountDetail', { accountId: a.id, tab: 'details' })}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
          {providerRows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-sm text-ink-faint">
                {q || status !== 'All' ? 'No service providers match these filters.' : 'No service providers are available in your scope.'}
              </td>
            </tr>
          )}
        </Table>
      </Panel>

      {drafts.length > 0 && (
        <Panel className="mt-5">
          <div className="flex items-end justify-between border-b border-line px-5 py-4">
            <div>
              <p className="type-overline">In progress</p>
              <p className="mt-1 font-display text-title-sm text-ink">Drafts</p>
            </div>
            <span className="text-xs text-ink-muted">
              Saved from onboarding · resume anytime
            </span>
          </div>
          <Table columns={['#', 'Draft name', 'Industry', 'Last saved', 'Owner', '', 'Status']}>
            {drafts.map((d, i) => (
              <tr key={d.id} className="interactive hover:bg-elevated/70">
                <td className="mono px-4 py-3 text-ink-faint tabular-nums">
                  {providerRows.length + i + 1}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOnboard?.(d.id)}
                    className="link-brand text-left font-medium"
                  >
                    {d.name || 'Untitled draft'}
                  </button>
                </td>
                <td className="px-4 py-3 text-ink-muted">{d.industry || '—'}</td>
                <td className="mono px-4 py-3 text-ink-muted">
                  {d.updatedAt
                    ? new Date(d.updatedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-ink-muted">{d.ownerName || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" className="!px-2.5 !py-1.5 text-xs" onClick={() => onOnboard?.(d.id)}>
                      Resume
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDraftToDelete(d)}
                      className="rounded-control p-1.5 text-ink-faint interactive hover:bg-danger-soft hover:text-danger"
                      aria-label={`Delete draft ${d.name}`}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge color="amber">Draft</Badge>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
      {draftToDelete && (
        <ConfirmDialog
          title="Delete draft?"
          description={`Delete “${draftToDelete.name || 'Untitled draft'}”? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={async () => {
            try {
              await deleteDraftMutation.mutateAsync(draftToDelete.id);
              toast('Draft deleted');
            } catch (error) {
              toast(getErrorMessage(error, 'Could not delete draft.'), 'danger');
            }
            setDraftToDelete(null);
          }}
          onCancel={() => setDraftToDelete(null)}
        />
      )}
      </AsyncState>
    </Page>
  );
}
