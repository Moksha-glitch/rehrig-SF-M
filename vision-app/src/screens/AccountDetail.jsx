import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  AccountBadges,
  BoolCell,
  Dash,
  StatusDot,
  Table,
  Page,
  Panel,
  Button,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccount } from '../hooks/useAccounts.js';
import { useNotificationConfig } from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'customers', label: 'Customers' },
  { key: 'products', label: 'Service Provider Products' },
  { key: 'segments', label: 'Segments' },
  { key: 'routes', label: 'Routes' },
  { key: 'notifications', label: 'Notifications' },
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
  return (
    <Panel>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 interactive hover:bg-elevated/50"
      >
        <span className="font-display text-title-sm text-ink">{title}</span>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} className="text-ink-faint" />
      </button>
      {open && <div className="border-t border-line px-5 py-2">{children}</div>}
    </Panel>
  );
}

function val(v) {
  if (v === true || v === false) return <BoolCell value={v} />;
  if (v === '' || v === null || v === undefined) return <Dash />;
  return v;
}

const SEG_BADGE = { Top: 'sky', 'Market Area': 'cyan', District: 'green', Division: 'amber' };

export default function AccountDetail({ accountId, tab }) {
  const { state, navigate, canTab, toast } = useStore();
  const [followed, setFollowed] = useState(false);
  const detailQuery = useAccount(accountId);
  const account = detailQuery.data?.data;
  if (detailQuery.isLoading) {
    return (
      <Page>
        <Panel padded>
          <p className="text-sm text-ink-muted" role="status">
            Loading account…
          </p>
        </Panel>
      </Page>
    );
  }
  if (detailQuery.isError || !account) {
    return <Page><Panel padded><p className="type-overline">Service provider</p><h1 className="mt-2 font-display text-title-lg text-ink">Account not found</h1><p className="mt-2 text-sm text-ink-muted">{detailQuery.isError ? getErrorMessage(detailQuery.error) : 'This account may have been removed or is outside your access scope.'}</p><Button className="mt-5" variant="primary" onClick={() => navigate('accounts')}>Back to service providers</Button></Panel></Page>;
  }
  const contacts = detailQuery.data?.contacts || [];
  const segments = detailQuery.data?.segments || [];
  const routes = detailQuery.data?.routes || [];
  const products = detailQuery.data?.products || [];
  const customers = detailQuery.data?.customers || [];
  const visibleTabs = TABS.filter((t) => canTab(t.key));
  const activeTab = visibleTabs.some((t) => t.key === tab) ? tab : visibleTabs[0]?.key || 'details';

  const setTab = (t) => {
    if (!canTab(t)) return;
    navigate(state.nav.module === 'account' ? 'account' : 'accountDetail', {
      accountId: account.id,
      tab: t,
    });
  };

  return (
    <Page>
      <header className="mb-8 animate-fade-up sm:mb-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0 max-w-2xl">
            <p className="type-overline mb-2.5">Service Provider</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-display-md text-ink sm:text-[2.15rem]">{account.name}</h1>
              <AccountBadges account={account} />
              {account.inactive && <StatusDot color="slate" label="Inactive" />}
            </div>
            <p className="mt-2.5 text-sm text-ink-muted">
              {account.industry} · <span className="font-medium text-brand">{account.owner}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => { setFollowed((v) => !v); toast?.(followed ? 'Account unfollowed' : 'Account followed'); }}>
              <Icon name="bookmark" size={15} /> {followed ? 'Following' : 'Follow'}
            </Button>
            <Button variant="secondary" onClick={() => setTab('contacts')}>
              <Icon name="users" size={15} /> Contacts
            </Button>
            <Button variant="primary" onClick={() => setTab('routes')}>
              View routes <Icon name="chevronRight" size={14} />
            </Button>
          </div>
        </div>
        <div className="hairline-rule mt-7 animate-rule-draw" />
      </header>

      <div role="tablist" aria-label="Account sections" className="mb-6 flex gap-0 overflow-x-auto border-b border-line bg-surface/60 scroll-thin">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
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
      {activeTab === 'contacts' && <ContactsTab contacts={contacts} />}
      {activeTab === 'customers' && <CustomersTab account={account} customers={customers} />}
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
          onNav={setTab}
        />
      )}
    </Page>
  );
}

