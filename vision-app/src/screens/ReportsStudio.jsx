import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Button,
  Field,
  FieldSection,
  FormDrawer,
  Page,
  PageHeader,
  Panel,
  Select,
  TextInput,
  TextArea,
  Checkbox,
  ConfirmDialog,
  AsyncState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useRecords } from '../hooks/useRecords.js';
import {
  useReportMutations,
  useReportSpecs,
} from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';
import {
  REPORT_CHART_TYPES,
  REPORT_DATA_SOURCES,
  REPORT_SORT_BY,
  REPORT_TIMEFRAMES,
  aggregateReportRows,
  blankReportSpec,
} from '../data/reportStudio.js';

const CHART_COLORS = ['#0b5f49', '#1E5A8F', '#c27803', '#b42318', '#0f7b55', '#8b969f', '#4A9BD8'];

function ReportPreview({ spec, data }) {
  const yDomain = [
    spec.yMin === '' || spec.yMin == null ? 'auto' : Number(spec.yMin),
    spec.yMax === '' || spec.yMax == null ? 'auto' : Number(spec.yMax),
  ];

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-ink-muted">
        No data for the selected filters
      </div>
    );
  }

  if (spec.chart === 'donut') {
    return (
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              label={spec.showLabels ? ({ name, value }) => `${name}: ${value}` : false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            {spec.showLegend !== false && <Tooltip />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (spec.chart === 'progress') {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
      <div className="space-y-3 py-2">
        {data.map((row) => (
          <div key={row.name}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-ink-soft">{row.name}</span>
              <span className="mono font-semibold tabular-nums">{row.value}</span>
            </div>
            <div className="h-2 bg-elevated">
              <div
                className="h-2 bg-brand"
                style={{ width: `${Math.round((row.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const horizontal = spec.chart === 'bar-h';
  const ChartEl =
    spec.chart === 'line' ? LineChart : spec.chart === 'area' ? AreaChart : BarChart;
  const Series =
    spec.chart === 'line' ? Line : spec.chart === 'area' ? Area : Bar;

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ChartEl
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 8, left: horizontal ? 40 : -8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe8" />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#8b969f' }} domain={yDomain} />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fontSize: 10, fill: '#8b969f' }}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8b969f' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8b969f' }} domain={yDomain} />
            </>
          )}
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e6ebe8' }}
          />
          <Series
            type="monotone"
            dataKey="value"
            fill="#0b5f49"
            stroke="#0b5f49"
            strokeWidth={1.75}
            dot={false}
            name="Count"
          />
        </ChartEl>
      </ResponsiveContainer>
    </div>
  );
}

function ReportConfigDrawer({ draft, baseline, onChange, onClose, onSave, busy, error, canEdit }) {
  const sourceMeta = REPORT_DATA_SOURCES[draft.source] || REPORT_DATA_SOURCES.workOrders;
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  return (
    <FormDrawer
      open
      onClose={onClose}
      onSubmit={onSave}
      title={draft.id ? 'Configure report' : 'New report'}
      description="Reports Studio filter and chart configuration."
      wide
      dirty={dirty}
      busy={busy}
      error={error}
      submitLabel={canEdit ? (draft.id ? 'Save report' : 'Create report') : 'Close'}
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
      <FieldSection title="Widget" description="Title and data binding.">
        <Field label="Widget title" required span2>
          <TextInput
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            disabled={!canEdit}
            placeholder="Hot Tickets Aging"
          />
        </Field>
        <Field label="Description" span2>
          <TextArea
            rows={2}
            value={draft.desc || ''}
            onChange={(e) => onChange({ ...draft, desc: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
      </FieldSection>

      <FieldSection title="Data source">
        <Field label="Source" required span2>
          <Select
            options={Object.entries(REPORT_DATA_SOURCES).map(([k, v]) => ({
              value: k,
              label: v.label,
            }))}
            value={draft.source}
            onChange={(e) => {
              const nextSource = e.target.value;
              const fields = REPORT_DATA_SOURCES[nextSource]?.fields || [];
              onChange({
                ...draft,
                source: nextSource,
                groupBy: fields[0] || 'status',
                subGroupBy: '',
              });
            }}
            disabled={!canEdit}
          />
        </Field>
      </FieldSection>

      <FieldSection title="Timeframe">
        <div className="sm:col-span-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {REPORT_TIMEFRAMES.map((tf) => {
            const active = draft.timeframe === tf.k;
            return (
              <button
                key={tf.k}
                type="button"
                disabled={!canEdit}
                onClick={() => onChange({ ...draft, timeframe: tf.k })}
                className={`rounded-control border px-2.5 py-1.5 text-left text-xs interactive ${
                  active
                    ? 'border-brand bg-brand-soft font-medium text-brand'
                    : 'border-line bg-elevated/60 text-ink-muted hover:border-line-strong'
                }`}
              >
                {tf.l}
              </button>
            );
          })}
        </div>
      </FieldSection>

      <FieldSection title="Group by">
        <Field label="Primary group" required>
          <Select
            options={sourceMeta.fields}
            value={draft.groupBy}
            onChange={(e) => onChange({ ...draft, groupBy: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="Sub-group (optional)">
          <Select
            options={sourceMeta.fields.filter((f) => f !== draft.groupBy)}
            value={draft.subGroupBy || ''}
            onChange={(e) => onChange({ ...draft, subGroupBy: e.target.value })}
            disabled={!canEdit}
            placeholder="— none —"
          />
        </Field>
      </FieldSection>

      <FieldSection title="Chart type">
        <div className="sm:col-span-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {REPORT_CHART_TYPES.map((ct) => {
            const active = draft.chart === ct.k;
            return (
              <button
                key={ct.k}
                type="button"
                disabled={!canEdit}
                onClick={() => onChange({ ...draft, chart: ct.k })}
                className={`flex h-14 flex-col items-center justify-center gap-1 rounded-control border text-[11px] interactive ${
                  active
                    ? 'border-brand bg-brand-soft font-medium text-brand'
                    : 'border-line bg-elevated/60 text-ink-muted hover:border-line-strong'
                }`}
              >
                <Icon name={ct.k.includes('line') ? 'lineChart' : 'barChart'} size={14} />
                {ct.l}
              </button>
            );
          })}
        </div>
      </FieldSection>

      <FieldSection title="Sort & limit">
        <Field label="Sort by">
          <Select
            options={REPORT_SORT_BY.map((s) => ({ value: s.k, label: s.l }))}
            value={draft.sortBy}
            onChange={(e) => onChange({ ...draft, sortBy: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="Direction">
          <Select
            options={[
              { value: 'desc', label: 'Descending' },
              { value: 'asc', label: 'Ascending' },
            ]}
            value={draft.sortDir}
            onChange={(e) => onChange({ ...draft, sortDir: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="Limit (top N)">
          <TextInput
            type="number"
            min="1"
            max="100"
            value={draft.limit}
            onChange={(e) => onChange({ ...draft, limit: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
      </FieldSection>

      <FieldSection title="Chart style">
        <Field label="Y min">
          <TextInput
            type="number"
            placeholder="auto"
            value={draft.yMin}
            onChange={(e) => onChange({ ...draft, yMin: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <Field label="Y max">
          <TextInput
            type="number"
            placeholder="auto"
            value={draft.yMax}
            onChange={(e) => onChange({ ...draft, yMax: e.target.value })}
            disabled={!canEdit}
          />
        </Field>
        <div className="sm:col-span-2 space-y-2">
          <Checkbox
            label="Show legend"
            checked={!!draft.showLegend}
            onChange={(e) => onChange({ ...draft, showLegend: e.target.checked })}
            disabled={!canEdit}
          />
          <Checkbox
            label="Show data labels"
            checked={!!draft.showLabels}
            onChange={(e) => onChange({ ...draft, showLabels: e.target.checked })}
            disabled={!canEdit}
          />
        </div>
      </FieldSection>
    </FormDrawer>
  );
}

export default function ReportsStudio({ view = 'reports' }) {
  const { toast, canCreateRecords, canAccessModule } = useStore();
  const canEdit = canCreateRecords && canAccessModule('analytics');
  const specsQuery = useReportSpecs();
  const { upsert, remove } = useReportMutations();
  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [deletePending, setDeletePending] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const specs = specsQuery.data || [];
  const active = specs.find((s) => s.id === activeId) || specs[0] || null;
  const sourceKind = REPORT_DATA_SOURCES[active?.source]?.kind || 'workOrders';
  const recordsQuery = useRecords(sourceKind);
  const rows = recordsQuery.data?.data || recordsQuery.data || [];

  const chartData = useMemo(() => {
    if (!active) return [];
    return aggregateReportRows(Array.isArray(rows) ? rows : [], active);
  }, [active, rows]);

  const openNew = () => {
    const next = blankReportSpec();
    setDraft(next);
    setBaseline(next);
    setSaveError('');
  };

  const openEdit = (spec) => {
    const next = { ...blankReportSpec(), ...spec };
    setDraft(next);
    setBaseline(next);
    setSaveError('');
    setActiveId(spec.id);
  };

  const save = async () => {
    if (!canEdit) return;
    if (!draft.name?.trim()) {
      setSaveError('Widget title is required.');
      return;
    }
    if (!draft.source) {
      setSaveError('Data source is required.');
      return;
    }
    try {
      const saved = await upsert.mutateAsync(draft);
      toast(draft.id ? 'Report saved' : 'Report created');
      setDraft(null);
      setBaseline(null);
      setActiveId(saved.id || draft.id);
    } catch (error) {
      setSaveError(getErrorMessage(error, 'Unable to save report.'));
    }
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(deletePending.id);
      toast('Report deleted');
      if (activeId === deletePending.id) setActiveId(null);
      setDeletePending(null);
    } catch (error) {
      toast(getErrorMessage(error, 'Delete failed'), 'danger');
    }
  };

  const isDashboards = view === 'dashboards';

  return (
    <Page wide>
      <PageHeader
        overline="Insights"
        title={isDashboards ? 'Dashboards' : 'Reports Studio'}
        description={
          isDashboards
            ? 'Saved dashboard widgets · configure via Reports Studio filters'
            : 'Point-and-click builder · filters, grouping, and chart types'
        }
        actions={
          canEdit ? (
            <Button variant="primary" onClick={openNew}>
              <Icon name="plus" size={15} /> New report
            </Button>
          ) : (
            <Badge color="slate">View only</Badge>
          )
        }
      />

      <AsyncState
        loading={specsQuery.isLoading}
        error={specsQuery.isError ? getErrorMessage(specsQuery.error) : null}
        onRetry={() => specsQuery.refetch()}
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Panel className="lg:col-span-4" padded={false}>
            <div className="border-b border-line px-4 py-3">
              <p className="type-overline">Saved</p>
              <p className="mt-0.5 text-sm text-ink-muted">{specs.length} reports</p>
            </div>
            <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto scroll-thin">
              {specs.map((spec) => {
                const selected = (active?.id || null) === spec.id;
                return (
                  <li key={spec.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(spec.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left interactive ${
                        selected ? 'bg-elevated' : 'hover:bg-elevated/60'
                      }`}
                    >
                      <Icon name="barChart" size={15} className="mt-0.5 shrink-0 text-ink-faint" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {spec.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-muted">
                          {REPORT_DATA_SOURCES[spec.source]?.label || spec.source} ·{' '}
                          {REPORT_CHART_TYPES.find((c) => c.k === spec.chart)?.l || spec.chart}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {!specs.length && (
                <li className="px-4 py-8 text-center text-sm text-ink-muted">No saved reports yet.</li>
              )}
            </ul>
          </Panel>

          <Panel className="lg:col-span-8" padded>
            {active ? (
              <>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="type-overline">Preview</p>
                    <h2 className="mt-1 font-display text-title-sm text-ink">{active.name}</h2>
                    <p className="mt-1 text-xs text-ink-muted">{active.desc || 'No description'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => openEdit(active)}>
                      <Icon name="sliders" size={14} /> Configure
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        onClick={() => setDeletePending(active)}
                        className="text-danger"
                      >
                        <Icon name="trash" size={14} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <Badge color="slate">
                    Source: {REPORT_DATA_SOURCES[active.source]?.label || active.source}
                  </Badge>
                  <Badge color="slate">
                    Timeframe:{' '}
                    {REPORT_TIMEFRAMES.find((t) => t.k === active.timeframe)?.l || active.timeframe}
                  </Badge>
                  <Badge color="slate">Group: {active.groupBy}</Badge>
                  {active.subGroupBy && <Badge color="slate">Sub: {active.subGroupBy}</Badge>}
                  <Badge color="slate">
                    Chart: {REPORT_CHART_TYPES.find((c) => c.k === active.chart)?.l || active.chart}
                  </Badge>
                </div>
                <ReportPreview spec={active} data={chartData} />
                <p className="mt-3 text-[11px] text-ink-faint">
                  Preview uses seeded demo records · {chartData.length} groups shown
                </p>
              </>
            ) : (
              <div className="py-16 text-center text-sm text-ink-muted">
                Select or create a report to configure filters and charts.
              </div>
            )}
          </Panel>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {specs.slice(0, 6).map((spec, index) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => openEdit(spec)}
              className="bg-surface p-5 text-left interactive hover:bg-elevated/40"
            >
              <div className="flex items-start justify-between">
                <span className="mono text-xs text-ink-faint">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Icon name="barChart" size={16} className="text-ink-faint" />
              </div>
              <div className="mt-4 font-display text-title-sm text-ink">{spec.name}</div>
              <div className="mt-1 text-xs text-ink-muted">
                {REPORT_CHART_TYPES.find((c) => c.k === spec.chart)?.l || spec.chart} ·{' '}
                {REPORT_DATA_SOURCES[spec.source]?.label || spec.source}
              </div>
            </button>
          ))}
        </div>
      </AsyncState>

      {draft && (
        <ReportConfigDrawer
          draft={draft}
          baseline={baseline}
          onChange={(next) => {
            setDraft(next);
            setSaveError('');
          }}
          onClose={() => {
            setDraft(null);
            setBaseline(null);
            setSaveError('');
          }}
          onSave={save}
          busy={upsert.isPending}
          error={saveError}
          canEdit={canEdit}
        />
      )}

      {deletePending && (
        <ConfirmDialog
          title="Delete report?"
          description={`Delete “${deletePending.name}”?`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeletePending(null)}
          busy={remove.isPending}
        />
      )}
    </Page>
  );
}
