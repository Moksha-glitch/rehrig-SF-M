import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  StatusDot,
  Table,
  Switch,
  Page,
  PageHeader,
  Panel,
  Toolbar,
  SearchField,
  Button,
  FormDrawer,
  FieldSection,
  Field,
  TextInput,
  TextArea,
  Select,
  Checkbox,
  ConfirmDialog,
  AsyncState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import {
  useApiIntegrations,
  useApiIntegrationMutations,
  useConfigList,
  useConfigMutations,
  useNotificationConfig,
  useNotificationRuleMutations,
  useToggleNotificationRule,
} from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';
import { PICKLISTS } from '../data/picklists.js';

const WASTE_STREAMS = PICKLISTS.productServiceType;
const WASTE_STREAM_CATEGORIES = PICKLISTS.productServiceCategory;
const LOCATION_CATEGORIES = ['Residential', 'Commercial', 'Industrial', 'Facility', 'Other'];
const ASSET_CATEGORIES = PICKLISTS.productFamily;

const CONFIG_FIELDS = {
  serviceTypes: [
    { key: 'name', label: 'Service Name', required: true, list: true },
    { key: 'code', label: 'Code', list: true },
    { key: 'wasteStream', label: 'Waste Stream', type: 'select', options: WASTE_STREAMS, list: true },
    { key: 'specialLicense', label: 'Special License' },
    { key: 'serviceCode', label: 'Service Code' },
    { key: 'wasteStreamCategory', label: 'Waste Stream Category', type: 'select', options: WASTE_STREAM_CATEGORIES, list: true },
    { key: 'routePrefix', label: 'Route Prefix' },
    { key: 'containerColour', label: 'Container Colour' },
    {
      key: 'requiresSpecialHandlingLicense',
      label: 'Requires Special Handling License',
      type: 'checkbox',
      span2: true,
    },
    { key: 'availableForResidential', label: 'Available for Residential', type: 'checkbox' },
    { key: 'availableForCommercial', label: 'Available for Commercial', type: 'checkbox' },
    { key: 'sortOrder', label: 'Sort Order', type: 'number', list: true },
    { key: 'isActive', label: 'Is Active', type: 'checkbox', list: true },
    { key: 'description', label: 'Description', type: 'textarea', span2: true },
  ],
  locationTypes: [
    { key: 'name', label: 'Type Name', required: true, list: true },
    { key: 'category', label: 'Category', type: 'select', options: LOCATION_CATEGORIES, list: true },
    { key: 'publicPortal', label: 'Public Portal', type: 'checkbox', list: true },
    { key: 'needsSegment', label: 'Needs Segment', type: 'checkbox', list: true },
    { key: 'sort', label: 'Sort', type: 'number', list: true },
    { key: 'typeCode', label: 'Type Code', list: true },
    { key: 'description', label: 'Description', type: 'textarea', span2: true },
  ],
  assetTypes: [
    { key: 'name', label: 'Type Name', required: true, list: true },
    { key: 'code', label: 'Type Code', list: true },
    { key: 'category', label: 'Category', type: 'select', options: ASSET_CATEGORIES, list: true },
    { key: 'sortOrder', label: 'Sort Order', type: 'number', list: true },
    { key: 'isActive', label: 'Is Active', type: 'checkbox', list: true },
    { key: 'description', label: 'Description', type: 'textarea', span2: true, list: true },
  ],
  productTypes: [
    { key: 'name', label: 'Product Name', required: true, list: true },
    { key: 'code', label: 'Product Code', list: true },
    { key: 'family', label: 'Family', type: 'select', options: PICKLISTS.productFamily, list: true },
    { key: 'serviceType', label: 'Service Type', type: 'select', options: PICKLISTS.productServiceType, list: true },
    { key: 'category', label: 'Category', type: 'select', options: PICKLISTS.productServiceCategory, list: true },
    { key: 'size', label: 'Size' },
    { key: 'isActive', label: 'Is Active', type: 'checkbox', list: true },
    { key: 'description', label: 'Description', type: 'textarea', span2: true },
  ],
};

function listColumnsFor(configKey) {
  const fields = (CONFIG_FIELDS[configKey] || []).filter((field) => field.list);
  return [...fields.map((field) => field.label), ''];
}

