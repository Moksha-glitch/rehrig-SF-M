import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  AccountBadges,
  BoolCell,
  Dash,
  StatusDot,
  Table,
  Page,
  PageHeader,
  Panel,
  Button,
  ConfirmDialog,
  Drawer,
  FormDrawer,
  FieldSection,
  Field,
  TextInput,
  Select,
  Checkbox,
  AsyncState,
  EmptyState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccount, useUpdateAccount } from '../hooks/useAccounts.js';
import { useCreateContact, useRecords, useUpdateContact } from '../hooks/useRecords.js';
import { useNotificationConfig } from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';
import { PICKLISTS } from '../data/picklists.js';

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'customers', label: 'Customers' },
  { key: 'products', label: 'Service Provider Products' },
  { key: 'segments', label: 'Service Provider Segments' },
  { key: 'routes', label: 'Routes' },
  { key: 'notifications', label: 'Service Notifications' },
  { key: 'mindmap', label: 'Mind Map' },
];

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-line py-2.5 last:border-0 sm:grid-cols-3 sm:gap-4">
      <div className="text-sm text-ink-muted">{label}</div>
      <div className="col-span-2 text-sm text-ink">{children}</div>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `section-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <Panel>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between px-5 py-3.5 interactive hover:bg-elevated/50"
      >
        <span className="font-display text-title-sm text-ink">{title}</span>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} className="text-ink-faint" aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} className="border-t border-line px-5 py-2">
          {children}
        </div>
      )}
    </Panel>
  );
}

function val(v) {
  if (v === true || v === false) return <BoolCell value={v} />;
  if (v === '' || v === null || v === undefined) return <Dash />;
  return v;
}

const SEG_BADGE = { Top: 'sky', 'Market Area': 'cyan', District: 'green', Division: 'amber' };

function recordStatusColor(status) {
  const s = String(status || '').toLowerCase();
  if (['lost', 'decommissioned', 'failed', 'cancelled'].some((k) => s.includes(k))) return 'rose';
  if (['paused', 'inactive', 'draft'].some((k) => s.includes(k))) return 'slate';
  if (['pending', 'delayed', 'warning'].some((k) => s.includes(k))) return 'amber';
  if (['complete', 'enabled', 'in service', 'available', 'active'].some((k) => s.includes(k)))
    return 'green';
  return 'cyan';
}

function recordStatus(record) {
  if (record.status) return record.status;
  if (record.inactive || record.active === false) return 'Inactive';
  return 'Active';
}

function belongsToAccount(record, account) {
  if (!record || !account) return false;
  return (
    record.accountId === account.id ||
    record.account === account.name ||
    record.accountName === account.name
  );
}

function recordRows(query) {
  const payload = query.data;
  if (Array.isArray(payload)) return payload;
  return payload?.data || [];
}

function segmentNamesFor(customer, segments) {
  const byId = Object.fromEntries(segments.map((segment) => [segment.id, segment.name]));
  const named = (customer.segmentIds || []).map((id) => byId[id]).filter(Boolean);
  if (named.length) return named.join(', ');
  return segments.find((segment) => !segment.parentId)?.name || '';
}

export default function AccountDetail({ accountId, tab }) {
  const {
    state,
    navigate,
    canTab,
    canAccessModule,
    canCreateAccounts,
    canCreateRecords,
    toast,
    isFollowingAccount,
    toggleFollowAccount,
  } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const detailQuery = useAccount(accountId);
  const updateAccount = useUpdateAccount();
  const account = detailQuery.data?.data;
  if (detailQuery.isLoading) {
    return (
      <Page>
        <AsyncState loading />
      </Page>
    );
  }
  if (detailQuery.isError || !account) {
    return (
      <Page>
        <PageHeader overline="Service Provider" title="Account not found" />
        <EmptyState
          icon="alert"
          title="Account not found"
          description={
            detailQuery.isError
              ? getErrorMessage(detailQuery.error)
              : 'This account may have been removed or is outside your access scope.'
          }
          action={
            <Button variant="primary" onClick={() => navigate('accounts')}>
              Back to service providers
            </Button>
          }
        />
      </Page>
    );
  }
  const contacts = detailQuery.data?.contacts || [];
  const segments = detailQuery.data?.segments || [];
  const routes = detailQuery.data?.routes || [];
  const products = detailQuery.data?.products || [];
  const customers = detailQuery.data?.customers || [];
  const visibleTabs = TABS.filter((t) => canTab(t.key));
  const activeTab = visibleTabs.some((t) => t.key === tab) ? tab : visibleTabs[0]?.key || 'details';
  const followed = isFollowingAccount?.(account.id);

  const setTab = (t) => {
    if (!canTab(t)) return;
    navigate(state.nav.module === 'account' ? 'account' : 'accountDetail', {
      accountId: account.id,
      tab: t,
    });
  };

  const openModule = (moduleKey) => {
    if (!canAccessModule(moduleKey)) return;
    navigate(moduleKey);
  };

  const toggleAccountStatus = async () => {
    setStatusBusy(true);
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        changes: { inactive: !account.inactive },
      });
      toast(account.inactive ? 'Service provider re-activated' : 'Service provider deactivated');
      setStatusConfirm(false);
      detailQuery.refetch?.();
    } catch (err) {
      toast(getErrorMessage(err, 'Could not update provider status.'), 'danger');
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <Page>
      <PageHeader
        overline="Service Provider"
        title={account.name}
        titleExtra={
          <>
            <AccountBadges account={account} />
            {account.inactive ? (
              <StatusDot color="slate" label="Inactive" />
            ) : (
              <StatusDot color="emerald" label="Active" />
            )}
          </>
        }
        description={
          <span>
            {account.industry} ·{' '}
            <span className="font-medium text-brand">{account.ownerName || account.owner}</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                const nowFollowing = toggleFollowAccount?.(account.id);
                toast?.(nowFollowing ? 'Account followed' : 'Account unfollowed');
              }}
            >
              <Icon name="bookmark" size={15} /> {followed ? 'Following' : 'Follow'}
            </Button>
            <Button variant="secondary" className="hidden sm:inline-flex" onClick={() => setTab('contacts')}>
              <Icon name="users" size={15} /> Contacts
            </Button>
            <Button variant="secondary" className="hidden md:inline-flex" onClick={() => setTab('routes')}>
              View routes <Icon name="chevronRight" size={14} />
            </Button>
            {canCreateAccounts && (
              <Button variant="secondary" onClick={() => setStatusConfirm(true)}>
                <Icon name={account.inactive ? 'checkCircle' : 'x'} size={15} />{' '}
                {account.inactive ? 'Re-activate' : 'Deactivate'}
              </Button>
            )}
            {canCreateAccounts && (
              <Button variant="primary" onClick={() => setEditOpen(true)}>
                <Icon name="edit" size={15} /> Edit provider
              </Button>
            )}
          </>
        }
      />

      {editOpen && (
        <EditProviderDialog
          account={account}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            detailQuery.refetch?.();
          }}
        />
      )}

      <ConfirmDialog
        open={statusConfirm}
        title={account.inactive ? 'Re-activate service provider?' : 'Deactivate service provider?'}
        description={
          account.inactive
            ? `${account.name} becomes active again and returns to operational reporting.`
            : `${account.name} is marked inactive. Existing records stay searchable but the provider is excluded from active reporting.`
        }
        confirmLabel={account.inactive ? 'Re-activate' : 'Deactivate'}
        severity={account.inactive ? 'info' : 'danger'}
        busy={statusBusy}
        onCancel={() => setStatusConfirm(false)}
        onConfirm={toggleAccountStatus}
      />

      <div
        role="tablist"
        aria-label="Account sections"
        className="mb-6 flex gap-0 overflow-x-auto border-b border-line bg-surface/60 scroll-thin"
      >
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            role="tab"
            aria-selected={activeTab === t.key}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition duration-snappy ${
              activeTab === t.key
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-faint hover:text-ink-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && <DetailsTab account={account} />}
      {activeTab === 'contacts' && (
        <ContactsTab
          accountId={account.id}
          contacts={contacts}
          canEdit={canCreateAccounts}
          onChanged={() => detailQuery.refetch?.()}
        />
      )}
      {activeTab === 'customers' && (
        <CustomersTab
          account={account}
          customers={customers}
          segments={segments}
          canManage={canCreateAccounts || canCreateRecords}
          onChanged={() => detailQuery.refetch?.()}
        />
      )}
      {activeTab === 'products' && <ProductsTab products={products} />}
      {activeTab === 'segments' && <SegmentsTab segments={segments} />}
      {activeTab === 'routes' && <RoutesTab routes={routes} />}
      {activeTab === 'notifications' && <NotificationsTab account={account} />}
      {activeTab === 'mindmap' && (
        <MindMap
          account={account}
          contacts={contacts}
          segments={segments}
          products={products}
          routes={routes}
          customers={customers}
          onOpenTab={setTab}
          canOpenTab={canTab}
          onOpenModule={openModule}
          canOpenModule={canAccessModule}
        />
      )}
    </Page>
  );
}

function DetailsTab({ account }) {
  const n = account.notif || {};
  const serviceTypes = Array.isArray(account.serviceTypes)
    ? account.serviceTypes.join(', ')
    : account.serviceTypes || '';
  return (
    <div className="space-y-4">
      <Section title="Account Information">
        <Row label="Account Name">{account.name}</Row>
        <Row label="Account Owner">{val(account.ownerName)}</Row>
        <Row label="Type">{val(account.type)}</Row>
        <Row label="Website">{val(account.website)}</Row>
        <Row label="Phone">{val(account.phone)}</Row>
        <Row label="Description">{val(account.description)}</Row>
        <Row label="Industry">{val(account.industry)}</Row>
        <Row label="Service Provider UID">
          <span className="mono">{account.uid}</span>
        </Row>
        <Row label="Employees">{val(account.employees)}</Row>
        <Row label="JDEdwards Id">{val(account.jdEdwardsId)}</Row>
        <Row label="Number Of Weeks">{val(account.numberOfWeeks)}</Row>
        <Row label="Service Types">{val(serviceTypes)}</Row>
        <Row label="InActive">{val(account.inactive)}</Row>
        <Row label="Track Observations">{val(account.trackObservations)}</Row>
        <Row label="Track Safety Events">{val(account.trackSafetyEvents)}</Row>
        <Row label="Support Email">{val(account.supportEmail)}</Row>
        <Row label="Service Modules">{val(account.serviceModules)}</Row>
        <Row label="Is Tableau Cloud?">{val(account.isTableauCloud)}</Row>
        <Row label="Hardware Type">{val(account.hardwareType)}</Row>
      </Section>

      <Section title="Automated Work Orders">
        <Row label="Enable Auto WO">{val(account.enableAutoWO)}</Row>
      </Section>

      <Section title="Hot Ticket Conversion">
        <Row label="Enable Auto Hot Ticket">{val(account.enableAutoHotTicket)}</Row>
        <Row label="Auto Hot Ticket Days">{val(account.autoHotTicketDays)}</Row>
      </Section>

      <Section title="Move Burnt Carts">
        <Row label="Enable Auto Move Burnt Carts to Yard">{val(account.enableMoveBurntCarts)}</Row>
      </Section>

      <Section title="Service Notifications Detail">
        <Row label="Enable Service Notification Tab">{val(n.enableTab)}</Row>
        <Row label="Send Service Notifications">{val(n.send)}</Row>
        <Row label="Message Limit">{val(n.messageLimit)}</Row>
        <Row label="Time Zone">{val(n.timeZone)}</Row>
        <Row label="Start Time">{val(n.startTime)}</Row>
        <Row label="End Time">{val(n.endTime)}</Row>
        <Row label="Email Send Time">{val(n.emailSendTime)}</Row>
        <Row label="SMS Send Time">{val(n.smsSendTime)}</Row>
        <Row label="SMS Failed">{val(n.smsFailed)}</Row>
        <Row label="Phone Failed">{val(n.phoneFailed)}</Row>
        <Row label="SendGrid Service Failed">{val(n.sendGridFailed)}</Row>
      </Section>

      <Section title="Address Information">
        <div className="grid grid-cols-1 gap-6 py-3 sm:grid-cols-2">
          {['billing', 'shipping'].map((k) => {
            const a = account[k] || {};
            return (
              <div key={k}>
                <div className="type-overline mb-2">
                  {k === 'billing' ? 'Billing Address' : 'Shipping Address'}
                </div>
                <div className="text-sm leading-relaxed text-brand">
                  {a.street || '—'}
                  <br />
                  {[a.city, a.state].filter(Boolean).join(', ')} {a.zip || ''}
                  <br />
                  {a.country || ''}
                </div>
                <div
                  className="map-grid mt-3 flex h-24 items-center justify-center border border-line"
                  style={{ backgroundSize: '18px 18px' }}
                >
                  <Icon name="mapPin" size={20} className="text-danger" />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="System Information">
        <Row label="Created By">{val(account.createdBy)}</Row>
        <Row label="Last Modified By">{val(account.lastModifiedBy)}</Row>
      </Section>
    </div>
  );
}

function providerFormValues(account) {
  return {
    name: account.name || '',
    uid: account.uid || '',
    industry: account.industry || '',
    phone: account.phone || '',
    website: account.website || '',
    supportEmail: account.supportEmail || '',
    description: account.description || '',
    type: account.type || 'Customer',
    employees: account.employees ?? 0,
    inactive: !!account.inactive,
    serviceTypes: Array.isArray(account.serviceTypes)
      ? account.serviceTypes.join(', ')
      : account.serviceTypes || '',
    billingStreet: account.billing?.street || '',
    billingCity: account.billing?.city || '',
    billingState: account.billing?.state || '',
    billingZip: account.billing?.zip || '',
    billingCountry: account.billing?.country || '',
  };
}

function EditProviderDialog({ account, onClose, onSaved }) {
  const { toast } = useStore();
  const updateAccount = useUpdateAccount();
  const [form, setForm] = useState(() => providerFormValues(account));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Account name is required.');
      return;
    }
    if (!form.uid.trim()) {
      setError('Service Provider UID is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        changes: {
          name: form.name.trim(),
          uid: form.uid.trim(),
          industry: form.industry.trim(),
          phone: form.phone.trim(),
          website: form.website.trim(),
          supportEmail: form.supportEmail.trim(),
          description: form.description.trim(),
          type: form.type,
          employees: Number(form.employees) || 0,
          inactive: !!form.inactive,
          serviceTypes: form.serviceTypes
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
          billing: {
            ...(account.billing || {}),
            street: form.billingStreet.trim(),
            city: form.billingCity.trim(),
            state: form.billingState.trim(),
            zip: form.billingZip.trim(),
            country: form.billingCountry.trim(),
          },
        },
      });
      toast('Service provider updated');
      onSaved?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save provider changes.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={save}
      title="Edit service provider"
      description={account.name}
      wide
      dirty={JSON.stringify(form) !== JSON.stringify(providerFormValues(account))}
      busy={busy}
      error={error}
      submitLabel="Save changes"
    >
      <FieldSection title="Provider information">
            <Field label="Account name" required>
              <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Service Provider UID" required>
              <TextInput value={form.uid} onChange={(e) => set({ uid: e.target.value })} />
            </Field>
            <Field label="Industry">
              <Select
                options={PICKLISTS.industry || ['Municipal', 'Commercial', 'Industrial']}
                value={form.industry}
                onChange={(e) => set({ industry: e.target.value })}
              />
            </Field>
            <Field label="Type">
              <Select
                options={PICKLISTS.accountType || ['Customer', 'Partner']}
                value={form.type}
                onChange={(e) => set({ type: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="Website">
              <TextInput value={form.website} onChange={(e) => set({ website: e.target.value })} />
            </Field>
            <Field label="Support email">
              <TextInput
                type="email"
                value={form.supportEmail}
                onChange={(e) => set({ supportEmail: e.target.value })}
              />
            </Field>
            <Field label="Employees">
              <TextInput
                type="number"
                min="0"
                value={form.employees}
                onChange={(e) => set({ employees: e.target.value })}
              />
            </Field>
            <Field label="Service types" span2 hint="Comma-separated, e.g. Residential, Commercial">
              <TextInput
                value={form.serviceTypes}
                onChange={(e) => set({ serviceTypes: e.target.value })}
              />
            </Field>
            <Field label="Description" span2>
              <TextInput
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
              />
            </Field>
      </FieldSection>
      <FieldSection title="Billing address" className="border-t border-line pt-5">
            <Field label="Billing street" span2>
              <TextInput
                value={form.billingStreet}
                onChange={(e) => set({ billingStreet: e.target.value })}
              />
            </Field>
            <Field label="City">
              <TextInput
                value={form.billingCity}
                onChange={(e) => set({ billingCity: e.target.value })}
              />
            </Field>
            <Field label="State / province">
              <TextInput
                value={form.billingState}
                onChange={(e) => set({ billingState: e.target.value })}
              />
            </Field>
            <Field label="Postal code">
              <TextInput
                value={form.billingZip}
                onChange={(e) => set({ billingZip: e.target.value })}
              />
            </Field>
            <Field label="Country">
              <TextInput
                value={form.billingCountry}
                onChange={(e) => set({ billingCountry: e.target.value })}
              />
            </Field>
      </FieldSection>
      <Checkbox
        label="Mark inactive"
        checked={form.inactive}
        onChange={(e) => set({ inactive: e.target.checked })}
      />
    </FormDrawer>
  );
}

function ContactsTab({ accountId, contacts, canEdit, onChanged }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p className="text-sm text-ink-muted">{contacts.length} contact{contacts.length === 1 ? '' : 's'}</p>
        {canEdit && (
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} /> Add contact
          </Button>
        )}
      </div>
      <Table
        columns={[
          'Contact Name',
          'Title',
          'Role Title',
          'Email',
          'Phone',
          'Segment',
          'Status',
          'Portal Access',
          '',
        ]}
      >
        {contacts.map((c) => (
          <tr key={c.id} className="interactive hover:bg-elevated/70">
            <td className="max-w-[10rem] truncate px-4 py-3 font-medium text-ink">{c.name}</td>
            <td className="max-w-[8rem] truncate px-4 py-3 text-ink-muted">{c.title || '—'}</td>
            <td className="max-w-[8rem] truncate px-4 py-3 text-ink-muted">{c.roleTitle || c.role || '—'}</td>
            <td className="max-w-[12rem] truncate px-4 py-3 text-ink-muted">{c.email || '—'}</td>
            <td className="max-w-[8rem] truncate px-4 py-3 text-ink-muted">{c.phone || c.mobile || '—'}</td>
            <td className="max-w-[8rem] truncate px-4 py-3 text-ink-muted">{c.segment || '—'}</td>
            <td className="px-4 py-3">
              <Badge color={recordStatusColor(recordStatus(c))}>{recordStatus(c)}</Badge>
            </td>
            <td className="px-4 py-3">
              {c.isUserCreated && c.isUserActive ? (
                <Badge color="green">Portal User</Badge>
              ) : (
                <Badge color="slate">Not enrolled</Badge>
              )}
            </td>
            <td className="px-4 py-3 text-right">
              {canEdit && (
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
        {contacts.length === 0 && (
          <tr>
            <td colSpan={9} className="px-4 py-8 text-center text-sm text-ink-faint">
              No contacts yet.
            </td>
          </tr>
        )}
      </Table>
      {(editing || creating) && (
        <ContactEditorDialog
          accountId={accountId}
          contact={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            onChanged?.();
          }}
        />
      )}
    </Panel>
  );
}

function contactFormValues(contact) {
  return {
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    email: contact?.email || '',
    title: contact?.title || '',
    role: contact?.roleTitle || contact?.role || PICKLISTS.wizardRole[0],
    segment: contact?.segment || '',
    portal: !!(contact?.isUserCreated && contact?.isUserActive) || !!contact?.portal,
  };
}

function ContactEditorDialog({ accountId, contact, onClose, onSaved }) {
  const { toast } = useStore();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const isNew = !contact;
  const [form, setForm] = useState(() => contactFormValues(contact));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(contactFormValues(contact));
  }, [contact]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('First name, last name, and email are required.');
      return;
    }
    setBusy(true);
    setError('');
    const changes = {
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
        await createContact.mutateAsync({ ...changes, accountId });
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
      description="Contact details for this service provider"
      dirty={JSON.stringify(form) !== JSON.stringify(contactFormValues(contact))}
      busy={busy}
      error={error}
      submitLabel={isNew ? 'Add contact' : 'Save contact'}
    >
      <FieldSection title="Contact details">
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

function customerProfiles(account) {
  return account.customerProfiles || {};
}

function isCustomerInactive(account, customer) {
  const profile = customerProfiles(account)[customer.id];
  if (profile && typeof profile.inactive === 'boolean') return profile.inactive;
  return customer.active === false;
}

/** Resolves the Location record behind a customer through their work orders (V1.4 customer-location junction). */
function resolveCustomerLocation(customer, locations, workOrders) {
  const workOrder = workOrders.find(
    (record) =>
      (customer.customerId && record.customerId === customer.customerId) ||
      (customer.name && record.customer === customer.name)
  );
  const hint = String(workOrder?.location || '').trim().toLowerCase();
  if (!hint) return null;
  return (
    locations.find((location) => {
      const name = String(location.name || '').trim().toLowerCase();
      const address = String(location.address || '').trim().toLowerCase();
      if (name && (hint.startsWith(name) || name.startsWith(hint))) return true;
      return !!address && address.startsWith(hint);
    }) || null
  );
}

function derivedCustomerValues({ account, customer, location, segmentName }) {
  const billing = account.billing || {};
  return {
    accountNumber: customer.customerId || '',
    customerName: customer.name || '',
    address:
      location?.address ||
      [location?.houseNumber, location?.street].filter(Boolean).join(' ') ||
      '',
    city: location?.city || billing.city || '',
    state: location?.state || billing.state || '',
    postalCode: location?.zip || billing.zip || '',
    county: location?.county || '',
    zone: location?.zone || '',
    parcelId: location?.parcelId || '',
    siteId: location?.siteId || '',
    latitude: location?.latitude || '',
    longitude: location?.longitude || '',
    division: segmentName || '',
    epcorAcct: '',
    nbrOfUnits: '',
    rateCategory: '',
    billingExempt: false,
    cisZone: '',
    cartSharing: '',
    parentAccount: '',
    locationType: location?.type || '',
  };
}

function customerFormValues(base, profile) {
  const values = { ...base };
  Object.entries(profile || {}).forEach(([key, value]) => {
    if (key in values && value !== undefined) values[key] = value;
  });
  return values;
}

function customerFieldSections({ divisionOptions, parentOptions }) {
  return [
    {
      title: 'Customer account',
      fields: [
        { key: 'accountNumber', label: 'Account #', mono: true },
        { key: 'customerName', label: 'Customer Name' },
        {
          key: 'parentAccount',
          label: 'Parent Account',
          type: 'select',
          options: parentOptions,
        },
        { key: 'division', label: 'Division', type: 'select', options: divisionOptions },
        {
          key: 'locationType',
          label: 'Location Type',
          type: 'select',
          options: PICKLISTS.locationType,
        },
      ],
    },
    {
      title: 'Service address',
      fields: [
        { key: 'address', label: 'Address', span2: true },
        { key: 'city', label: 'City' },
        {
          key: 'state',
          label: 'State/Province',
          type: 'select',
          options: PICKLISTS.provinceState,
        },
        { key: 'postalCode', label: 'Postal Code' },
        { key: 'county', label: 'County' },
        { key: 'zone', label: 'Zone' },
        { key: 'parcelId', label: 'Parcel Id', mono: true },
        { key: 'siteId', label: 'Site Id', mono: true },
        { key: 'latitude', label: 'Latitude', mono: true },
        { key: 'longitude', label: 'Longitude', mono: true },
      ],
    },
    {
      title: 'Billing & program',
      fields: [
        { key: 'epcorAcct', label: 'EPCOR Acct' },
        { key: 'nbrOfUnits', label: 'Nbr of Units', type: 'number' },
        { key: 'rateCategory', label: 'Rate Category' },
        { key: 'cisZone', label: 'CIS - Zone' },
        { key: 'cartSharing', label: 'Cart Sharing' },
        { key: 'billingExempt', label: 'Billing Exempt', type: 'checkbox' },
      ],
    },
  ];
}

function CustomersTab({ account, customers, segments, canManage, onChanged }) {
  const [selected, setSelected] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const { toast } = useStore();
  const updateAccount = useUpdateAccount();
  const locationsQuery = useRecords('locations');
  const workOrdersQuery = useRecords('workOrders');

  const locations = recordRows(locationsQuery).filter((record) =>
    belongsToAccount(record, account)
  );
  const workOrders = recordRows(workOrdersQuery).filter((record) =>
    belongsToAccount(record, account)
  );

  const setCustomerProfile = async (customer, changes, message) => {
    const profiles = customerProfiles(account);
    await updateAccount.mutateAsync({
      id: account.id,
      changes: {
        customerProfiles: {
          ...profiles,
          [customer.id]: { ...(profiles[customer.id] || {}), ...changes },
        },
      },
    });
    toast(message);
    onChanged?.();
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const nextInactive = !isCustomerInactive(account, statusTarget);
    setStatusBusy(true);
    try {
      await setCustomerProfile(
        statusTarget,
        { inactive: nextInactive },
        nextInactive ? 'Customer deactivated' : 'Customer re-activated'
      );
      setStatusTarget(null);
    } catch (err) {
      toast(getErrorMessage(err, 'Could not update customer status.'), 'danger');
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <Panel>
      <div className="border-b border-line px-5 py-3">
        <p className="text-sm text-ink-muted">
          {customers.length} customer{customers.length === 1 ? '' : 's'} on this service provider
        </p>
      </div>
      <Table columns={['Customer #', 'Customer Name', 'Email', 'Segment', 'Owner', 'Status', '']}>
        {customers.length ? (
          customers.map((customer) => {
            const inactive = isCustomerInactive(account, customer);
            return (
              <tr key={customer.id} className="interactive hover:bg-elevated/70">
                <td className="mono px-4 py-3 text-ink-muted">{customer.customerId || '—'}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  <button
                    type="button"
                    className="link-brand font-medium"
                    onClick={() => setSelected(customer)}
                  >
                    {customer.name}
                  </button>
                </td>
                <td className="px-4 py-3 text-ink-muted">{customer.email || '—'}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {segmentNamesFor(customer, segments) || '—'}
                </td>
                <td className="px-4 py-3 text-ink-muted">{account.ownerName || account.owner}</td>
                <td className="px-4 py-3">
                  {inactive ? (
                    <StatusDot color="slate" label="Inactive" />
                  ) : (
                    <StatusDot color="emerald" label="Active" />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="link-brand text-xs font-medium"
                      onClick={() => setSelected(customer)}
                    >
                      {canManage ? 'Edit' : 'View'}
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        className="link-brand text-xs font-medium"
                        onClick={() => setStatusTarget(customer)}
                      >
                        {inactive ? 'Re-activate' : 'Deactivate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-faint">
              No customers yet.
            </td>
          </tr>
        )}
      </Table>

      {selected && (
        <CustomerDrawer
          key={selected.id}
          account={account}
          customer={selected}
          customers={customers}
          segments={segments}
          location={resolveCustomerLocation(selected, locations, workOrders)}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onSave={async (values) => {
            await setCustomerProfile(selected, values, 'Customer updated');
            setSelected(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!statusTarget}
        title={
          statusTarget && isCustomerInactive(account, statusTarget)
            ? 'Re-activate customer?'
            : 'Deactivate customer?'
        }
        description={
          statusTarget
            ? isCustomerInactive(account, statusTarget)
              ? `${statusTarget.name} returns to active service and can raise new requests.`
              : `${statusTarget.name} is marked inactive. Carts stay on the location until a removal work order completes.`
            : undefined
        }
        confirmLabel={
          statusTarget && isCustomerInactive(account, statusTarget) ? 'Re-activate' : 'Deactivate'
        }
        severity={
          statusTarget && isCustomerInactive(account, statusTarget) ? 'info' : 'danger'
        }
        busy={statusBusy}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </Panel>
  );
}

function CustomerDrawer({
  account,
  customer,
  customers,
  segments,
  location,
  canManage,
  onClose,
  onSave,
}) {
  const segmentName = segmentNamesFor(customer, segments);
  const base = derivedCustomerValues({ account, customer, location, segmentName });
  const profile = customerProfiles(account)[customer.id];
  const baseline = customerFormValues(base, profile);
  const [form, setForm] = useState(baseline);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sections = customerFieldSections({
    divisionOptions: segments.map((segment) => segment.name),
    parentOptions: customers
      .filter((candidate) => candidate.id !== customer.id)
      .map((candidate) => candidate.name),
  });

  if (!canManage) {
    return (
      <Drawer
        open
        onClose={onClose}
        wide
        title={customer.name}
        description={`Customer ${baseline.accountNumber || customer.id} · ${account.name}`}
      >
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 scroll-thin">
          {sections.map((section) => (
            <FieldSection key={section.title} title={section.title}>
              {section.fields.map((field) => (
                <div key={field.key} className={field.span2 ? 'sm:col-span-2' : ''}>
                  <p className="type-overline mb-1.5">{field.label}</p>
                  <p className={`text-sm text-ink ${field.mono ? 'mono' : ''}`}>
                    {val(baseline[field.key])}
                  </p>
                </div>
              ))}
            </FieldSection>
          ))}
        </div>
      </Drawer>
    );
  }

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async (e) => {
    e.preventDefault();
    if (!String(form.customerName).trim()) {
      setError('Customer name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave({
        ...form,
        accountNumber: String(form.accountNumber).trim(),
        customerName: String(form.customerName).trim(),
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save customer changes.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={save}
      title={customer.name}
      description={`Customer ${baseline.accountNumber || customer.id} · ${account.name}`}
      wide
      dirty={JSON.stringify(form) !== JSON.stringify(baseline)}
      busy={busy}
      error={error}
      submitLabel="Save customer"
    >
      {sections.map((section, index) => (
        <FieldSection
          key={section.title}
          title={section.title}
          className={index ? 'border-t border-line pt-5' : ''}
        >
          {section.fields.map((field) => {
            if (field.type === 'checkbox') {
              return (
                <div key={field.key} className="min-w-0 sm:col-span-2">
                  <Checkbox
                    label={field.label}
                    checked={!!form[field.key]}
                    onChange={(e) => set({ [field.key]: e.target.checked })}
                  />
                </div>
              );
            }
            return (
              <Field key={field.key} label={field.label} span2={field.span2}>
                {field.type === 'select' ? (
                  <Select
                    options={field.options}
                    value={form[field.key]}
                    onChange={(e) => set({ [field.key]: e.target.value })}
                    placeholder="—"
                  />
                ) : (
                  <TextInput
                    type={field.type === 'number' ? 'number' : 'text'}
                    className={field.mono ? 'mono' : ''}
                    value={form[field.key]}
                    onChange={(e) => set({ [field.key]: e.target.value })}
                  />
                )}
              </Field>
            );
          })}
        </FieldSection>
      ))}
    </FormDrawer>
  );
}

function ProductsTab({ products }) {
  return (
    <Panel>
      <Table
        columns={[
          'SP Product #',
          'Product',
          'Product Code',
          'Size',
          'Size Type',
          'Service Category',
          'Family',
          'Status',
        ]}
      >
        {products.map((p) => (
          <tr key={p.id} className="interactive hover:bg-elevated/70">
            <td className="mono px-4 py-3 text-ink-muted">{p.number}</td>
            <td className="px-4 py-3 font-medium text-ink">{p.product}</td>
            <td className="mono px-4 py-3 text-ink-muted">{p.code}</td>
            <td className="px-4 py-3 text-ink-muted">{p.size}</td>
            <td className="px-4 py-3 text-ink-muted">{p.sizeType}</td>
            <td className="px-4 py-3 text-ink-muted">{p.category}</td>
            <td className="px-4 py-3 text-ink-muted">{p.family}</td>
            <td className="px-4 py-3">
              <Badge color={recordStatusColor(recordStatus(p))}>{recordStatus(p)}</Badge>
            </td>
          </tr>
        ))}
        {products.length === 0 && (
          <tr>
            <td colSpan={8} className="px-4 py-8 text-center text-sm text-ink-faint">
              No products linked yet.
            </td>
          </tr>
        )}
      </Table>
    </Panel>
  );
}

function SegmentsTab({ segments }) {
  const byParent = {};
  segments.forEach((s) => {
    const p = s.parentId || 'root';
    (byParent[p] = byParent[p] || []).push(s);
  });
  const nameById = Object.fromEntries(segments.map((s) => [s.id, s.name]));
  const render = (parentKey, depth) =>
    (byParent[parentKey] || []).map((s) => (
      <div key={s.id}>
        <div
          className="flex flex-wrap items-center gap-2 py-2 interactive hover:bg-elevated/60"
          style={{ paddingLeft: depth * 24 + 16 }}
        >
          <Icon name="chevronRight" size={13} className="text-ink-faint" />
          <span className="text-sm font-medium text-ink">{s.name}</span>
          <Badge color={SEG_BADGE[s.type]}>{s.type}</Badge>
          <span className="text-xs text-ink-faint">
            Parent · {nameById[s.parentId] || 'Top level'}
          </span>
        </div>
        {render(s.id, depth + 1)}
      </div>
    ));
  return (
    <Panel className="py-2">
      {segments.length ? (
        render('root', 0)
      ) : (
        <div className="px-5 py-8 text-center text-sm text-ink-faint">No segments yet.</div>
      )}
    </Panel>
  );
}

function RoutesTab({ routes }) {
  return (
    <Panel>
      <Table
        columns={[
          'Route #',
          'Record Type',
          'Dispatch',
          'Route UID',
          'Duration',
          'Start',
          'Truck',
          'Driver',
          'Status',
          'Collection Type',
          'Days',
        ]}
      >
        {routes.map((r) => (
          <tr key={r.id} className="interactive hover:bg-elevated/70">
            <td className="px-4 py-3 font-medium text-ink">{r.routeNumber}</td>
            <td className="px-4 py-3 text-ink-muted">{r.recordType}</td>
            <td className="px-4 py-3 text-ink-muted">{r.dispatch}</td>
            <td className="mono px-4 py-3 text-ink-muted">{r.routeUID}</td>
            <td className="px-4 py-3 text-ink-muted">{r.duration}</td>
            <td className="px-4 py-3 text-ink-muted">{r.startTime}</td>
            <td className="px-4 py-3 text-ink-muted">{r.truck}</td>
            <td className="px-4 py-3 text-ink-muted">{r.driver}</td>
            <td className="px-4 py-3">
              <Badge color={recordStatusColor(r.status)}>{r.status}</Badge>
            </td>
            <td className="px-4 py-3 text-ink-muted">{r.collectionType}</td>
            <td className="px-4 py-3 text-ink-muted">{r.collectionDays || '—'}</td>
          </tr>
        ))}
        {routes.length === 0 && (
          <tr>
            <td colSpan={11} className="px-4 py-8 text-center text-sm text-ink-faint">
              No routes yet.
            </td>
          </tr>
        )}
      </Table>
    </Panel>
  );
}

function NotificationsTab({ account }) {
  const notifQuery = useNotificationConfig();
  const rules = notifQuery.data || [];
  return (
    <Panel>
      <div className="border-b border-line px-5 py-4">
        <p className="type-overline">Service notifications</p>
        <p className="mt-1 text-sm text-ink-muted">
          Platform rules that can notify residents for {account.name}. Edit rules under Notification Config.
        </p>
      </div>
      <Table columns={['Rule', 'Event', 'Channel', 'Priority', 'Status']}>
        {rules.map((r) => (
          <tr key={r.id} className="interactive hover:bg-elevated/70">
            <td className="px-4 py-3 font-medium text-ink">{r.name}</td>
            <td className="mono px-4 py-3 text-ink-muted">{r.event}</td>
            <td className="px-4 py-3 text-ink-muted">{r.channel}</td>
            <td className="px-4 py-3 text-ink-muted">{r.priority}</td>
            <td className="px-4 py-3">
              {r.enabled ? <Badge color="green">Enabled</Badge> : <Badge color="slate">Paused</Badge>}
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}

function MindMapNode({ icon, label, count, meta, onClick, emphasis, reachable = true, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={onClick && !reachable ? true : undefined}
      className={`w-full rounded-panel border px-3 py-2.5 text-left text-sm interactive ${
        emphasis
          ? 'border-ink bg-ink text-white'
          : `border-line bg-surface text-ink ${
              reachable ? 'hover:border-line-strong hover:bg-elevated' : 'opacity-70'
            }`
      }`}
    >
      {children || (
        <>
          <span className="flex items-center gap-2">
            {icon && <Icon name={icon} size={14} className="text-ink-faint" aria-hidden="true" />}
            <span className="font-medium">{label}</span>
            <span className="ml-auto font-semibold tabular-nums">{count}</span>
          </span>
          {meta && <span className="mt-1 block text-xs leading-snug text-ink-muted">{meta}</span>}
        </>
      )}
    </button>
  );
}

function MindMap({
  account,
  contacts,
  segments,
  products,
  routes,
  customers,
  onOpenTab,
  canOpenTab,
  onOpenModule,
  canOpenModule,
}) {
  const assetsQuery = useRecords('assets');
  const locationsQuery = useRecords('locations');
  const dispatchesQuery = useRecords('dispatches');
  const workOrdersQuery = useRecords('workOrders');
  const notesQuery = useRecords('notesAttachments');
  const aggregatedTipsQuery = useRecords('aggregatedTips');
  const individualTipsQuery = useRecords('individualTips');
  const notifQuery = useNotificationConfig();

  const forAccount = (query) =>
    recordRows(query).filter((record) => belongsToAccount(record, account));
  const assets = forAccount(assetsQuery);
  const locations = forAccount(locationsQuery);
  const dispatches = forAccount(dispatchesQuery);
  const workOrders = forAccount(workOrdersQuery);
  const notes = forAccount(notesQuery);
  const tips = forAccount(aggregatedTipsQuery).length + forAccount(individualTipsQuery).length;
  const notificationRules = notifQuery.data || [];
  const serviceModules = String(account.serviceModules || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const importableRecords =
    workOrders.length + locations.length + assets.length + contacts.length + routes.length;

  const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

  const nodes = [
    {
      key: 'contacts',
      icon: 'users',
      label: 'Contacts',
      count: contacts.length,
      meta: 'Provider employees · one segment each',
      tab: 'contacts',
    },
    {
      key: 'customers',
      icon: 'user',
      label: 'Customers',
      count: customers.length,
      meta: 'Residents · customer, junction, location',
      tab: 'customers',
    },
    {
      key: 'products',
      icon: 'package',
      label: 'Service Provider Products',
      count: products.length,
      meta: 'Subset of the Rehrig master catalog',
      tab: 'products',
    },
    {
      key: 'segments',
      icon: 'layers',
      label: 'Service Provider Segments',
      count: segments.length,
      meta: 'Top → Market Area → District → Division',
      tab: 'segments',
    },
    {
      key: 'routes',
      icon: 'route',
      label: 'Routes',
      count: routes.length,
      meta: `${plural(routes.length, 'collection route')} with collection days`,
      tab: 'routes',
    },
    {
      key: 'notifications',
      icon: 'bell',
      label: 'Service Notifications',
      count: notificationRules.length,
      meta: `${plural(
        notificationRules.filter((rule) => rule.enabled).length,
        'rule'
      )} enabled for residents`,
      tab: 'notifications',
    },
    {
      key: 'manageAccount',
      icon: 'settings',
      label: 'Manage account',
      count: serviceModules.length,
      meta: serviceModules.length
        ? `Service modules · ${serviceModules.join(', ')}`
        : 'Provider settings, automation, notifications',
      tab: 'details',
    },
    {
      key: 'assets',
      icon: 'box',
      label: 'Assets',
      count: assets.length,
      meta: 'Carts and containers tracked for this provider',
      module: 'assets',
    },
    {
      key: 'locations',
      icon: 'mapPin',
      label: 'Locations',
      count: locations.length,
      meta: 'Service addresses, yards, and sites',
      module: 'locations',
    },
    {
      key: 'dispatches',
      icon: 'truck',
      label: 'Dispatches',
      count: dispatches.length,
      meta: 'Truck and driver assignments per route date',
      module: 'dispatches',
    },
    {
      key: 'workOrders',
      icon: 'clipboard',
      label: 'Work orders',
      count: workOrders.length,
      meta: 'Requests raised against this provider',
      module: 'workOrders',
    },
    {
      key: 'notes',
      icon: 'paperclip',
      label: 'Notes',
      count: notes.length,
      meta: 'Notes and attachments on provider records',
      module: 'notesAttachments',
    },
    {
      key: 'tips',
      icon: 'activity',
      label: 'Tips',
      count: tips,
      meta: 'Aggregated truck totals and individual tip events',
      module: 'aggregatedTips',
    },
    {
      key: 'bulkImport',
      icon: 'download',
      label: 'Bulk import',
      count: importableRecords,
      meta: 'Records across work orders, locations, assets, contacts, routes',
      module: 'bulkImport',
    },
  ];

  return (
    <Panel padded>
      <p className="type-overline mb-6 text-center">Relationship map</p>
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-panel border border-line bg-elevated px-4 py-2 text-sm font-semibold text-ink">
          Rehrig Pacific
        </div>
        <div className="h-6 w-px bg-line" />
        <MindMapNode emphasis>
          {account.name} <span className="mono text-xs opacity-70">({account.uid})</span>
        </MindMapNode>
        <div className="h-6 w-px bg-line" />
        <div className="grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.map((node) => {
            const reachable = node.tab ? canOpenTab(node.tab) : canOpenModule(node.module);
            return (
              <MindMapNode
                key={node.key}
                icon={node.icon}
                label={node.label}
                count={node.count}
                meta={node.meta}
                reachable={reachable}
                onClick={() => (node.tab ? onOpenTab(node.tab) : onOpenModule(node.module))}
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          {plural(segments.length, 'segment')} · {plural(contacts.length, 'provider user')} ·{' '}
          {plural(customers.length, 'resident')}
        </p>
      </div>
    </Panel>
  );
}
