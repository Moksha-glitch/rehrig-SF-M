/**
 * Shell chrome that is not a Salesforce-style top bar:
 * desktop = persona-preview banner only; small screens = hamburger nav.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import UserAccountMenu from './UserAccountMenu.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { NAV, filterNavTree, isNavItemActive } from './navConfig.js';

function initials(name) {
  const parts = (name || '').split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function TopBar() {
  const {
    state,
    persona,
    navigate,
    logout,
    canNav,
    openAssistant,
    isScoped,
    canPreviewPersonas,
    personaViews,
    previewPersona,
    exitPersonaPreview,
    previewOrigin,
    isPreviewingPersona,
    psgLabel,
  } = useStore();
  const accountsQuery = useAccounts();
  const user = state.currentUser;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState({});
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const tree = useMemo(
    () => filterNavTree(NAV[persona] || [], canNav),
    [persona, canNav]
  );

  const accounts = accountsQuery.data || [];
  const scopedAccount =
    persona !== 'rehrig'
      ? accounts.find((a) => user?.accountIds?.includes(a.id)) ||
        (persona === 'sp' ? accounts[0] : null)
      : null;

  const activeModule = state.nav.module;
  const activeParams = state.nav.params || {};

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const goTo = (item) => {
    if (item.module === 'assistant') {
      openAssistant();
      setMobileOpen(false);
      return;
    }
    navigate(item.module, item.params);
    setMobileOpen(false);
  };

  return (
    <>
      {isPreviewingPersona && (
        <header className="relative z-30 hidden border-b border-line bg-surface/95 backdrop-blur-md lg:block">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 bg-warn-soft px-4 py-2 text-xs text-warn sm:px-5">
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
        </header>
      )}

      <header className="relative z-30 border-b border-line bg-surface/95 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-control p-1.5 text-ink-muted interactive hover:bg-elevated hover:text-ink"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Icon name="panelLeft" size={18} />
            </button>
            <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
              vision
            </span>
            <span className="hidden rounded-control border border-line bg-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint sm:inline">
              ops
            </span>
          </div>
          {isPreviewingPersona && (
            <div className="flex flex-col items-start gap-1 border-t border-line bg-warn-soft px-4 py-2 text-xs text-warn sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2.5">
              <Icon name="eye" size={14} />
              <span className="font-semibold uppercase tracking-wide">Admin preview</span>
              <span className="min-w-0 truncate">
                Viewing Vision as {user?.name} · {user?.role}
              </span>
              <button
                type="button"
                onClick={exitPersonaPreview}
                className="font-semibold underline hover:no-underline sm:ml-auto"
              >
                Back to {previewOrigin?.name}
              </button>
            </div>
          )}
      </header>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="overlay-scrim fixed inset-0 z-40 lg:hidden"
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
            </nav>
            <div ref={accountRef} className="relative shrink-0 border-t border-line px-3 py-3">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left interactive hover:bg-elevated ${
                  accountOpen ? 'bg-elevated' : ''
                }`}
                aria-label={`Signed in as ${user?.name || 'user'}`}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-white ${
                    isPreviewingPersona ? 'bg-warn' : 'bg-ink'
                  }`}
                >
                  {initials(user?.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{user?.name}</div>
                  <div className="truncate text-[11px] text-ink-faint">{user?.role}</div>
                </div>
                <Icon name="chevronDown" size={12} className="text-ink-faint" />
              </button>
              {accountOpen && (
                <UserAccountMenu
                  user={user}
                  persona={persona}
                  scopedAccount={scopedAccount}
                  isScoped={isScoped}
                  canPreviewPersonas={canPreviewPersonas}
                  personaViews={personaViews}
                  previewPersona={previewPersona}
                  exitPersonaPreview={exitPersonaPreview}
                  previewOrigin={previewOrigin}
                  isPreviewingPersona={isPreviewingPersona}
                  navigate={navigate}
                  logout={logout}
                  onClose={() => {
                    setAccountOpen(false);
                    setMobileOpen(false);
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