const CONFIG_META = {
  serviceTypes: {
    title: 'Service Types',
    subtitle:
      'Customer classifications (Residential, Commercial, Industrial, Municipal). Managed centrally by Rehrig.',
    columns: listColumnsFor('serviceTypes'),
    newLabel: 'New Service Type',
    stateList: 'serviceTypes',
    kind: 'config',
  },
  locationTypes: {
    title: 'Location Types',
    subtitle:
      'Categories of physical locations (homes, businesses, yards, and more). Managed centrally by Rehrig.',
    columns: listColumnsFor('locationTypes'),
    newLabel: 'New Location Type',
    stateList: 'locationTypes',
    kind: 'config',
  },
  assetTypes: {
    title: 'Asset Types',
    subtitle:
      'Categories of physical assets (carts, containers, compactors). Referenced by Product Master and Assets.',
    columns: listColumnsFor('assetTypes'),
    newLabel: 'New Asset Type',
    stateList: 'assetTypes',
    kind: 'config',
  },
  productTypes: {
    title: 'Master Product Catalog',
    subtitle:
      'Product family categories (Cart, Bin, Compactor, Roll-Off, Container, Truck, Accessory). Managed centrally by Rehrig.',
    columns: listColumnsFor('productTypes'),
    newLabel: 'New Product Type',
    stateList: 'productTypes',
    kind: 'config',
  },
  apiIntegrations: {
    title: 'API Integrations',
    subtitle: 'External systems that push or pull data. Monitor endpoint status and call volume.',
    columns: ['Name', 'Endpoint', 'Status', 'Calls / 30d', ''],
    newLabel: 'New Integration',
    kind: 'api',
  },
  notificationConfig: {
    title: 'Service Notification Config',
    subtitle: 'Rules that fire notifications to residents. Toggle each rule to activate or pause it.',
    columns: ['Enabled', 'Name', 'Event', 'Channel', 'Priority', ''],
    newLabel: 'New Notification Rule',
    kind: 'notif',
  },
};

function emptyApiForm(row) {
  return {
    originalId: row?.id || '',
    name: row?.name || '',
    description: row?.description || '',
    endpoint: row?.endpoint || '/api/v1/workorder',
    status: row?.status || 'Active',
    calls30d: row?.calls30d ?? 0,
  };
}

function emptyNotifForm(row) {
  return {
    originalId: row?.id || '',
    name: row?.name || '',
    description: row?.description || '',
    enabled: row?.enabled !== false,
    event: row?.event || PICKLISTS.notificationEvent[2],
    channel: row?.channel || PICKLISTS.serviceNotificationChannel[0],
    priority: row?.priority || 'Normal',
  };
}

function emptyConfigForm(configKey, row) {
  const fields = CONFIG_FIELDS[configKey] || [];
  const form = {
    originalId: row?.id || '',
    initialSnapshot: '',
  };
  fields.forEach((field) => {
    if (field.type === 'checkbox') {
      form[field.key] =
        row?.[field.key] !== undefined
          ? !!row[field.key]
          : field.key === 'isActive' || field.key === 'availableForResidential' || field.key === 'availableForCommercial'
            ? true
            : false;
    } else if (field.type === 'number') {
      form[field.key] = row?.[field.key] ?? '';
    } else if (field.type === 'select') {
      form[field.key] = row?.[field.key] || field.options?.[0] || '';
    } else {
      form[field.key] = row?.[field.key] || '';
    }
  });
  form.initialSnapshot = JSON.stringify(snapshotConfigForm(form, configKey));
  return form;
}

function snapshotConfigForm(form, configKey) {
  const fields = CONFIG_FIELDS[configKey] || [];
  const snap = {};
  fields.forEach((field) => {
    snap[field.key] = form[field.key];
  });
  return snap;
}

