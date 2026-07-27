import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useSearch } from '../hooks/useSearch.js';
import { useMarkNotifications, useNotifications } from '../hooks/useConfig.js';

const MODULE_LABELS = {
  home: 'Home',
  accounts: 'Service Providers',
  accountDetail: 'Service Provider',
  account: 'My Service Provider',
  contacts: 'Contacts',
  serviceTypes: 'Service Types',
  locationTypes: 'Location Types',
  assetTypes: 'Asset Types',
  productTypes: 'Product Types',
  apiIntegrations: 'API Integrations',
  notificationConfig: 'Notification Config',
  setup: 'Setup',
  workOrders: 'Work Orders',
  dispatches: 'Dispatches',
  assets: 'Assets',
  trucks: 'Trucks',
  locations: 'Locations',
  maintenanceRouteProfiles: 'Maintenance Route Profiles',
  notesAttachments: 'Notes & Attachments',
  requestTypeResolutions: 'Request Type / Resolutions',
  aggregatedTips: 'Aggregated Truck and Tips',
  individualTips: 'Individual Tip / Non-Tip',
  mapCenter: 'Map Center',
  bulkImport: 'Bulk Import',
  analytics: 'Analytics',
  myLocations: 'My Locations',
  myWorkOrders: 'My Work Orders',
  myNotifications: 'My Notifications',
  myAccount: 'My Account',
};

function initials(name) {
  const parts = (name || '').split(' ');
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

export default function TopBar({ onToggleSidebar }) {
  const { state, navigate, canAccessModule } = useStore();
  const notificationsQuery = useNotifications();
  const { markOne, markAll } = useMarkNotifications();
  const label = MODULE_LABELS[state.nav.module] || 'Home';
  const user = state.currentUser;
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(-1);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const listboxId = useId();
  const resultsQuery = useSearch(query);
  const results = (resultsQuery.data || []).map((item) => ({
    ...item,
    label: item.title || item.label,
  }));
  const notifications = (notificationsQuery.data || []).filter(
    (item) => !item.module || canAccessModule(item.module)
  );
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false);
      if (!notificationRef.current?.contains(event.target)) setNotificationOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotificationOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const chooseResult = (result) => {
    navigate(result.module, result.params);
    setQuery('');
    setSearchOpen(false);
    setActiveResult(-1);
  };

  const onSearchKeyDown = (event) => {
    if (!searchOpen || !results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveResult((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveResult((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter' && activeResult >= 0) {
      event.preventDefault();
      chooseResult(results[activeResult]);
    }
  };

  return (
    <header className="relative z-20 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur-md sm:gap-3 sm:px-5">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-control p-1.5 text-ink-muted interactive hover:bg-elevated hover:text-ink"
        aria-label="Toggle sidebar"
      >
        <Icon name="panelLeft" size={18} />
      </button>

      <div className="hidden min-w-0 items-baseline gap-2.5 sm:flex">
        <span className="type-overline shrink-0">Module</span>
        <span className="font-display truncate text-[0.95rem] font-semibold tracking-tight text-ink">
          {label}
        </span>
      </div>

      <div ref={searchRef} className="relative mx-auto flex w-full max-w-md items-center">
        <label className="relative w-full">
          <span className="sr-only">Search the application</span>
          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-ink-faint">
            <Icon name="search" size={14} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
              setActiveResult(-1);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search accounts, work orders, assets…"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={searchOpen && query.trim().length >= 2}
            aria-controls={listboxId}
            aria-activedescendant={
              activeResult >= 0 ? `${listboxId}-option-${activeResult}` : undefined
            }
            className="w-full border-0 border-b border-transparent bg-transparent py-1.5 pl-6 pr-2 text-sm text-ink placeholder:text-ink-faint focus:border-line-strong focus:outline-none focus:ring-0"
          />
        </label>
        {searchOpen && query.trim().length >= 2 && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+0.55rem)] max-h-80 overflow-y-auto rounded-panel border border-line bg-surface p-1.5 shadow-float scroll-thin"
          >
            {results.length ? (
              results.map((result, index) => (
                <button
                  id={`${listboxId}-option-${index}`}
                  key={result.id}
                  type="button"
                  role="option"
                  aria-selected={activeResult === index}
                  onMouseEnter={() => setActiveResult(index)}
                  onClick={() => chooseResult(result)}
                  className={`block w-full rounded-control px-3 py-2.5 text-left ${
                    activeResult === index ? 'bg-elevated' : 'hover:bg-elevated'
                  }`}
                >
                  <span className="block truncate text-sm font-medium text-ink">{result.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink-muted">{result.meta}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-5 text-center text-sm text-ink-muted">
                No results for “{query.trim()}”
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <a
          href="mailto:helpdesk@rehrigpacific.com"
          className="rounded-control p-1.5 text-ink-muted interactive hover:bg-elevated hover:text-ink"
          aria-label="Contact helpdesk"
        >
          <Icon name="help" size={17} />
        </a>
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationOpen((open) => !open);
              setSearchOpen(false);
            }}
            className="relative rounded-control p-1.5 text-ink-muted interactive hover:bg-elevated hover:text-ink"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notificationOpen}
            aria-haspopup="dialog"
          >
            <Icon name="bell" size={17} />
            {unreadCount > 0 && (
              <span
                className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger ring-2 ring-surface"
                aria-hidden="true"
              />
            )}
          </button>
          {notificationOpen && (
            <section
              role="dialog"
              aria-label="Notifications"
              className="fixed left-3 right-3 top-[3.75rem] rounded-panel border border-line bg-surface shadow-float sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.65rem)] sm:w-96"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="font-display text-title-sm text-ink">Notifications</h2>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAll.mutate()}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto p-1.5 scroll-thin">
                {notifications.length ? (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        markOne.mutate(item.id);
                        if (item.module) navigate(item.module);
                        setNotificationOpen(false);
                      }}
                      className="flex w-full gap-3 rounded-control px-3 py-3 text-left hover:bg-elevated"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          item.read ? 'bg-line-strong' : 'bg-brand'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{item.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                          {item.detail}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-ink-muted">
                    You’re all caught up.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
        <span
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-control border border-line bg-elevated text-[10px] font-semibold text-ink"
          title={user?.name}
          aria-label={`Signed in as ${user?.name || 'user'}`}
        >
          {initials(user?.name)}
        </span>
      </div>
    </header>
  );
}
