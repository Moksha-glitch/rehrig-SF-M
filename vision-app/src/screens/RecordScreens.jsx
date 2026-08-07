import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  FormDrawer,
  DrawerActions,
  FieldSection,
  ConfirmDialog,
  AsyncState,
} from '../components/UI.jsx';
import {
  ASSET_ACTIONS,
  RECORD_SCHEMAS,
  YARD_MOVE_STATUSES,
} from '../data/recordSchemas.js';
import { PICKLISTS } from '../data/picklists.js';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import {
  useCreateRecord,
  useDeleteRecord,
  useRecords,
  useUpdateRecord,
} from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';
import ReportsStudio from './ReportsStudio.jsx';

function FieldInput({ field, value, onChange, error, disabled = false }) {
  const common = { value: value ?? '', onChange: (e) => onChange(e.target.value), disabled };
  if (disabled && field.type !== 'readonly') {
    return (
      <div className="field-input flex items-center bg-elevated text-ink-muted">
        {value === true ? 'Yes' : value === false ? 'No' : String(value ?? '') || '—'}
      </div>
    );
  }
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
      return (
        <Checkbox
          label="Yes"
          checked={value === true || value === 'Yes' || value === 'true'}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
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

function RecordForm({ schema, initial, onClose, onSave, onDelete, readOnly = false }) {
  const [values, setValues] = useState(initial || {});
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (readOnly) return;
    const next = {};
    schema.sections.flatMap((s) => s.fields).forEach((field) => {
      const value = values[field.key];
      if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
        next[field.key] = `${field.label} is required`;
      }
      if (field.type === 'number' && value !== '' && value !== undefined && value !== null && !Number.isFinite(Number(value))) {
        next[field.key] = `${field.label} must be a number`;
      }
      if (field.key.toLowerCase().includes('email') && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        next[field.key] = 'Enter a valid email address';
      }
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setSaveError('');
    try {
      await onSave(values);
    } catch (error) {
      setSaveError(getErrorMessage(error, `Could not save ${schema.singular.toLowerCase()}.`));
    } finally {
      setBusy(false);
    }
  };
  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={save}
      wide
      title={
        readOnly
          ? `${schema.singular} details`
          : initial
            ? `Edit ${schema.singular.toLowerCase()}`
            : schema.newLabel
      }
      description={
        readOnly
          ? 'Your role has view-only access to these records.'
          : initial
            ? 'Update the fields below, then save your changes.'
            : 'Complete the fields below, then save to create the record.'
      }
      dirty={!readOnly && JSON.stringify(values) !== JSON.stringify(initial || {})}
      busy={busy}
      error={saveError}
      submitLabel={initial ? 'Save changes' : 'Create record'}
      footer={
        readOnly ? (
          <DrawerActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </DrawerActions>
        ) : undefined
      }
    >
      {schema.sections.map((sec, idx) => (
        <FieldSection
          key={sec.title}
          title={sec.title}
          className={idx === 0 ? '' : 'border-t border-line pt-5'}
        >
          {sec.fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              required={field.required}
              error={errors[field.key]}
              span2={!!field.span2 || field.type === 'textarea'}
            >
              <FieldInput
                field={field}
                value={values[field.key]}
                error={errors[field.key]}
                disabled={readOnly}
                onChange={(value) => {
                  setValues((current) => ({ ...current, [field.key]: value }));
                  setErrors((current) => ({ ...current, [field.key]: undefined }));
                }}
              />
            </Field>
          ))}
        </FieldSection>
      ))}
      {initial && !readOnly && (
        <div className="border-t border-line pt-5">
          <p className="mb-3 text-sm text-ink-muted">
            Deleting this {schema.singular.toLowerCase()} cannot be undone.
          </p>
          <Button type="button" variant="secondary" onClick={onDelete} disabled={busy}>
            Delete {schema.singular.toLowerCase()}
          </Button>
        </div>
      )}
    </FormDrawer>
  );
}