function formatConfigCell(field, row) {
  const value = row[field.key];
  if (field.type === 'checkbox') {
    if (field.key === 'isActive') return value === false ? 'Inactive' : 'Active';
    return value ? 'Yes' : 'No';
  }
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

export function MasterConfig({ configKey }) {
  const meta = CONFIG_META[configKey];
  const { toast, canCreateAccounts, deleteApiIntegration, mode } = useStore();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [apiEditing, setApiEditing] = useState(null);
  const [apiBaseline, setApiBaseline] = useState(null);
  const [notifEditing, setNotifEditing] = useState(null);
  const [notifBaseline, setNotifBaseline] = useState(null);
  const [deleted, setDeleted] = useState(null);
  const [deletePending, setDeletePending] = useState(null);
  const [saveError, setSaveError] = useState('');

  const configQuery = useConfigList(meta.kind === 'config' ? meta.stateList : null);
  const apiQuery = useApiIntegrations();
  const notifQuery = useNotificationConfig();
  const { create, remove } = useConfigMutations(meta.stateList);
  const apiMutations = useApiIntegrationMutations();
  const notifMutations = useNotificationRuleMutations();
  const toggleRule = useToggleNotificationRule();

  const canEdit = canCreateAccounts;
  const activeQuery =
    meta.kind === 'config' ? configQuery : meta.kind === 'api' ? apiQuery : notifQuery;
  const rows = activeQuery.data || [];
  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
  const configFields = CONFIG_FIELDS[configKey] || [];
  const listFields = configFields.filter((field) => field.list);

  const openApiForm = (row) => {
    const form = emptyApiForm(row);
    setSaveError('');
    setApiBaseline(form);
    setApiEditing(form);
  };

  const openNotifForm = (row) => {
    const form = emptyNotifForm(row);
    setSaveError('');
    setNotifBaseline(form);
    setNotifEditing(form);
  };

  const onNew = () => {
    setSaveError('');
    if (meta.kind === 'config') {
      setEditing(emptyConfigForm(configKey));
      return;
    }
    if (meta.kind === 'api') {
      openApiForm();
      return;
    }
    if (meta.kind === 'notif') {
      openNotifForm();
    }
  };

  const save = async (item) => {
    if (!String(item.name || '').trim()) {
      setSaveError('Name is required.');
      return;
    }
    setSaveError('');
    try {
      if (item.originalId) await remove.mutateAsync(item.originalId);
      const payload = {
        id: item.originalId || `${meta.stateList}-${Date.now()}`,
        ...snapshotConfigForm(item, configKey),
      };
      if (payload.name) payload.name = String(payload.name).trim();
      if (typeof payload.description === 'string') payload.description = payload.description.trim();
      if (payload.sortOrder !== undefined && payload.sortOrder !== '') {
        payload.sortOrder = Number(payload.sortOrder) || 0;
      }
      if (payload.sort !== undefined && payload.sort !== '') {
        payload.sort = Number(payload.sort) || 0;
      }
      await create.mutateAsync(payload);
      toast(`${meta.title.replace(/s$/, '')} ${item.originalId ? 'updated' : 'created'}`);
      setEditing(null);
    } catch (error) {
      const message = getErrorMessage(error, 'Could not save configuration.');
      setSaveError(message);
      toast(message, 'danger');
    }
  };

  const saveApi = async () => {
    if (!apiEditing.name.trim()) {
      setSaveError('Name is required.');
      return;
    }
    if (!apiEditing.endpoint.trim()) {
      setSaveError('Endpoint is required.');
      return;
    }
    setSaveError('');
    const payload = {
      name: apiEditing.name.trim(),
      description: apiEditing.description.trim(),
      endpoint: apiEditing.endpoint.trim(),
      status: apiEditing.status || 'Active',
      calls30d: Number(apiEditing.calls30d) || 0,
    };
    try {
      if (apiEditing.originalId) {
        await apiMutations.update.mutateAsync({ id: apiEditing.originalId, changes: payload });
        toast('API integration updated');
      } else {
        await apiMutations.create.mutateAsync(payload);
        toast('API integration created');
      }
      setApiEditing(null);
      setApiBaseline(null);
    } catch (error) {
      const message = getErrorMessage(error, 'Could not save API integration.');
      setSaveError(message);
      toast(message, 'danger');
    }
  };

  const saveNotif = async () => {
    if (!notifEditing.name.trim()) {
      setSaveError('Name is required.');
      return;
    }
    if (!notifEditing.event.trim()) {
      setSaveError('Event is required.');
      return;
    }
    setSaveError('');
    const payload = {
      name: notifEditing.name.trim(),
      description: notifEditing.description.trim(),
      enabled: !!notifEditing.enabled,
      event: notifEditing.event,
      channel: notifEditing.channel,
      priority: notifEditing.priority,
    };
    try {
      if (notifEditing.originalId) {
        await notifMutations.update.mutateAsync({ id: notifEditing.originalId, changes: payload });
        toast('Notification rule updated');
      } else {
        await notifMutations.create.mutateAsync(payload);
        toast('Notification rule created');
      }
      setNotifEditing(null);
      setNotifBaseline(null);
    } catch (error) {
      const message = getErrorMessage(error, 'Could not save notification rule.');
      setSaveError(message);
      toast(message, 'danger');
    }
  };

  const removeRow = async (row) => {
    try {
      if (meta.kind === 'api') {
        await deleteApiIntegration(row.id);
        if (mode === 'api') await apiQuery.refetch?.();
      } else {
        await remove.mutateAsync(row.id);
      }
      setDeleted({ ...row, _kind: meta.kind });
      setDeletePending(null);
      toast(`${row.name} deleted`);
    } catch (error) {
      toast(getErrorMessage(error, 'Could not delete configuration.'), 'danger');
    }
  };

  const undoDelete = async () => {
    if (!deleted) return;
    const { _kind, ...item } = deleted;
    try {
      if (_kind === 'api') {
        await apiMutations.create.mutateAsync(item);
        if (mode === 'api') await apiQuery.refetch?.();
      } else {
        await create.mutateAsync(item);
      }
      setDeleted(null);
      toast('Delete undone');
    } catch (error) {
      toast(getErrorMessage(error, 'Could not undo delete.'), 'danger');
    }
  };

  const apiBusy = apiMutations.create.isPending || apiMutations.update.isPending;
  const notifBusy = notifMutations.create.isPending || notifMutations.update.isPending;
  const apiDirty = !!apiEditing && JSON.stringify(apiEditing) !== JSON.stringify(apiBaseline);
  const notifDirty =
    !!notifEditing && JSON.stringify(notifEditing) !== JSON.stringify(notifBaseline);
  const configDirty =
    !!editing &&
    JSON.stringify(snapshotConfigForm(editing, configKey)) !== editing.initialSnapshot;
  const deleteBusy = meta.kind === 'api' ? false : remove.isPending;

  return (
    <Page>
      <PageHeader
        overline="Configure"
        title={meta.title}
        description={
          <span>
            {meta.subtitle}
            {!canEdit && <span className="text-ink-faint"> · View only</span>}
          </span>
        }
        actions={
          canEdit ? (
            <Button variant="primary" onClick={onNew}>
              <Icon name="plus" size={16} /> {meta.newLabel}
            </Button>
          ) : null
        }
      />

      <AsyncState
        loading={activeQuery.isLoading}
        error={activeQuery.isError ? getErrorMessage(activeQuery.error) : null}
        onRetry={() => activeQuery.refetch()}
      >
        <Panel>
          <Toolbar>
            <SearchField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              label={`Search ${meta.title.toLowerCase()}`}
            />
          </Toolbar>
          <Table columns={meta.columns}>
            {filtered.map((row) => (
              <tr key={row.id} className="interactive hover:bg-elevated/70">
                {meta.kind === 'notif' && (
                  <td className="px-4 py-3">
                    <Switch
                      checked={row.enabled}
                      onChange={(enabled) => toggleRule.mutate({ id: row.id, enabled })}
                      label={`Toggle ${row.name}`}
                      disabled={!canEdit}
                    />
                  </td>
                )}
                {meta.kind === 'config' &&
                  listFields.map((field) => (
                    <td
                      key={field.key}
                      className={`px-4 py-3 ${
                        field.key === 'name' ? 'font-medium text-ink' : 'text-ink-muted'
                      } ${field.key === 'code' || field.key === 'typeCode' || field.key === 'sortOrder' || field.key === 'sort' ? 'mono' : ''}`}
                    >
                      {field.key === 'isActive' ||
                      field.key === 'publicPortal' ||
                      field.key === 'needsSegment' ? (
                        <Badge
                          color={
                            formatConfigCell(field, row) === 'Active' ||
                            formatConfigCell(field, row) === 'Yes'
                              ? 'green'
                              : 'slate'
                          }
                        >
                          {formatConfigCell(field, row)}
                        </Badge>
                      ) : (
                        formatConfigCell(field, row)
                      )}
                    </td>
                  ))}
                {meta.kind !== 'config' && (
                  <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                )}
                {meta.kind === 'api' && (
                  <>
                    <td className="mono px-4 py-3 text-ink-muted">{row.endpoint}</td>
                    <td className="px-4 py-3">
                      <StatusDot
                        color={row.status === 'Active' ? 'emerald' : 'amber'}
                        label={row.status}
                      />
                    </td>
                    <td className="mono px-4 py-3 text-ink-muted">{row.calls30d}</td>
                  </>
                )}
                {meta.kind === 'notif' && (
                  <>
                    <td className="mono px-4 py-3 text-ink-muted">{row.event}</td>
                    <td className="px-4 py-3 text-ink-muted">{row.channel}</td>
                    <td className="px-4 py-3 text-ink-muted">{row.priority}</td>
                  </>
                )}
                {(meta.kind === 'config' || meta.kind === 'api' || meta.kind === 'notif') && (
                  <td className="px-4 py-3 text-right">
                    {canEdit && meta.kind === 'config' && (
                      <>
                        <button
                          type="button"
                          className="link-brand mr-3 text-xs"
                          onClick={() => setEditing(emptyConfigForm(configKey, row))}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-danger hover:underline"
                          onClick={() => setDeletePending(row)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {canEdit && meta.kind === 'api' && (
                      <>
                        <button
                          type="button"
                          className="link-brand mr-3 text-xs"
                          onClick={() => openApiForm(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-danger hover:underline"
                          onClick={() => setDeletePending(row)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {canEdit && meta.kind === 'notif' && (
                      <button
                        type="button"
                        className="link-brand text-xs"
                        onClick={() => openNotifForm(row)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </Table>
        </Panel>
      </AsyncState>

      {deleted && (
        <div className="mt-3 flex items-center gap-3 text-sm text-ink-muted">
          <Badge color="slate">Deleted {deleted.name}</Badge>
          <Button variant="secondary" onClick={undoDelete}>
            Undo
          </Button>
        </div>
      )}

      {editing && (
        <FormDrawer
          onClose={() => {
            setEditing(null);
            setSaveError('');
          }}
          onSubmit={() => save(editing)}
          title={`${editing.originalId ? 'Edit' : 'New'} ${
            configKey === 'productTypes'
              ? 'Product'
              : meta.title.replace(/ Types$/, ' Type').replace(/s$/, '')
          }`}
          description="Manage this shared master configuration value."
          dirty={configDirty}
          busy={create.isPending || remove.isPending}
          error={saveError}
          wide
        >
          <FieldSection title="Configuration details">
            {configFields.map((field) => {
              if (field.type === 'checkbox') {
                return (
                  <div key={field.key} className={field.span2 ? 'sm:col-span-2' : ''}>
                    <Checkbox
                      label={field.label}
                      checked={!!editing[field.key]}
                      onChange={(e) =>
                        setEditing((current) => ({ ...current, [field.key]: e.target.checked }))
                      }
                    />
                  </div>
                );
              }
              return (
                <Field
                  key={field.key}
                  label={field.label}
                  required={!!field.required}
                  span2={!!field.span2}
                >
                  {field.type === 'textarea' ? (
                    <TextArea
                      rows={3}
                      value={editing[field.key] || ''}
                      onChange={(e) =>
                        setEditing((current) => ({ ...current, [field.key]: e.target.value }))
                      }
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      options={field.options || []}
                      value={editing[field.key] || ''}
                      onChange={(e) =>
                        setEditing((current) => ({ ...current, [field.key]: e.target.value }))
                      }
                    />
                  ) : (
                    <TextInput
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={editing[field.key] ?? ''}
                      onChange={(e) => {
                        setEditing((current) => ({ ...current, [field.key]: e.target.value }));
                        if (field.key === 'name') setSaveError('');
                      }}
                    />
                  )}
                </Field>
              );
            })}
          </FieldSection>
        </FormDrawer>
      )}

      {apiEditing && (
        <FormDrawer
          onClose={() => {
            setApiEditing(null);
            setApiBaseline(null);
            setSaveError('');
          }}
          onSubmit={saveApi}
          title={apiEditing.originalId ? 'Edit API Integration' : 'New API Integration'}
          description="Configure an external system that pushes or pulls Vision data."
          dirty={apiDirty}
          busy={apiBusy}
          error={saveError}
          submitLabel={apiEditing.originalId ? 'Save integration' : 'Create integration'}
        >
          <FieldSection title="Integration details">
            <Field label="Name" required span2>
              <TextInput
                value={apiEditing.name}
                onChange={(e) => {
                  setApiEditing((c) => ({ ...c, name: e.target.value }));
                  setSaveError('');
                }}
                placeholder="Salesforce Sync"
              />
            </Field>
            <Field label="Endpoint" required span2>
              <TextInput
                value={apiEditing.endpoint}
                onChange={(e) => {
                  setApiEditing((c) => ({ ...c, endpoint: e.target.value }));
                  setSaveError('');
                }}
                placeholder="/api/v1/workorder"
                className="mono"
              />
            </Field>
            <Field label="Status">
              <Select
                options={PICKLISTS.apiIntegrationStatus}
                value={apiEditing.status}
                onChange={(e) => setApiEditing((c) => ({ ...c, status: e.target.value }))}
              />
            </Field>
            <Field label="Calls / 30d" hint="Preserved on edit; starts at 0 for new integrations.">
              <TextInput
                type="number"
                min="0"
                value={apiEditing.calls30d}
                onChange={(e) =>
                  setApiEditing((c) => ({ ...c, calls30d: e.target.value }))
                }
                disabled={!apiEditing.originalId}
              />
            </Field>
            <Field label="Description" span2>
              <TextArea
                rows={3}
                value={apiEditing.description}
                onChange={(e) => setApiEditing((c) => ({ ...c, description: e.target.value }))}
              />
            </Field>
          </FieldSection>
        </FormDrawer>
      )}

      {notifEditing && (
        <FormDrawer
          onClose={() => {
            setNotifEditing(null);
            setNotifBaseline(null);
            setSaveError('');
          }}
          onSubmit={saveNotif}
          title={notifEditing.originalId ? 'Edit Notification Rule' : 'New Notification Rule'}
          description="Define when and how residents are notified about service events."
          dirty={notifDirty}
          busy={notifBusy}
          error={saveError}
          submitLabel={notifEditing.originalId ? 'Save rule' : 'Create rule'}
        >
          <FieldSection title="Rule details">
            <Field label="Name" required span2>
              <TextInput
                value={notifEditing.name}
                onChange={(e) => {
                  setNotifEditing((c) => ({ ...c, name: e.target.value }));
                  setSaveError('');
                }}
                placeholder="Cart out-of-place"
              />
            </Field>
            <Field label="Event" required>
              <Select
                options={PICKLISTS.notificationEvent}
                value={notifEditing.event}
                onChange={(e) => setNotifEditing((c) => ({ ...c, event: e.target.value }))}
              />
            </Field>
            <Field label="Channel">
              <Select
                options={PICKLISTS.serviceNotificationChannel}
                value={notifEditing.channel}
                onChange={(e) => setNotifEditing((c) => ({ ...c, channel: e.target.value }))}
              />
            </Field>
            <Field label="Priority">
              <Select
                options={PICKLISTS.notificationPriority}
                value={notifEditing.priority}
                onChange={(e) => setNotifEditing((c) => ({ ...c, priority: e.target.value }))}
              />
            </Field>
            <Field label="Description" span2>
              <TextArea
                rows={3}
                value={notifEditing.description}
                onChange={(e) => setNotifEditing((c) => ({ ...c, description: e.target.value }))}
              />
            </Field>
          </FieldSection>
          <Checkbox
            label="Enabled"
            checked={!!notifEditing.enabled}
            onChange={(e) => setNotifEditing((c) => ({ ...c, enabled: e.target.checked }))}
          />
        </FormDrawer>
      )}

      {deletePending && (
        <ConfirmDialog
          title={meta.kind === 'api' ? 'Delete API integration?' : 'Delete configuration?'}
          description={`Delete “${deletePending.name}”?`}
          confirmLabel="Delete"
          onConfirm={() => removeRow(deletePending)}
          onCancel={() => setDeletePending(null)}
          busy={deleteBusy}
        />
      )}
    </Page>
  );
}
