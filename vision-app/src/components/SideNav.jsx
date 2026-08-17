import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import UserAccountMenu from './UserAccountMenu.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { NAV, filterNavTree, isNavItemActive } from './navConfig.js';

function initials(name) {
  const parts = (name || '').split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function VaiMark({ size = 32, muted = false }) {
  const id = React.useId().replace(/:/g, '');
  const ink = muted ? '#64748B' : '#5DB7E7';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {!muted && (
        <path
          d="M11.2256 31.7998C20.1635 31.7998 29.559 24.3516 29.559 15.9382C29.559 7.52467 20.1635 0.710938 11.2256 0.710938C2.28764 0.710938 0.441406 7.52467 0.441406 15.9382C0.441406 24.3516 2.28764 31.7998 11.2256 31.7998Z"
          fill={`url(#vai-wash-${id})`}
          fillOpacity="0.2"
        />
      )}
      <path
        d="M19.42 10.2305V12.897M20.7437 11.5637H18.0964M10.1546 22.23C10.1546 22.9663 9.56198 23.5633 8.83096 23.5633C8.09994 23.5633 7.50732 22.9663 7.50732 22.23C7.50732 21.4936 8.09994 20.8967 8.83096 20.8967C9.56198 20.8967 10.1546 21.4936 10.1546 22.23Z"
        stroke={ink}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.6763 24.8889L10.8825 19.259L5.29395 16.4444L10.8825 13.6299L13.6763 8L16.4701 13.6299L22.0587 16.4444L16.4701 19.259L13.6763 24.8889ZM8.39042 16.4444L11.9198 18.2305L13.6763 21.786L15.4492 18.2305L18.9787 16.4444L15.4492 14.6749L13.6763 11.1194L11.9198 14.6749L8.39042 16.4444Z"
        fill={ink}
      />
      {!muted && (
        <defs>
          <linearGradient
            id={`vai-wash-${id}`}
            x1="15.0002"
            y1="0.710937"
            x2="15.0002"
            y2="31.7998"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BB00BB" />
            <stop offset="1" stopColor="#2B81FF" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}

function VisionAiNavButton({ active, collapsed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Vision AI"
      aria-label="Vision AI"
      aria-current={active ? 'page' : undefined}
      className={
        collapsed
          ? `nav-vai-collapsed ${active ? 'nav-vai-active' : ''}`
          : `nav-vai w-full ${active ? 'nav-vai-active' : ''}`
      }
    >
      <span className={collapsed ? 'flex h-8 w-8 items-center justify-center' : 'nav-vai-mark'}>
        <VaiMark muted={!active} />
      </span>
      {!collapsed && <span className="nav-vai-label">VAI</span>}
    </button>
  );
}

function NavButton({ item, active, onClick, collapsed }) {
  if (item.module === 'assistant') {
    return <VisionAiNavButton active={active} collapsed={collapsed} onClick={onClick} />;
  }
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

function FolderFlyout({ anchorEl, section, isItemActive, onSelect }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!anchorEl) return undefined;
    const place = () => {
      const rect = anchorEl.getBoundingClientRect();
      const width = 220;
      const estimatedHeight = 16 + section.children.length * 40;
      const top = Math.min(rect.top, window.innerHeight - estimatedHeight - 12);
      setPos({
        top: Math.max(12, top),
        left: Math.min(rect.right + 6, window.innerWidth - width - 12),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorEl, section.children.length]);

  return createPortal(
    <div
      role="menu"
      aria-label={section.label}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[60] min-w-[13.5rem] rounded-2xl border border-line bg-elevated p-1.5 shadow-float"
    >
      {section.children.map((item) => {
        const active = isItemActive(item);
        return (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            onClick={() => onSelect(item)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] interactive ${
              active ? 'nav-item-active-soft text-ink' : 'text-ink-muted hover:bg-surface hover:text-ink'
            }`}
          >
            {item.icon ? (
              <Icon
                name={item.icon}
                size={16}
                className={`shrink-0 ${active ? 'text-ink' : 'text-ink-faint'}`}
              />
            ) : (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-semibold">
                {item.label.charAt(0)}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}

function FolderButton({ section, collapsed, open, active, onToggle, isItemActive, onSelect }) {
  const buttonRef = useRef(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        title={section.label}
        aria-label={section.label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
        className={
          collapsed
            ? `flex h-10 w-10 items-center justify-center rounded-xl ${
                active
                  ? 'nav-item-active text-ink'
                  : open
                    ? 'bg-surface/70 text-ink'
                    : 'text-ink-muted hover:bg-surface hover:text-ink'
              }`
            : `nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] ${
                active
                  ? 'nav-item-active text-ink'
                  : 'text-ink-muted hover:bg-surface hover:text-ink'
              }`
        }
      >
        <Icon
          name={section.icon || section.children?.[0]?.icon || 'grid'}
          size={collapsed ? 18 : 16}
          className={`shrink-0 ${active || open ? 'text-ink' : 'text-ink-faint'}`}
        />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{section.label}</span>
            <Icon
              name="chevronDown"
              size={14}
              className={`shrink-0 ${active ? 'text-ink-muted' : 'text-ink-faint'}`}
            />
          </>
        )}
      </button>
      {open && collapsed && (
        <FolderFlyout
          anchorEl={buttonRef.current}
          section={section}
          isItemActive={isItemActive}
          onSelect={onSelect}
        />
      )}
      {open && !collapsed && (
        <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-line pl-2" role="menu" aria-label={section.label}>
          {section.children.map((item) => {
            const itemActive = isItemActive(item);
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => onSelect(item)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-[13px] interactive ${
                  itemActive ? 'nav-item-active-soft text-ink' : 'text-ink-muted hover:bg-surface hover:text-ink'
                }`}
              >
                {item.icon ? (
                  <Icon
                    name={item.icon}
                    size={15}
                    className={`shrink-0 ${itemActive ? 'text-ink' : 'text-ink-faint'}`}
                  />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-semibold">
                    {item.label.charAt(0)}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
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
  const [openFolder, setOpenFolder] = useState(null);
  const accountRef = useRef(null);
  const shellRef = useRef(null);

  const tree = useMemo(() => filterNavTree(NAV[persona] || [], canNav), [persona, canNav]);

  const activeModule = state.nav.module;
  const activeParams = state.nav.params || {};

  const accounts = accountsQuery.data || [];
  const scopedAccount =
    persona !== 'rehrig'
      ? accounts.find((a) => user?.accountIds?.includes(a.id)) ||
        (persona === 'sp' ? accounts[0] : null)
      : null;

  useEffect(() => {
    if (!open) {
      setOpenFolder(null);
      return;
    }
    const activeSection = tree.find(
      (node) => node.type === 'section' && node.children?.some((item) => isNavItemActive(item, activeModule, activeParams))
    );
    if (activeSection) setOpenFolder(activeSection.label);
  }, [open, tree, activeModule, activeParams]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
      const inShell = shellRef.current?.contains(event.target);
      const inFlyout = event.target.closest?.('[role="menu"]');
      if (!inShell && !inFlyout) setOpenFolder(null);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        setOpenFolder(null);
      }
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
    if (!open) setOpenFolder(null);
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
    <div ref={shellRef} className={`side-nav hidden lg:block ${open ? 'w-[16.5rem]' : 'w-14'}`}>
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
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 scroll-thin ${
            open ? 'space-y-0.5 px-2.5' : 'items-center gap-1 px-1.5'
          }`}
        >
          {tree.map((node) => {
            const pinBottom = node.module === 'notifications' || node.module === 'myNotifications';
            if (node.type === 'item') {
              return (
                <div key={node.key} className={pinBottom ? 'mt-auto pt-2' : undefined}>
                  <NavButton
                    item={node}
                    active={isItemActive(node)}
                    collapsed={!open}
                    onClick={() => goTo(node)}
                  />
                </div>
              );
            }

            const sectionActive = node.children.some((item) => isItemActive(item));
            return (
              <FolderButton
                key={node.label}
                section={node}
                collapsed={!open}
                open={openFolder === node.label}
                active={sectionActive}
                onToggle={() => {
                  setAccountOpen(false);
                  setOpenFolder((current) => (current === node.label ? null : node.label));
                }}
                isItemActive={isItemActive}
                onSelect={goTo}
              />
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
              onClick={() => {
                setOpenFolder(null);
                setAccountOpen((openMenu) => !openMenu);
              }}
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
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-white ${
                  isPreviewingPersona ? 'bg-warn' : 'bg-ink'
                }`}
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
