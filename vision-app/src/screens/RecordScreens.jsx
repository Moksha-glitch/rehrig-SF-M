import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Table,
  Field,
  TextInput,
  TextArea,
  Select,
  Checkbox,
  Button,
  Page,
  PageHeader,
  Panel,
  Modal,
  ConfirmDialog,
  AsyncState,
} from '../components/UI.jsx';
import { RECORD_SCHEMAS } from '../data/recordSchemas.js';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import {
  useCreateRecord,
  useDeleteRecord,
  useRecords,
  useUpdateRecord,
} from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';

function FieldInput({ field, value, onChange, error }) {
  const common = { value: value ?? '', onChange: (e) => onChange(e.target.value) };
  switch (field.type) {
    case 'readonly':
      return (
        <div className="field-input flex items-center bg-elevated text-ink-faint">
          {value || 'Calculated on save'}
        </div>
      );
    case 'textarea':
      return <TextArea rows={2} {...common} />;
    case 'select':
      return <Select options={field.options || []} placeholder="Select…" {...common} />;
    case 'number':
      return <TextInput type="number" {...common} />;
    case 'date':
      return <TextInput type="date" {...common} />;
    case 'time':
      return <TextInput type="time" {...common} />;
    case 'datetime':
      return <TextInput type="datetime-local" {...common} />;
    case 'checkbox':
      return <Checkbox label="Yes" checked={value === true} onChange={(e) => onChange(e.target.checked)} />;
    case 'lookup':
      return (
        <div className="relative">
          <TextInput placeholder="Search…" {...common} />
          <Icon
            name="search"
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
        </div>
      );
    default:
      return <TextInput {...common} aria-invalid={!!error} />;
  }
}

