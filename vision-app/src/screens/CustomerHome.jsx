import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Table,
  Page,
  PageHeader,
  Panel,
  Button,
  AsyncState,
  StatStrip,
  FormDrawer,
  FieldSection,
  Field,
  TextInput,
  TextArea,
  Select,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useCreateRecord, useRecords } from '../hooks/useRecords.js';
import { useNotifications } from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';
import { PICKLISTS } from '../data/picklists.js';

function locationLabel(location) {
  return (
    location?.address ||
    [location?.houseNumber, location?.street].filter(Boolean).join(' ') ||
    location?.name ||
    ''
  );
}

function locationRoutesSummary(location) {
  return [
    location?.trashRoute && `Trash: ${location.trashRoute}`,
    location?.recycleRoute && `Recycle: ${location.recycleRoute}`,
    location?.organicRoute && `Organic: ${location.organicRoute}`,
    location?.yardRoute && `Yard: ${location.yardRoute}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

function resolveCustomerLocations({ customerId, customerName, accountId, locations, workOrders }) {
  const hints = workOrders
    .filter(
      (workOrder) =>
        (customerId && workOrder.customerId === customerId) ||
        (customerName && workOrder.customer === customerName)
    )
    .map((workOrder) => String(workOrder.location || '').trim().toLowerCase())
    .filter(Boolean);

  const scoped = locations.filter(
    (location) => !accountId || location.accountId === accountId || !location.accountId
  );

  if (hints.length) {
    const matched = scoped.filter((location) => {
      const name = String(location.name || '').trim().toLowerCase();
      const address = String(location.address || '').trim().toLowerCase();
      return hints.some(
        (hint) =>
          (name && (hint.startsWith(name) || name.startsWith(hint))) ||
          (address && (address.startsWith(hint) || hint.startsWith(address)))
      );
    });
    if (matched.length) return matched;
  }

  return scoped.filter((location) => location.customerId && location.customerId === customerId);
}

function emptyRequestForm(account, locations) {
  const first = locations[0];
  return {
    requestType: PICKLISTS.portalRequestType[0] || '',
    location: locationLabel(first) || account?.billing?.street || '',
    subject: '',
    notes: '',
    preferredDate: '',
  };
}

function ServiceRequestDrawer({ account, user, locations, onClose, onSubmitted }) {
  const { toast } = useStore();
  const createMutation = useCreateRecord('workOrders');
  const [form, setForm] = useState(() => emptyRequestForm(account, locations));
  const [error, setError] = useState('');
  const baseline = useMemo(() => emptyRequestForm(account, locations), [account, locations]);

  const locationOptions = useMemo(() => {
    const opts = [];
    locations.forEach((location) => {
      const label = locationLabel(location);
      if (label && !opts.includes(label)) opts.push(label);
    });
    if (account?.billing?.street && !opts.includes(account.billing.street)) {
      opts.push(account.billing.street);
    }
    return opts;
  }, [account, locations]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    if (!user?.customerId || !account?.id) {
      setError('A customer account is required to submit a service request.');
      return;
    }
    if (!form.requestType.trim()) {
      setError('Request type is required.');
      return;
    }
    if (!form.location.trim()) {
      setError('Location is required.');
      return;
    }
    if (!form.subject.trim() && !form.notes.trim()) {
      setError('Add a short subject or notes describing the request.');
      return;
    }
    setError('');
    try {
      const createdAt = new Date().toISOString();
      await createMutation.mutateAsync({
        number: `WO-${Date.now().toString(36).toUpperCase()}`,
        customerId: user.customerId,
        accountId: account.id,
        account: account.name,
        requestType: form.requestType,
        status: 'Open',
        location: form.location.trim(),
        subject: form.subject.trim() || form.requestType,
        woNotes: form.notes.trim(),
        requestDate: createdAt.slice(0, 10),
        dueDate: form.preferredDate || undefined,
        createdAt,
      });
      toast?.('Service request submitted');
      onSubmitted?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit service request.'));
    }
  };

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={submit}
      title="Request service"
      description="Describe the issue so your service provider can respond."
      dirty={JSON.stringify(form) !== JSON.stringify(baseline)}
      busy={createMutation.isPending}
      error={error}
      submitLabel="Submit request"
    >
      <FieldSection title="Request details">
        <Field label="Request type" required span2>
          <Select
            options={PICKLISTS.portalRequestType}
            value={form.requestType}
            onChange={(e) => {
              set({ requestType: e.target.value });
              setError('');
            }}
          />
        </Field>
        <Field label="Location" required span2>
          {locationOptions.length ? (
            <Select
              options={locationOptions}
              value={form.location}
              onChange={(e) => {
                set({ location: e.target.value });
                setError('');
              }}
              placeholder="Select location"
            />
          ) : (
            <TextInput
              value={form.location}
              onChange={(e) => {
                set({ location: e.target.value });
                setError('');
              }}
              placeholder="Service address"
            />
          )}
        </Field>
        <Field label="Subject" span2>
          <TextInput
            value={form.subject}
            onChange={(e) => {
              set({ subject: e.target.value });
              setError('');
            }}
            placeholder="Short summary"
          />
        </Field>
        <Field label="Preferred date">
          <TextInput
            type="date"
            value={form.preferredDate}
            onChange={(e) => set({ preferredDate: e.target.value })}
          />
        </Field>
        <Field label="Notes" span2>
          <TextArea
            rows={4}
            value={form.notes}
            onChange={(e) => {
              set({ notes: e.target.value });
              setError('');
            }}
            placeholder="Missed pickup, damage, delivery details…"
          />
        </Field>
      </FieldSection>
    </FormDrawer>
  );
}

export default function CustomerHome({ view }) {
  const { state, toast } = useStore();
  const user = state.currentUser;
  const accountId = user?.accountIds?.[0];
  const accountsQuery = useAccounts();
  const locationsQuery = useRecords('locations');
  const workOrdersQuery = useRecords('workOrders');
  const notificationsQuery = useNotifications();
  const [requestOpen, setRequestOpen] = useState(false);
  const account = (accountsQuery.data || []).find((candidate) => candidate.id === accountId);
  const allLocations = locationsQuery.data?.data || [];
  const allWorkOrders = workOrdersQuery.data?.data || [];
  const workOrders = allWorkOrders.filter(
    (workOrder) =>
      workOrder.customerId === user?.customerId &&
      workOrder.accountId === account?.id
  );
  const locations = useMemo(
    () =>
      resolveCustomerLocations({
        customerId: user?.customerId,
        customerName: user?.name,
        accountId: account?.id,
        locations: allLocations,
        workOrders: allWorkOrders,
      }),
    [user?.customerId, user?.name, account?.id, allLocations, allWorkOrders]
  );
  const openRequests = workOrders.filter(
    (workOrder) => !['Closed', 'Complete'].includes(workOrder.status)
  );
  const customerNotifications = (notificationsQuery.data || []).filter((notification) => {
    if (notification.customerId) return notification.customerId === user?.customerId;
    return notification.accountId && user?.accountIds?.includes(notification.accountId);
  });
  const locationsLoading =
    locationsQuery.isLoading || workOrdersQuery.isLoading || accountsQuery.isLoading;
  const locationsError = locationsQuery.isError
    ? getErrorMessage(locationsQuery.error)
    : workOrdersQuery.isError
      ? getErrorMessage(workOrdersQuery.error)
      : null;

  if (view === 'home') {
    return (
      <Page wide>
        <PageHeader
          overline="Home"
          title="My Service"
          description="Your locations and collection routes at a glance."
        />
        <StatStrip
          compact
          items={[
            { label: 'Service locations', value: locations.length, hint: 'Linked to your account' },
            { label: 'Open requests', value: openRequests.length, hint: `${workOrders.length} total requests` },
            { label: 'Messages', value: customerNotifications.length, hint: 'Collection and service updates' },
            { label: 'Account status', value: account?.inactive ? 'Inactive' : 'Active', hint: account?.name || 'Service provider' },
          ]}
        />
        <LocationsContent
          locations={locations}
          loading={locationsLoading}
          error={locationsError}
          onRetry={() => {
            locationsQuery.refetch?.();
            workOrdersQuery.refetch?.();
          }}
        />
      </Page>
    );
  }

  if (view === 'myWorkOrders') {
    return (
      <Shell
        overline="Resident"
        title="My Work Orders"
        subtitle="Service requests for your locations."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              if (!user?.customerId || !account?.id) {
                toast?.('A customer account is required to submit a service request', 'error');
                return;
              }
              setRequestOpen(true);
            }}
          >
            <Icon name="plus" size={16} /> Request service
          </Button>
        }
      >
        <AsyncState
          loading={workOrdersQuery.isLoading}
          error={workOrdersQuery.isError ? getErrorMessage(workOrdersQuery.error) : null}
          onRetry={() => workOrdersQuery.refetch()}
        >
          <Panel>
            <Table columns={['Work Order #', 'Request Type', 'Status', 'Location', 'Due Date']}>
              {workOrders.map((wo) => (
                <tr key={wo.number} className="interactive hover:bg-elevated/70">
                  <td className="mono px-4 py-3 font-medium text-ink">{wo.number}</td>
                  <td className="px-4 py-3 text-ink-muted">{wo.requestType}</td>
                  <td className="px-4 py-3">
                    <Badge color="cyan">{wo.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{wo.location || '—'}</td>
                  <td className="mono px-4 py-3 text-ink-muted">{wo.dueDate}</td>
                </tr>
              ))}
              {!workOrders.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-muted">
                    You have no service requests.
                  </td>
                </tr>
              )}
            </Table>
          </Panel>
        </AsyncState>
        {requestOpen && (
          <ServiceRequestDrawer
            account={account}
            user={user}
            locations={locations}
            onClose={() => setRequestOpen(false)}
            onSubmitted={() => {
              setRequestOpen(false);
              workOrdersQuery.refetch?.();
            }}
          />
        )}
      </Shell>
    );
  }

  if (view === 'myNotifications') {
    return (
      <Shell overline="Resident" title="Notifications" subtitle="Service messages sent to you.">
        <AsyncState
          loading={notificationsQuery.isLoading}
          error={notificationsQuery.isError ? getErrorMessage(notificationsQuery.error) : null}
          onRetry={() => notificationsQuery.refetch()}
        >
          <Panel>
            <ul className="divide-y divide-line">
              {customerNotifications.map((notification, index) => (
                <li key={notification.id} className="flex items-start gap-4 px-5 py-4">
                  <span className="mono text-xs text-ink-faint">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Icon name="bell" size={15} className="mt-0.5 shrink-0 text-ink-faint" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink">{notification.title}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {notification.detail}
                    </div>
                    {notification.createdAt && (
                      <div className="mt-1 text-xs text-ink-faint">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              {!customerNotifications.length && (
                <li className="px-5 py-10 text-center text-sm text-ink-muted">
                  You have no service messages.
                </li>
              )}
            </ul>
          </Panel>
        </AsyncState>
      </Shell>
    );
  }

  if (view === 'myAccount') {
    return (
      <Shell overline="Resident" title="My Account" subtitle="Your portal profile and service provider.">
        <Panel padded>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="type-overline">Name</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{user?.name}</dd>
            </div>
            <div>
              <dt className="type-overline">Email</dt>
              <dd className="mt-1 text-sm text-ink-muted">{user?.email}</dd>
            </div>
            <div>
              <dt className="type-overline">Service provider</dt>
              <dd className="mt-1 text-sm text-ink-muted">{account?.name || '—'}</dd>
            </div>
            <div>
              <dt className="type-overline">Customer ID</dt>
              <dd className="mono mt-1 text-sm text-ink-muted">{user?.customerId || '—'}</dd>
            </div>
          </dl>
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell overline="Resident" title="My Locations" subtitle="Service addresses on your account.">
      <LocationsContent
        locations={locations}
        loading={locationsLoading}
        error={locationsError}
        onRetry={() => {
          locationsQuery.refetch?.();
          workOrdersQuery.refetch?.();
        }}
      />
    </Shell>
  );
}

function LocationsContent({ locations, loading, error, onRetry }) {
  return (
    <AsyncState loading={loading} error={error} onRetry={onRetry}>
      <Panel>
        <Table columns={['Address', 'Zone', 'Validated', 'Routes']}>
          {locations.map((location) => (
            <tr key={location.id || location.number || location.name} className="interactive hover:bg-elevated/70">
              <td className="px-4 py-3 font-medium text-ink">
                {locationLabel(location) || location.name || '—'}
                {location.type ? (
                  <div className="mt-0.5 text-xs text-ink-faint">{location.type}</div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-ink-muted">{location.zone || '—'}</td>
              <td className="px-4 py-3">
                <Badge color={location.isValidated ? 'green' : 'slate'}>
                  {location.isValidated ? 'Validated' : 'Unvalidated'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {locationRoutesSummary(location) || '—'}
              </td>
            </tr>
          ))}
          {!locations.length && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-muted">
                No locations are linked to your account yet.
              </td>
            </tr>
          )}
        </Table>
      </Panel>
    </AsyncState>
  );
}

function Shell({ overline, title, subtitle, actions, children }) {
  return (
    <Page>
      <PageHeader overline={overline} title={title} description={subtitle} actions={actions} />
      {children}
    </Page>
  );
}
