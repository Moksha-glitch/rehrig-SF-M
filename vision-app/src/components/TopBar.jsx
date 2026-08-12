import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import AppLauncher from './AppLauncher.jsx';
import { hasOpenOverlay } from './UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useSearch } from '../hooks/useSearch.js';
import { useMarkNotifications, useNotifications } from '../hooks/useConfig.js';
import { useAccounts } from '../hooks/useAccounts.js';
import { getContactsDestination } from '../data/assistantIntents.js';
import {
  NAV,
  filterNavTree,
  isNavItemActive,
} from './navConfig.js';

function initials(name) {
  const parts = (name || '').split(' ');
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

const HELP_RESOURCES = [
  {
    label: 'Guided onboarding',
    detail: 'Walk a new Service Provider through setup step by step.',
    module: 'onboarding',
    icon: 'building',
  },
  {
    label: 'Bulk Import (White Tool)',
    detail: 'Map spreadsheet columns and load records in bulk.',
    module: 'bulkImport',
    icon: 'download',
  },
  {
    label: 'Workspace settings',
    detail: 'Users, permission sets, licenses and defaults.',
    module: 'setup',
    params: { section: 'userMgmt' },
    icon: 'settings',
  },
];

function SearchField({
  query,
  setQuery,
  searchOpen,
  setSearchOpen,
  results,
  groups,
  activeResult,
  setActiveResult,
  chooseResult,
  onSearchKeyDown,
  listboxId,
  searchRef,
  className = '',
  autoFocus = false,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <label className="relative block w-full">
        <span className="sr-only">Search the application</span>
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint">
          <Icon name="search" size={14} />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearchOpen(true);
            setActiveResult(-1);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={onSearchKeyDown}
          placeholder="Jump to anywhere…"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={searchOpen && query.trim().length >= 2}
          aria-controls={listboxId}
          aria-activedescendant={
            activeResult >= 0 ? `${listboxId}-option-${activeResult}` : undefined
          }
          className="w-full rounded-control border border-line bg-elevated/50 py-1.5 pl-8 pr-2 text-sm text-ink placeholder:text-ink-faint focus:border-line-strong focus:outline-none focus:ring-0"
        />
      </label>
      {searchOpen && query.trim().length >= 2 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-40 max-h-80 overflow-y-auto rounded-panel border border-line bg-surface p-1.5 shadow-float scroll-thin"
        >
          {results.length ? (
            groups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label} className="mb-1 last:mb-0">
                <div className="px-3 pb-1 pt-2 type-overline">{group.label}</div>
                {group.items.map((result) => (
                  <button
                    id={`${listboxId}-option-${result.index}`}
                    key={result.id}
                    type="button"
                    role="option"
                    aria-selected={activeResult === result.index}
                    onMouseEnter={() => setActiveResult(result.index)}
                    onClick={() => chooseResult(result)}
                    className={`block w-full rounded-control px-3 py-2 text-left ${
                      activeResult === result.index ? 'bg-elevated' : 'hover:bg-elevated'
                    }`}
                  >
                    <span className="block truncate text-sm font-medium text-ink">
                      {result.label}
                    </span>
                    {result.meta && (
                      <span className="mt-0.5 block truncate text-xs text-ink-muted">
                        {result.meta}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="px-3 py-5 text-center text-sm text-ink-muted">
              No results for “{query.trim()}”
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HelpMenu({ open, onToggle, onClose, onAskAi, canAccessModule, navigate, panelClassName }) {
  const resources = HELP_RESOURCES.filter((item) => canAccessModule(item.module));
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-control p-1.5 interactive ${
          open ? 'bg-elevated text-ink' : 'text-ink-muted hover:bg-elevated hover:text-ink'
        }`}
        aria-label="Help & Training"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Help & Training"
      >
        <Icon name="help" size={17} />
      </button>
      {open && (
        <section role="dialog" aria-label="Help & Training" className={panelClassName}>
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-display text-title-sm text-ink">Help &amp; Training</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Guided flows, support contacts and the AI assistant.
            </p>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAskAi();
              }}
              className="flex w-full items-start gap-2.5 rounded-control px-3 py-2.5 text-left hover:bg-elevated"
            >
              <Icon name="star" size={15} className="mt-0.5 text-brand" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">Ask the AI assistant</span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  Answers grounded in this workspace.
                </span>
              </span>
            </button>
            {resources.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  onClose();
                  navigate(item.module, item.params || {});
                }}
                className="flex w-full items-start gap-2.5 rounded-control px-3 py-2.5 text-left hover:bg-elevated"
              >
                <Icon name={item.icon} size={15} className="mt-0.5 text-ink-faint" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{item.detail}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-line p-1.5">
            <a
              href="mailto:helpdesk@rehrigpacific.com"
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm text-ink-muted hover:bg-elevated hover:text-ink"
            >
              <Icon name="mail" size={15} className="text-ink-faint" />
              Email the Vision helpdesk
            </a>
            <a
              href="https://www.rehrigpacific.com/contact"
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm text-ink-muted hover:bg-elevated hover:text-ink"
            >
              <Icon name="arrowUpRight" size={15} className="text-ink-faint" />
              Rehrig Pacific support
            </a>
          </div>
        </section>
      )}
    </>
  );
}

function UserMenu({
  user,
  persona,
  scopedAccount,
  isScoped,
  canPreviewPersonas,
  personaViews,
  previewPersona,
  exitPersonaPreview,
  previewOrigin,
  isPreviewingPersona,
  navigate,
  logout,
  onClose,
}) {
  return (
    <div
      role="menu"
      className="absolute right-0 top-[calc(100%+0.45rem)] z-40 w-64 rounded-panel border border-line bg-surface p-1.5 shadow-float"
    >
      <div className="border-b border-line px-3 py-2.5">
        <div className="truncate text-sm font-medium text-ink">{user?.name}</div>
        <div className="truncate text-xs text-ink-muted">{user?.role}</div>
        {scopedAccount && (
          <div className="mt-1 truncate text-[11px] text-ink-faint">
            {scopedAccount.name}
            {isScoped && user?.scopeLabel ? ` · ${user.scopeLabel}` : ''}
          </div>
        )}
      </div>
      {persona === 'rehrig' && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            navigate('setup', { section: 'account' });
            onClose();
          }}
          className="mt-1 flex w-full rounded-control px-3 py-2 text-left text-sm text-ink-muted interactive hover:bg-elevated hover:text-ink"
        >
          Your Account
        </button>
      )}
      {canPreviewPersonas && (
        <div className="mt-1 border-t border-line pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 type-overline">
            <Icon name="eye" size={12} />
            View as
          </div>
          {personaViews.map((view) => {
            const active = view.id === user?.id;
            return (
              <button
                key={view.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  if (!active) previewPersona(view.id);
                  onClose();
                }}
                className={`flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm interactive ${
                  active ? 'bg-elevated text-ink' : 'text-ink-muted hover:bg-elevated hover:text-ink'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{view.name}</span>
                  <span className="block truncate text-[11px] text-ink-faint">{view.label}</span>
                </span>
                {active && <Icon name="check" size={13} className="text-brand" />}
              </button>
            );
          })}
          {isPreviewingPersona && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                exitPersonaPreview();
                onClose();
              }}
              className="mt-0.5 flex w-full items-center gap-2 rounded-control bg-warn-soft px-3 py-2 text-left text-sm font-medium text-warn interactive hover:brightness-95"
            >
              <Icon name="logout" size={14} />
              Exit preview — {previewOrigin?.name}
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          logout();
          onClose();
        }}
        className="mt-1 flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm text-ink-muted interactive hover:bg-elevated hover:text-ink"
      >
        <Icon name="logout" size={14} />
        Sign out
      </button>
    </div>
  );
}

export default function TopBar() {
  const {
    state,
    persona,
    navigate,
    logout,
    canNav,
    canAccessModule,
    canTab,
    isScoped,
    openAssistant,
    assistantOpen,
    canPreviewPersonas,
    personaViews,
    previewPersona,
    exitPersonaPreview,
    previewOrigin,
    isPreviewingPersona,
    psgLabel,
  } = useStore();
  const notificationsQuery = useNotifications();
  const { markOne, markAll } = useMarkNotifications();
  const accountsQuery = useAccounts();
  const user = state.currentUser;
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(-1);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const notificationDesktopRef = useRef(null);
  const notificationMobileRef = useRef(null);
  const userMenuDesktopRef = useRef(null);
  const userMenuMobileRef = useRef(null);
  const helpDesktopRef = useRef(null);
  const helpMobileRef = useRef(null);
  const listboxId = useId();
  const mobileListboxId = useId();

  const tree = useMemo(
    () => filterNavTree(NAV[persona] || [], canNav),
    [persona, canNav]
  );

  const contactsDestination = useMemo(
    () => getContactsDestination({ persona, canAccessModule, canTab }),
    [persona, canAccessModule, canTab]
  );

  const resultsQuery = useSearch(query);
  const results = useMemo(
    () =>
      (resultsQuery.data || []).map((item) => ({
        ...item,
        label: item.title || item.label,
      })),
    [resultsQuery.data]
  );
  const resultGroups = useMemo(() => {
    const map = new Map();
    results.forEach((result, index) => {
      const label = result.category || result.meta || 'Results';
      if (!map.has(label)) map.set(label, []);
      map.get(label).push({ ...result, index });
    });
    return [...map.entries()].map(([label, items]) => ({ label, items }));
  }, [results]);
  const notifications = (notificationsQuery.data || []).filter(
    (item) => !item.module || canAccessModule(item.module)
  );
  const unreadCount = notifications.filter((item) => !item.read).length;

  const accounts = accountsQuery.data || [];
  const scopedAccount =
    persona !== 'rehrig'
      ? accounts.find((a) => user?.accountIds?.includes(a.id)) ||
        (persona === 'sp' ? accounts[0] : null)
      : null;

  const activeModule = state.nav.module;
  const activeParams = state.nav.params || {};
  const contactsActive =
    contactsDestination &&
    contactsDestination.module === activeModule &&
    (!contactsDestination.params?.tab || contactsDestination.params.tab === activeParams.tab);

  useEffect(() => {
    const onPointerDown = (event) => {
      const inSearch =
        searchRef.current?.contains(event.target) ||
        mobileSearchRef.current?.contains(event.target);
      if (!inSearch) setSearchOpen(false);
      const inNotif =
        notificationDesktopRef.current?.contains(event.target) ||
        notificationMobileRef.current?.contains(event.target);
      if (!inNotif) setNotificationOpen(false);
      const inUser =
        userMenuDesktopRef.current?.contains(event.target) ||
        userMenuMobileRef.current?.contains(event.target);
      if (!inUser) setUserMenuOpen(false);
      const inHelp =
        helpDesktopRef.current?.contains(event.target) ||
        helpMobileRef.current?.contains(event.target);
      if (!inHelp) setHelpOpen(false);
    };
    const onKeyDown = (event) => {
      // A modal drawer/dialog owns Escape while it is open.
      if (event.key === 'Escape' && !hasOpenOverlay()) {
        setSearchOpen(false);
        setMobileSearchOpen(false);
        setNotificationOpen(false);
        setUserMenuOpen(false);
        setMobileOpen(false);
        setLauncherOpen(false);
        setHelpOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const goHome = () => {
    navigate('home');
    setMobileOpen(false);
  };

  const goTo = (item) => {
    navigate(item.module, item.params);
    setMobileOpen(false);
  };

  const chooseResult = (result) => {
    navigate(result.module, result.params);
    setQuery('');
    setSearchOpen(false);
    setMobileSearchOpen(false);
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

  const openContacts = () => {
    if (!contactsDestination) return;
    navigate(contactsDestination.module, contactsDestination.params);
    setMobileOpen(false);
  };

  const openAi = () => {
    setNotificationOpen(false);
    setUserMenuOpen(false);
    setMobileOpen(false);
    setHelpOpen(false);
    openAssistant();
  };

  const helpProps = {
    open: helpOpen,
    onToggle: () => {
      setHelpOpen((open) => !open);
      setNotificationOpen(false);
      setUserMenuOpen(false);
      setSearchOpen(false);
    },
    onClose: () => setHelpOpen(false),
    onAskAi: openAi,
    canAccessModule,
    navigate,
  };

  const userMenuProps = {
    user,
    persona,
    scopedAccount,
    isScoped,
    canPreviewPersonas,
    personaViews,
    previewPersona,
    exitPersonaPreview,
    previewOrigin,
    isPreviewingPersona,
    navigate,
    logout,
    onClose: () => setUserMenuOpen(false),
  };

  const searchProps = {
    query,
    setQuery,
    searchOpen,
    setSearchOpen,
    results,
    groups: resultGroups,
    activeResult,
    setActiveResult,
    chooseResult,
    onSearchKeyDown,
  };

  return (
    <>
      <header className="relative z-30 border-b border-line bg-surface/95 backdrop-blur-md">
        {/* Desktop: collision-safe three-zone grid keeps search truly centered */}
        <div className="hidden h-14 items-center gap-3 px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(14rem,26rem)_minmax(0,1fr)]">
          <div className="flex min-w-0 items-center gap-2 justify-self-start">
            <button
              type="button"
              onClick={() => {
                setLauncherOpen(true);
                setNotificationOpen(false);
                setUserMenuOpen(false);
                setSearchOpen(false);
              }}
              className={`rounded-control p-1.5 interactive ${
                launcherOpen
                  ? 'bg-elevated text-ink'
                  : 'text-ink-muted hover:bg-elevated hover:text-ink'
              }`}
              aria-label="App Launcher"
              aria-expanded={launcherOpen}
              title="App Launcher"
            >
              <Icon name="grid" size={17} />
            </button>
            <button
              type="button"
              onClick={goHome}
              className="group flex shrink-0 items-baseline gap-2 interactive"
              aria-label="Vision home"
            >
              <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
                vision
              </span>
              <span className="rounded-control border border-line bg-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint group-hover:text-ink-muted">
                ops
              </span>
            </button>
          </div>

          <SearchField
            {...searchProps}
            listboxId={listboxId}
            searchRef={searchRef}
            className="w-full justify-self-center"
          />

          <div className="flex min-w-0 items-center justify-end gap-1.5 justify-self-end">
            {contactsDestination && (
              <button
                type="button"
                onClick={openContacts}
                aria-current={contactsActive ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-sm font-medium interactive ${
                  contactsActive
                    ? 'bg-elevated text-ink'
                    : 'text-ink-muted hover:bg-elevated hover:text-ink'
                }`}
              >
                <Icon name="user" size={15} className="text-ink-faint" />
                Contacts
              </button>
            )}
            <button
              type="button"
              onClick={openAi}
              aria-pressed={assistantOpen}
              className={`inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-sm font-medium interactive ${
                assistantOpen
                  ? 'bg-brand-soft text-brand'
                  : 'text-ink-muted hover:bg-elevated hover:text-ink'
              }`}
            >
              <Icon name="star" size={15} />
              AI Assistant
            </button>

            <div ref={helpDesktopRef} className="relative">
              <HelpMenu
                {...helpProps}
                panelClassName="absolute right-0 top-[calc(100%+0.65rem)] z-40 w-80 rounded-panel border border-line bg-surface shadow-float"
              />
            </div>
            <div ref={notificationDesktopRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setSearchOpen(false);
                  setUserMenuOpen(false);
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
                  className="absolute right-0 top-[calc(100%+0.65rem)] z-40 w-96 rounded-panel border border-line bg-surface shadow-float"
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

            <div ref={userMenuDesktopRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((o) => !o);
                  setNotificationOpen(false);
                }}
                className="ml-0.5 flex items-center gap-2 rounded-control border border-line bg-elevated py-1 pl-1 pr-2 interactive hover:bg-surface"
                aria-label={`Signed in as ${user?.name || 'user'}`}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-control bg-ink text-[10px] font-semibold text-white">
                  {initials(user?.name)}
                </span>
                <span className="hidden max-w-[7rem] truncate text-xs font-medium text-ink xl:inline">
                  {user?.name}
                </span>
                {isPreviewingPersona && (
                  <span className="hidden rounded-control bg-warn-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn xl:inline">
                    Preview
                  </span>
                )}
                <Icon name="chevronDown" size={12} className="text-ink-faint" />
              </button>
              {userMenuOpen && <UserMenu {...userMenuProps} />}
            </div>
          </div>
        </div>

        {/* Mobile / tablet bar */}
        <div className="flex h-14 items-center gap-2 px-3 sm:px-5 lg:hidden">
          <button
            type="button"
            onClick={() => {
              setLauncherOpen(true);
              setMobileOpen(false);
              setNotificationOpen(false);
              setUserMenuOpen(false);
            }}
            className={`rounded-control p-1.5 interactive ${
              launcherOpen
                ? 'bg-elevated text-ink'
                : 'text-ink-muted hover:bg-elevated hover:text-ink'
            }`}
            aria-label="App Launcher"
            aria-expanded={launcherOpen}
          >
            <Icon name="grid" size={17} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-control p-1.5 text-ink-muted interactive hover:bg-elevated hover:text-ink"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Icon name="panelLeft" size={18} />
          </button>

          <button
            type="button"
            onClick={goHome}
            className="group flex shrink-0 items-baseline gap-2 interactive"
            aria-label="Vision home"
          >
            <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
              vision
            </span>
            <span className="hidden rounded-control border border-line bg-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint group-hover:text-ink-muted sm:inline">
              ops
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((open) => !open);
                setNotificationOpen(false);
                setUserMenuOpen(false);
              }}
              className={`rounded-control p-1.5 interactive ${
                mobileSearchOpen
                  ? 'bg-elevated text-ink'
                  : 'text-ink-muted hover:bg-elevated hover:text-ink'
              }`}
              aria-label="Search"
              aria-expanded={mobileSearchOpen}
            >
              <Icon name="search" size={17} />
            </button>
            {contactsDestination && (
              <button
                type="button"
                onClick={openContacts}
                className={`rounded-control p-1.5 interactive ${
                  contactsActive
                    ? 'bg-elevated text-ink'
                    : 'text-ink-muted hover:bg-elevated hover:text-ink'
                }`}
                aria-label="Contacts"
              >
                <Icon name="user" size={17} />
              </button>
            )}
            <button
              type="button"
              onClick={openAi}
              className={`rounded-control p-1.5 interactive ${
                assistantOpen
                  ? 'bg-brand-soft text-brand'
                  : 'text-ink-muted hover:bg-elevated hover:text-ink'
              }`}
              aria-label="AI Assistant"
              aria-pressed={assistantOpen}
            >
              <Icon name="star" size={17} />
            </button>
            <div ref={helpMobileRef} className="relative">
              <HelpMenu
                {...helpProps}
                panelClassName="fixed left-3 right-3 top-[3.75rem] z-40 rounded-panel border border-line bg-surface shadow-float"
              />
            </div>
            <div ref={notificationMobileRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setSearchOpen(false);
                  setUserMenuOpen(false);
                  setMobileSearchOpen(false);
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
                  className="fixed left-3 right-3 top-[3.75rem] z-40 rounded-panel border border-line bg-surface shadow-float"
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

            <div ref={userMenuMobileRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((o) => !o);
                  setNotificationOpen(false);
                  setMobileSearchOpen(false);
                }}
                className="ml-0.5 flex items-center gap-2 rounded-control border border-line bg-elevated py-1 pl-1 pr-2 interactive hover:bg-surface"
                aria-label={`Signed in as ${user?.name || 'user'}`}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-control text-[10px] font-semibold text-white ${
                    isPreviewingPersona ? 'bg-warn' : 'bg-ink'
                  }`}
                >
                  {initials(user?.name)}
                </span>
                <Icon name="chevronDown" size={12} className="text-ink-faint" />
              </button>
              {userMenuOpen && <UserMenu {...userMenuProps} />}
            </div>
          </div>
        </div>

        {isPreviewingPersona && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line bg-warn-soft px-4 py-2 text-xs text-warn sm:px-5">
            <Icon name="eye" size={14} />
            <span className="font-semibold uppercase tracking-wide">Admin preview</span>
            <span className="min-w-0 truncate">
              Viewing Vision as {user?.name} · {user?.role}
              {psgLabel ? ` · ${psgLabel}` : ''}
            </span>
            <button
              type="button"
              onClick={exitPersonaPreview}
              className="ml-auto font-semibold underline hover:no-underline"
            >
              Back to {previewOrigin?.name}
            </button>
          </div>
        )}

        {mobileSearchOpen && (
          <div className="border-t border-line px-3 py-2.5 sm:px-5 lg:hidden">
            <SearchField
              {...searchProps}
              listboxId={mobileListboxId}
              searchRef={mobileSearchRef}
              className="w-full"
              autoFocus
            />
          </div>
        )}
      </header>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,92vw)] flex-col border-r border-line bg-surface shadow-float lg:hidden">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <span className="font-display text-lg font-semibold text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-control p-1.5 text-ink-muted"
                aria-label="Close menu"
              >
                <Icon name="x" size={17} />
              </button>
            </div>
            {scopedAccount && (
              <div className="mx-3 mt-3 rounded-panel border border-line bg-elevated/70 px-3.5 py-3">
                <div className="type-overline">Service Provider</div>
                <div className="mt-1 truncate text-sm font-semibold text-ink">{scopedAccount.name}</div>
              </div>
            )}
            <nav className="flex-1 overflow-y-auto px-2.5 py-3 scroll-thin" aria-label="Mobile primary">
              {tree.map((node, i) => {
                if (node.type === 'item') {
                  const active = isNavItemActive(node, activeModule, activeParams);
                  return (
                    <button
                      key={node.key}
                      type="button"
                      onClick={() => goTo(node)}
                      className={`mb-0.5 flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-sm ${
                        active ? 'bg-elevated font-medium text-ink' : 'text-ink-muted hover:bg-elevated'
                      }`}
                    >
                      {node.icon && <Icon name={node.icon} size={15} className="text-ink-faint" />}
                      {node.label}
                    </button>
                  );
                }
                const expanded = mobileExpanded[i] ?? true;
                return (
                  <div key={node.label} className="mb-2 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpanded((prev) => ({ ...prev, [i]: !expanded }))
                      }
                      aria-expanded={expanded}
                      className="mb-1 flex w-full items-center justify-between px-3 py-1 type-overline"
                    >
                      <span>{node.label}</span>
                      <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={12} />
                    </button>
                    {expanded &&
                      node.children.map((item) => {
                        const active = isNavItemActive(item, activeModule, activeParams);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => goTo(item)}
                            className={`mb-0.5 flex w-full items-center gap-2 rounded-control px-3 py-2 pl-4 text-left text-sm ${
                              active
                                ? 'bg-elevated font-medium text-ink'
                                : 'text-ink-muted hover:bg-elevated'
                            }`}
                          >
                            {item.icon && (
                              <Icon name={item.icon} size={14} className="text-ink-faint" />
                            )}
                            {item.label}
                          </button>
                        );
                      })}
                  </div>
                );
              })}
              <div className="mt-3 border-t border-line pt-3">
                {contactsDestination && (
                  <button
                    type="button"
                    onClick={openContacts}
                    className={`mb-0.5 flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-sm ${
                      contactsActive
                        ? 'bg-elevated font-medium text-ink'
                        : 'text-ink-muted hover:bg-elevated'
                    }`}
                  >
                    <Icon name="user" size={15} className="text-ink-faint" />
                    Contacts
                  </button>
                )}
                <button
                  type="button"
                  onClick={openAi}
                  className="mb-0.5 flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-sm text-ink-muted hover:bg-elevated"
                >
                  <Icon name="star" size={15} className="text-brand" />
                  AI Assistant
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setHelpOpen(true);
                  }}
                  className="mb-0.5 flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-sm text-ink-muted hover:bg-elevated"
                >
                  <Icon name="help" size={15} className="text-ink-faint" />
                  Help &amp; Training
                </button>
              </div>
            </nav>
          </div>
        </>
      )}
      <AppLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)} />
    </>
  );
}
