import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Badge, Page, PageHeader, Panel, Checkbox, Select } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useRecords } from '../hooks/useRecords.js';

const LAYERS = [
  { key: 'providers', label: 'Service Providers', color: 'bg-ink' },
  { key: 'assets', label: 'Assets', color: 'bg-brand' },
  { key: 'dispatches', label: 'Dispatches', color: 'bg-amber-600' },
  { key: 'workOrders', label: 'Work Orders', color: 'bg-cyan-700' },
];

const DENSITY_MODES = [
  { value: 'Concentrated', label: 'Concentrated', radius: 22, jitter: 4 },
  { value: 'Sparse', label: 'Sparse', radius: 31, jitter: 8 },
  { value: 'Low volume', label: 'Low volume', radius: 38, jitter: 12 },
];

function hashOffset(seed, spread) {
  let hash = 0;
  const text = String(seed || '');
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 997;
  const angle = (hash / 997) * Math.PI * 2;
  const distance = ((hash % 17) / 17) * spread;
  return { dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance };
}

function providerPoint(account, index, total, density) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 50 + Math.cos(angle) * density.radius,
    y: 52 + Math.sin(angle) * (density.radius * 0.9),
  };
}

function relativePoint(base, seed, density) {
  const offset = hashOffset(seed, density.jitter);
  return {
    x: Math.min(92, Math.max(8, base.x + offset.dx)),
    y: Math.min(90, Math.max(12, base.y + offset.dy)),
  };
}

