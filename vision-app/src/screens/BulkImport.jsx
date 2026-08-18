import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Button,
  Page,
  PageHeader,
  Panel,
  Field,
  FieldSection,
  FormDrawer,
  Badge,
  Table,
  Select,
  TextInput,
  Checkbox,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useBulkImport, useCreateRecord } from '../hooks/useRecords.js';
import {
  useImportMapping,
  useImportMappingMutations,
} from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';
import { PICKLISTS } from '../data/picklists.js';
import { RECORD_SCHEMAS } from '../data/recordSchemas.js';

const HISTORY_KEY = '__importHistory';

const OBJECTS = {
  'Work Orders': {
    columns: ['account', 'requestType', 'status', 'dueDate', 'subject'],
    kind: 'workOrders',
    mode: 'bulk',
    required: ['account', 'requestType'],
    enums: { requestType: PICKLISTS.requestType, status: PICKLISTS.workOrderStatus },
  },
  Locations: {
    columns: ['account', 'name', 'type', 'city', 'state', 'zip'],
    kind: 'locations',
    mode: 'bulk',
    required: ['account', 'name'],
    enums: { type: PICKLISTS.locationType, state: PICKLISTS.provinceState },
  },
  Assets: {
    columns: ['account', 'name', 'product', 'serial', 'status'],
    kind: 'assets',
    mode: 'bulk',
    required: ['account', 'name'],
    enums: { status: PICKLISTS.assetStatus },
  },
  Contacts: {
    columns: ['account', 'firstName', 'lastName', 'email', 'phone'],
    mode: 'bulk',
    required: ['account', 'firstName'],
  },
  Routes: {
    columns: ['account', 'routeNumber', 'truck', 'driver', 'status'],
    mode: 'bulk',
    required: ['account', 'routeNumber'],
    enums: { status: PICKLISTS.routeStatus },
  },
  Dispatches: {
    columns: ['account', 'number', 'status', 'routeDate', 'truck', 'driver', 'serviceType'],
    kind: 'dispatches',
    mode: 'record',
    required: ['account', 'routeDate'],
    enums: { status: PICKLISTS.dispatchStatus, serviceType: PICKLISTS.serviceType },
  },
  Notes: {
    columns: ['account', 'title', 'relatedTo', 'type', 'createdBy', 'created'],
    kind: 'notesAttachments',
    mode: 'record',
    required: ['account', 'title'],
    enums: { type: ['Note', 'Attachment'] },
  },
  Tips: {
    columns: ['account', 'name', 'asset', 'type', 'truck', 'location', 'collectionRoute', 'timestamp'],
    kind: 'individualTips',
    mode: 'record',
    required: ['account', 'name'],
    enums: { type: ['Tip', 'Non-Tip'] },
  },
};

function parseCsv(text) {
  const records = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i <= text.length; i += 1) {
    const char = text[i] ?? '\n';
    if (char === '"' && quoted && text[i + 1] === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value.trim());
      value = '';
      if (row.some(Boolean)) records.push(row);
      row = [];
    } else value += char;
  }
  return records;
}

function defaultMapping(columns) {
  return {
    matchBy: columns[0] || 'account',
    upsert: false,
    dryRun: false,
    columnMap: Object.fromEntries(columns.map((c) => [c, c])),
  };
}

function schemaFieldKeys(kind) {
  const schema = RECORD_SCHEMAS[kind];
  if (!schema) return [];
  return schema.sections.flatMap((section) => section.fields.map((field) => field.key));
}

