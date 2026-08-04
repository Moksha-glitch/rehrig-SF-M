import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

// ---- Page chrome (Editorial Ops · Premium) ----
export function Page({ children, wide = false, className = '' }) {
  return (
    <div
      className={`mx-auto animate-fade-up px-6 py-8 sm:px-8 sm:py-10 ${wide ? 'max-w-7xl' : 'max-w-6xl'} ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({ overline, title, description, actions, meta }) {
  return (
    <header className="mb-8 sm:mb-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 max-w-2xl">
          {overline && <p className="type-overline mb-2.5">{overline}</p>}
          <h1 className="font-display text-display-md text-ink sm:text-[2.15rem]">{title}</h1>
          {description && (
            <div className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink-muted">{description}</div>
          )}
          {meta && <div className="mt-2 text-sm text-ink-muted">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="hairline-rule mt-7 animate-rule-draw" />
    </header>
  );
}

export function Panel({ children, className = '', padded = false, hover = false }) {
  return (
    <div
      className={`surface-panel ${hover ? 'surface-panel-hover' : ''} ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Stat({ label, value, hint, icon, tint = 'bg-elevated text-ink-soft' }) {
  return (
    <div className="surface-panel surface-panel-hover p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="type-overline">{label}</p>
        {icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-control ${tint}`}>
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <p className="font-display mt-4 text-[2rem] font-semibold tracking-tight text-ink tabular-nums leading-none">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-relaxed text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Compact KPI strip used on home / registry dashboards */
export function StatStrip({ items }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((k, i) => (
        <div
          key={k.label}
          className="surface-panel surface-panel-hover animate-fade-up p-5"
          style={{ animationDelay: `${i * 45}ms` }}
        >
          <p className="type-overline">{k.label}</p>
          <p className="font-display mt-3 text-[1.85rem] font-semibold tracking-tight text-ink tabular-nums leading-none">
            {k.value}
          </p>
          {k.hint && <p className="mt-2 text-xs leading-relaxed text-ink-muted">{k.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function Toolbar({ children, className = '' }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 border-b border-line bg-elevated/40 px-4 py-3.5 sm:px-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative max-w-sm flex-1 ${className}`}>
      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-ink-faint">
        <Icon name="search" size={15} />
      </span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border-0 border-b border-line bg-transparent py-2 pl-7 pr-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-0"
      />
    </div>
  );
}

// ---- Badges ----
export function Badge({ children, color = 'slate', className = '' }) {
  const colors = {
    slate: 'bg-elevated text-ink-muted border-line',
    amber: 'bg-warn-soft text-warn border-line',
    cyan: 'bg-brand-soft text-brand-ink border-line',
    rose: 'bg-danger-soft text-danger border-line',
    emerald: 'bg-success-soft text-success border-line',
    sky: 'bg-brand-soft text-brand-ink border-line',
    green: 'bg-success-soft text-success border-line',
    blue: 'bg-brand-soft text-brand-ink border-line',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-control border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export function AccountBadges({ account }) {
  return (
    <>
      {account.paymentRequired && <Badge color="amber">Pay-gated</Badge>}
      {account.apiIntegrated && <Badge color="cyan">API</Badge>}
      {account.onboardingComplete === false && <Badge color="rose">Onboarding incomplete</Badge>}
    </>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`surface-panel ${className}`}>{children}</div>;
}

export function BoolCell({ value }) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 text-success" title="Yes">
      <Icon name="check" size={16} aria-hidden="true" />
      <span className="sr-only">Yes</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-ink-faint" title="No">
      <Icon name="x" size={16} aria-hidden="true" />
      <span className="sr-only">No</span>
    </span>
  );
}

export function Dash() {
  return <span className="text-ink-faint">—</span>;
}

export function StatusDot({ color = 'emerald', label }) {
  const colors = {
    emerald: 'bg-success',
    slate: 'bg-ink-faint',
    amber: 'bg-warn',
    rose: 'bg-danger',
    cyan: 'bg-brand',
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${colors[color]}`} />
      {label && <span className="text-sm text-ink-muted">{label}</span>}
    </span>
  );
}

export function Button({ variant = 'secondary', children, className = '', ...rest }) {
  const variants = {
    primary: 'btn-primary',
    accent: 'btn-brand',
    success:
      'inline-flex items-center justify-center gap-1.5 rounded-control bg-success px-3.5 py-2 text-sm font-semibold text-white interactive hover:brightness-95 disabled:opacity-50',
    secondary: 'btn-secondary',
    ghost:
      'inline-flex items-center justify-center gap-1.5 rounded-control px-3.5 py-2 text-sm font-medium text-ink-muted interactive hover:bg-elevated hover:text-ink',
  };
  return (
    <button className={`${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Field({
  label,
  required,
  children,
  className = '',
  span2 = false,
  id,
  error,
  hint,
}) {
  const generatedId = useId();
  const controlId = id || `field-${generatedId.replace(/:/g, '')}`;
  const childArray = React.Children.toArray(children);
  const inputChild = childArray.find(React.isValidElement) || null;
  const resolvedId =
    (React.isValidElement(inputChild) && inputChild.props.id) || controlId;
  const errorId = `${resolvedId}-error`;
  const hintId = `${resolvedId}-hint`;
  const control = childArray.map((child) => {
    if (!React.isValidElement(child) || child !== inputChild) return child;
    return React.cloneElement(child, {
      id: resolvedId,
      'aria-invalid': error ? true : child.props['aria-invalid'],
      'aria-describedby':
        [child.props['aria-describedby'], hint ? hintId : '', error ? errorId : '']
          .filter(Boolean)
          .join(' ') || undefined,
      required: required || child.props.required,
    });
  });
  return (
    <div className={`min-w-0 ${span2 ? 'sm:col-span-2' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={resolvedId}
          className="type-overline mb-2 flex min-h-[1rem] items-center gap-1"
        >
          <span>{label}</span>
          {required && (
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {control}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase = 'field-input disabled:cursor-not-allowed';

export function TextInput({ className = '', ...rest }) {
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function TextArea({ className = '', rows = 2, ...rest }) {
  return <textarea rows={rows} className={`${inputBase} resize-y ${className}`} {...rest} />;
}

export function Select({ options = [], className = '', placeholder, ...rest }) {
  return (
    <select className={`${inputBase} ${className}`} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({ label, checked, onChange, className = '' }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-sm text-ink-soft ${className}`}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand/30"
      />
      {label}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label = 'Toggle setting',
  className = '',
  ...rest
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-snappy ease-out ${
        checked ? 'bg-brand' : 'bg-line-strong'
      } ${disabled ? 'opacity-50' : ''} ${className}`}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform duration-snappy ease-out ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export const Toggle = Switch;

export function Tabs({ items, value, onChange, label = 'Sections', className = '' }) {
  const onKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    onChange(items[next].key);
    event.currentTarget.parentElement?.children[next]?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex gap-1 overflow-x-auto border-b border-line ${className}`}
    >
      {items.map((item, index) => {
        const selected = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
              selected
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function Table({ columns, children, className = '', caption, label }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm" aria-label={caption ? undefined : label}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line bg-elevated/30">
            {columns.map((c, i) => (
              <th
                key={typeof c === 'object' ? c.key || c.label : `${c}-${i}`}
                scope="col"
                className="type-overline px-4 py-3.5 font-semibold sm:px-5"
              >
                {typeof c === 'object' ? c.label : c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Dialog({
  children,
  onClose,
  wide = false,
  title,
  description,
  className = '',
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    (focusable || dialog)?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
      }
      if (event.key !== 'Tab' || !dialog) return;
      const items = [...dialog.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-ink/45 backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={title ? undefined : 'Dialog'}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[min(90vh,860px)] w-full flex-col overflow-hidden rounded-sheet border border-line bg-surface shadow-float animate-fade-up ${
          wide ? 'max-w-4xl' : 'max-w-lg'
        } ${className}`}
      >
        {(title || description) && (
          <div className="shrink-0 border-b border-line px-6 py-5">
            {title && (
              <h2 id={titleId} className="font-display text-title-md text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export const Modal = Dialog;

export function ConfirmDialog({
  open = true,
  title = 'Confirm action',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  severity = 'danger',
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) return null;
  return (
    <Dialog title={title} description={description} onClose={onCancel}>
      <div className="flex justify-end gap-2.5 px-6 py-4">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          variant={severity === 'danger' ? 'primary' : 'accent'}
          className={severity === 'danger' ? 'bg-danger hover:bg-danger' : ''}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
  icon = 'search',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center px-6 py-12 text-center ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-ink-muted">
        <Icon name={icon} size={18} />
      </span>
      <h3 className="mt-3 font-display text-title-sm text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function AsyncState({
  status,
  loading = false,
  error,
  empty = false,
  onRetry,
  children,
  emptyTitle,
  emptyDescription,
}) {
  const current = status || (loading ? 'loading' : error ? 'error' : empty ? 'empty' : 'success');
  if (current === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-ink-muted" role="status">
        <span className="loading-spinner" aria-hidden="true" /> Loading…
      </div>
    );
  }
  if (current === 'error') {
    return (
      <EmptyState
        icon="alert"
        title="Unable to load data"
        description={typeof error === 'string' ? error : 'Try again in a moment.'}
        action={onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
      />
    );
  }
  if (current === 'empty') {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return children;
}

export function Toast({ message, onDismiss }) {
  if (!message) return null;
  const payload = typeof message === 'string' ? { message, severity: 'success' } : message;
  const severity = payload.severity || 'success';
  const styles = {
    success: { icon: 'checkCircle', iconClass: 'text-success', role: 'status', live: 'polite' },
    info: { icon: 'info', iconClass: 'text-brand-soft', role: 'status', live: 'polite' },
    warning: { icon: 'alert', iconClass: 'text-warn', role: 'alert', live: 'assertive' },
    warn: { icon: 'alert', iconClass: 'text-warn', role: 'alert', live: 'assertive' },
    error: { icon: 'alert', iconClass: 'text-danger-soft', role: 'alert', live: 'assertive' },
    danger: { icon: 'alert', iconClass: 'text-danger-soft', role: 'alert', live: 'assertive' },
  };
  const style = styles[severity] || styles.info;
  return (
    <div
      className="fixed bottom-6 left-1/2 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 animate-fade-up"
      role={style.role}
      aria-live={style.live}
      aria-atomic="true"
    >
      <div className="flex items-center gap-2.5 rounded-control border border-ink/10 bg-ink px-4 py-3 text-sm font-medium text-white shadow-float">
        <Icon name={style.icon} size={16} className={style.iconClass} />
        <span className="min-w-0 flex-1">{payload.message}</span>
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
            <Icon name="x" size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export function SectionLabel({ children, className = '' }) {
  return <div className={`type-overline ${className}`}>{children}</div>;
}