function RecordForm({ schema, initial, onClose, onSave, onDelete }) {
  const [values, setValues] = useState(initial || {});
  const [errors, setErrors] = useState({});
  const save = () => {
    const next = {};
    schema.sections.flatMap((s) => s.fields).forEach((field) => {
      const value = values[field.key];
      if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
        next[field.key] = `${field.label} is required`;
      }
      if (field.type === 'number' && value !== '' && value !== undefined && !Number.isFinite(Number(value))) {
        next[field.key] = `${field.label} must be a number`;
      }
      if (field.key.toLowerCase().includes('email') && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        next[field.key] = 'Enter a valid email address';
      }
    });
    setErrors(next);
    if (!Object.keys(next).length) onSave(values);
  };
  return (
    <Modal onClose={onClose} wide>
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-5 sm:px-8">
        <div className="min-w-0">
          <p className="type-overline">New record</p>
          <h2 className="font-display mt-1.5 text-title-md text-ink sm:text-title-lg">
            {schema.newLabel}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Complete the fields below, then save to create the record.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-control p-2 text-ink-faint interactive hover:bg-elevated hover:text-ink"
          aria-label="Close"
        >
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 scroll-thin sm:px-8 sm:py-7">
        {schema.sections.map((sec, idx) => (
          <div
            key={sec.title}
            className={idx === 0 ? '' : 'mt-8 border-t border-line pt-7'}
          >
            <div className="type-overline mb-4 text-brand">{sec.title}</div>
            <div className="grid grid-cols-1 items-start gap-x-5 gap-y-5 sm:grid-cols-2">
              {sec.fields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  error={errors[field.key]}
                >
                  <FieldInput
                    field={field}
                    value={values[field.key]}
                    error={errors[field.key]}
                    onChange={(value) => {
                      setValues((current) => ({ ...current, [field.key]: value }));
                      setErrors((current) => ({ ...current, [field.key]: undefined }));
                    }}
                  />
                </Field>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2.5 border-t border-line bg-elevated/40 px-6 py-4 sm:px-8">
        {initial && <Button className="mr-auto" variant="secondary" onClick={onDelete}>Delete</Button>}
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save}>
          {initial ? 'Save changes' : 'Create record'}
        </Button>
      </div>
    </Modal>
  );
}

export function GenericList({ kind, view }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('default');
  const [deletePending, setDeletePending] = useState(false);
  const { canCreateRecords, isScoped, state, toast } = useStore();
  const accountsQuery = useAccounts();
  const recordsQuery = useRecords(kind === 'analytics' ? null : kind);
  const createMutation = useCreateRecord(kind);
  const updateMutation = useUpdateRecord(kind);
  const deleteMutation = useDeleteRecord(kind);
  const schema = RECORD_SCHEMAS[kind];
  useEffect(() => {
    setFormOpen(false); setEditing(null); setDeletePending(false); setQ(''); setStatus('All'); setSort('default');
  }, [kind]);

  if (kind === 'analytics') return <Analytics view={view} />;
  if (!schema) {
    return (
      <Page>
        <p className="text-ink-muted">Screen not available.</p>
      </Page>
    );
  }

  const rows = recordsQuery.data?.data || [];
  const scopedAccounts = accountsQuery.data || [];
  const accountNames = new Set(scopedAccounts.map((account) => account.name));
  const statuses = [...new Set(rows.map((row) => row.status).filter(Boolean))];
  const filtered = rows
    .filter((row) => status === 'All' || row.status === status)
    .filter((row) => Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => {
      if (sort === 'asc') return String(a[schema.listColumns[0].key] || '').localeCompare(String(b[schema.listColumns[0].key] || ''));
      if (sort === 'desc') return String(b[schema.listColumns[0].key] || '').localeCompare(String(a[schema.listColumns[0].key] || ''));
      return 0;
    });
  const saveRecord = async (values) => {
    const generated = schema.listColumns[0].key === 'number' && !values.number
      ? { number: `${kind.slice(0, 3).toUpperCase()}-${String(rows.length + 1).padStart(5, '0')}` }
      : {};
    const scopedDefault = isScoped && !values.account ? { account: [...accountNames][0] } : {};
    const accountName = values.account || scopedDefault.account || editing?.account;
    const account = scopedAccounts.find((candidate) => candidate.name === accountName);
    const changes = {
      ...generated,
      ...scopedDefault,
      ...values,
      ...(account ? { accountId: account.id } : {}),
    };
    try {
      if (editing) await updateMutation.mutateAsync({ id: editing.id, changes });
      else await createMutation.mutateAsync(changes);
      toast?.(`${schema.singular} ${editing ? 'updated' : 'created'}`);
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast?.(getErrorMessage(error, `Could not save ${schema.singular.toLowerCase()}.`), 'danger');
    }
  };
  const confirmDelete = async () => {
    if (!editing) return;
    try {
      await deleteMutation.mutateAsync(editing.id);
      toast?.(`${schema.singular} deleted`);
      setDeletePending(false); setFormOpen(false); setEditing(null);
    } catch (error) {
      toast?.(getErrorMessage(error, `Could not delete ${schema.singular.toLowerCase()}.`), 'danger');
    }
  };

  return (
    <Page>
      <PageHeader
        overline="Records"
        title={schema.title}
        description={
          <span>
            <span className="mono tabular-nums">{filtered.length}</span> of {rows.length} records
            {isScoped && state.currentUser?.scopeLabel && (
              <span className="text-ink-faint"> · {state.currentUser.scopeLabel}</span>
            )}
            {!canCreateRecords && <span className="text-ink-faint"> · View only</span>}
          </span>
        }
        actions={
          canCreateRecords ? (
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              <Icon name="plus" size={16} /> {schema.newLabel}
            </Button>
          ) : null
        }
      />

      <AsyncState
        loading={recordsQuery.isLoading}
        error={recordsQuery.isError ? getErrorMessage(recordsQuery.error) : null}
        onRetry={() => recordsQuery.refetch()}
      >
      <Panel>
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <div className="min-w-[220px] flex-1">
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${schema.title.toLowerCase()}…`} />
          </div>
          {statuses.length > 0 && <Select value={status} onChange={(e) => setStatus(e.target.value)} options={['All', ...statuses]} />}
          <select className="field-input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">Default order</option>
            <option value="asc">Name A–Z</option>
            <option value="desc">Name Z–A</option>
          </select>
        </div>
        <Table columns={schema.listColumns.map((c) => c.label)}>
          {filtered.map((row) => (
            <tr key={row.id || row.number || row.name} className="interactive hover:bg-elevated/70">
              {schema.listColumns.map((c, j) => (
                <td key={c.key} className="px-4 py-3">
                  {j === 0 ? (
                    <button type="button" className="link-brand mono text-left" onClick={() => { setEditing(row); setFormOpen(true); }}>
                      {String(row[c.key] ?? '—')}
                    </button>
                  ) : c.key === 'status' ? (
                    <Badge color="cyan">{row[c.key]}</Badge>
                  ) : (
                    <span className="text-ink-muted">{row[c.key]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
          {!filtered.length && (
            <tr><td colSpan={schema.listColumns.length} className="px-4 py-10 text-center text-sm text-ink-muted">
              {q || status !== 'All' ? 'No records match these filters.' : `No ${schema.title.toLowerCase()} in your scope yet.`}
            </td></tr>
          )}
        </Table>
      </Panel>

      {formOpen && <RecordForm schema={schema} initial={editing} onSave={saveRecord} onDelete={() => setDeletePending(true)} onClose={() => { setFormOpen(false); setEditing(null); }} />}
      {deletePending && (
        <ConfirmDialog
          title={`Delete ${schema.singular.toLowerCase()}?`}
          description="This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeletePending(false)}
        />
      )}
      </AsyncState>
    </Page>
  );
}

function Analytics({ view }) {
  const cards = [
    { title: 'Hot Tickets Aging', sub: 'Bar · 8 groups', icon: 'barChart', n: '01' },
    { title: 'SLA % by Account', sub: 'Progress · 6 accounts', icon: 'activity', n: '02' },
    { title: 'Truck Utilization', sub: 'Line · 30d', icon: 'lineChart', n: '03' },
    { title: 'Assets by Family', sub: 'Donut · 8 groups', icon: 'package', n: '04' },
    { title: 'Dispatches by Day', sub: 'Area · 7d', icon: 'activity', n: '05' },
    { title: 'Providers Map', sub: 'Map · 6 cities', icon: 'mapPin', n: '06' },
  ];
  return (
    <Page>
      <PageHeader
        overline="Insights"
        title="Analytics"
        description={view === 'dashboards' ? 'Dashboards' : 'Reports · 13 saved'}
      />
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="bg-surface p-5 interactive hover:bg-elevated/40">
            <div className="flex items-start justify-between">
              <span className="mono text-xs text-ink-faint">{c.n}</span>
              <Icon name={c.icon} size={16} className="text-ink-faint" />
            </div>
            <div className="mt-4 font-display text-title-sm text-ink">{c.title}</div>
            <div className="mt-1 text-xs text-ink-muted">{c.sub}</div>
            <div
              className="mt-4 h-20 border border-line bg-[linear-gradient(to_right,#e6ebe8_1px,transparent_1px),linear-gradient(to_bottom,#e6ebe8_1px,transparent_1px)]"
              style={{ backgroundSize: '16px 16px' }}
            />
            <p className="mt-3 text-[11px] text-ink-faint">Preview based on seeded demo records · not live telemetry</p>
          </div>
        ))}
      </div>
    </Page>
  );
}
