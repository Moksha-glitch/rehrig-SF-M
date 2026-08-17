import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Page,
  PageHeader,
  Panel,
  Button,
  StatStrip,
  AsyncState,
  StatusDot,
  Drawer,
  DrawerActions,
  Checkbox,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useContacts, useRecords } from '../hooks/useRecords.js';
import { useDrafts } from '../hooks/useOnboarding.js';
import { getErrorMessage } from '../lib/errors.js';

const HOME_PREFS_KEY = 'vision.ui.customizeHome';

const KPI_CARDS = [
  { id: 'totalSps', label: 'Total SPs', defaultOn: true },
  { id: 'activeSps', label: 'Active SPs', defaultOn: true },
  { id: 'pendingOnboarding', label: 'Pending Onboarding', defaultOn: true },
  { id: 'contacts', label: 'Contacts', defaultOn: true },
  { id: 'paymentGated', label: 'Payment-gated SPs', defaultOn: false },
  { id: 'apiIntegrated', label: 'API-integrated SPs', defaultOn: false },
  { id: 'locations', label: 'Locations (all SPs)', defaultOn: false },
  { id: 'customers', label: 'Customers (all SPs)', defaultOn: false },
  { id: 'openWorkOrders', label: 'Open Work Orders (all SPs)', defaultOn: false },
  { id: 'hotTickets', label: 'Hot Tickets (all SPs)', defaultOn: false },
];

const HOME_PANELS = [
  { id: 'recent', label: 'Recently Added Service Providers', defaultOn: true },
  { id: 'actions', label: 'Quick Actions', defaultOn: true },
  { id: 'queue', label: 'Onboarding Queue', defaultOn: true },
  { id: 'notice', label: 'Rehrig Scope Notice', defaultOn: true },
  { id: 'health', label: 'Platform Health', defaultOn: false },
];

function defaultPrefs() {
  return {
    kpis: Object.fromEntries(KPI_CARDS.map((item) => [item.id, item.defaultOn])),
    panels: Object.fromEntries(HOME_PANELS.map((item) => [item.id, item.defaultOn])),
  };
}

function readPrefs() {
  try {
    const raw = window.localStorage.getItem(HOME_PREFS_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw);
    const defaults = defaultPrefs();
    return {
      kpis: { ...defaults.kpis, ...(parsed.kpis || {}) },
      panels: { ...defaults.panels, ...(parsed.panels || {}) },
    };
  } catch {
    return defaultPrefs();
  }
}

