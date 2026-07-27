import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts, useProducts, useSegments } from '../hooks/useAccounts.js';
import { useContacts, useRecords, useRoutes } from '../hooks/useRecords.js';
import { useNotificationConfig } from '../hooks/useConfig.js';

const NAV = {
  rehrig: [
    { type: 'item', key: 'home', module: 'home', label: 'Home', icon: 'grid' },
    {
      type: 'section',
      label: 'Service Providers',
      defaultOpen: true,
      children: [
        { key: 'accounts', module: 'accounts', label: 'All Providers', icon: 'building' },
        { key: 'contacts', module: 'contacts', label: 'Contacts', icon: 'user' },
        { key: 'contractOnboarding', module: 'contractOnboarding', label: 'Contract Onboarding', icon: 'clipboard' },
      ],
    },
    {
      type: 'section',
      label: 'Configure',
      defaultOpen: false,
      children: [
        { key: 'serviceTypes', module: 'serviceTypes', label: 'Service Types' },
        { key: 'locationTypes', module: 'locationTypes', label: 'Location Types' },
        { key: 'assetTypes', module: 'assetTypes', label: 'Asset Types' },
        { key: 'productTypes', module: 'productTypes', label: 'Product Types' },
        { key: 'apiIntegrations', module: 'apiIntegrations', label: 'API Integrations' },
        { key: 'notificationConfig', module: 'notificationConfig', label: 'Notification Config' },
        { key: 'setup', module: 'setup', label: 'Setup' },
      ],
    },
  ],
  sp: [
    { type: 'item', key: 'home', module: 'home', label: 'Home', icon: 'grid' },
    { type: 'item', key: 'details', module: 'account', params: { tab: 'details' }, label: 'Details', icon: 'building' },
    { type: 'item', key: 'mindmap', module: 'account', params: { tab: 'mindmap' }, label: 'Mindmap', icon: 'network' },
    {
      type: 'section',
      label: 'Related',
      defaultOpen: true,
      children: [
        { key: 'r-products', module: 'account', params: { tab: 'products' }, label: 'Service Provider Products', icon: 'users' },
        { key: 'r-contacts', module: 'account', params: { tab: 'contacts' }, label: 'Contacts', icon: 'user' },
        { key: 'r-assets', module: 'assets', label: 'Assets', icon: 'box' },
        { key: 'r-mrp', module: 'maintenanceRouteProfiles', label: 'Maintenance Route Profiles', icon: 'wrench' },
        { key: 'r-locations', module: 'locations', label: 'Locations', icon: 'mapPin' },
        { key: 'r-customers', module: 'account', params: { tab: 'customers' }, label: 'Customers', icon: 'user' },
        { key: 'r-dispatches', module: 'dispatches', label: 'Dispatches', icon: 'send' },
        { key: 'r-notes', module: 'notesAttachments', label: 'Notes & Attachments', icon: 'paperclip' },
        { key: 'r-workOrders', module: 'workOrders', label: 'Work Orders', icon: 'clipboard' },
        { key: 'r-requestTypes', module: 'requestTypeResolutions', label: 'Request Type/Resolutions', icon: 'layers' },
        { key: 'r-segments', module: 'account', params: { tab: 'segments' }, label: 'Service Provider Segments', icon: 'layers' },
        { key: 'r-aggTips', module: 'aggregatedTips', label: 'Aggregated Truck and Tips', icon: 'barChart' },
        { key: 'r-trucks', module: 'trucks', label: 'Trucks', icon: 'truck' },
        { key: 'r-indTips', module: 'individualTips', label: 'Individual Tip / Non-Tip', icon: 'layers' },
        { key: 'r-routes', module: 'account', params: { tab: 'routes' }, label: 'Routes', icon: 'route' },
        { key: 'r-notif', module: 'account', params: { tab: 'notifications' }, label: 'Service Notifications', icon: 'bell' },
      ],
    },
    {
      type: 'section',
      label: 'Tools',
      defaultOpen: true,
      children: [
        { key: 'mapCenter', module: 'mapCenter', label: 'Map Center', icon: 'map' },
        { key: 'bulkImport', module: 'bulkImport', label: 'Bulk Import', icon: 'download' },
      ],
    },
    {
      type: 'section',
      label: 'Analytics',
      defaultOpen: false,
      children: [
        { key: 'reports', module: 'analytics', params: { view: 'reports' }, label: 'Reports', icon: 'clipboard' },
        { key: 'dashboards', module: 'analytics', params: { view: 'dashboards' }, label: 'Dashboards', icon: 'barChart' },
      ],
    },
  ],
  customer: [
    { type: 'item', key: 'myLocations', module: 'myLocations', label: 'My Locations', icon: 'mapPin' },
    { type: 'item', key: 'myWorkOrders', module: 'myWorkOrders', label: 'My Work Orders', icon: 'clipboard' },
    { type: 'item', key: 'myNotifications', module: 'myNotifications', label: 'My Notifications', icon: 'bell' },
    { type: 'item', key: 'myAccount', module: 'myAccount', label: 'My Account', icon: 'users' },
  ],
};

