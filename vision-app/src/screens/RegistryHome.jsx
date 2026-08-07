import React from 'react';
import Icon from '../components/Icon.jsx';
import { Badge, Page, PageHeader, Panel, Button, StatStrip, AsyncState } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useContacts } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';
import HomeAssistant from '../components/HomeAssistant.jsx';

export default function RegistryHome({ onOnboard }) {
  const { navigate } = useStore();
  const accountsQuery = useAccounts();
  const contactsQuery = useContacts();
  const accounts = accountsQuery.data || [];
  const active = accounts.filter((a) => !a.inactive).length;
  const contactsCount = (contactsQuery.data || []).length;
  const locations = new Set(
    accounts
      .map((a) => [a.billing?.street, a.billing?.city, a.billing?.zip].filter(Boolean).join('|'))
      .filter(Boolean)
  ).size;
  const latestDate = accounts.map((a) => a.addedDate).filter(Boolean).sort().at(-1);

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
        loading={accountsQuery.isLoading || contactsQuery.isLoading}
        error={
          accountsQuery.isError || contactsQuery.isError
            ? getErrorMessage(accountsQuery.error || contactsQuery.error)
            : null
        }
        onRetry={() => {
          accountsQuery.refetch();
          contactsQuery.refetch();
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

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Panel className="lg:col-span-8">
            <div className="flex items-end justify-between border-b border-line px-5 py-4">
              <div>
                <p className="type-overline">Catalog</p>
                <p className="mt-1 font-display text-title-sm text-ink">Recently added</p>
              </div>
              <button
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
                        <span className="mono block text-xs text-ink-soft">{a.addedDate}</span>
                      </span>
                      {a.inactive ? (
                        <Badge color="slate">Inactive</Badge>
                      ) : (
                        <Badge color="green">Active</Badge>
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
