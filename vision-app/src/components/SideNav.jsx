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

function VaiRow({ active = false, collapsed = false }) {
  const id = React.useId().replace(/:/g, '');
  const ink = active ? '#5DB7E7' : '#64748B';
  return (
    <svg
      width={collapsed ? 48 : 240}
      height={collapsed ? 48 : 49}
      viewBox={collapsed ? '0.5 0 48 48' : '0 0 240 49'}
      fill="none"
      aria-hidden="true"
      className="nav-vai-art"
    >
      {active && (
        <>
          <rect
            x="0.5"
            width="239"
            height="48"
            rx="4"
            fill={`url(#vai-fill-a-${id})`}
            fillOpacity="0.2"
          />
          <rect x="0.5" width="239" height="48" rx="4" fill={`url(#vai-fill-b-${id})`} />
          <rect
            x="0.5"
            width="239"
            height="48"
            rx="4"
            stroke={`url(#vai-stroke-${id})`}
            strokeOpacity="0.15"
          />
          <path
            d="M19.7256 39.7998C28.6635 39.7998 38.059 32.3516 38.059 23.9382C38.059 15.5247 28.6635 8.71094 19.7256 8.71094C10.7876 8.71094 8.94141 15.5247 8.94141 23.9382C8.94141 32.3516 10.7876 39.7998 19.7256 39.7998Z"
            fill={`url(#vai-mark-${id})`}
            fillOpacity="0.2"
          />
        </>
      )}
      <path
        d="M27.92 18.2305V20.897M29.2437 19.5637H26.5964M18.6546 30.23C18.6546 30.9663 18.062 31.5633 17.331 31.5633C16.5999 31.5633 16.0073 30.9663 16.0073 30.23C16.0073 29.4936 16.5999 28.8967 17.331 28.8967C18.062 28.8967 18.6546 29.4936 18.6546 30.23Z"
        stroke={ink}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22.1763 32.8889L19.3825 27.259L13.7939 24.4444L19.3825 21.6299L22.1763 16L24.9701 21.6299L30.5587 24.4444L24.9701 27.259L22.1763 32.8889ZM16.8904 24.4444L20.4198 26.2305L22.1763 29.786L23.9492 26.2305L27.4787 24.4444L23.9492 22.6749L22.1763 19.1194L20.4198 22.6749L16.8904 24.4444Z"
        fill={ink}
      />
      {!collapsed && (
        <path
          d="M50.1506 18.8182L53.1733 27.3892H53.2926L56.3153 18.8182H57.608L53.8693 29H52.5966L48.858 18.8182H50.1506ZM58.7365 29H57.4439L61.1825 18.8182H62.4553L66.1939 29H64.9013L61.8587 20.429H61.7791L58.7365 29ZM59.2138 25.0227H64.424V26.1165H59.2138V25.0227ZM69.0128 18.8182V29H67.7798V18.8182H69.0128Z"
          fill="#64748B"
        />
      )}
      {active && (
        <defs>
          <linearGradient
            id={`vai-fill-a-${id}`}
            x1="120"
            y1="0"
            x2="120"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BB00BB" />
            <stop offset="1" stopColor="#2B81FF" />
          </linearGradient>
          <linearGradient
            id={`vai-fill-b-${id}`}
            x1="0.5"
            y1="24"
            x2="239.5"
            y2="24"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.7" />
            <stop offset="0.504808" stopColor="white" stopOpacity="0.5" />
            <stop offset="1" stopColor="white" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient
            id={`vai-stroke-${id}`}
            x1="183.438"
            y1="6.07321"
            x2="182.051"
            y2="51.1314"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BB00BB" />
            <stop offset="1" stopColor="#2B81FF" />
          </linearGradient>
          <linearGradient
            id={`vai-mark-${id}`}
            x1="23.5002"
            y1="8.71094"
            x2="23.5002"
            y2="39.7998"
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
      className={`nav-vai ${collapsed ? 'nav-vai-collapsed' : ''} ${active ? 'nav-vai-active' : ''}`}
    >
      <VaiRow active={active} collapsed={collapsed} />
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
  const activeParams = state.nav.params;

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
      (node) =>
        node.type === 'section' &&
        node.children?.some((item) => isNavItemActive(item, activeModule, activeParams || {}))
    );
    if (activeSection) setOpenFolder(activeSection.label);
  }, [open, tree, activeModule, activeParams]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
      if (open) return;
      const inShell = shellRef.current?.contains(event.target);
      const inFlyout = event.target.closest?.('[role="menu"]');
      if (!inShell && !inFlyout) setOpenFolder(null);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        if (!open) setOpenFolder(null);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

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
            if (node.type === 'item') {
              return (
                <div key={node.key}>
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
