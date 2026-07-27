import React, { useState } from 'react';
import { Badge, Table, Page, PageHeader, Panel, Toolbar, SearchField, AsyncState } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useContacts } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';

export default function ContactsDirectory() {
  const { isScoped } = useStore();
  const accountsQuery = useAccounts();
  const contactsQuery = useContacts();
  const [q, setQ] = useState('');
  const accounts = accountsQuery.data || [];
  const contacts = contactsQuery.data || [];
  const accById = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const rows = contacts.filter((c) =>
    [c.name, c.title, c.email, c.phone, c.mobile, c.roleTitle, c.segment, accById[c.accountId]].some(
      (value) => String(value || '').toLowerCase().includes(q.trim().toLowerCase())
    )
  );

  return (
    <Page>
      <PageHeader
        overline="Directory"
        title="Contacts"
        description={`${rows.length} of ${contacts.length} contacts${isScoped ? ' in your scope' : ' across all service providers'}.`}
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
        <Panel>
          <Toolbar>
            <SearchField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search contacts…"
            />
          </Toolbar>
          <Table columns={['Name', 'Title', 'Email', 'Role', 'Service Provider', 'Segment', 'Portal Access']}>
            {rows.map((c) => (
              <tr key={c.id} className="interactive hover:bg-elevated/70">
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-ink-muted">{c.title}</td>
                <td className="px-4 py-3 text-ink-muted">{c.email}</td>
                <td className="px-4 py-3 text-ink-muted">{c.roleTitle}</td>
                <td className="px-4 py-3 text-ink-muted">{accById[c.accountId]}</td>
                <td className="px-4 py-3 text-ink-muted">{c.segment}</td>
                <td className="px-4 py-3">
                  {c.isUserCreated && c.isUserActive ? (
                    <Badge color="green">Portal User</Badge>
                  ) : (
                    <Badge color="slate">Not enrolled</Badge>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-muted">
                  {q ? 'No contacts match your search.' : 'No contacts are available in your scope.'}
                </td>
              </tr>
            )}
          </Table>
        </Panel>
      </AsyncState>
    </Page>
  );
}
