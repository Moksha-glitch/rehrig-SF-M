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
import { useBulkImport } from '../hooks/useRecords.js';
import {
  useImportMapping,
  useImportMappingMutations,
} from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';

const OBJECTS = {
  'Work Orders': {
    columns: ['account', 'requestType', 'status', 'dueDate', 'subject'],
    kind: 'workOrders',
    mode: 'operational',
  },
  Locations: {
    columns: ['account', 'name', 'type', 'city', 'state', 'zip'],
    kind: 'locations',
    mode: 'operational',
  },
  Assets: {
    columns: ['account', 'name', 'product', 'serial', 'status'],
    kind: 'assets',
    mode: 'operational',
  },
  Contacts: {
    columns: ['account', 'firstName', 'lastName', 'email', 'phone'],
    mode: 'contact',
  },
  Routes: {
    columns: ['account', 'routeNumber', 'truck', 'driver', 'status'],
    mode: 'route',
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

export default function BulkImport() {
  const { toast } = useStore();
  const accountsQuery = useAccounts();
  const bulkImport = useBulkImport();
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
  const { save: saveMapping } = useImportMappingMutations();

  const activeMapping = useMemo(
    () => mappingQuery.data || defaultMapping(columns),
    [mappingQuery.data, columns]
  );

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
    const required = columns.slice(0, 2);
    const validation = required
      .filter((h) => {
        const csvName = activeMapping.columnMap?.[h] || h;
        return !headers.includes(csvName) && !headers.includes(h);
      })
      .map((h) => `Missing required column: ${activeMapping.columnMap?.[h] || h}`);
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
    });
    setPreview(rows);
    setErrors(validation);
  };

  const importRows = async () => {
    try {
      if (activeMapping.dryRun) {
        setSummary({
          imported: 0,
          failed: 0,
          object,
          dryRun: true,
          previewed: preview.length,
        });
        toast(`Dry run · ${preview.length} rows would import`, 'success');
        return;
      }
      const result = await bulkImport.mutateAsync({ object, rows: preview });
      setSummary({ imported: result.imported, failed: result.failed, object });
      toast(
        result.failed
          ? `${result.imported} imported · ${result.failed} failed`
          : `${result.imported} ${object.toLowerCase()} imported`,
        result.failed ? 'warning' : 'success'
      );
    } catch (error) {
      toast(getErrorMessage(error, 'Import failed. Please try again.'), 'danger');
    }
  };

  return (
    <Page>
      <PageHeader
        overline="Tools"
        title="Bulk Import"
        description="Upload a CSV to create records for this Service Provider. Portal customers are provisioned in identity systems, not here."
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
            disabled={!preview.length || errors.length > 0}
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