export default function MapCenter() {
  const { state, navigate, persona } = useStore();
  const navParams = state.nav?.params || {};
  const accountsQuery = useAccounts();
  const assetsQuery = useRecords('assets');
  const dispatchesQuery = useRecords('dispatches');
  const workOrdersQuery = useRecords('workOrders');

  const [provider, setProvider] = useState(navParams.provider || 'All');
  const [selected, setSelected] = useState(null);
  const [densityMode, setDensityMode] = useState('Sparse');
  const [layers, setLayers] = useState({
    providers: true,
    assets: true,
    dispatches: true,
    workOrders: true,
  });
  const [focusAssetId, setFocusAssetId] = useState(navParams.assetId || null);

  useEffect(() => {
    if (navParams.provider) setProvider(navParams.provider);
    if (navParams.assetId) {
      setFocusAssetId(navParams.assetId);
      setLayers((prev) => ({ ...prev, assets: true, providers: true }));
    }
  }, [navParams.provider, navParams.assetId]);

  const accounts = accountsQuery.data || [];
  const assets = assetsQuery.data?.data || [];
  const allDispatches = dispatchesQuery.data?.data || [];
  const allWorkOrders = workOrdersQuery.data?.data || [];
  const density = DENSITY_MODES.find((mode) => mode.value === densityMode) || DENSITY_MODES[1];

  const providerPins = useMemo(
    () =>
      accounts.map((account, index) => {
        const point = providerPoint(account, index, accounts.length, density);
        return {
          id: account.id,
          layer: 'providers',
          x: point.x,
          y: point.y,
          account,
          label: account.name,
          meta: `${account.billing?.city || '—'}, ${account.billing?.state || '—'}`,
        };
      }),
    [accounts, density]
  );

  const providerById = useMemo(
    () => Object.fromEntries(providerPins.map((pin) => [pin.id, pin])),
    [providerPins]
  );
  const providerByName = useMemo(
    () => Object.fromEntries(accounts.map((account) => [account.name, account])),
    [accounts]
  );

  const matchesProviderFilter = (accountId, accountName) => {
    if (provider === 'All') return true;
    if (accountId && accountId === provider) return true;
    const selectedAccount = accounts.find((account) => account.id === provider);
    return !!selectedAccount && accountName === selectedAccount.name;
  };

  const assetPins = useMemo(
    () =>
      assets
        .filter((asset) => matchesProviderFilter(asset.accountId, asset.account))
        .map((asset) => {
          const base =
            providerById[asset.accountId] ||
            providerById[providerByName[asset.account]?.id] ||
            { x: 50, y: 50 };
          const point = relativePoint(base, asset.id || asset.name, density);
          return {
            id: asset.id || asset.name,
            layer: 'assets',
            x: point.x,
            y: point.y,
            asset,
            label: asset.name || asset.serial || 'Asset',
            meta: [asset.status, asset.location].filter(Boolean).join(' · '),
            accountId: asset.accountId || providerByName[asset.account]?.id,
          };
        }),
    [assets, provider, providerById, providerByName, density, accounts]
  );

  const dispatchPins = useMemo(
    () =>
      allDispatches
        .filter((dispatch) => matchesProviderFilter(dispatch.accountId, dispatch.account))
        .map((dispatch) => {
          const base =
            providerById[dispatch.accountId] ||
            providerById[providerByName[dispatch.account]?.id] ||
            { x: 50, y: 50 };
          const point = relativePoint(base, dispatch.id || dispatch.number, density);
          return {
            id: dispatch.id || dispatch.number,
            layer: 'dispatches',
            x: point.x,
            y: point.y,
            dispatch,
            label: dispatch.number || dispatch.id,
            meta: [dispatch.status, dispatch.truck].filter(Boolean).join(' · '),
            accountId: dispatch.accountId || providerByName[dispatch.account]?.id,
          };
        }),
    [allDispatches, provider, providerById, providerByName, density, accounts]
  );

  const workOrderPins = useMemo(
    () =>
      allWorkOrders
        .filter((workOrder) => matchesProviderFilter(workOrder.accountId, workOrder.account))
        .map((workOrder) => {
          const base =
            providerById[workOrder.accountId] ||
            providerById[providerByName[workOrder.account]?.id] ||
            { x: 50, y: 50 };
          const point = relativePoint(base, workOrder.id || workOrder.number, density);
          return {
            id: workOrder.id || workOrder.number,
            layer: 'workOrders',
            x: point.x,
            y: point.y,
            workOrder,
            label: workOrder.number || workOrder.id,
            meta: [workOrder.requestType, workOrder.status].filter(Boolean).join(' · '),
            accountId: workOrder.accountId || providerByName[workOrder.account]?.id,
          };
        }),
    [allWorkOrders, provider, providerById, providerByName, density, accounts]
  );

  const visibleProviderPins = providerPins.filter(
    (pin) => provider === 'All' || pin.account.id === provider
  );

  const mapPins = [
    ...(layers.providers ? visibleProviderPins : []),
    ...(layers.assets ? assetPins : []),
    ...(layers.dispatches ? dispatchPins : []),
    ...(layers.workOrders ? workOrderPins : []),
  ];

  useEffect(() => {
    if (!focusAssetId) return;
    const target = assetPins.find((pin) => pin.id === focusAssetId || pin.asset?.id === focusAssetId);
    if (target) setSelected(target);
  }, [focusAssetId, assetPins]);

  const dispatches = allDispatches.filter((dispatch) =>
    matchesProviderFilter(dispatch.accountId, dispatch.account)
  );
  const activeDispatches = dispatches.filter((dispatch) =>
    ['In Route', 'In Progress'].includes(dispatch.status)
  );
  const activeProviders = visibleProviderPins.filter((pin) => !pin.account.inactive).length;

  const pinClass = (pin) => {
    if (pin.layer === 'providers') {
      return selected?.id === pin.id && selected?.layer === 'providers'
        ? 'bg-danger ring-danger/20'
        : 'bg-ink ring-ink/15';
    }
    if (pin.layer === 'assets') {
      const focused = focusAssetId && (pin.id === focusAssetId || pin.asset?.id === focusAssetId);
      return focused || (selected?.id === pin.id && selected?.layer === 'assets')
        ? 'bg-brand ring-brand/25 scale-125'
        : 'bg-brand ring-brand/15';
    }
    if (pin.layer === 'dispatches') {
      return selected?.id === pin.id && selected?.layer === 'dispatches'
        ? 'bg-amber-600 ring-amber-600/25'
        : 'bg-amber-600 ring-amber-600/15';
    }
    return selected?.id === pin.id && selected?.layer === 'workOrders'
      ? 'bg-cyan-700 ring-cyan-700/25'
      : 'bg-cyan-700 ring-cyan-700/15';
  };

  const selectedDetail = (() => {
    if (!selected) return null;
    if (selected.layer === 'providers') {
      return {
        title: selected.account.name,
        subtitle: `${selected.account.billing?.city || '—'}, ${selected.account.billing?.state || '—'}`,
        action: {
          label: 'Open provider',
          onClick: () =>
            persona === 'rehrig'
              ? navigate('accountDetail', {
                  accountId: selected.account.id,
                  tab: 'details',
                })
              : navigate('account', { tab: 'details' }),
        },
      };
    }
    if (selected.layer === 'assets') {
      return {
        title: selected.label,
        subtitle: selected.meta || 'Asset',
        action: selected.accountId
          ? {
              label: 'Open assets',
              onClick: () => navigate('assets', { accountId: selected.accountId }),
            }
          : null,
      };
    }
    if (selected.layer === 'dispatches') {
      return {
        title: selected.label,
        subtitle: selected.meta || 'Dispatch',
        action: { label: 'Open dispatches', onClick: () => navigate('dispatches') },
      };
    }
    return {
      title: selected.label,
      subtitle: selected.meta || 'Work order',
      action: { label: 'Open work orders', onClick: () => navigate('workOrders') },
    };
  })();

  return (
    <Page wide>
      <PageHeader
        overline="Tools"
        title="Map Center"
        description="A schematic service-area view of enrolled providers, assets, dispatches, and work orders."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel className="lg:col-span-8" padded>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="type-overline">Geospatial</p>
              <p className="mt-1 font-display text-title-sm text-ink">Service areas</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="map-provider-filter">
                Filter by provider
              </label>
              <select
                id="map-provider-filter"
                aria-label="Filter service areas by provider"
                className="field-input max-w-[220px]"
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setSelected(null);
                }}
              >
                <option value="All">All providers</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="map-density-mode">
                Density mode
              </label>
              <Select
                id="map-density-mode"
                aria-label="Map density mode"
                className="max-w-[180px]"
                options={DENSITY_MODES.map((mode) => mode.label)}
                value={densityMode}
                onChange={(e) => setDensityMode(e.target.value)}
              />
            </div>
          </div>

          <fieldset className="mb-4 flex flex-wrap gap-4 rounded-panel border border-line px-3 py-2">
            <legend className="sr-only">Map layers</legend>
            {LAYERS.map((layer) => (
              <Checkbox
                key={layer.key}
                label={layer.label}
                checked={!!layers[layer.key]}
                onChange={(e) =>
                  setLayers((prev) => ({ ...prev, [layer.key]: e.target.checked }))
                }
              />
            ))}
          </fieldset>

          <div
            className="relative h-96 overflow-hidden rounded-panel border border-line bg-[linear-gradient(to_right,#e6ebe8_1px,transparent_1px),linear-gradient(to_bottom,#e6ebe8_1px,transparent_1px)]"
            style={{ backgroundSize: '24px 24px' }}
            role="list"
            aria-label="Map pins"
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <path
                d="M5 80 Q 50 40 95 78"
                fill="rgba(11,95,73,0.06)"
                stroke="rgba(11,95,73,0.28)"
                strokeWidth="0.5"
              />
            </svg>
            {mapPins.map((pin) => (
              <button
                type="button"
                key={`${pin.layer}-${pin.id}`}
                role="listitem"
                className="absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                title={`${pin.label}${pin.meta ? ` · ${pin.meta}` : ''}`}
                aria-label={`${LAYERS.find((layer) => layer.key === pin.layer)?.label || 'Pin'}: ${pin.label}`}
                aria-pressed={selected?.id === pin.id && selected?.layer === pin.layer}
                onClick={() => setSelected(pin)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(pin);
                  }
                }}
              >
                <span className={`block h-3 w-3 rounded-full ring-4 transition ${pinClass(pin)}`} />
                {(pin.layer === 'providers' ||
                  (pin.layer === 'assets' &&
                    focusAssetId &&
                    (pin.id === focusAssetId || pin.asset?.id === focusAssetId))) && (
                  <span className="absolute -top-5 left-1/2 hidden max-w-[5.5rem] -translate-x-1/2 truncate text-center text-[10px] font-medium text-ink-muted sm:block">
                    {pin.label}
                  </span>
                )}
              </button>
            ))}
          </div>

          {selectedDetail && (
            <div className="mt-3 flex flex-col gap-2 rounded-panel border border-line p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <strong className="block truncate">{selectedDetail.title}</strong>
                <span className="mt-0.5 block truncate text-ink-muted sm:mt-0 sm:ml-2 sm:inline">{selectedDetail.subtitle}</span>
              </div>
              {selectedDetail.action ? (
                <button type="button" className="link-brand text-xs" onClick={selectedDetail.action.onClick}>
                  {selectedDetail.action.label}
                </button>
              ) : null}
            </div>
          )}
        </Panel>

        <div className="space-y-6 lg:col-span-4">
          <Panel padded>
            <p className="type-overline">Queue</p>
            <p className="mt-1 font-display text-title-sm text-ink">Active dispatches</p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {activeDispatches.map((dispatch) => (
                <li key={dispatch.id || dispatch.number} className="py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="mono font-medium text-ink">{dispatch.number || dispatch.id}</span>
                    <Badge color="cyan">{dispatch.status}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-muted">
                    {dispatch.account || 'Unassigned provider'} · {dispatch.truck || 'Unassigned truck'}
                  </div>
                </li>
              ))}
              {!activeDispatches.length && (
                <li className="py-6 text-center text-sm text-ink-muted">No active dispatches.</li>
              )}
            </ul>
          </Panel>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line">
            {[
              { icon: 'mapPin', value: visibleProviderPins.length, label: 'Providers shown' },
              { icon: 'building', value: activeProviders, label: 'Active providers' },
              {
                icon: 'truck',
                value: new Set(activeDispatches.map((dispatch) => dispatch.truck).filter(Boolean)).size,
                label: 'Trucks assigned',
              },
              { icon: 'activity', value: activeDispatches.length, label: 'Active dispatches' },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface p-4">
                <Icon name={stat.icon} size={14} className="text-ink-faint" />
                <div className="font-display mt-2 text-lg font-semibold text-ink">{stat.value}</div>
                <div className="type-overline mt-1 !normal-case !tracking-normal">{stat.label}</div>
              </div>
            ))}
          </div>

          <Panel padded>
            <p className="type-overline">Legend</p>
            <ul className="mt-3 space-y-2 text-xs text-ink-muted">
              {LAYERS.map((layer) => (
                <li key={layer.key} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${layer.color}`} />
                  {layer.label}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
