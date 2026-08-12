import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  AsyncState,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  FieldSection,
  FormDrawer,
  Page,
  PageHeader,
  Panel,
  SearchField,
  Select,
  StatStrip,
  StatusDot,
  Table,
  TextInput,
  Toolbar,
} from '../components/UI.jsx';
import { RECORD_SCHEMAS } from '../data/recordSchemas.js';
import { useStore } from '../state/AppStore.jsx';
import { useRecords, useUpdateRecord } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';

const TRUCK_DEVICE_SLOTS = (
  RECORD_SCHEMAS.trucks.sections.find((section) => section.title === 'Devices')?.fields || []
).map((field) => ({ key: field.key, label: field.label }));

const STATUS_COLORS = {
  Registered: 'emerald',
  Unassigned: 'slate',
  'Reporting, unregistered': 'amber',
};

function latest(dates) {
  return dates.reduce((best, current) => (current && (!best || current > best) ? current : best), null);
}

function parseStamp(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const date = new Date(raw.includes('T') || raw.includes('/') ? raw : `${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatStamp(date) {
  if (!date) return 'Never';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Devices() {
  const { navigate, canCreateRecords, toast } = useStore();
  const trucksQuery = useRecords('trucks');
  const tipsQuery = useRecords('individualTips');
  const aggTipsQuery = useRecords('aggregatedTips');
  const assetsQuery = useRecords('assets');
  const updateTruck = useUpdateRecord('trucks');

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [accountFilter, setAccountFilter] = useState('All');
  const [editing, setEditing] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const [clearPending, setClearPending] = useState(null);

  const queries = [trucksQuery, tipsQuery, aggTipsQuery, assetsQuery];
  const loading = queries.some((query) => query.isLoading);
  const failed = queries.find((query) => query.isError);

  const trucks = trucksQuery.data?.data || [];
  const tips = tipsQuery.data?.data || [];
  const aggTips = aggTipsQuery.data?.data || [];
  const assets = assetsQuery.data?.data || [];

  const telemetryByTruck = useMemo(() => {
    const map = new Map();
    const bump = (truckKey, patch) => {
      if (!truckKey) return;
      const current = map.get(truckKey) || { events: 0, tips: 0, lastReported: null };
      map.set(truckKey, {
        events: current.events + (patch.events || 0),
        tips: current.tips + (patch.tips || 0),
        lastReported: latest([current.lastReported, patch.lastReported]),
      });
    };
    tips.forEach((tip) => {
      bump(tip.truck, { events: 1, lastReported: parseStamp(tip.timestamp) });
    });
    aggTips.forEach((agg) => {
      const stamp = parseStamp(
        agg.truckStartTime ? `${agg.date}T${agg.truckStartTime}` : agg.date
      );
      bump(agg.truck || agg.truckNumber, { tips: Number(agg.tips) || 0, lastReported: stamp });
    });
    return map;
  }, [aggTips, tips]);

  const telemetryByAsset = useMemo(() => {
    const map = new Map();
    tips.forEach((tip) => {
      if (!tip.asset) return;
      const current = map.get(tip.asset) || { events: 0, lastReported: null };
      map.set(tip.asset, {
        events: current.events + 1,
        lastReported: latest([current.lastReported, parseStamp(tip.timestamp)]),
      });
    });
    return map;
  }, [tips]);

  const rows = useMemo(() => {
    const list = [];
    const registered = new Set();

    trucks.forEach((truck) => {
      const telemetry = telemetryByTruck.get(truck.number) ||
        telemetryByTruck.get(truck.name) || { events: 0, tips: 0, lastReported: null };
      TRUCK_DEVICE_SLOTS.forEach((slot) => {
        const serial = truck[slot.key] ? String(truck[slot.key]) : '';
        if (serial) registered.add(serial.toLowerCase());
        list.push({
          id: `${truck.id}-${slot.key}`,
          serial,
          type: slot.label,
          status: serial ? 'Registered' : 'Unassigned',
          hostLabel: truck.name || truck.number,
          hostMeta: [truck.number, truck.driver].filter(Boolean).join(' · '),
          account: truck.account || '',
          lastReported: serial ? telemetry.lastReported : null,
          events: serial ? telemetry.events : 0,
          tips: serial ? telemetry.tips : 0,
          editable: true,
          truckId: truck.id,
          truckName: truck.name || truck.number,
          slotKey: slot.key,
          slotLabel: slot.label,
          module: 'trucks',
        });
      });
    });

    assets.forEach((asset) => {
      if (!asset.rfid) return;
      const telemetry = telemetryByAsset.get(asset.name) || { events: 0, lastReported: null };
      registered.add(String(asset.rfid).toLowerCase());
      list.push({
        id: `asset-${asset.id}`,
        serial: String(asset.rfid),
        type: 'RFID Tag',
        status: 'Registered',
        hostLabel: asset.name,
        hostMeta: [asset.product, asset.location].filter(Boolean).join(' · '),
        account: asset.account || '',
        lastReported: telemetry.lastReported,
        events: telemetry.events,
        tips: telemetry.events,
        editable: false,
        module: 'assets',
      });
    });

    const observed = new Map();
    tips.forEach((tip) => {
      if (!tip.sfdcDeviceId) return;
      const current = observed.get(tip.sfdcDeviceId) || {
        events: 0,
        lastReported: null,
        truck: tip.truck,
        account: tip.account,
      };
      observed.set(tip.sfdcDeviceId, {
        ...current,
        events: current.events + 1,
        lastReported: latest([current.lastReported, parseStamp(tip.timestamp)]),
      });
    });
    aggTips.forEach((agg) => {
      if (!agg.device) return;
      const current = observed.get(agg.device) || {
        events: 0,
        lastReported: null,
        truck: agg.truck,
        account: agg.account,
      };
      observed.set(agg.device, {
        ...current,
        tips: (current.tips || 0) + (Number(agg.tips) || 0),
        lastReported: latest([current.lastReported, parseStamp(agg.date)]),
      });
    });
    observed.forEach((value, serial) => {
      if (registered.has(String(serial).toLowerCase())) return;
      list.push({
        id: `observed-${serial}`,
        serial: String(serial),
        type: 'Telematics Device',
        status: 'Reporting, unregistered',
        hostLabel: value.truck || 'Unmatched truck',
        hostMeta: 'Seen in telematics feed only',
        account: value.account || '',
        lastReported: value.lastReported,
        events: value.events,
        tips: value.tips || 0,
        editable: false,
        module: 'individualTips',
      });
    });

    return list.sort((a, b) => {
      if (!!b.serial !== !!a.serial) return b.serial ? 1 : -1;
      return (
        String(a.hostLabel).localeCompare(String(b.hostLabel)) || a.type.localeCompare(b.type)
      );
    });
  }, [aggTips, assets, telemetryByAsset, telemetryByTruck, tips, trucks]);

  const typeOptions = useMemo(
    () => ['All', ...[...new Set(rows.map((row) => row.type))].sort()],
    [rows]
  );
  const accountOptions = useMemo(
    () => ['All', ...[...new Set(rows.map((row) => row.account).filter(Boolean))].sort()],
    [rows]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== 'All' && row.type !== typeFilter) return false;
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;
      if (accountFilter !== 'All' && row.account !== accountFilter) return false;
      if (
        query &&
        ![row.serial, row.type, row.hostLabel, row.hostMeta, row.account]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      ) {
        return false;
      }
      return true;
    });
  }, [accountFilter, q, rows, statusFilter, typeFilter]);

  const stats = useMemo(
    () => [
      { label: 'Device slots', value: rows.length },
      {
        label: 'Registered',
        value: rows.filter((row) => row.status === 'Registered').length,
      },
      {
        label: 'Open slots',
        value: rows.filter((row) => row.status === 'Unassigned').length,
        hint: 'Truck slots with no device serial',
      },
      {
        label: 'Reporting',
        value: rows.filter((row) => row.lastReported).length,
        hint: 'Seen in the telematics feed',
      },
    ],
    [rows]
  );

  const openForm = (row) => {
    const form = { id: row.id, serial: row.serial, truckId: row.truckId, slotKey: row.slotKey };
    setSaveError('');
    setBaseline(form);
    setEditing({ ...form, row });
  };

  const save = async () => {
    const serial = editing.serial.trim();
    if (!serial) {
      setSaveError('Enter a device serial, or clear the slot from the registry list.');
      return;
    }
    const duplicate = rows.find(
      (row) => row.id !== editing.id && row.serial.toLowerCase() === serial.toLowerCase()
    );
    if (duplicate) {
      setSaveError(`${serial} is already registered to ${duplicate.hostLabel}.`);
      return;
    }
    setBusy(true);
    setSaveError('');
    try {
      await updateTruck.mutateAsync({
        id: editing.truckId,
        changes: { [editing.slotKey]: serial },
      });
      toast(`${editing.row.slotLabel} registered on ${editing.row.truckName}`);
      setEditing(null);
      setBaseline(null);
    } catch (error) {
      setSaveError(getErrorMessage(error, 'Could not register the device.'));
    } finally {
      setBusy(false);
    }
  };

  const confirmClear = async () => {
    try {
      await updateTruck.mutateAsync({
        id: clearPending.truckId,
        changes: { [clearPending.slotKey]: '' },
      });
      toast(`${clearPending.slotLabel} cleared on ${clearPending.truckName}`);
      setClearPending(null);
    } catch (error) {
      toast(getErrorMessage(error, 'Could not clear the device.'), 'danger');
    }
  };

  return (
    <Page wide>
      <PageHeader
        overline="Telematics"
        title="Devices"
        description="Every RFID reader, all-in-one unit and telematics device known to the workspace, derived from truck device slots, asset RFID tags and the telematics event feed."
        actions={
          <Button variant="secondary" onClick={() => navigate('trucks', {})}>
            <Icon name="truck" size={16} /> Trucks
          </Button>
        }
      />

      <AsyncState
        loading={loading}
        error={failed ? getErrorMessage(failed.error) : null}
        onRetry={() => queries.forEach((query) => query.refetch?.())}
      >
        <div className="space-y-5">
          <StatStrip items={stats} compact />
          <Panel>
            <Toolbar>
              <SearchField
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search devices…"
                label="Search devices"
              />
              <Select
                aria-label="Filter by device type"
                className="max-w-[190px]"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={typeOptions}
              />
              <Select
                aria-label="Filter by registration status"
                className="max-w-[210px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={['All', 'Registered', 'Unassigned', 'Reporting, unregistered']}
              />
              <Select
                aria-label="Filter by Service Provider"
                className="max-w-[200px]"
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                options={accountOptions}
              />
              <span className="ml-auto text-xs text-ink-faint">
                {filtered.length} of {rows.length} devices
              </span>
            </Toolbar>

            {filtered.length === 0 ? (
              <EmptyState
                icon="package"
                title="No devices match these filters"
                description="Device slots come from truck records; clear the filters or register a device on a truck."
              />
            ) : (
              <Table
                columns={[
                  'Device',
                  'Type',
                  'Installed On',
                  'Service Provider',
                  'Status',
                  'Last Reported',
                  'Events',
                  'Actions',
                ]}
                label="Device registry"
              >
                {filtered.map((row) => (
                  <tr key={row.id} className="interactive hover:bg-elevated/70">
                    <td className="px-4 py-3">
                      {row.serial ? (
                        <span className="mono text-ink">{row.serial}</span>
                      ) : (
                        <span className="text-ink-faint">Not registered</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{row.type}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="link-brand text-left"
                        onClick={() => navigate(row.module, {})}
                      >
                        {row.hostLabel}
                      </button>
                      {row.hostMeta && (
                        <div className="mt-0.5 text-xs text-ink-faint">{row.hostMeta}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{row.account || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge color={STATUS_COLORS[row.status]}>{row.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot
                        color={row.lastReported ? 'emerald' : 'slate'}
                        label={formatStamp(row.lastReported)}
                      />
                    </td>
                    <td className="px-4 py-3 text-ink-muted tabular-nums">
                      {row.events ? `${row.events} events` : '—'}
                      {row.tips ? ` · ${row.tips} tips` : ''}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.editable && canCreateRecords ? (
                        <>
                          <button
                            type="button"
                            className="link-brand mr-3 text-xs"
                            onClick={() => openForm(row)}
                          >
                            {row.serial ? 'Replace' : 'Register'}
                          </button>
                          {row.serial && (
                            <button
                              type="button"
                              className="text-xs text-danger hover:underline"
                              onClick={() => setClearPending(row)}
                            >
                              Clear
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          className="link-brand text-xs"
                          onClick={() => navigate(row.module, {})}
                        >
                          Open source
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Panel>
        </div>
      </AsyncState>

      {editing && (
        <FormDrawer
          onClose={() => {
            setEditing(null);
            setBaseline(null);
            setSaveError('');
          }}
          onSubmit={save}
          title={editing.row.serial ? 'Replace device' : 'Register device'}
          description={`${editing.row.slotLabel} on ${editing.row.truckName}`}
          dirty={editing.serial !== baseline.serial}
          busy={busy}
          error={saveError}
          submitLabel={editing.row.serial ? 'Save device' : 'Register device'}
        >
          <FieldSection title="Device">
            <Field label="Serial / device id" required span2>
              <TextInput
                value={editing.serial}
                onChange={(e) => {
                  setEditing((current) => ({ ...current, serial: e.target.value }));
                  setSaveError('');
                }}
                placeholder="e.g. RFID-20114"
              />
            </Field>
            <Field label="Device slot">
              <TextInput value={editing.row.slotLabel} readOnly disabled />
            </Field>
            <Field label="Truck">
              <TextInput value={editing.row.truckName} readOnly disabled />
            </Field>
          </FieldSection>
          <p className="text-xs text-ink-muted">
            Saving writes the serial to the truck record, so it stays in sync with the Trucks
            module and the telematics feed.
          </p>
        </FormDrawer>
      )}

      {clearPending && (
        <ConfirmDialog
          title="Clear this device slot?"
          description={`${clearPending.serial} will be removed from ${clearPending.slotLabel} on ${clearPending.truckName}.`}
          confirmLabel="Clear device"
          onConfirm={confirmClear}
          onCancel={() => setClearPending(null)}
        />
      )}
    </Page>
  );
}
