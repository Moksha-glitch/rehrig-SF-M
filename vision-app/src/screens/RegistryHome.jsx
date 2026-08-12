import React from 'react';
import Icon from '../components/Icon.jsx';
import { Page, PageHeader, Panel, Button, StatStrip, AsyncState, StatusDot } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useContacts, useRecords } from '../hooks/useRecords.js';
import { useDrafts } from '../hooks/useOnboarding.js';
import { getErrorMessage } from '../lib/errors.js';
import HomeAssistant from '../components/HomeAssistant.jsx';

export default function RegistryHome({ onOnboard }) {
  const { navigate } = useStore();
  const accountsQuery = useAccounts();
  const contactsQuery = useContacts();
  const workOrdersQuery = useRecords('workOrders');
  const draftsQuery = useDrafts();
  const accounts = accountsQuery.data || [];
  const workOrders = workOrdersQuery.data?.data || [];
  const drafts = draftsQuery.data || [];
  const active = accounts.filter((a) => !a.inactive).length;
  const contactsCount = (contactsQuery.data || []).length;
  const locations = new Set(
    accounts
      .map((a) => [a.billing?.street, a.billing?.city, a.billing?.zip].filter(Boolean).join('|'))
      .filter(Boolean)
  ).size;
  const latestDate = accounts.map((a) => a.addedDate).filter(Boolean).sort().at(-1);
  const pendingOnboarding = accounts.filter((a) => a.onboardingComplete === false).length;
  const paymentGated = accounts.filter((a) => a.paymentRequired).length;
  const apiIntegrated = accounts.filter((a) => a.apiIntegrated).length;
  const openWorkOrders = workOrders.filter((row) => !['Closed', 'Complete'].includes(row.status));
  const hotTickets = openWorkOrders.filter(
    (row) => row.hotTicket || ['Critical', 'High'].includes(row.priority)
  );
  const operationalProviders = accounts.filter(
    (a) => !a.inactive && a.onboardingComplete !== false && !a.paymentRequired
  ).length;
  const platformHealth = accounts.length
    ? Math.round((operationalProviders / accounts.length) * 100)
    : 0;

  const recent = [...accounts]
    .sort((a, b) => (a.addedDate < b.addedDate ? 1 : -1))
    .slice(0, 5);

  return (
    <Page>
      <PageHeader
        overline="Platform"
        title="Service Provider Registry"
        description={`${accounts.length} service providers · ${active} active · Registry data through ${latestDate ? new Date(`${latestDate}T12:00:00`).toLocaleDateString() : 'unknown'}`}
        actions={
          <Button variant="primary" onClick={() => onOnboard()}>
            <Icon name="plus" size={16} /> Onboard Service Provider
          </Button>
        }
      />

      <AsyncState
        loading={
          accountsQuery.isLoading ||
          contactsQuery.isLoading ||
          workOrdersQuery.isLoading ||
          draftsQuery.isLoading
        }
        error={
          accountsQuery.isError || contactsQuery.isError || workOrdersQuery.isError || draftsQuery.isError
            ? getErrorMessage(
                accountsQuery.error ||
                  contactsQuery.error ||
                  workOrdersQuery.error ||
                  draftsQuery.error
              )
            : null
        }
        onRetry={() => {
          accountsQuery.refetch();
          contactsQuery.refetch();
          workOrdersQuery.refetch();
          draftsQuery.refetch();
        }}
      >
        <StatStrip
          compact
          items={[
            { label: 'Total providers', value: accounts.length, hint: 'On the platform' },
            { label: 'Active providers', value: active, hint: 'Currently enrolled' },
            { label: 'Contacts', value: contactsCount, hint: 'Across all accounts' },
            { label: 'Locations', value: locations, hint: 'Platform footprint' },
          ]}
        />
        <div className="mt-4">
          <HomeAssistant onOnboard={onOnboard} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Pending Onboarding',
              value: pendingOnboarding,
              hint: 'Provider records incomplete',
              onClick: () => navigate('accounts'),
            },
            {
              label: 'Payment-gated SPs',
              value: paymentGated,
              hint: 'Payment required',
              onClick: () => navigate('accounts'),
            },
            {
              label: 'API-integrated SPs',
              value: apiIntegrated,
              hint: 'Provider API enabled',
              onClick: () => navigate('accounts'),
            },
            {
              label: 'Open Work Orders (all SPs)',
              value: openWorkOrders.length,
              hint: 'Awaiting completion',
              onClick: () => navigate('workOrders'),
            },
            {
              label: 'Hot Tickets (all SPs)',
              value: hotTickets.length,
              hint: 'Open high-priority records',
              onClick: () => navigate('workOrders'),
            },
            {
              label: 'Onboarding Queue',
              value: drafts.length,
              hint: 'Saved onboarding drafts',
              onClick: () => navigate('accounts'),
            },
            {
              label: 'Platform Health',
              value: `${platformHealth}%`,
              hint: `${operationalProviders}/${accounts.length} providers operational`,
              onClick: () => navigate('accounts'),
            },
          ].map((tile) => (
            <button
              key={tile.label}
              type="button"
              onClick={tile.onClick}
              className="surface-panel surface-panel-hover p-4 text-left interactive"
            >
              <p className="type-overline">{tile.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink">
                {tile.value}
              </p>
              <p className="mt-1 text-[11px] text-ink-muted">{tile.hint}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Panel className="lg:col-span-8">
            <div className="flex items-end justify-between border-b border-line px-5 py-4">
              <div>
                <p className="type-overline">Catalog</p>
                <p className="mt-1 font-display text-title-sm text-ink">Recently added</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('accounts')}
                className="link-brand flex items-center gap-1 text-xs"
              >
                View all <Icon name="arrowRight" size={13} />
              </button>
            </div>
            <ol className="divide-y divide-line">
              {recent.map((a, i) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => navigate('accountDetail', { accountId: a.id, tab: 'details' })}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left interactive hover:bg-elevated/60"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="mono shrink-0 text-xs tabular-nums text-ink-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{a.name}</span>
                        <span className="block text-xs text-ink-muted">
                          {a.industry} · {a.billing?.city}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-right sm:block">
                        <span className="type-overline block">Added</span>
                        <span className="mono block text-xs text-ink-soft">
                          {a.addedDate ? new Date(`${a.addedDate}T12:00:00`).toLocaleDateString() : '—'}
                        </span>
                      </span>
                      {a.inactive ? (
                        <StatusDot color="slate" label="Inactive" />
                      ) : (
                        <StatusDot color="emerald" label="Active" />
                      )}
                    </span>
                  </button>
                </li>
              ))}
              {!recent.length && (
                <li className="px-5 py-10 text-center text-sm text-ink-muted">
                  No service providers have been added.
                </li>
              )}
            </ol>
          </Panel>

          <Panel className="lg:col-span-4" padded>
            <p className="type-overline">Quick actions</p>
            <p className="mt-1 font-display text-title-sm text-ink">Platform tasks</p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {[
                { icon: 'building', label: 'Manage service providers', module: 'accounts' },
                { icon: 'users', label: 'Contact directory', module: 'contacts' },
                { icon: 'settings', label: 'Workspace', module: 'setup', params: { section: 'userMgmt' } },
              ].map((q, i) => (
                <li key={q.label}>
                  <button
                    type="button"
                    onClick={() => navigate(q.module, q.params)}
                    className="flex w-full items-center gap-3 py-3.5 text-left text-sm font-medium text-ink-soft interactive hover:text-ink"
                  >
                    <span className="mono text-xs text-ink-faint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Icon name={q.icon} size={15} className="text-ink-faint" />
                    {q.label}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-ink-muted">
              As a Rehrig platform user, you have oversight-only access. Operational data belongs to
              each service provider.
            </p>
          </Panel>
        </div>
      </AsyncState>
    </Page>
  );
}
