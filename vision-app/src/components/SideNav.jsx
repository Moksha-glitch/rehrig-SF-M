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

function NavButton({ item, active, onClick, collapsed }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className={
        collapsed
          ? `flex h-10 w-10 items-center justify-center rounded-xl ${
              active
                ? 'nav-item-active text-ink'
                : 'text-ink-muted hover:bg-surface hover:text-ink'
            }`
          : `nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] ${
              active ? 'nav-item-active' : 'text-ink-muted hover:bg-surface hover:text-ink'
            }`
      }
    >
      {item.icon ? (
        <Icon
          name={item.icon}
          size={collapsed ? 18 : 16}
          className={`shrink-0 ${active ? 'text-ink' : 'text-ink-faint'}`}
        />
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center font-semibold ${
            collapsed ? 'h-5 w-5 text-[11px]' : 'h-4 w-4 text-[10px]'
          } ${active ? 'text-ink' : 'text-ink-faint'}`}
        >
          {item.label.charAt(0)}
        </span>
      )}
      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
    </button>
  );
}

export default function SideNav({ open, onToggle }) {
  const {
    state,
    persona,
    navigate,
    logout,
    canNav,
    openAssistant,
    assistantOpen,
    isScoped,
    canPreviewPersonas,
    personaViews,
    previewPersona,
    exitPersonaPreview,
    previewOrigin,
    isPreviewingPersona,
  } = useStore();
  const accountsQuery = useAccounts();
  const user = state.currentUser;
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const tree = useMemo(() => filterNavTree(NAV[persona] || [], canNav), [persona, canNav]);

  const activeModule = state.nav.module;
  const activeParams = state.nav.params || {};

  const activeSection = useMemo(() => {
    const match = tree.find(
      (node) =>
        node.type === 'section' &&
        node.children.some((item) => isNavItemActive(item, activeModule, activeParams))
    );
    return match?.label || null;
  }, [tree, activeModule, activeParams]);

  const [collapsedSections, setCollapsedSections] = useState({});

  const accounts = accountsQuery.data || [];
  const scopedAccount =
    persona !== 'rehrig'
      ? accounts.find((a) => user?.accountIds?.includes(a.id)) ||
        (persona === 'sp' ? accounts[0] : null)
      : null;

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (!tree.length) return null;

  const personaLabel =
    persona === 'rehrig' ? 'Rehrig' : persona === 'sp' ? 'Service Provider' : 'Resident';

  const goTo = (item) => {
    if (item.module === 'assistant') {
      openAssistant();
      return;
    }
    navigate(item.module, item.params);
  };

  const isItemActive = (item) =>
    item.module === 'assistant'
      ? assistantOpen
      : isNavItemActive(item, activeModule, activeParams);

  return (
    <div className={`side-nav hidden lg:block ${open ? 'w-[16.5rem]' : 'w-14'}`}>
      <aside
        className="flex h-full w-full flex-col border-r border-line bg-elevated/70"
        aria-label="Main navigation"
      >
        <div
          className={`flex h-14 shrink-0 items-center ${
            open ? 'justify-between gap-2 px-3' : 'justify-center'
          }`}
        >
          {open && (
            <button
              type="button"
              onClick={() => navigate('home')}
              className="group flex min-w-0 items-baseline gap-2 px-1 interactive"
              aria-label="Vision home"
            >
              <span className="font-display text-[1.25rem] font-semibold tracking-tight text-ink">
                vision
              </span>
              <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint group-hover:text-ink-muted">
                ops
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
            className="rounded-xl p-1.5 text-ink-muted interactive hover:bg-surface hover:text-ink"
          >
            <Icon name="panelLeft" size={18} />
          </button>
        </div>

        <nav
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-3 scroll-thin ${
            open ? 'space-y-0.5 px-2.5' : 'flex flex-col items-center gap-0.5 px-1.5'
          }`}
        >
          {tree.map((node) => {
            if (node.type === 'item') {
              return (
                <NavButton
                  key={node.key}
                  item={node}
                  active={isItemActive(node)}
                  collapsed={!open}
                  onClick={() => goTo(node)}
                />
              );
            }

            const expanded =
              collapsedSections[node.label] === undefined
                ? activeSection === node.label
                : !collapsedSections[node.label];

            if (!open) {
              return (
                <div
                  key={node.label}
                  className="flex flex-col items-center gap-0.5 border-t border-line/70 pt-1.5 first:border-t-0 first:pt-0"
                >
                  {node.children.map((item) => (
                    <NavButton
                      key={item.key}
                      item={item}
                      active={isItemActive(item)}
                      collapsed
                      onClick={() => goTo(item)}
                    />
                  ))}
                </div>
              );
            }

            return (
              <div key={node.label} className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedSections((prev) => ({
                      ...prev,
                      [node.label]: expanded,
                    }))
                  }
                  aria-expanded={expanded}
                  className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint interactive hover:bg-surface hover:text-ink-muted"
                >
                  <span>{node.label}</span>
                  <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={12} />
                </button>
                {expanded && (
                  <div className="space-y-0.5">
                    {node.children.map((item) => (
                      <NavButton
                        key={item.key}
                        item={item}
                        active={isItemActive(item)}
                        onClick={() => goTo(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={`shrink-0 border-t border-line ${open ? 'px-3 py-3' : 'px-1.5 py-3'}`}>
          {open && scopedAccount && (
            <div className="mb-2 truncate px-2 text-[11px] text-ink-faint">{scopedAccount.name}</div>
          )}
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((openMenu) => !openMenu)}
              className={
                open
                  ? `flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left interactive hover:bg-surface ${
                      accountOpen ? 'bg-surface' : ''
                    }`
                  : `mx-auto flex h-10 w-10 items-center justify-center rounded-xl interactive hover:bg-surface ${
                      accountOpen ? 'bg-surface' : ''
                    }`
              }
              aria-label={`Signed in as ${user?.name || 'user'}`}
              title={user?.name || 'Account'}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              <span
                className={`flex shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-white ${
                  open ? 'h-8 w-8' : 'h-8 w-8'
                } ${isPreviewingPersona ? 'bg-warn' : 'bg-ink'}`}
              >
                {initials(user?.name)}
              </span>
              {open && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{user?.name}</div>
                    <div className="truncate text-[11px] text-ink-faint">
                      {user?.role} · {personaLabel}
                    </div>
                  </div>
                  <Icon name="chevronDown" size={12} className="shrink-0 text-ink-faint" />
                </>
              )}
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
                onClose={() => setAccountOpen(false)}
                className={
                  open
                    ? 'absolute left-0 bottom-full z-40 mb-2 w-64 rounded-panel border border-line bg-surface p-1.5 shadow-float'
                    : 'absolute left-full bottom-0 z-40 ml-2 w-64 rounded-panel border border-line bg-surface p-1.5 shadow-float'
                }
              />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