function DetailsTab({ account }) {
  const n = account.notif;
  return (
    <div className="space-y-4">
      <Section title="Account Information">
        <Row label="Account Name">{account.name}</Row>
        <Row label="Account Owner">{account.ownerName}</Row>
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
        <Row label="Service Types">{account.serviceTypes.join(', ')}</Row>
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
            const a = account[k];
            return (
              <div key={k}>
                <div className="type-overline mb-2">
                  {k === 'billing' ? 'Billing Address' : 'Shipping Address'}
                </div>
                <div className="text-sm leading-relaxed text-brand">
                  {a.street}
                  <br />
                  {a.city}
                  {a.state ? `, ${a.state}` : ''} {a.zip}
                  <br />
                  {a.country}
                </div>
                <div
                  className="mt-3 flex h-24 items-center justify-center border border-line bg-[linear-gradient(to_right,#e6ebe8_1px,transparent_1px),linear-gradient(to_bottom,#e6ebe8_1px,transparent_1px)]"
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
        <Row label="Created By">{account.createdBy}</Row>
        <Row label="Last Modified By">{account.lastModifiedBy}</Row>
      </Section>
    </div>
  );
}

function ContactsTab({ contacts }) {
  return (
    <Panel>
      <Table columns={['Name', 'Title', 'Email', 'Role', 'Segment', 'Portal Access']}>
        {contacts.map((c) => (
          <tr key={c.id} className="interactive hover:bg-elevated/70">
            <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
            <td className="px-4 py-3 text-ink-muted">{c.title}</td>
            <td className="px-4 py-3 text-ink-muted">{c.email}</td>
            <td className="px-4 py-3 text-ink-muted">{c.roleTitle}</td>
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
        {contacts.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-faint">
              No contacts yet.
            </td>
          </tr>
        )}
      </Table>
    </Panel>
  );
}

function CustomersTab({ account, customers }) {
  return (
    <Panel>
      <Table columns={['Customer #', 'Name', 'Email', 'Segment', 'Owner']}>
        {customers.length ? customers.map((customer) => (
          <tr key={customer.id} className="interactive hover:bg-elevated/70">
            <td className="mono px-4 py-3 text-ink-muted">{customer.customerId || '—'}</td>
            <td className="px-4 py-3 font-medium text-ink">{customer.name}</td>
            <td className="px-4 py-3 text-ink-muted">{customer.email}</td>
            <td className="px-4 py-3 text-ink-muted">{account.name} Top</td>
            <td className="px-4 py-3 text-ink-muted">{account.ownerName}</td>
          </tr>
        )) : (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-faint">
              No customers yet.
            </td>
          </tr>
        )}
      </Table>
    </Panel>
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
          </tr>
        ))}
        {products.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-faint">
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
  const render = (parentKey, depth) =>
    (byParent[parentKey] || []).map((s) => (
      <div key={s.id}>
        <div
          className="flex items-center gap-2 py-2 interactive hover:bg-elevated/60"
          style={{ paddingLeft: depth * 24 + 16 }}
        >
          <Icon name="chevronRight" size={13} className="text-ink-faint" />
          <span className="text-sm font-medium text-ink">{s.name}</span>
          <Badge color={SEG_BADGE[s.type]}>{s.type}</Badge>
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
              <Badge color="cyan">{r.status}</Badge>
            </td>
            <td className="px-4 py-3 text-ink-muted">{r.collectionType}</td>
          </tr>
        ))}
        {routes.length === 0 && (
          <tr>
            <td colSpan={10} className="px-4 py-8 text-center text-sm text-ink-faint">
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

function MindMap({ account, contacts, segments, products, onNav }) {
  const Node = ({ children, onClick, emphasis }) => (
    <button
      onClick={onClick}
      className={`w-full rounded-panel border px-3 py-2.5 text-left text-sm interactive ${
        emphasis
          ? 'border-ink bg-ink text-white'
          : 'border-line bg-surface text-ink hover:border-line-strong hover:bg-elevated'
      }`}
    >
      {children}
    </button>
  );
  return (
    <Panel padded>
      <p className="type-overline mb-6 text-center">Relationship map</p>
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-panel border border-line bg-elevated px-4 py-2 text-sm font-semibold text-ink">
          Rehrig Pacific
        </div>
        <div className="h-6 w-px bg-line" />
        <Node emphasis>
          {account.name} <span className="mono text-xs opacity-70">({account.uid})</span>
        </Node>
        <div className="h-6 w-px bg-line" />
        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Node onClick={() => onNav('products')}>
              Products <span className="font-semibold">({products.length})</span>
            </Node>
          </div>
          <div className="space-y-2">
            <Node onClick={() => onNav('contacts')}>
              Contacts <span className="font-semibold">({contacts.length})</span>
            </Node>
            {contacts.slice(0, 3).map((c) => (
              <div key={c.id} className="border-b border-line px-1 py-2 text-xs text-ink-muted">
                {c.name}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Node onClick={() => onNav('segments')}>
              Segments <span className="font-semibold">({segments.length})</span>
            </Node>
            {segments.map((s) => (
              <div key={s.id} className="border-b border-line px-1 py-2 text-xs text-ink-muted">
                {s.name} · {s.type}
              </div>
            ))}
            <div className="px-1 py-2 text-xs text-ink-faint">Residents ({account.residents})</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