export default function BulkImport() {
  const { toast } = useStore();
  const accountsQuery = useAccounts();
  const bulkImport = useBulkImport();
  const createDispatch = useCreateRecord('dispatches');
  const createNote = useCreateRecord('notesAttachments');
  const createTip = useCreateRecord('individualTips');
  const [object, setObject] = useState('Work Orders');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [mappingDraft, setMappingDraft] = useState(null);
  const [mappingBaseline, setMappingBaseline] = useState(null);
  const [mapError, setMapError] = useState('');

  const meta = OBJECTS[object];
  const columns = meta.columns;
  const accounts = accountsQuery.data || [];
  const mappingQuery = useImportMapping(object);
  const historyQuery = useImportMapping(HISTORY_KEY);
  const { save: saveMapping } = useImportMappingMutations();

  const activeMapping = useMemo(
    () => mappingQuery.data || defaultMapping(columns),
    [mappingQuery.data, columns]
  );
  const historyEntries = useMemo(() => {
    const raw = historyQuery.data?.entries;
    return Array.isArray(raw) ? raw : [];
  }, [historyQuery.data]);

  useEffect(() => {
    setMappingDraft(null);
    setMappingBaseline(null);
  }, [object]);

  const openMapping = () => {
    const next = {
      ...defaultMapping(columns),
      ...activeMapping,
      columnMap: {
        ...Object.fromEntries(columns.map((c) => [c, c])),
        ...(activeMapping.columnMap || {}),
      },
    };
    setMappingDraft(next);
    setMappingBaseline(next);
    setMapError('');
    setMappingOpen(true);
  };

  const persistMapping = async () => {
    if (!mappingDraft.matchBy) {
      setMapError('Match-by column is required.');
      return;
    }
    try {
      await saveMapping.mutateAsync({ objectKey: object, mapping: mappingDraft });
      toast('Import mapping saved');
      setMappingOpen(false);
      setMappingDraft(null);
      setMappingBaseline(null);
    } catch (error) {
      setMapError(getErrorMessage(error, 'Unable to save mapping.'));
    }
  };

  const appendHistory = async (entry) => {
    const nextEntries = [entry, ...historyEntries].slice(0, 50);
    try {
      await saveMapping.mutateAsync({
        objectKey: HISTORY_KEY,
        mapping: { ...(historyQuery.data || {}), entries: nextEntries },
      });
    } catch {
      /* history persistence is best-effort */
    }
  };

  const downloadTemplate = () => {
    const headers = columns.map((c) => activeMapping.columnMap?.[c] || c);
    const blob = new Blob([`${headers.join(',')}\n`], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${object.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
    link.click();
    URL.revokeObjectURL(href);
    toast('Template downloaded');
  };

  const loadFile = async (file) => {
    setFileName(file?.name || '');
    setSummary(null);
    if (!file) {
      setPreview([]);
      setErrors([]);
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Choose a .csv file.']);
      setPreview([]);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors(['File exceeds the 10 MB limit.']);
      setPreview([]);
      return;
    }
    const parsed = parseCsv(await file.text());
    const headers = parsed[0] || [];
    const reverseMap = Object.fromEntries(
      Object.entries(activeMapping.columnMap || {}).map(([field, csvCol]) => [csvCol, field])
    );
    const required = meta.required || columns.slice(0, 2);
    const validation = required
      .filter((h) => {
        const csvName = activeMapping.columnMap?.[h] || h;
        return !headers.includes(csvName) && !headers.includes(h);
      })
      .map((h) => `Missing required column: ${activeMapping.columnMap?.[h] || h}`);

    if (meta.kind) {
      const known = new Set(schemaFieldKeys(meta.kind));
      columns.forEach((field) => {
        if (known.size && !known.has(field) && field !== 'account') {
          validation.push(`Column “${field}” is not on the ${meta.kind} schema`);
        }
      });
    }

    const rows = parsed.slice(1).map((cells, index) => {
      const raw = Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']));
      const normalized = {};
      columns.forEach((field) => {
        const csvCol = activeMapping.columnMap?.[field] || field;
        normalized[field] = raw[csvCol] ?? raw[field] ?? raw[reverseMap[csvCol]] ?? '';
      });
      return { _row: index + 2, ...normalized };
    });
    rows.forEach((row) =>
      required.forEach((h) => {
        if (!row[h]) validation.push(`Row ${row._row}: ${h} is required`);
      })
    );
    const accountNames = new Set(accounts.map((a) => a.name));
    rows.forEach((row) => {
      if (row.account && !accountNames.has(row.account)) {
        validation.push(`Row ${row._row}: unknown account “${row.account}”`);
      }
      Object.entries(meta.enums || {}).forEach(([field, options]) => {
        const value = row[field];
        if (!value) return;
        const allowed = options.map((option) =>
          option && typeof option === 'object' ? option.value ?? option.label : option
        );
        if (!allowed.includes(value)) {
          validation.push(`Row ${row._row}: invalid ${field} “${value}”`);
        }
      });
    });
    setPreview(rows);
    setErrors(validation);
  };

  const importRecordRows = async () => {
    const creators = {
      dispatches: createDispatch,
      notesAttachments: createNote,
      individualTips: createTip,
    };
    const createMutation = creators[meta.kind];
    if (!createMutation) throw new Error(`No create path for ${object}.`);
    let imported = 0;
    let failed = 0;
    for (const row of preview) {
      try {
        const { _row, ...payload } = row;
        await createMutation.mutateAsync(payload);
        imported += 1;
      } catch {
        failed += 1;
      }
    }
    return { imported, failed };
  };

  const importRows = async () => {
    try {
      if (activeMapping.dryRun) {
        const drySummary = {
          imported: 0,
          failed: 0,
          object,
          dryRun: true,
          previewed: preview.length,
        };
        setSummary(drySummary);
        await appendHistory({
          id: `imp-${Date.now()}`,
          object,
          rowCount: preview.length,
          status: 'Dry run',
          timestamp: new Date().toISOString(),
        });
        toast(`Dry run · ${preview.length} rows would import`, 'success');
        return;
      }

      let result;
      if (meta.mode === 'record') {
        result = await importRecordRows();
      } else {
        result = await bulkImport.mutateAsync({ object, rows: preview });
      }

      setSummary({ imported: result.imported, failed: result.failed, object });
      await appendHistory({
        id: `imp-${Date.now()}`,
        object,
        rowCount: preview.length,
        status: result.failed ? 'Partial' : 'Complete',
        imported: result.imported,
        failed: result.failed,
        timestamp: new Date().toISOString(),
      });
      toast(
        result.failed
          ? `${result.imported} imported · ${result.failed} failed`
          : `${result.imported} ${object.toLowerCase()} imported`,
        result.failed ? 'warning' : 'success'
      );
    } catch (error) {
      await appendHistory({
        id: `imp-${Date.now()}`,
        object,
        rowCount: preview.length,
        status: 'Failed',
        timestamp: new Date().toISOString(),
      });
      toast(getErrorMessage(error, 'Import failed. Please try again.'), 'danger');
    }
  };

  const importBusy =
    bulkImport.isPending ||
    createDispatch.isPending ||
    createNote.isPending ||
    createTip.isPending ||
    saveMapping.isPending;

  return (
    <Page>
      <PageHeader
        overline="Tools"
        title="WOIT Import"
        description="Work Order Import Tool. Upload a CSV to create records for this Service Provider. Portal customers are provisioned in identity systems, not here."
        actions={
          <Button variant="secondary" onClick={openMapping}>
            <Icon name="sliders" size={14} /> Column mapping
          </Button>
        }
      />

      <Panel className="max-w-2xl" padded>
        <Field label="Object">
          <select
            value={object}
            onChange={(e) => {
              setObject(e.target.value);
              setFileName('');
              setPreview([]);
              setErrors([]);
              setSummary(null);
            }}
            className="field-input"
          >
            {Object.keys(OBJECTS).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge color="slate">Match by: {activeMapping.matchBy}</Badge>
          {activeMapping.upsert && <Badge color="blue">Upsert</Badge>}
          {activeMapping.dryRun && <Badge color="amber">Dry run</Badge>}
        </div>

        <div className="mt-5">
          <p className="type-overline mb-2">File</p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-panel border border-dashed border-line-strong bg-elevated/80 px-4 py-14 interactive hover:border-ink hover:bg-surface hover:shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-control border border-line bg-surface text-ink-muted">
              <Icon name="download" size={18} />
            </span>
            <span className="mt-4 text-sm font-medium text-ink">
              {fileName || 'Drop a CSV here, or click to browse'}
            </span>
            <span className="mt-1 text-xs text-ink-faint">Max 10 MB · .csv only</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => loadFile(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-line pt-5">
          <Button variant="secondary" onClick={downloadTemplate}>
            Download template
          </Button>
          <Button
            variant="primary"
            disabled={!preview.length || errors.length > 0 || importBusy}
            onClick={importRows}
          >
            <Icon name="download" size={15} />{' '}
            {activeMapping.dryRun ? 'Dry run' : 'Import'} {preview.length || ''} rows
          </Button>
        </div>
      </Panel>

      {(preview.length > 0 || errors.length > 0) && (
        <Panel className="mt-5">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="type-overline">Validation preview</p>
              <p className="mt-1 text-sm text-ink-muted">{preview.length} data rows parsed</p>
            </div>
            <Badge color={errors.length ? 'rose' : 'green'}>
              {errors.length ? `${errors.length} issues` : 'Ready'}
            </Badge>
          </div>
          {errors.length > 0 && (
            <ul className="max-h-40 overflow-auto px-5 py-4 text-sm text-danger">
              {errors.slice(0, 20).map((e, i) => (
                <li key={`${e}-${i}`}>• {e}</li>
              ))}
            </ul>
          )}
          {preview.length > 0 && (
            <Table columns={columns.slice(0, 4)}>
              {preview.slice(0, 5).map((row) => (
                <tr key={row._row}>
                  {columns.slice(0, 4).map((h) => (
                    <td key={h} className="px-4 py-3 text-ink-muted">
                      {row[h] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      )}

      {summary && (
        <Panel className="mt-5 p-5">
          <p className="font-display text-title-sm text-ink">
            {summary.dryRun ? 'Dry run complete' : 'Import complete'}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            {summary.dryRun
              ? `${summary.previewed} rows validated · no records written`
              : `${summary.imported} imported · ${summary.failed} failed · ${summary.object}`}
          </p>
        </Panel>
      )}

      <Panel className="mt-5">
        <div className="border-b border-line px-5 py-4">
          <p className="type-overline">Import history</p>
          <p className="mt-1 text-sm text-ink-muted">Past imports for this workspace</p>
        </div>
        <Table columns={['Object', 'Rows', 'Status', 'Timestamp']}>
          {historyEntries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3 font-medium text-ink">{entry.object}</td>
              <td className="mono px-4 py-3 text-ink-muted">{entry.rowCount ?? '—'}</td>
              <td className="px-4 py-3">
                <Badge
                  color={
                    entry.status === 'Complete'
                      ? 'green'
                      : entry.status === 'Failed'
                        ? 'rose'
                        : entry.status === 'Partial'
                          ? 'amber'
                          : 'slate'
                  }
                >
                  {entry.status}
                </Badge>
              </td>
              <td className="mono px-4 py-3 text-ink-muted">
                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
          {!historyEntries.length && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-muted">
                No imports yet.
              </td>
            </tr>
          )}
        </Table>
      </Panel>

      {mappingOpen && mappingDraft && (
        <FormDrawer
          onClose={() => {
            setMappingOpen(false);
            setMappingDraft(null);
            setMappingBaseline(null);
            setMapError('');
          }}
          onSubmit={persistMapping}
          title="Import column mapping"
          description={`Map CSV headers to ${object} fields and set upsert options.`}
          dirty={JSON.stringify(mappingDraft) !== JSON.stringify(mappingBaseline)}
          busy={saveMapping.isPending}
          error={mapError}
          submitLabel="Save mapping"
          wide
        >
          <FieldSection title="Options">
            <Field label="Match by" required>
              <Select
                options={columns}
                value={mappingDraft.matchBy}
                onChange={(e) =>
                  setMappingDraft((m) => ({ ...m, matchBy: e.target.value }))
                }
              />
            </Field>
            <div className="space-y-2 sm:col-span-2">
              <Checkbox
                label="Upsert existing rows matched by key"
                checked={!!mappingDraft.upsert}
                onChange={(e) =>
                  setMappingDraft((m) => ({ ...m, upsert: e.target.checked }))
                }
              />
              <Checkbox
                label="Dry run (validate only, do not write)"
                checked={!!mappingDraft.dryRun}
                onChange={(e) =>
                  setMappingDraft((m) => ({ ...m, dryRun: e.target.checked }))
                }
              />
            </div>
          </FieldSection>
          <FieldSection title="Column map" description="CSV header for each Vision field.">
            {columns.map((field) => (
              <Field key={field} label={field}>
                <TextInput
                  value={mappingDraft.columnMap?.[field] || field}
                  onChange={(e) =>
                    setMappingDraft((m) => ({
                      ...m,
                      columnMap: { ...m.columnMap, [field]: e.target.value },
                    }))
                  }
                />
              </Field>
            ))}
          </FieldSection>
        </FormDrawer>
      )}
    </Page>
  );
}
