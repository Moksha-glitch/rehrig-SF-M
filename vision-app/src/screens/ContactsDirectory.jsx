import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Table,
  Page,
  PageHeader,
  Panel,
  Toolbar,
  SearchField,
  Button,
  FormDrawer,
  FieldSection,
  Field,
  TextInput,
  Select,
  Checkbox,
  AsyncState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useContacts, useCreateContact, useUpdateContact } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';
import { PICKLISTS } from '../data/picklists.js';

function contactFormValues(contact, defaultAccountId = '') {
  return {
    accountId: contact?.accountId || defaultAccountId,
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    email: contact?.email || '',
    title: contact?.title || '',
    role: contact?.roleTitle || contact?.role || PICKLISTS.wizardRole[0],
    segment: contact?.segment || '',
    portal: !!(contact?.isUserCreated && contact?.isUserActive) || !!contact?.portal,
  };
}

function ContactEditorDrawer({ accounts, contact, defaultAccountId, onClose, onSaved }) {
  const { toast } = useStore();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const isNew = !contact;
  const [form, setForm] = useState(() => contactFormValues(contact, defaultAccountId));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(contactFormValues(contact, defaultAccountId));
  }, [contact, defaultAccountId]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const accountOptions = accounts.map((a) => a.name);
  const accountIdByName = Object.fromEntries(accounts.map((a) => [a.name, a.id]));
  const accountNameById = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  const save = async (e) => {
    e.preventDefault();
    if (!form.accountId) {
      setError('Service provider is required.');
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('First name, last name, and email are required.');
      return;
    }
    setBusy(true);
    setError('');
    const changes = {
      accountId: form.accountId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      title: form.title.trim() || form.role,
      role: form.role,
      roleTitle: form.role,
      segment: form.segment.trim(),
      portal: form.portal,
      isUserCreated: form.portal,
      isUserActive: form.portal,
      name: `${form.firstName.trim()} ${form.lastName.trim()}`,
    };
    try {
      if (isNew) {
        await createContact.mutateAsync(changes);
        toast('Contact added');
      } else {
        await updateContact.mutateAsync({ id: contact.id, changes });
        toast('Contact updated');
      }
      onSaved?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save contact.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={save}
      title={isNew ? 'Add contact' : 'Edit contact'}
      description="Global contact directory entry for a service provider."
      dirty={JSON.stringify(form) !== JSON.stringify(contactFormValues(contact, defaultAccountId))}
      busy={busy}
      error={error}
      submitLabel={isNew ? 'Add contact' : 'Save contact'}
    >
      <FieldSection title="Contact details">
        <Field label="Service provider" required span2>
          <Select
            options={accountOptions}
            value={accountNameById[form.accountId] || ''}
            onChange={(e) => set({ accountId: accountIdByName[e.target.value] || '' })}
            placeholder="Select service provider"
          />
        </Field>
        <Field label="First name" required>
          <TextInput value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} />
        </Field>
        <Field label="Last name" required>
          <TextInput value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} />
        </Field>
        <Field label="Email" required span2>
          <TextInput
            type="email"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </Field>
        <Field label="Title">
          <TextInput value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Role">
          <Select
            options={PICKLISTS.wizardRole}
            value={form.role}
            onChange={(e) => set({ role: e.target.value })}
          />
        </Field>
        <Field label="Segment" span2>
          <TextInput value={form.segment} onChange={(e) => set({ segment: e.target.value })} />
        </Field>
      </FieldSection>
      <Checkbox
        label="Enable as portal user"
        checked={form.portal}
        onChange={(e) => set({ portal: e.target.checked })}
      />
    </FormDrawer>
  );
}

export default function ContactsDirectory() {
  const { isScoped, canCreateAccounts } = useStore();
  const accountsQuery = useAccounts();
  const contactsQuery = useContacts();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const accounts = accountsQuery.data || [];
  const contacts = contactsQuery.data || [];
  const accById = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const rows = contacts.filter((c) =>
    [c.name, c.title, c.email, c.phone, c.mobile, c.roleTitle, c.segment, accById[c.accountId]].some(
      (value) => String(value || '').toLowerCase().includes(q.trim().toLowerCase())
    )
  );
  const defaultAccountId = accounts[0]?.id || '';

  return (
    <Page>
      <PageHeader
        overline="Directory"
        title="Contacts"
        description={`${rows.length} of ${contacts.length} contacts${isScoped ? ' in your scope' : ' across all service providers'}.`}
        actions={
          canCreateAccounts ? (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} /> New contact
            </Button>
          ) : null
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
        <Panel>
          <Toolbar>
            <SearchField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search contacts…"
            />
          </Toolbar>
          <Table
            columns={[
              'Name',
              'Title',
              'Email',
              'Role',
              'Service Provider',
              'Segment',
              'Portal Access',
              '',
            ]}
          >
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
                <td className="px-4 py-3 text-right">
                  {canCreateAccounts && (
                    <button
                      type="button"
                      className="link-brand text-xs font-medium"
                      onClick={() => setEditing(c)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-muted">
                  {q ? 'No contacts match your search.' : 'No contacts are available in your scope.'}
                </td>
              </tr>
            )}
          </Table>
        </Panel>
      </AsyncState>

      {(creating || editing) && (
        <ContactEditorDrawer
          accounts={accounts}
          contact={editing}
          defaultAccountId={defaultAccountId}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            contactsQuery.refetch?.();
          }}
        />
      )}
    </Page>
  );
}
