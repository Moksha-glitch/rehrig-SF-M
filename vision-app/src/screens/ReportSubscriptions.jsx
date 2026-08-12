import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  AsyncState,
  Badge,
  Button,
  Checkbox,
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
  StatusDot,
  Table,
  TextArea,
  TextInput,
  Toolbar,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useReportSpecs } from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';
import {
  SUBSCRIPTION_CHANNELS,
  SUBSCRIPTION_FORMATS,
  SUBSCRIPTION_FREQUENCIES,
  SUBSCRIPTION_WEEKDAYS,
} from '../data/appLauncher.js';

const DAY_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRecipients(value) {
  return String(value || '')
    .split(/[,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function needsDay(frequency) {
  return frequency === 'Weekly' || frequency === 'Monthly';
}

/** Next delivery for a subscription, computed from its cadence and send time. */
function nextRun(subscription, now = new Date()) {
  if (!subscription.active) return 'Paused';
  const [hours, minutes] = String(subscription.time || '07:00')
    .split(':')
    .map((part) => Number(part) || 0);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (subscription.frequency === 'Monthly') {
    const day = Math.min(Math.max(Number(subscription.day) || 1, 1), 28);
    next.setDate(day);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else if (subscription.frequency === 'Weekly') {
    const target = DAY_INDEX[subscription.day] ?? 1;
    let delta = (target - next.getDay() + 7) % 7;
    if (delta === 0 && next <= now) delta = 7;
    next.setDate(next.getDate() + delta);
  } else if (subscription.frequency === 'Weekdays') {
    if (next <= now) next.setDate(next.getDate() + 1);
    while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  } else if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function cadenceLabel(subscription) {
  if (needsDay(subscription.frequency)) {
    const day =
      subscription.frequency === 'Monthly' ? `day ${subscription.day}` : subscription.day;
    return `${subscription.frequency} · ${day || '—'} · ${subscription.time}`;
  }
  return `${subscription.frequency} · ${subscription.time}`;
}

function blankForm(reports) {
  const first = reports[0];
  return {
    id: '',
    reportId: first?.id || '',
    reportName: first?.name || '',
    frequency: 'Daily',
    day: '',
    time: '07:00',
    recipients: '',
    channel: SUBSCRIPTION_CHANNELS[0],
    format: SUBSCRIPTION_FORMATS[0],
    active: true,
    notes: '',
  };
}

export default function ReportSubscriptions() {
  const {
    reportSubscriptions,
    createReportSubscription,
    updateReportSubscription,
    deleteReportSubscription,
    canCreateAccounts,
    canCreateRecords,
    toast,
  } = useStore();
  const specsQuery = useReportSpecs();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editing, setEditing] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deletePending, setDeletePending] = useState(null);

  const reports = specsQuery.data || [];
  const canEdit = canCreateAccounts || canCreateRecords;

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (reportSubscriptions || [])
      .filter((row) => {
        if (statusFilter === 'Active') return row.active;
        if (statusFilter === 'Paused') return !row.active;
        return true;
      })
      .filter((row) =>
        query
          ? [row.reportName, row.recipients, row.frequency, row.channel, row.format]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(query))
          : true
      );
  }, [q, reportSubscriptions, statusFilter]);

  const openForm = (row) => {
    const form = row
      ? {
          id: row.id,
          reportId: row.reportId || '',
          reportName: row.reportName || '',
          frequency: row.frequency || 'Daily',
          day: row.day || '',
          time: row.time || '07:00',
          recipients: row.recipients || '',
          channel: row.channel || SUBSCRIPTION_CHANNELS[0],
          format: row.format || SUBSCRIPTION_FORMATS[0],
          active: row.active !== false,
          notes: row.notes || '',
        }
      : blankForm(reports);
    setSaveError('');
    setBaseline(form);
    setEditing(form);
  };

  const save = async () => {
    if (!canEdit) return;
    if (!editing.reportId) {
      setSaveError('Select the report to deliver.');
      return;
    }
    const recipients = parseRecipients(editing.recipients);
    if (!recipients.length) {
      setSaveError('At least one recipient is required.');
      return;
    }
    const invalid = recipients.find((entry) => !EMAIL_PATTERN.test(entry));
    if (invalid) {
      setSaveError(`“${invalid}” is not a valid email address.`);
      return;
    }
    if (!editing.time) {
      setSaveError('Send time is required.');
      return;
    }
    if (editing.frequency === 'Weekly' && !editing.day) {
      setSaveError('Pick the weekday for a weekly cadence.');
      return;
    }
    if (editing.frequency === 'Monthly') {
      const day = Number(editing.day);
      if (!Number.isFinite(day) || day < 1 || day > 28) {
        setSaveError('Monthly cadence needs a day of month between 1 and 28.');
        return;
      }
    }
    const report = reports.find((item) => item.id === editing.reportId);
    const payload = {
      reportId: editing.reportId,
      reportName: report?.name || editing.reportName,
      frequency: editing.frequency,
      day: needsDay(editing.frequency) ? String(editing.day) : '',
      time: editing.time,
      recipients: recipients.join(', '),
      channel: editing.channel,
      format: editing.format,
      active: !!editing.active,
      notes: editing.notes.trim(),
    };
    setBusy(true);
    setSaveError('');
    try {
      if (editing.id) {
        await updateReportSubscription(editing.id, payload);
        toast('Report subscription updated');
      } else {
        await createReportSubscription(payload);
        toast('Report subscription created');
      }
      setEditing(null);
      setBaseline(null);
    } catch (error) {
      setSaveError(getErrorMessage(error, 'Could not save the subscription.'));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      await updateReportSubscription(row.id, { active: !row.active });
      toast(row.active ? 'Subscription paused' : 'Subscription resumed');
    } catch (error) {
      toast(getErrorMessage(error, 'Could not update the subscription.'), 'danger');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteReportSubscription(deletePending.id);
      toast('Report subscription deleted');
      setDeletePending(null);
    } catch (error) {
      toast(getErrorMessage(error, 'Could not delete the subscription.'), 'danger');
    }
  };

  const activeCount = (reportSubscriptions || []).filter((row) => row.active).length;

  return (
    <Page wide>
      <PageHeader
        overline="Analytics"
        title="Report Subscriptions"
        description={
          <span>
            Scheduled report delivery by email and Slack. Recipients receive PDFs or CSVs on a
            cadence.
            <span className="text-ink-faint">
              {' '}
              · {activeCount} active of {(reportSubscriptions || []).length}
            </span>
            {!canEdit && <span className="text-ink-faint"> · View only</span>}
          </span>
        }
        actions={
          canEdit ? (
            <Button variant="primary" onClick={() => openForm(null)} disabled={!reports.length}>
              <Icon name="plus" size={16} /> New Subscription
            </Button>
          ) : null
        }
      />

      <AsyncState
        loading={specsQuery.isLoading}
        error={specsQuery.isError ? getErrorMessage(specsQuery.error) : null}
        onRetry={() => specsQuery.refetch()}
      >
        <Panel>
          <Toolbar>
            <SearchField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search subscriptions…"
              label="Search report subscriptions"
            />
            <Select
              aria-label="Filter by delivery state"
              className="max-w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={['All', 'Active', 'Paused']}
            />
          </Toolbar>
          {rows.length === 0 ? (
            <EmptyState
              icon="mail"
              title={
                (reportSubscriptions || []).length ? 'No matching subscriptions' : 'No subscriptions yet'
              }
              description={
                (reportSubscriptions || []).length
                  ? 'Try adjusting the search or the delivery state filter.'
                  : 'Schedule a saved report to be delivered on a cadence.'
              }
              action={
                canEdit && !(reportSubscriptions || []).length ? (
                  <Button variant="primary" onClick={() => openForm(null)} disabled={!reports.length}>
                    New Subscription
                  </Button>
                ) : null
              }
            />
          ) : (
            <Table
              columns={['Report', 'Cadence', 'Recipients', 'Channel', 'Format', 'Next Run', 'Actions']}
              label="Report subscriptions"
            >
              {rows.map((row) => (
                <tr key={row.id} className="interactive hover:bg-elevated/70">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="link-brand text-left"
                      onClick={() => openForm(row)}
                    >
                      {row.reportName || 'Untitled report'}
                    </button>
                    <div className="mono mt-0.5 text-xs text-ink-faint">{row.id}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{cadenceLabel(row)}</td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-ink-muted">
                    {row.recipients}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color="cyan">{row.channel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{row.format}</td>
                  <td className="px-4 py-3">
                    <StatusDot
                      color={row.active ? 'emerald' : 'slate'}
                      label={nextRun(row)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit ? (
                      <>
                        <button
                          type="button"
                          className="link-brand mr-3 text-xs"
                          onClick={() => toggleActive(row)}
                        >
                          {row.active ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          type="button"
                          className="link-brand mr-3 text-xs"
                          onClick={() => openForm(row)}
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
                    ) : (
                      <button
                        type="button"
                        className="link-brand text-xs"
                        onClick={() => openForm(row)}
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </AsyncState>

      {editing && (
        <FormDrawer
          onClose={() => {
            setEditing(null);
            setBaseline(null);
            setSaveError('');
          }}
          onSubmit={save}
          title={editing.id ? 'Edit subscription' : 'New subscription'}
          description="Pick a saved report, a cadence, and who receives the delivery."
          dirty={JSON.stringify(editing) !== JSON.stringify(baseline)}
          busy={busy}
          error={saveError}
          submitLabel={editing.id ? 'Save subscription' : 'Create subscription'}
          footer={
            canEdit ? undefined : (
              <div className="flex justify-end px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(null);
                    setBaseline(null);
                  }}
                >
                  Close
                </Button>
              </div>
            )
          }
        >
          <FieldSection title="Report">
            <Field label="Report" required span2>
              <Select
                options={reports.map((report) => ({ value: report.id, label: report.name }))}
                placeholder="Select a saved report"
                value={editing.reportId}
                onChange={(e) => {
                  const report = reports.find((item) => item.id === e.target.value);
                  setEditing((current) => ({
                    ...current,
                    reportId: e.target.value,
                    reportName: report?.name || '',
                  }));
                  setSaveError('');
                }}
                disabled={!canEdit}
              />
            </Field>
          </FieldSection>
          <FieldSection title="Cadence" className="border-t border-line pt-5">
            <Field label="Frequency">
              <Select
                options={SUBSCRIPTION_FREQUENCIES}
                value={editing.frequency}
                onChange={(e) =>
                  setEditing((current) => ({
                    ...current,
                    frequency: e.target.value,
                    day: needsDay(e.target.value) ? current.day : '',
                  }))
                }
                disabled={!canEdit}
              />
            </Field>
            <Field label="Send time" required>
              <TextInput
                type="time"
                value={editing.time}
                onChange={(e) => setEditing((current) => ({ ...current, time: e.target.value }))}
                disabled={!canEdit}
              />
            </Field>
            {editing.frequency === 'Weekly' && (
              <Field label="Weekday" required>
                <Select
                  options={SUBSCRIPTION_WEEKDAYS}
                  placeholder="Select a day"
                  value={editing.day}
                  onChange={(e) => setEditing((current) => ({ ...current, day: e.target.value }))}
                  disabled={!canEdit}
                />
              </Field>
            )}
            {editing.frequency === 'Monthly' && (
              <Field label="Day of month" required hint="1–28 so every month can deliver.">
                <TextInput
                  type="number"
                  min="1"
                  max="28"
                  value={editing.day}
                  onChange={(e) => setEditing((current) => ({ ...current, day: e.target.value }))}
                  disabled={!canEdit}
                />
              </Field>
            )}
          </FieldSection>
          <FieldSection title="Delivery" className="border-t border-line pt-5">
            <Field
              label="Recipients"
              required
              span2
              hint="Comma-separated email addresses."
            >
              <TextInput
                value={editing.recipients}
                onChange={(e) => {
                  setEditing((current) => ({ ...current, recipients: e.target.value }));
                  setSaveError('');
                }}
                placeholder="ops@rehrigpacific.com, leadership@rehrigpacific.com"
                disabled={!canEdit}
              />
            </Field>
            <Field label="Channel">
              <Select
                options={SUBSCRIPTION_CHANNELS}
                value={editing.channel}
                onChange={(e) => setEditing((current) => ({ ...current, channel: e.target.value }))}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Format">
              <Select
                options={SUBSCRIPTION_FORMATS}
                value={editing.format}
                onChange={(e) => setEditing((current) => ({ ...current, format: e.target.value }))}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Notes" span2>
              <TextArea
                rows={3}
                value={editing.notes}
                onChange={(e) => setEditing((current) => ({ ...current, notes: e.target.value }))}
                disabled={!canEdit}
              />
            </Field>
            <div className="sm:col-span-2">
              <Checkbox
                label="Active — deliver on this cadence"
                checked={!!editing.active}
                onChange={(e) => setEditing((current) => ({ ...current, active: e.target.checked }))}
                disabled={!canEdit}
              />
            </div>
          </FieldSection>
          <p className="text-xs text-ink-muted">
            Next delivery: <span className="font-medium text-ink">{nextRun(editing)}</span>
          </p>
        </FormDrawer>
      )}

      {deletePending && (
        <ConfirmDialog
          title="Delete subscription?"
          description={`Stop delivering “${deletePending.reportName}” to ${deletePending.recipients}.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeletePending(null)}
        />
      )}
    </Page>
  );
}
