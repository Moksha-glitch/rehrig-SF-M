import React, { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { NAV, filterNavTree, isNavItemActive } from './navConfig.js';

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
    </button>
  );
}

export default function SideNav() {
  const { state, persona, navigate, canNav, isScoped } = useStore();
  const accountsQuery = useAccounts();
  const user = state.currentUser;

  const tree = useMemo(() => filterNavTree(NAV[persona] || [], canNav), [persona, canNav]);
  const [collapsedSections, setCollapsedSections] = useState({});

  const activeModule = state.nav.module;
  const activeParams = state.nav.params || {};

  const accounts = accountsQuery.data || [];
  const scopedAccount =
    persona !== 'rehrig'
      ? accounts.find((a) => user?.accountIds?.includes(a.id)) ||
        (persona === 'sp' ? accounts[0] : null)
      : null;

  if (!tree.length) return null;

  return (
    <aside
      className="hidden w-[16rem] shrink-0 flex-col border-r border-line bg-surface/95 lg:flex"
      aria-label="Main navigation"
    >
      {scopedAccount && (
        <div className="mx-3 mt-3 rounded-panel border border-line bg-elevated/70 px-3.5 py-3">
          <div className="type-overline">Service Provider</div>
          <div className="mt-1 truncate text-sm font-semibold text-ink">{scopedAccount.name}</div>
          {isScoped && user?.scopeLabel && (
            <div className="mt-1 text-[11px] text-ink-muted">{user.scopeLabel}</div>
          )}
        </div>
      )}

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3 scroll-thin">
        {tree.map((node) => {
          if (node.type === 'item') {
            return (
              <NavButton
                key={node.key}
                item={node}
                active={isNavItemActive(node, activeModule, activeParams)}
                onClick={() => navigate(node.module, node.params)}
              />
            );
          }

          const expanded = !collapsedSections[node.label];
          return (
            <div key={node.label} className="pt-3">
              <button
                type="button"
                onClick={() =>
                  setCollapsedSections((prev) => ({ ...prev, [node.label]: expanded }))
                }
                aria-expanded={expanded}
                className="mb-1 flex w-full items-center justify-between px-3 py-1 type-overline interactive hover:text-ink-muted"
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
                      active={isNavItemActive(item, activeModule, activeParams)}
                      onClick={() => navigate(item.module, item.params)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
