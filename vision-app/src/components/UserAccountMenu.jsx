import React from 'react';
import Icon from './Icon.jsx';

export default function UserAccountMenu({
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
  className = 'absolute left-0 bottom-full z-40 mb-2 w-64 rounded-panel border border-line bg-surface p-1.5 shadow-float',
}) {
  return (
    <div role="menu" className={className}>
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
