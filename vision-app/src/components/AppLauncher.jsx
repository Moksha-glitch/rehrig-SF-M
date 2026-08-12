import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import {
  Badge,
  Button,
  Field,
  FieldSection,
  FormDrawer,
  Select,
  TextInput,
  TextArea,
} from './UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import {
  useAppLicenseMutations,
  useAppLicenses,
} from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';
import {
  LAUNCHER_APPS,
  LAUNCHER_ITEMS,
  LICENSE_STATUSES,
  LICENSE_TYPES,
} from '../data/appLauncher.js';

function LicenseDrawer({ license, baseline, onChange, onClose, onSave, busy, error, canEdit }) {
  const dirty = JSON.stringify(license) !== JSON.stringify(baseline);
  return (
    <FormDrawer
      open
      onClose={onClose}
      onSubmit={onSave}
      title={license.id ? 'Configure product & license' : 'Add product license'}
      description="Subscription seats, license type, and renewal for installed apps."
      dirty={dirty}
      busy={busy}
      error={error}
      submitLabel={canEdit ? 'Save license' : 'Close'}
      footer={
        canEdit ? undefined : (
          <div className="flex justify-end px-6 py-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )
      }
    >
      <FieldSection title="Product">
        <Field label="Product name" required span2>
          <TextInput
            value={license.productName}
            onChange={(e) => onChange({ ...license, productName: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="App">
          <Select
            options={LAUNCHER_APPS.map((a) => ({ value: a.key, label: a.label }))}
            value={license.appKey}
            onChange={(e) => onChange({ ...license, appKey: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="License type">
          <Select
            options={LICENSE_TYPES}
            value={license.licenseType}
            onChange={(e) => onChange({ ...license, licenseType: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="Status">
          <Select
            options={LICENSE_STATUSES}
            value={license.status}
            onChange={(e) => onChange({ ...license, status: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="Renewal date">
          <TextInput
            type="date"
            value={license.renewalDate || ''}
            onChange={(e) => onChange({ ...license, renewalDate: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="Seats">
          <TextInput
            type="number"
            min="0"
            value={license.seats}
            onChange={(e) => onChange({ ...license, seats: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="Assigned">
          <TextInput
            type="number"
            min="0"
            value={license.assigned}
            onChange={(e) => onChange({ ...license, assigned: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="Notes" span2>
          <TextArea
            rows={3}
            value={license.notes || ''}
            onChange={(e) => onChange({ ...license, notes: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
      </FieldSection>
    </FormDrawer>
  );
}

export default function AppLauncher({ open, onClose }) {
  const { navigate, canAccessModule, persona, toast } = useStore();
  const licensesQuery = useAppLicenses();
  const { upsert } = useAppLicenseMutations();
  const [query, setQuery] = useState('');
  const [viewAll, setViewAll] = useState(false);
  const [licenseDraft, setLicenseDraft] = useState(null);
  const [licenseBaseline, setLicenseBaseline] = useState(null);
  const [saveError, setSaveError] = useState('');
  const canEditLicenses = persona === 'rehrig';

  const licenses = licensesQuery.data || [];

  useEffect(() => {
    if (!open) {
      setQuery('');
      setViewAll(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !licenseDraft) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, licenseDraft]);

  const apps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LAUNCHER_APPS;
    return LAUNCHER_APPS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        (a.subtitle || '').toLowerCase().includes(q)
    );
  }, [query]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LAUNCHER_ITEMS.filter((item) => {
      if (q && !item.label.toLowerCase().includes(q)) return false;
      if (!item.module) return true;
      return canAccessModule(item.module);
    });
  }, [query, canAccessModule]);

  const openLicenseForApp = (app) => {
    const existing = licenses.find((l) => l.appKey === app.key);
    const next = existing || {
      id: null,
      appKey: app.key,
      productName: app.label,
      licenseType: 'Named User',
      seats: 10,
      assigned: 0,
      status: 'Trial',
      renewalDate: '',
      notes: '',
    };
    setLicenseDraft({ ...next });
    setLicenseBaseline({ ...next });
    setSaveError('');
  };

  const goApp = (app) => {
    if (app.configureLicenses) {
      openLicenseForApp(app);
      return;
    }
    if (app.module && canAccessModule(app.module)) {
      navigate(app.module, app.params);
      onClose?.();
      return;
    }
    toast(`You do not have access to ${app.label}`, 'warning');
  };

  const goItem = (item) => {
    if (!item.module || !canAccessModule(item.module)) {
      toast('You do not have access to that item', 'warning');
      return;
    }
    navigate(item.module, item.params);
    onClose?.();
  };

  const saveLicense = async () => {
    if (!canEditLicenses) return;
    if (!licenseDraft.productName?.trim()) {
      setSaveError('Product name is required.');
      return;
    }
    const seats = Number(licenseDraft.seats);
    const assigned = Number(licenseDraft.assigned);
    if (!Number.isFinite(seats) || seats < 0) {
      setSaveError('Seats must be a non-negative number.');
      return;
    }
    if (!Number.isFinite(assigned) || assigned < 0 || assigned > seats) {
      setSaveError('Assigned seats cannot exceed total seats.');
      return;
    }
    try {
      await upsert.mutateAsync({
        ...licenseDraft,
        seats,
        assigned,
        productName: licenseDraft.productName.trim(),
      });
      toast('License configuration saved');
      setLicenseDraft(null);
      setLicenseBaseline(null);
    } catch (error) {
      setSaveError(getErrorMessage(error, 'Unable to save license.'));
    }
  };

  if (!open) return null;

  const panel = viewAll ? (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-ink/45 px-3 pb-6 pt-14 backdrop-blur-[2px] sm:px-6">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="App Launcher"
        className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-5xl flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-float animate-fade-up"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="font-display text-title-sm text-ink">App Launcher</h2>
          <label className="relative min-w-[12rem] flex-1">
            <span className="sr-only">Search apps</span>
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint">
              <Icon name="search" size={13} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps or items…"
              className="w-full rounded-control border border-line bg-elevated/50 py-1.5 pl-8 pr-2 text-sm"
              autoFocus
            />
          </label>
          <Button type="button" variant="secondary" onClick={onClose} aria-label="Close App Launcher">
            <Icon name="x" size={15} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 scroll-thin">
          <p className="mb-3 text-sm font-medium text-ink">All Apps</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <button
                key={app.key}
                type="button"
                onClick={() => goApp(app)}
                className="flex items-start gap-3 rounded-panel border border-line bg-elevated/40 p-3 text-left interactive hover:bg-elevated"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-[10px] font-bold text-white"
                  style={{ background: app.color }}
                >
                  {app.isVision ? 'V' : app.label.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{app.label}</span>
                  {app.subtitle && (
                    <span className="mt-0.5 block text-xs leading-snug text-ink-muted">
                      {app.subtitle}
                    </span>
                  )}
                </span>
                {app.configureLicenses && <Badge color="slate">Licenses</Badge>}
              </button>
            ))}
          </div>
          <p className="mb-2 mt-6 text-sm font-medium text-ink">All Items</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => goItem(item)}
                className="truncate py-1.5 text-left text-sm text-brand interactive hover:underline"
              >
                {item.label}
              </button>
            ))}
          </div>
          {canEditLicenses && (
            <div className="mt-6 border-t border-line pt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Product & license configuration</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    openLicenseForApp(LAUNCHER_APPS.find((a) => a.key === 'yourAcct') || LAUNCHER_APPS[0])
                  }
                >
                  Configure
                </Button>
              </div>
              <ul className="space-y-2">
                {licenses.map((lic) => (
                  <li key={lic.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setLicenseDraft({ ...lic });
                        setLicenseBaseline({ ...lic });
                        setSaveError('');
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-panel border border-line px-3 py-2.5 text-left interactive hover:bg-elevated/70"
                    >
                      <span>
                        <span className="block text-sm font-medium text-ink">{lic.productName}</span>
                        <span className="text-xs text-ink-muted">
                          {lic.licenseType} · {lic.assigned}/{lic.seats} seats
                        </span>
                      </span>
                      <Badge color={lic.status === 'Active' ? 'green' : 'amber'}>{lic.status}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="fixed left-3 top-14 z-40 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-panel border border-line bg-surface shadow-float animate-fade-up">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">App Launcher</h2>
        <button type="button" onClick={onClose} className="rounded-control p-1 text-ink-muted" aria-label="Close">
          <Icon name="x" size={14} />
        </button>
      </div>
      <div className="p-3">
        <label className="relative block">
          <span className="sr-only">Search apps</span>
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint">
            <Icon name="search" size={12} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps and items…"
            className="w-full rounded-control border border-line bg-elevated/50 py-1.5 pl-8 pr-2 text-sm"
            autoFocus
          />
        </label>
      </div>
      <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Apps</p>
      <div className="max-h-[280px] overflow-y-auto pb-2 scroll-thin">
        {apps.slice(0, 6).map((app) => (
          <button
            key={app.key}
            type="button"
            onClick={() => goApp(app)}
            className="flex w-full items-center gap-2.5 px-4 py-1.5 text-left text-sm text-ink interactive hover:bg-elevated"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white"
              style={{ background: app.color }}
            >
              {app.isVision ? 'V' : app.label.slice(0, 1)}
            </span>
            {app.label}
          </button>
        ))}
      </div>
      <div className="border-t border-line">
        <button
          type="button"
          onClick={() => setViewAll(true)}
          className="w-full px-4 py-2.5 text-left text-xs font-medium text-brand interactive hover:bg-elevated"
        >
          View All
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>
      {!viewAll && (
        <button
          type="button"
          className="fixed inset-0 z-[35] cursor-default bg-transparent"
          aria-label="Close app launcher"
          onClick={onClose}
        />
      )}
      {panel}
      {licenseDraft && (
        <LicenseDrawer
          license={licenseDraft}
          baseline={licenseBaseline}
          onChange={(next) => {
            setLicenseDraft(next);
            setSaveError('');
          }}
          onClose={() => {
            setLicenseDraft(null);
            setLicenseBaseline(null);
            setSaveError('');
          }}
          onSave={saveLicense}
          busy={upsert.isPending}
          error={saveError}
          canEdit={canEditLicenses}
        />
      )}
    </>,
    document.body
  );
}
