import React, { useMemo, useState } from 'react';
import {
  Badge,
  Table,
  Page,
  PageHeader,
  Panel,
  Toolbar,
  SearchField,
  AsyncState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts, useUsers } from '../hooks/useAccounts.js';
import { getErrorMessage } from '../lib/errors.js';

export default function CustomersDirectory() {
  const { navigate, isScoped, assistantOpen } = useStore();
  const accountsQuery = useAccounts();
  const usersQuery = useUsers();
  const [q, setQ] = useState('');
  const compact = assistantOpen;
  const accounts = accountsQuery.data || [];
  const accById = useMemo(
    () => Object.fromEntries(accounts.map((account) => [account.id, account])),
    [accounts]
  );

  const customers = useMemo(
    () => (usersQuery.data || []).filter((user) => user.persona === 'customer'),
    [usersQuery.data]
  );

  const rows = customers.filter((customer) => {
    const providerNames = (customer.accountIds || [])
      .map((id) => accById[id]?.name)
      .filter(Boolean)
      .join(' ');
    return [customer.name, customer.email, customer.customerId, customer.scopeLabel, providerNames].some(
      (value) => String(value || '').toLowerCase().includes(q.trim().toLowerCase())
    );
  });

  return (
    <Page>
      <PageHeader
        overline="Service Providers"
        title="Customers"
        description={`${rows.length} of ${customers.length} customers${
          isScoped ? ' in your scope' : ' across all service providers'
        }.`}
      />

      <AsyncState
        loading={accountsQuery.isLoading || usersQuery.isLoading}
        error={
          accountsQuery.isError || usersQuery.isError
            ? getErrorMessage(accountsQuery.error || usersQuery.error)
            : null
        }
        onRetry={() => {
          accountsQuery.refetch();
          usersQuery.refetch();
        }}
      >
        <Panel>
          <Toolbar>
            <SearchField
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search customers…"
              label="Search customers"
            />
          </Toolbar>
          <Table
            columns={[
              'Customer #',
              'Customer Name',
              { label: 'Email', className: compact ? 'hidden' : '' },
              'Service Provider',
              { label: 'Scope', className: compact ? 'hidden' : '' },
              'Status',
            ]}
          >
            {rows.map((customer) => {
              const provider =
                (customer.accountIds || []).map((id) => accById[id]).find(Boolean) || null;
              return (
                <tr key={customer.id} className="interactive hover:bg-elevated/70">
                  <td className="mono px-3 py-3 text-ink-muted sm:px-4">
                    {customer.customerId || '—'}
                  </td>
                  <td className="min-w-0 px-3 py-3 sm:px-4">
                    <button
                      type="button"
                      onClick={() =>
                        navigate('accountDetail', {
                          accountId: provider?.id || customer.accountIds?.[0],
                          tab: 'customers',
                        })
                      }
                      className="link-brand max-w-full truncate text-left font-medium"
                    >
                      {customer.name}
                    </button>
                  </td>
                  <td
                    className={`max-w-[14rem] truncate px-3 py-3 text-ink-muted sm:px-4 ${
                      compact ? 'hidden' : ''
                    }`}
                  >
                    {customer.email || '—'}
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-3 text-ink-muted sm:px-4">
                    {provider?.name || '—'}
                  </td>
                  <td
                    className={`max-w-[8rem] truncate px-3 py-3 text-ink-muted sm:px-4 ${
                      compact ? 'hidden' : ''
                    }`}
                  >
                    {customer.scopeLabel || '—'}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <Badge color={customer.active === false ? 'slate' : 'green'}>
                      {customer.active === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td
                  colSpan={compact ? 4 : 6}
                  className="px-4 py-8 text-center text-sm text-ink-faint"
                >
                  {q ? 'No customers match this search.' : 'No customers are available.'}
                </td>
              </tr>
            )}
          </Table>
        </Panel>
      </AsyncState>
    </Page>
  );
}