function writePrefs(prefs) {
  try {
    window.localStorage.setItem(HOME_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function CustomizeHomeDrawer({ open, prefs, onChange, onClose, onReset }) {
  const kpiCount = Object.values(prefs.kpis).filter(Boolean).length;
  const panelCount = Object.values(prefs.panels).filter(Boolean).length;

  return (
    <Drawer
      open={open}
      title="Customize Home"
      description={`${kpiCount} KPIs · ${panelCount} panels enabled`}
      onClose={onClose}
      footer={
        <DrawerActions className="justify-between">
          <Button variant="secondary" onClick={onReset}>
            <Icon name="refresh" size={14} /> Reset to defaults
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </DrawerActions>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 scroll-thin">
        <div className="mb-5 flex items-start gap-2 rounded-panel border border-brand/25 bg-brand-soft px-3 py-2.5">
          <Icon name="help" size={15} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-sm leading-relaxed text-ink-soft">
            Preferences are saved in this browser. Permission sets still override anything you enable
            here.
          </p>
        </div>

        <p className="type-overline mb-2">KPI cards</p>
        <div className="space-y-2">
          {KPI_CARDS.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-panel border border-line bg-elevated/50 px-3 py-2.5"
            >
              <Checkbox
                label={item.label}
                checked={!!prefs.kpis[item.id]}
                onChange={(event) =>
                  onChange({
                    ...prefs,
                    kpis: { ...prefs.kpis, [item.id]: event.target.checked },
                  })
                }
              />
              {item.defaultOn && (
                <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="type-overline mb-2 mt-6">Panels &amp; sections</p>
        <div className="space-y-2">
          {HOME_PANELS.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-panel border border-line bg-elevated/50 px-3 py-2.5"
            >
              <Checkbox
                label={item.label}
                checked={!!prefs.panels[item.id]}
                onChange={(event) =>
                  onChange({
                    ...prefs,
                    panels: { ...prefs.panels, [item.id]: event.target.checked },
                  })
                }
              />
              {item.defaultOn && (
                <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="type-overline mb-2 mt-6">Rehrig scope — permission notes</p>
        <div className="rounded-panel border border-line bg-elevated/50 px-3 py-3 text-sm text-ink-muted">
          As a Rehrig platform admin, you can:
          <ul className="mt-1 list-disc pl-5">
            <li>See counts and rosters across all Service Providers</li>
          </ul>
        </div>
      </div>
    </Drawer>
  );
}

export default function RegistryHome({ onOnboard }) {
  const { navigate } = useStore();
  const accountsQuery = useAccounts();
  const contactsQuery = useContacts();
  const workOrdersQuery = useRecords('workOrders');
  const draftsQuery = useDrafts();
  const accounts = accountsQuery.data || [];
  const workOrders = workOrdersQuery.data?.data || [];
  const drafts = draftsQuery.data || [];
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    writePrefs(prefs);
  }, [prefs]);

  const metrics = useMemo(() => {
    const active = accounts.filter((a) => !a.inactive).length;
    const contactsCount = (contactsQuery.data || []).length;
    const locations = new Set(
      accounts
        .map((a) => [a.billing?.street, a.billing?.city, a.billing?.zip].filter(Boolean).join('|'))
        .filter(Boolean)
    ).size;
    const pendingOnboarding = accounts.filter((a) => a.onboardingComplete === false).length;
    const paymentGated = accounts.filter((a) => a.paymentRequired).length;
    const apiIntegrated = accounts.filter((a) => a.apiIntegrated).length;
    const openWorkOrders = workOrders.filter((row) => !['Closed', 'Complete'].includes(row.status));
    const hotTickets = openWorkOrders.filter(
      (row) => row.hotTicket || ['Critical', 'High'].includes(row.priority)
    );
    const customers = accounts.reduce((sum, account) => sum + (Number(account.residents) || 0), 0);
    const operationalProviders = accounts.filter(
      (a) => !a.inactive && a.onboardingComplete !== false && !a.paymentRequired
    ).length;
    const platformHealth = accounts.length
      ? Math.round((operationalProviders / accounts.length) * 100)
      : 0;
    return {
      active,
      contactsCount,
      locations,
      pendingOnboarding,
      paymentGated,
      apiIntegrated,
      openWorkOrders,
      hotTickets,
      customers,
      operationalProviders,
      platformHealth,
    };
  }, [accounts, contactsQuery.data, workOrders]);

  const latestDate = accounts.map((a) => a.addedDate).filter(Boolean).sort().at(-1);
  const recent = [...accounts]
    .sort((a, b) => (a.addedDate < b.addedDate ? 1 : -1))
    .slice(0, 5);

  const kpiItems = [
    { id: 'totalSps', label: 'Total SPs', value: accounts.length, hint: 'On the platform' },
    { id: 'activeSps', label: 'Active SPs', value: metrics.active, hint: 'Currently enrolled' },
    {
      id: 'pendingOnboarding',
      label: 'Pending Onboarding',
      value: metrics.pendingOnboarding,
      hint: 'Provider records incomplete',
    },
    { id: 'contacts', label: 'Contacts', value: metrics.contactsCount, hint: 'Across all accounts' },
    {
      id: 'paymentGated',
      label: 'Payment-gated SPs',
      value: metrics.paymentGated,
      hint: 'Payment required',
    },
    {
      id: 'apiIntegrated',
      label: 'API-integrated SPs',
      value: metrics.apiIntegrated,
      hint: 'Provider API enabled',
    },
    { id: 'locations', label: 'Locations (all SPs)', value: metrics.locations, hint: 'Platform footprint' },
    {
      id: 'customers',
      label: 'Customers (all SPs)',
      value: metrics.customers,
      hint: 'Resident records',
    },
    {
      id: 'openWorkOrders',
      label: 'Open Work Orders (all SPs)',
      value: metrics.openWorkOrders.length,
      hint: 'Awaiting completion',
    },
    {
      id: 'hotTickets',
      label: 'Hot Tickets (all SPs)',
      value: metrics.hotTickets.length,
      hint: 'Open high-priority records',
    },
  ].filter((item) => prefs.kpis[item.id]);

  const show = (panelId) => prefs.panels[panelId];

  return (
    <Page>
      <PageHeader
        overline="Home"
        title="Service Provider Registry"
        description={`${accounts.length} service providers · ${metrics.active} active · Registry data through ${latestDate ? new Date(`${latestDate}T12:00:00`).toLocaleDateString() : 'unknown'}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCustomizeOpen(true)}>
              <Icon name="sliders" size={16} /> Customize Home
            </Button>
            <Button variant="primary" onClick={() => onOnboard()}>
              <Icon name="plus" size={16} /> Onboard new Service Provider
            </Button>
          </>
        }
      />

      <CustomizeHomeDrawer
        open={customizeOpen}
        prefs={prefs}
        onChange={setPrefs}
        onClose={() => setCustomizeOpen(false)}
        onReset={() => setPrefs(defaultPrefs())}
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
        {kpiItems.length > 0 && <StatStrip compact items={kpiItems} />}

        {(show('health') || show('queue')) && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {show('health') && (
              <button
                type="button"
                onClick={() => navigate('accounts')}
                className="surface-panel surface-panel-hover p-4 text-left interactive"
              >
                <p className="type-overline">Platform Health</p>
                <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink">
                  {metrics.platformHealth}%
                </p>
                <p className="mt-1 text-[11px] text-ink-muted">
                  {metrics.operationalProviders}/{accounts.length} providers operational
                </p>
              </button>
            )}
            {show('queue') && (
              <button
                type="button"
                onClick={() => navigate('accounts')}
                className="surface-panel surface-panel-hover p-4 text-left interactive"
              >
                <p className="type-overline">Onboarding Queue</p>
                <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink">
                  {drafts.length}
                </p>
                <p className="mt-1 text-[11px] text-ink-muted">Saved onboarding drafts</p>
              </button>
            )}
          </div>
        )}

        {(show('recent') || show('actions') || show('notice')) && (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {show('recent') && (
              <Panel className={show('actions') || show('notice') ? 'lg:col-span-8' : 'lg:col-span-12'}>
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
            )}

            {(show('actions') || show('notice')) && (
              <Panel className={show('recent') ? 'lg:col-span-4' : 'lg:col-span-12'} padded>
                {show('actions') && (
                  <>
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
                  </>
                )}
                {show('notice') && (
                  <p className={`${show('actions') ? 'mt-5' : ''} text-xs leading-relaxed text-ink-muted`}>
                    As a Rehrig platform admin, you can see counts and rosters across all Service
                    Providers. Operational data belongs to each service provider.
                  </p>
                )}
              </Panel>
            )}
          </div>
        )}
      </AsyncState>
    </Page>
  );
}