function initials(name) {
  const parts = name.split(' ');
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

function NavButton({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`nav-item flex w-full items-center gap-2.5 px-3 py-2 pl-3.5 text-sm ${
        active ? 'nav-item-active' : 'text-ink-muted hover:bg-elevated hover:text-ink'
      }`}
    >
      {item.icon && (
        <Icon
          name={item.icon}
          size={15}
          className={`shrink-0 ${active ? 'text-ink' : 'text-ink-faint'}`}
        />
      )}
      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
      {item.count != null && (
        <span className="mono shrink-0 text-[11px] tabular-nums text-ink-faint">{item.count}</span>
      )}
    </button>
  );
}

function filterTree(tree, canNav) {
  return tree
    .map((n) => {
      if (n.type === 'item') return canNav(n.key) ? n : null;
      const children = (n.children || []).filter((c) => canNav(c.key));
      if (!children.length) return null;
      return { ...n, children };
    })
    .filter(Boolean);
}

export default function Sidebar({ collapsed, mobileOpen = false, onClose = () => {} }) {
  const { state, persona, navigate, logout, canNav, isScoped } = useStore();
  const user = state.currentUser;
  const accountsQuery = useAccounts();
  const contactsQuery = useContacts();
  const segmentsQuery = useSegments();
  const routesQuery = useRoutes();
  const productsQuery = useProducts();
  const notifConfigQuery = useNotificationConfig();
  const assetsQuery = useRecords(persona === 'sp' ? 'assets' : null);
  const mrpQuery = useRecords(persona === 'sp' ? 'maintenanceRouteProfiles' : null);
  const locationsQuery = useRecords(persona === 'sp' ? 'locations' : null);
  const dispatchesQuery = useRecords(persona === 'sp' ? 'dispatches' : null);
  const notesQuery = useRecords(persona === 'sp' ? 'notesAttachments' : null);
  const workOrdersQuery = useRecords(persona === 'sp' ? 'workOrders' : null);
  const requestTypesQuery = useRecords(persona === 'sp' ? 'requestTypeResolutions' : null);
  const aggTipsQuery = useRecords(persona === 'sp' ? 'aggregatedTips' : null);
  const trucksQuery = useRecords(persona === 'sp' ? 'trucks' : null);
  const indTipsQuery = useRecords(persona === 'sp' ? 'individualTips' : null);
  const baseTree = NAV[persona] || [];
  const tree = useMemo(() => filterTree(baseTree, canNav), [baseTree, canNav]);
  const activeModule = state.nav.module;
  const activeTab = state.nav.params?.tab;

  const [open, setOpen] = useState({});

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, onClose]);

  const openState = useMemo(() => {
    const init = { ...open };
    tree.forEach((n, i) => {
      if (n.type === 'section' && init[i] === undefined) {
        init[i] = n.defaultOpen !== false;
      }
    });
    return init;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, user?.id]);

  const accounts = accountsQuery.data || [];
  const scopedAccount =
    persona !== 'rehrig'
      ? accounts.find((a) => user?.accountIds?.includes(a.id)) ||
        (persona === 'sp' && isScoped ? null : persona === 'sp' ? accounts[0] : null)
      : null;

  const navCounts = useMemo(() => {
    if (persona !== 'sp') return {};
    return {
      'r-products': (productsQuery.data || []).length,
      'r-contacts': (contactsQuery.data || []).length,
      'r-assets': (assetsQuery.data?.data || []).length,
      'r-mrp': (mrpQuery.data?.data || []).length,
      'r-locations': (locationsQuery.data?.data || []).length,
      'r-customers': 0,
      'r-dispatches': (dispatchesQuery.data?.data || []).length,
      'r-notes': (notesQuery.data?.data || []).length,
      'r-workOrders': (workOrdersQuery.data?.data || []).length,
      'r-requestTypes': (requestTypesQuery.data?.data || []).length,
      'r-segments': (segmentsQuery.data || []).length,
      'r-aggTips': (aggTipsQuery.data?.data || []).length,
      'r-trucks': (trucksQuery.data?.data || []).length,
      'r-indTips': (indTipsQuery.data?.data || []).length,
      'r-routes': (routesQuery.data || []).length,
      'r-notif': (notifConfigQuery.data || []).filter((rule) => rule.enabled).length,
    };
  }, [
    persona,
    productsQuery.data,
    contactsQuery.data,
    assetsQuery.data,
    mrpQuery.data,
    locationsQuery.data,
    dispatchesQuery.data,
    notesQuery.data,
    workOrdersQuery.data,
    requestTypesQuery.data,
    segmentsQuery.data,
    aggTipsQuery.data,
    trucksQuery.data,
    indTipsQuery.data,
    routesQuery.data,
    notifConfigQuery.data,
  ]);

  const isItemActive = (n) => {
    if (n.module !== activeModule) return false;
    if (n.params?.tab) return n.params.tab === activeTab;
    if (activeModule === 'home') return n.key === 'home';
    return !n.params?.tab;
  };

  if (collapsed && !mobileOpen) return null;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/45 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-full w-[16rem] flex-col border-r border-line bg-surface/95 shadow-float backdrop-blur-sm transition-transform duration-soft ease-out md:static md:z-auto md:shadow-none ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center border-b border-line px-5">
        <button
          type="button"
          onClick={() => {
            navigate(persona === 'customer' ? 'myLocations' : 'home');
            onClose();
          }}
          className="group flex items-baseline gap-2 interactive"
          aria-label="Vision home"
        >
          <span className="font-display text-[1.4rem] font-semibold tracking-tight text-ink">
            vision
          </span>
          <span className="rounded-control border border-line bg-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint group-hover:text-ink-muted">
            ops
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="ml-auto rounded-control p-1.5 text-ink-muted md:hidden"
        >
          <Icon name="x" size={17} />
        </button>
      </div>

      {scopedAccount && (
        <div className="mx-3 mt-3 rounded-panel border border-line bg-elevated/70 px-3.5 py-3">
          <div className="type-overline">Service Provider</div>
          <div className="mt-1 truncate text-sm font-semibold text-ink">{scopedAccount.name}</div>
          {isScoped && (
            <div className="mt-1 text-[11px] text-ink-muted">{user?.scopeLabel}</div>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3 scroll-thin">
        {tree.map((n, i) => {
          if (n.type === 'item') {
            return (
              <NavButton
                key={n.key}
                item={n}
                active={isItemActive(n)}
                onClick={() => {
                  navigate(n.module, n.params);
                  onClose();
                }}
              />
            );
          }
          const isOpen = openState[i];
          return (
            <div key={n.label} className="pt-3">
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...openState, ...o, [i]: !isOpen }))}
                aria-expanded={isOpen}
                className="mb-1 flex w-full items-center justify-between px-3 py-1 type-overline interactive hover:text-ink-muted"
              >
                <span>{n.label}</span>
                <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={12} />
              </button>
              {isOpen && (
                <div className="space-y-0.5">
                  {n.children.map((c) => (
                    <NavButton
                      key={c.key}
                      item={
                        navCounts[c.key] != null ? { ...c, count: navCounts[c.key] } : c
                      }
                      active={isItemActive(c)}
                      onClick={() => {
                        navigate(c.module, c.params);
                        onClose();
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-panel border border-line bg-elevated/50 p-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-control bg-ink text-[11px] font-semibold text-white">
            {initials(user?.name || '')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{user?.name}</div>
            <div className="truncate text-xs text-ink-muted">{user?.role}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            aria-label="Sign out"
            className="rounded-control p-1.5 text-ink-faint interactive hover:bg-surface hover:text-ink"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
