import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const MENU_MIN_WIDTH = 224;

function NavDropdown({ section, activeModule, activeParams, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const sectionActive = section.children.some((c) =>
    isNavItemActive(c, activeModule, activeParams)
  );

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(rect.width, MENU_MIN_WIDTH);
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    setPosition({
      top: rect.bottom + 6,
      left: Math.min(Math.max(8, rect.left), maxLeft),
      minWidth: width,
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    place();
    const onPointerDown = (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onScroll = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      place();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', place);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex shrink-0 items-center gap-1 rounded-control px-2.5 py-1.5 text-sm font-medium interactive ${
          sectionActive || open
            ? 'bg-elevated text-ink'
            : 'text-ink-muted hover:bg-elevated hover:text-ink'
        }`}
      >
        {section.label}
        <Icon name="chevronDown" size={13} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={section.label}
            style={{ top: position.top, left: position.left, minWidth: position.minWidth }}
            className="fixed z-40 max-h-[min(70vh,32rem)] overflow-y-auto rounded-panel border border-line bg-surface p-1.5 shadow-float scroll-thin"
          >
            {section.children.map((item) => {
              const active = isNavItemActive(item, activeModule, activeParams);
              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onNavigate(item);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm interactive ${
                    active
                      ? 'bg-elevated font-medium text-ink'
                      : 'text-ink-muted hover:bg-elevated hover:text-ink'
                  }`}
                >
                  {item.icon && (
                    <Icon name={item.icon} size={14} className="shrink-0 text-ink-faint" />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

function SearchField({
  query,
  setQuery,
  searchOpen,
  setSearchOpen,
  results,
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
          placeholder="Search…"
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
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(-1);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const notificationDesktopRef = useRef(null);
  const notificationMobileRef = useRef(null);
  const userMenuDesktopRef = useRef(null);
  const userMenuMobileRef = useRef(null);
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
  const results = (resultsQuery.data || []).map((item) => ({
    ...item,
    label: item.title || item.label,
  }));
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
    openAssistant();
  };

  const searchProps = {
    query,
    setQuery,
    searchOpen,
    setSearchOpen,
    results,
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

            <nav
              className="ml-1 flex min-w-0 items-center gap-0.5 overflow-x-auto overflow-y-visible scroll-thin"
              aria-label="Primary"
            >
              {tree.map((node) => {
                if (node.type === 'item') {
                  const active = isNavItemActive(node, activeModule, activeParams);
                  return (
                    <button
                      key={node.key}
                      type="button"
                      onClick={() => goTo(node)}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-control px-2.5 py-1.5 text-sm font-medium interactive ${
                        active
                          ? 'bg-elevated text-ink'
                          : 'text-ink-muted hover:bg-elevated hover:text-ink'
                      }`}
                    >
                      {node.icon && <Icon name={node.icon} size={14} className="text-ink-faint" />}
                      {node.label}
                    </button>
                  );
                }
                return (
                  <NavDropdown
                    key={node.label}
                    section={node}
                    activeModule={activeModule}
                    activeParams={activeParams}
                    onNavigate={goTo}
                  />
                );
              })}
            </nav>
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

            <a
              href="mailto:helpdesk@rehrigpacific.com"
              className="rounded-control p-1.5 text-ink-muted interactive hover:bg-elevated hover:text-ink"
              aria-label="Contact helpdesk"
            >
              <Icon name="help" size={17} />
            </a>
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
                <Icon name="chevronDown" size={12} className="text-ink-faint" />
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.45rem)] z-40 w-56 rounded-panel border border-line bg-surface p-1.5 shadow-float"
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
                        setUserMenuOpen(false);
                      }}
                      className="mt-1 flex w-full rounded-control px-3 py-2 text-left text-sm text-ink-muted interactive hover:bg-elevated hover:text-ink"
                    >
                      Your Account
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm text-ink-muted interactive hover:bg-elevated hover:text-ink"
                  >
                    <Icon name="logout" size={14} />
                    Sign out
                  </button>
                </div>
              )}
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
            <a
              href="mailto:helpdesk@rehrigpacific.com"
              className="rounded-control p-1.5 text-ink-muted interactive hover:bg-elevated hover:text-ink"
              aria-label="Contact helpdesk"
            >
              <Icon name="help" size={17} />
            </a>
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
                <span className="flex h-7 w-7 items-center justify-center rounded-control bg-ink text-[10px] font-semibold text-white">
                  {initials(user?.name)}
                </span>
                <Icon name="chevronDown" size={12} className="text-ink-faint" />
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.45rem)] z-40 w-56 rounded-panel border border-line bg-surface p-1.5 shadow-float"
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
                        setUserMenuOpen(false);
                      }}
                      className="mt-1 flex w-full rounded-control px-3 py-2 text-left text-sm text-ink-muted interactive hover:bg-elevated hover:text-ink"
                    >
                      Your Account
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm text-ink-muted interactive hover:bg-elevated hover:text-ink"
                  >
                    <Icon name="logout" size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

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
              </div>
            </nav>
          </div>
        </>
      )}
      <AppLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)} />
    </>
  );
}
