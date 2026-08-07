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
import { useCreateRecord, useRecords, useRoutes } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';
import { PICKLISTS } from '../data/picklists.js';
import HomeAssistant from '../components/HomeAssistant.jsx';

function emptyRequestForm(account, routes) {
  const billing = account?.billing?.street || '';
  const firstRoute = routes[0];
  const routeLabel = firstRoute?.routeNumber
    ? `${firstRoute.routeNumber}${firstRoute.collectionType ? ` · ${firstRoute.collectionType}` : ''}`
    : '';
  return {
    requestType: PICKLISTS.requestType[0] || '',
    location: billing || routeLabel || '',
    subject: '',
    notes: '',
    preferredDate: '',
  };
}

function ServiceRequestDrawer({ account, user, routes, onClose, onSubmitted }) {
  const { toast } = useStore();
  const createMutation = useCreateRecord('workOrders');
  const [form, setForm] = useState(() => emptyRequestForm(account, routes));
  const [error, setError] = useState('');
  const baseline = useMemo(() => emptyRequestForm(account, routes), [account, routes]);

  const locationOptions = useMemo(() => {
    const opts = [];
    if (account?.billing?.street) opts.push(account.billing.street);
    routes.forEach((route) => {
      const label = route.routeNumber
        ? `${route.routeNumber}${route.collectionType ? ` · ${route.collectionType}` : ''}`
        : route.id;
      if (label && !opts.includes(label)) opts.push(label);
    });
    return opts;
  }, [account, routes]);

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
            options={PICKLISTS.requestType}
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
  const routesQuery = useRoutes(accountId);
  const workOrdersQuery = useRecords('workOrders');
  const [requestOpen, setRequestOpen] = useState(false);
  const account = (accountsQuery.data || []).find((candidate) => candidate.id === accountId);
  const routes = routesQuery.data || [];
  const workOrders = (workOrdersQuery.data?.data || []).filter(
    (workOrder) =>
      workOrder.customerId === user?.customerId &&
      workOrder.accountId === account?.id
  );
  const openRequests = workOrders.filter(
    (workOrder) => !['Closed', 'Complete'].includes(workOrder.status)
  );

  if (view === 'home') {
    return (
      <Page wide>
        <PageHeader
          overline="Resident"
          title="My Service"
          description="Your locations and collection routes at a glance."
        />
        <StatStrip
          compact
          items={[
            { label: 'Service locations', value: routes.length, hint: 'Linked to your account' },
            { label: 'Open requests', value: openRequests.length, hint: `${workOrders.length} total requests` },
            { label: 'Recent messages', value: 3, hint: 'Collection and service updates' },
            { label: 'Account status', value: account?.inactive ? 'Inactive' : 'Active', hint: account?.name || 'Service provider' },
          ]}
        />
        <div className="mt-4">
          <HomeAssistant />
        </div>
        <LocationsContent
          routes={routes}
          loading={routesQuery.isLoading || accountsQuery.isLoading}
          error={routesQuery.isError ? getErrorMessage(routesQuery.error) : null}
          onRetry={() => routesQuery.refetch()}
        />
      </Page>
    );
  }

  if (view === 'myWorkOrders') {
    return (
      <Shell overline="Resident" title="My Work Orders" subtitle="Service requests for your locations.">
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
                    <Badge color={wo.status === 'Closed' ? 'green' : 'cyan'}>{wo.status}</Badge>
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
            <div className="border-t border-line p-4">
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
                <Icon name="plus" size={15} /> Request service
              </Button>
            </div>
          </Panel>
        </AsyncState>
        {requestOpen && (
          <ServiceRequestDrawer
            account={account}
            user={user}
            routes={routes}
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
      <Shell overline="Resident" title="My Notifications" subtitle="Service messages sent to you.">
        <Panel>
          <ul className="divide-y divide-line">
            {[
              { t: 'Your recycling cart will be collected tomorrow.', c: 'SMS', d: 'Jun 30, 9:00 AM', n: '01' },
              { t: 'Delivery scheduled: 96 Gallon Trash cart.', c: 'Email', d: 'Jun 28, 8:00 AM', n: '02' },
              { t: 'Missed pickup reported — resolved same day.', c: 'SMS', d: 'Jun 20, 3:12 PM', n: '03' },
            ].map((m) => (
              <li key={m.n} className="flex items-start gap-4 px-5 py-4">
                <span className="mono text-xs text-ink-faint">{m.n}</span>
                <Icon name="bell" size={15} className="mt-0.5 shrink-0 text-ink-faint" />
                <div className="flex-1">
                  <div className="text-sm text-ink">{m.t}</div>
                  <div className="mt-0.5 text-xs text-ink-muted">
                    {m.c} · {m.d}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
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
        routes={routes}
        loading={routesQuery.isLoading || accountsQuery.isLoading}
        error={routesQuery.isError ? getErrorMessage(routesQuery.error) : null}
        onRetry={() => routesQuery.refetch()}
      />
    </Shell>
  );
}

function LocationsContent({ routes, loading, error, onRetry }) {
  return (
    <AsyncState loading={loading} error={error} onRetry={onRetry}>
      <Panel>
        <Table columns={['Route', 'Status', 'Collection', 'Truck', 'Driver']}>
          {routes.map((route) => (
            <tr key={route.id} className="interactive hover:bg-elevated/70">
              <td className="mono px-4 py-3 font-medium text-ink">{route.routeNumber}</td>
              <td className="px-4 py-3">
                <Badge color="cyan">{route.status}</Badge>
              </td>
              <td className="px-4 py-3 text-ink-muted">{route.collectionType || '—'}</td>
              <td className="mono px-4 py-3 text-ink-muted">{route.truck || '—'}</td>
              <td className="px-4 py-3 text-ink-muted">{route.driver || '—'}</td>
            </tr>
          ))}
          {!routes.length && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-muted">
                No locations or routes are linked to your account yet.
              </td>
            </tr>
          )}
        </Table>
      </Panel>
    </AsyncState>
  );
}

function Shell({ overline, title, subtitle, children }) {
  return (
    <Page>
      <PageHeader overline={overline} title={title} description={subtitle} />
      {children}
    </Page>
  );
}
