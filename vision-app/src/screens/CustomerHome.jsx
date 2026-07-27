import React from 'react';
import Icon from '../components/Icon.jsx';
import { Badge, Table, Page, PageHeader, Panel, Button, AsyncState } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useCreateRecord, useRecords, useRoutes } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';

export default function CustomerHome({ view }) {
  const { state, toast } = useStore();
  const user = state.currentUser;
  const accountId = user?.accountIds?.[0];
  const accountsQuery = useAccounts();
  const routesQuery = useRoutes(accountId);
  const workOrdersQuery = useRecords('workOrders');
  const createMutation = useCreateRecord('workOrders');
  const account = (accountsQuery.data || []).find((candidate) => candidate.id === accountId);
  const routes = routesQuery.data || [];
  const workOrders = (workOrdersQuery.data?.data || []).filter(
    (workOrder) =>
      workOrder.customerId === user?.customerId &&
      workOrder.accountId === account?.id
  );

  const createRequest = async () => {
    if (!user?.customerId || !account?.id) {
      toast?.('A customer account is required to submit a service request', 'error');
      return;
    }
    try {
      const createdAt = new Date().toISOString();
      await createMutation.mutateAsync({
        number: `WO-${Date.now().toString(36).toUpperCase()}`,
        customerId: user.customerId,
        accountId: account.id,
        account: account.name,
        requestType: 'Service request',
        status: 'Open',
        location: account.billing?.street || '',
        requestDate: createdAt.slice(0, 10),
        createdAt,
      });
      toast?.('Service request submitted');
    } catch (error) {
      toast?.(getErrorMessage(error, 'Could not submit service request.'), 'danger');
    }
  };

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
              <Button variant="primary" onClick={createRequest} disabled={createMutation.isPending}>
                <Icon name="plus" size={15} /> Request service
              </Button>
            </div>
          </Panel>
        </AsyncState>
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
      <AsyncState
        loading={routesQuery.isLoading || accountsQuery.isLoading}
        error={routesQuery.isError ? getErrorMessage(routesQuery.error) : null}
        onRetry={() => routesQuery.refetch()}
      >
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
    </Shell>
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
