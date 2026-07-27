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
  Modal,
  Field,
  TextInput,
  TextArea,
  ConfirmDialog,
  AsyncState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import {
  useApiIntegrations,
  useConfigList,
  useConfigMutations,
  useNotificationConfig,
  useToggleNotificationRule,
} from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';

const CONFIG_META = {
  serviceTypes: {
    title: 'Service Types',
    subtitle:
      'Customer classifications (Residential, Commercial, Industrial, Municipal). Managed centrally by Rehrig.',
    columns: ['Name', 'Description', ''],
    newLabel: 'New Service Type',
    stateList: 'serviceTypes',
    kind: 'config',
  },
  locationTypes: {
    title: 'Location Types',
    subtitle:
      'Categories of physical locations (homes, businesses, yards, and more). Managed centrally by Rehrig.',
    columns: ['Name', 'Description', ''],
    newLabel: 'New Location Type',
    stateList: 'locationTypes',
    kind: 'config',
  },
  assetTypes: {
    title: 'Asset Types',
    subtitle:
      'Categories of physical assets (carts, containers, compactors). Referenced by Product Master and Assets.',
    columns: ['Name', 'Description', ''],
    newLabel: 'New Asset Type',
    stateList: 'assetTypes',
    kind: 'config',
  },
  productTypes: {
    title: 'Product Types',
    subtitle:
      'Product family categories (Cart, Bin, Compactor, Roll-Off, Container, Truck, Accessory). Managed centrally by Rehrig.',
    columns: ['Name', 'Description', ''],
    newLabel: 'New Product Type',
    stateList: 'productTypes',
    kind: 'config',
  },
  apiIntegrations: {
    title: 'API Integrations',
    subtitle: 'External systems that push or pull data. Monitor endpoint status and call volume.',
    columns: ['Name', 'Endpoint', 'Status', 'Calls / 30d'],
    newLabel: 'New Integration',
    kind: 'api',
  },
  notificationConfig: {
    title: 'Service Notification Config',
    subtitle: 'Rules that fire notifications to residents. Toggle each rule to activate or pause it.',
    columns: ['Enabled', 'Name', 'Event', 'Channel', 'Priority'],
    newLabel: 'New Notification Rule',
    kind: 'notif',
  },
};

export function MasterConfig({ configKey }) {
  const meta = CONFIG_META[configKey];
  const { toast } = useStore();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleted, setDeleted] = useState(null);
  const [deletePending, setDeletePending] = useState(null);

  const configQuery = useConfigList(meta.kind === 'config' ? meta.stateList : null);
  const apiQuery = useApiIntegrations();
  const notifQuery = useNotificationConfig();
  const { create, remove } = useConfigMutations(meta.stateList);
  const toggleRule = useToggleNotificationRule();

  const activeQuery =
    meta.kind === 'config' ? configQuery : meta.kind === 'api' ? apiQuery : notifQuery;
  const rows = activeQuery.data || [];
  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  const onNew = () => {
    if (meta.kind === 'config') {
      setEditing({ id: '', name: '', description: '' });
    } else {
      toast(`${meta.title} is managed by the integration administrator`);
    }
  };

  const save = async (item) => {
    try {
      if (item.originalId) await remove.mutateAsync(item.originalId);
      await create.mutateAsync({
        id: item.originalId || `${meta.stateList}-${Date.now()}`,
        name: item.name.trim(),
        description: item.description.trim(),
      });
      toast(`${meta.title.replace(/s$/, '')} ${item.originalId ? 'updated' : 'created'}`);
      setEditing(null);
    } catch (error) {
      toast(getErrorMessage(error, 'Could not save configuration.'), 'danger');
    }
  };

  const removeRow = async (row) => {
    try {
      await remove.mutateAsync(row.id);
      setDeleted(row);
      setDeletePending(null);
      toast(`${row.name} deleted`);
    } catch (error) {
      toast(getErrorMessage(error, 'Could not delete configuration.'), 'danger');
    }
  };

  return (
    <Page>
      <PageHeader
        overline="Configure"
        title={meta.title}
        description={meta.subtitle}
        actions={
          <Button variant="primary" onClick={onNew}>
            <Icon name="plus" size={16} /> {meta.newLabel}
          </Button>
        }
      />

      <AsyncState
        loading={activeQuery.isLoading}
        error={activeQuery.isError ? getErrorMessage(activeQuery.error) : null}
        onRetry={() => activeQuery.refetch()}
      >
        <Panel>
          <Toolbar>
            <SearchField value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
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
                    />
                  </td>
                )}
                <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                {meta.kind === 'config' && (
                  <td className="px-4 py-3 text-ink-muted">{row.description}</td>
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
                {meta.kind === 'config' && (
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="link-brand mr-3 text-xs"
                      onClick={() =>
                        setEditing({
                          originalId: row.id,
                          name: row.name,
                          description: row.description,
                        })
                      }
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
          <Button
            variant="secondary"
            onClick={() => {
              create.mutate(deleted);
              setDeleted(null);
              toast('Delete undone');
            }}
          >
            Undo
          </Button>
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="border-b border-line px-6 py-5">
            <p className="type-overline">Configure</p>
            <h2 className="mt-1 font-display text-title-md text-ink">
              {editing.originalId ? 'Edit' : 'New'} {meta.title.replace(/s$/, '')}
            </h2>
          </div>
          <div className="space-y-4 px-6 py-5">
            <Field label="Name" required>
              <TextInput
                value={editing.name}
                onChange={(e) => setEditing((c) => ({ ...c, name: e.target.value }))}
              />
            </Field>
            <Field label="Description">
              <TextArea
                rows={3}
                value={editing.description}
                onChange={(e) => setEditing((c) => ({ ...c, description: e.target.value }))}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => save(editing)} disabled={!editing.name.trim()}>
              Save
            </Button>
          </div>
        </Modal>
      )}

      {deletePending && (
        <ConfirmDialog
          title="Delete configuration?"
          description={`Delete “${deletePending.name}”?`}
          confirmLabel="Delete"
          onConfirm={() => removeRow(deletePending)}
          onCancel={() => setDeletePending(null)}
        />
      )}
    </Page>
  );
}