function AssetActionMenu({ onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="secondary"
        className="!px-2.5 !py-1.5 text-xs"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        Actions <Icon name="chevronDown" size={12} />
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-panel border border-line bg-surface shadow-lg">
          {ASSET_ACTIONS.filter((action) => action.key !== 'assignNew').map((action) => (
            <button
              key={action.key}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-ink interactive hover:bg-elevated"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onSelect(action.key);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignAssetDrawer({ accounts, defaultAccount, onClose, onAssign }) {
  const [serial, setSerial] = useState('');
  const [account, setAccount] = useState(defaultAccount || accounts[0]?.name || '');
  const [location, setLocation] = useState('');
  const [product, setProduct] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const baseline = useMemo(
    () => ({ serial: '', account: defaultAccount || accounts[0]?.name || '', location: '', product: '' }),
    [accounts, defaultAccount]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!serial.trim()) {
      setError('Asset serial number is required.');
      return;
    }
    if (!account.trim()) {
      setError('Account is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onAssign({
        serial: serial.trim(),
        account: account.trim(),
        location: location.trim(),
        product: product.trim() || '96 Gallon Trash',
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not assign asset.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={submit}
      title="Assign New Asset"
      description="Search by serial number. If not found, a new asset record is created and assigned."
      dirty={
        serial !== baseline.serial ||
        account !== baseline.account ||
        location !== baseline.location ||
        product !== baseline.product
      }
      busy={busy}
      error={error}
      submitLabel="Assign"
    >
      <FieldSection title="Assignment">
        <Field label="Asset Serial Number" required span2>
          <TextInput value={serial} onChange={(e) => setSerial(e.target.value)} autoFocus placeholder="SN-…" />
        </Field>
        <Field label="Account" required>
          <Select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            options={accounts.map((a) => a.name)}
            placeholder="Select account"
          />
        </Field>
        <Field label="Customer Location">
          <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location name or #" />
        </Field>
        <Field label="Product" span2>
          <TextInput value={product} onChange={(e) => setProduct(e.target.value)} placeholder="96 Gallon Trash" />
        </Field>
      </FieldSection>
    </FormDrawer>
  );
}

function AssetActionDrawer({ action, asset, accounts, yardLocations, onClose, onSave, onEditFull }) {
  const meta = {
    editAsset: {
      title: `Edit Asset ${asset.serial || asset.name || ''}`,
      description: 'Update asset fields. Tracked changes are reflected on the asset record.',
      submitLabel: 'Save changes',
    },
    moveToYard: {
      title: `Move To Yard · ${asset.serial || asset.name || ''}`,
      description: 'Move this asset to a yard location and optionally update its status.',
      submitLabel: 'Confirm move',
    },
    moveToAccount: {
      title: `Move ${asset.serial || asset.name || ''} to Another Account`,
      description: 'Transfer this asset to a different service provider account.',
      submitLabel: 'Confirm move',
    },
    markLost: {
      title: `Mark Asset ${asset.serial || asset.name || ''} as Lost`,
      description: 'Set the asset status to Lost. Optionally record a yard or scrap status.',
      submitLabel: 'Mark Lost',
    },
    reactivate: {
      title: `Reactivate ${asset.serial || asset.name || ''}`,
      description: 'Return this asset to active inventory / in-service status.',
      submitLabel: 'Reactivate',
    },
    deactivate: {
      title: `Deactivate ${asset.serial || asset.name || ''}`,
      description: 'Decommission this asset. Related open work may be closed in a full deployment.',
      submitLabel: 'Deactivate',
    },
  }[action];

  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState(
    action === 'markLost'
      ? 'Lost'
      : action === 'reactivate'
        ? 'In Service'
        : action === 'deactivate'
          ? 'Decommissioned Tag'
          : asset.status || ''
  );
  const [name, setName] = useState(asset.name || '');
  const [product, setProduct] = useState(asset.product || '');
  const [serial, setSerial] = useState(asset.serial || '');
  const [location, setLocation] = useState(asset.location || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!meta) return null;

  if (action === 'editAsset' && onEditFull) {
    // Full schema edit is handled by RecordForm; this branch is a short cut confirmation.
  }

  const needsDestination = action === 'moveToYard' || action === 'moveToAccount';
  const needsStatus = action === 'moveToYard' || action === 'markLost' || action === 'reactivate' || action === 'deactivate';
  const isEdit = action === 'editAsset';

  const submit = async (e) => {
    e.preventDefault();
    if (needsDestination && !destination.trim()) {
      setError(action === 'moveToYard' ? 'Select a yard location.' : 'Select a destination account.');
      return;
    }
    if (needsStatus && !status.trim()) {
      setError('Asset status is required.');
      return;
    }
    if (isEdit && !name.trim()) {
      setError('Asset name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const changes = {};
      if (isEdit) {
        changes.name = name.trim();
        changes.product = product.trim();
        changes.serial = serial.trim();
        changes.location = location.trim();
        changes.status = status || asset.status;
      }
      if (action === 'moveToYard') {
        changes.location = destination;
        changes.warehouse = destination;
        changes.status = status;
      }
      if (action === 'moveToAccount') {
        changes.account = destination;
        const match = accounts.find((a) => a.name === destination);
        if (match) changes.accountId = match.id;
      }
      if (action === 'markLost') {
        changes.status = status || 'Lost';
      }
      if (action === 'reactivate') {
        changes.status = status || 'In Service';
      }
      if (action === 'deactivate') {
        changes.status = status || 'Decommissioned Tag';
        changes.usageEndDate = new Date().toISOString().slice(0, 10);
      }
      await onSave(changes, meta.title);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not complete asset action.'));
    } finally {
      setBusy(false);
    }
  };

  const yardOptions = yardLocations.length
    ? yardLocations
    : ['Kennedale', 'Edmonton AB Other Yard', 'Other Yard_Location Name'];

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={submit}
      title={meta.title}
      description={meta.description}
      dirty
      busy={busy}
      error={error}
      submitLabel={meta.submitLabel}
      wide={isEdit}
    >
      <FieldSection title="Asset">
        <Field label="Current asset" span2>
          <div className="field-input bg-elevated text-ink-muted">
            {asset.name || '—'} · {asset.serial || 'no serial'} · {asset.status || '—'}
          </div>
        </Field>
        {isEdit && (
          <>
            <Field label="Asset Name" required>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Serial Number">
              <TextInput value={serial} onChange={(e) => setSerial(e.target.value)} />
            </Field>
            <Field label="Product">
              <TextInput value={product} onChange={(e) => setProduct(e.target.value)} />
            </Field>
            <Field label="Customer Location">
              <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <Field label="Asset Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} options={PICKLISTS.assetStatus} />
            </Field>
            {onEditFull && (
              <div className="sm:col-span-2">
                <Button type="button" variant="secondary" onClick={onEditFull}>
                  Open full asset form
                </Button>
              </div>
            )}
          </>
        )}
        {action === 'moveToYard' && (
          <Field label="Move To Location" required span2>
            <Select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              options={yardOptions}
              placeholder="Select a Location"
            />
          </Field>
        )}
        {action === 'moveToAccount' && (
          <Field label="Destination Account" required span2>
            <Select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              options={accounts.map((a) => a.name)}
              placeholder="Select account"
            />
          </Field>
        )}
        {needsStatus && !isEdit && (
          <Field label="Asset Status" required span2>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={
                action === 'moveToYard' || action === 'markLost'
                  ? [...new Set([...YARD_MOVE_STATUSES, 'Lost', ...PICKLISTS.assetStatus])]
                  : action === 'reactivate'
                    ? ['Available', 'In Service', 'Inventory', 'New']
                    : ['Decommissioned Tag', 'Scrapped', 'To Be Scrapped', 'Lost', ...PICKLISTS.assetStatus]
              }
              placeholder="Select Asset Status"
            />
          </Field>
        )}
        {action === 'deactivate' && (
          <p className="sm:col-span-2 text-sm text-ink-muted">
            Deactivation sets a usage end date and marks the asset out of service. In production, open work orders at the
            location would be closed and Remove WOs created.
          </p>
        )}
      </FieldSection>
    </FormDrawer>
  );
}

export function GenericList({ kind, view }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('default');
  const [deletePending, setDeletePending] = useState(false);
  const [assetAction, setAssetAction] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const { canCreateRecords, isScoped, state, toast } = useStore();
  const accountsQuery = useAccounts();
  const recordsQuery = useRecords(kind === 'analytics' ? null : kind);
  const locationsQuery = useRecords(kind === 'assets' ? 'locations' : null);
  const createMutation = useCreateRecord(kind);
  const updateMutation = useUpdateRecord(kind);
  const deleteMutation = useDeleteRecord(kind);
  const createAssetMutation = useCreateRecord('assets');
  const updateAssetMutation = useUpdateRecord('assets');
  const schema = RECORD_SCHEMAS[kind];
  useEffect(() => {
    setFormOpen(false);
    setEditing(null);
    setDeletePending(false);
    setAssetAction(null);
    setAssignOpen(false);
    setQ('');
    setStatus('All');
    setSort('default');
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
  const yardLocations = (locationsQuery.data?.data || [])
    .filter((loc) => /yard/i.test(String(loc.type || loc.name || '')))
    .map((loc) => loc.name)
    .filter(Boolean);
  const filtered = rows
    .filter((row) => status === 'All' || row.status === status)
    .filter((row) =>
      Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q.trim().toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === 'asc') return String(a[schema.listColumns[0].key] || '').localeCompare(String(b[schema.listColumns[0].key] || ''));
      if (sort === 'desc') return String(b[schema.listColumns[0].key] || '').localeCompare(String(a[schema.listColumns[0].key] || ''));
      return 0;
    });

  const saveRecord = async (values) => {
    if (!canCreateRecords) {
      toast?.('Your role does not allow changes to these records.', 'danger');
      return;
    }
    const generated =
      schema.listColumns[0].key === 'number' && !values.number
        ? { number: `${kind.slice(0, 3).toUpperCase()}-${String(rows.length + 1).padStart(5, '0')}` }
        : {};
    const tipId =
      kind === 'individualTips' && !values.id
        ? { id: `TIP-${String(Date.now()).slice(-5)}` }
        : {};
    const tipName =
      kind === 'individualTips' && !values.name
        ? { name: values.id || tipId.id || `Tip ${rows.length + 1}` }
        : {};
    const aggName =
      kind === 'aggregatedTips' && !values.name
        ? { name: `AGG-${values.date || 'new'}-${values.truck || rows.length + 1}` }
        : {};
    const scopedDefault = isScoped && !values.account ? { account: [...accountNames][0] } : {};
    const accountName = values.account || scopedDefault.account || editing?.account;
    const account = scopedAccounts.find((candidate) => candidate.name === accountName);
    const changes = {
      ...generated,
      ...tipId,
      ...tipName,
      ...aggName,
      ...scopedDefault,
      ...values,
      ...(account ? { accountId: account.id } : {}),
      ...(kind === 'assets' && !values.recordType ? { recordType: 'Asset' } : {}),
      ...(kind === 'individualTips' && !values.recordType
        ? { recordType: 'Individual Telematics Events' }
        : {}),
    };
    try {
      if (editing) await updateMutation.mutateAsync({ id: editing.id, changes });
      else await createMutation.mutateAsync(changes);
      toast?.(`${schema.singular} ${editing ? 'updated' : 'created'}`);
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast?.(getErrorMessage(error, `Could not save ${schema.singular.toLowerCase()}.`), 'danger');
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!editing) return;
    if (!canCreateRecords) {
      toast?.('Your role does not allow deleting records.', 'danger');
      setDeletePending(false);
      return;
    }
    try {
      await deleteMutation.mutateAsync(editing.id);
      toast?.(`${schema.singular} deleted`);
      setDeletePending(false);
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast?.(getErrorMessage(error, `Could not delete ${schema.singular.toLowerCase()}.`), 'danger');
    }
  };

  const applyAssetAction = async (changes) => {
    if (!assetAction?.asset?.id || !canCreateRecords) return;
    await updateAssetMutation.mutateAsync({ id: assetAction.asset.id, changes });
    toast?.(`Asset ${assetAction.asset.serial || assetAction.asset.name} updated`);
    setAssetAction(null);
    recordsQuery.refetch?.();
  };

  const assignAsset = async ({ serial, account, location, product }) => {
    if (!canCreateRecords) throw new Error('Your role does not allow assigning assets.');
    const existing = rows.find(
      (row) => String(row.serial || '').toLowerCase() === serial.toLowerCase()
    );
    const accountRec = scopedAccounts.find((candidate) => candidate.name === account);
    if (existing) {
      await updateAssetMutation.mutateAsync({
        id: existing.id,
        changes: {
          account,
          ...(accountRec ? { accountId: accountRec.id } : {}),
          location: location || existing.location,
          status: existing.status === 'Lost' || existing.status === 'Decommissioned Tag' ? 'In Service' : existing.status || 'In Service',
        },
      });
      toast?.(`Asset ${serial} assigned to ${account}`);
    } else {
      await createAssetMutation.mutateAsync({
        name: serial,
        serial,
        account,
        ...(accountRec ? { accountId: accountRec.id } : {}),
        location,
        product,
        status: 'In Service',
        recordType: 'Asset',
      });
      toast?.(`Asset ${serial} created and assigned`);
    }
    setAssignOpen(false);
    recordsQuery.refetch?.();
  };

  const showAssetActions = kind === 'assets' && canCreateRecords;
  const columns = showAssetActions
    ? [...schema.listColumns.map((c) => c.label), 'Actions']
    : schema.listColumns.map((c) => c.label);

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
            <div className="flex flex-wrap gap-2">
              {kind === 'assets' && (
                <Button variant="secondary" onClick={() => setAssignOpen(true)}>
                  <Icon name="plus" size={16} /> Assign New Asset
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Icon name="plus" size={16} /> {schema.newLabel}
              </Button>
            </div>
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
              <TextInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${schema.title.toLowerCase()}…`}
              />
            </div>
            {statuses.length > 0 && (
              <Select value={status} onChange={(e) => setStatus(e.target.value)} options={['All', ...statuses]} />
            )}
            <select className="field-input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="default">Default order</option>
              <option value="asc">Name A–Z</option>
              <option value="desc">Name Z–A</option>
            </select>
          </div>
          <Table columns={columns}>
            {filtered.map((row) => (
              <tr key={row.id || row.number || row.name} className="interactive hover:bg-elevated/70">
                {schema.listColumns.map((c, j) => (
                  <td key={c.key} className="px-4 py-3">
                    {j === 0 ? (
                      <button
                        type="button"
                        className="link-brand mono text-left"
                        onClick={() => {
                          setEditing(row);
                          setFormOpen(true);
                        }}
                      >
                        {String(row[c.key] ?? '—')}
                      </button>
                    ) : c.key === 'status' ? (
                      <Badge color="cyan">{row[c.key]}</Badge>
                    ) : c.key === 'active' ? (
                      <span className="text-ink-muted">
                        {row[c.key] === true || row[c.key] === 'Yes' ? 'Yes' : 'No'}
                      </span>
                    ) : (
                      <span className="text-ink-muted">{row[c.key]}</span>
                    )}
                  </td>
                ))}
                {showAssetActions && (
                  <td className="px-4 py-3 text-right">
                    <AssetActionMenu
                      onSelect={(actionKey) => {
                        if (actionKey === 'editAsset') {
                          setEditing(row);
                          setFormOpen(true);
                          return;
                        }
                        setAssetAction({ kind: actionKey, asset: row });
                      }}
                    />
                  </td>
                )}
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-ink-muted">
                  {q || status !== 'All'
                    ? 'No records match these filters.'
                    : `No ${schema.title.toLowerCase()} in your scope yet.`}
                </td>
              </tr>
            )}
          </Table>
        </Panel>

        {formOpen && (
          <RecordForm
            schema={schema}
            initial={editing}
            readOnly={!canCreateRecords}
            onSave={saveRecord}
            onDelete={() => setDeletePending(true)}
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        )}
        {deletePending && (
          <ConfirmDialog
            title={`Delete ${schema.singular.toLowerCase()}?`}
            description="This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setDeletePending(false)}
            busy={deleteMutation.isPending}
          />
        )}
        {assignOpen && (
          <AssignAssetDrawer
            accounts={scopedAccounts}
            defaultAccount={isScoped ? [...accountNames][0] : ''}
            onClose={() => setAssignOpen(false)}
            onAssign={assignAsset}
          />
        )}
        {assetAction && (
          <AssetActionDrawer
            action={assetAction.kind}
            asset={assetAction.asset}
            accounts={scopedAccounts}
            yardLocations={yardLocations}
            onClose={() => setAssetAction(null)}
            onSave={applyAssetAction}
            onEditFull={() => {
              setEditing(assetAction.asset);
              setFormOpen(true);
              setAssetAction(null);
            }}
          />
        )}
      </AsyncState>
    </Page>
  );
}

function Analytics({ view }) {
  return <ReportsStudio view={view} />;
}
